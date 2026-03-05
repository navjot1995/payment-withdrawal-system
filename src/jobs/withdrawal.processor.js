import Queue from 'bull';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import Withdrawal from "../modules/withdrawal/withdrawal.model.js";
import Wallet from "../modules/wallet/wallet.model.js";
import TransactionLog from "../modules/transaction-log/transactionLog.model.js";
dotenv.config();

class WithdrawalQueue {
    constructor() {
        this.queue = null;
        this.initializeQueue();
    }

    initializeQueue() {
        this.queue = new Queue(
            process.env.WITHDRAWAL_QUEUE_NAME || "withdrawal-queue",
            process.env.REDIS_URL
        );

        this.queue.on("completed", (job) => {
            console.log(`Withdrawal job ${job.id} completed`);
        });

        this.queue.on("failed", (job, err) => {
            console.error(`Withdrawal job ${job.id} failed`, err);
        });

        this.queue.on("stalled", (job) => {
            console.warn(`Withdrawal job ${job.id} stalled`);
        });

        this.queue.process("process-withdrawal", 10, async (job) => {
            const { withdrawalId } = job.data;

            console.log(`Processing withdrawal ${withdrawalId}`);
            // simulate progress
            await job.progress(42);

            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const withdrawal = await Withdrawal.findById(withdrawalId).session(session);

                if (!withdrawal) {
                    throw new Error("Withdrawal not found");
                }

                // 🔐 Secure state transition
                if (!withdrawal.canTransitionTo("processing")) {
                    logger.warn(`Invalid transition for ${withdrawalId}`);
                    await session.abortTransaction();
                    return;
                }

                withdrawal.transitionStatus("processing");
                await withdrawal.save({ session });

                /*
                |--------------------------------------------------------------------------
                | MOCK PAYMENT GATEWAY
                |--------------------------------------------------------------------------
                */

                const isSuccess = Math.random() > 0.2; // 80% success

                if (isSuccess) {
                    withdrawal.transitionStatus("success");
                } else {
                    withdrawal.transitionStatus("failed");

                    // 🔁 Refund if failed
                    await Wallet.findOneAndUpdate(
                        { userId: withdrawal.userId },
                        { $inc: { balance: withdrawal.amount } },
                        { session }
                    );
                }

                await withdrawal.save({ session });

                /*
                |--------------------------------------------------------------------------
                | TRANSACTION LOG (IMMUTABLE)
                |--------------------------------------------------------------------------
                */
                const { userId, amount, referenceId } = withdrawal;
                const wallet = await Wallet.findOne({ userId }).session(session);
                if (!wallet) throw new Error("Wallet not found");

                const balanceBefore = wallet.balance;
                const updatedBalnce = isSuccess ? balanceBefore : balanceBefore + amount;

                await TransactionLog.create(
                    [
                        {
                            userId: userId,
                            walletId: wallet._id,
                            withdrawalId,
                            type: isSuccess ? "withdrawal_completed" : "refund",
                            amount: amount,
                            balanceBefore,
                            balanceAfter: updatedBalnce,
                            status: isSuccess ? "success" : "failed",
                            referenceId,
                        }
                    ],
                    { session }
                );

                await session.commitTransaction();
                session.endSession();

                return { success: true, withdrawalId };

            } catch (error) {
                await session.abortTransaction();
                session.endSession();
                logger.error(`Error processing withdrawal ${withdrawalId}`, error);
                throw error;
            }
        });

    }


    getQueue() {
        return this.queue;
    }

    async close() {
        if (this.queue) {
            await this.queue.close();
        }
    }
}

export default new WithdrawalQueue();

