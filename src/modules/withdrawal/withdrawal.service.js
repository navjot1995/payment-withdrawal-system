import mongoose from "mongoose";
import Withdrawal, { WITHDRAWAL_STATUS } from "./withdrawal.model.js";
import Wallet from "../wallet/wallet.model.js";
import TransactionLog from "../transaction-log/transactionLog.model.js";
import { randomUUID } from "crypto";
import User from "../user/user.model.js";
import withdrawalQueue from "../../jobs/withdrawal.processor.js";

export async function getWithdrawalById(withdrawalId) {
    try {
        const withdrawal = await Withdrawal.findById(withdrawalId);

        if (!withdrawal) {
            throw new Error("Withdrawal not found");
        }

        return withdrawal;
    } catch (error) {
        console.log("error", error);
        throw new Error("Withdrawal not found");
    }
}

export async function createWithdrawal({
    userId,
    amount,
    destination,
    idempotencyKey
}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const user = await User.findOne({ _id: userId });

        if (!user || user.status !== "active") {
            throw new Error("User not eligible for withdrawal");
        }
        // 1️⃣ Idempotency check
        const existing = await Withdrawal.findOne({ idempotencyKey }).session(session);

        if (existing) {
            await session.commitTransaction();
            session.endSession();
            return existing;
        }

        const wallet = await Wallet.findOne({ userId }).session(session);
        if (!wallet) throw new Error("Wallet not found");

        const balanceBefore = wallet.balance;

        if (!wallet.hasSufficientBalance(amount)) {
            throw new Error("Insufficient balance");
        }


        // 2️⃣ Atomic wallet deduction
        const updatedWallet = await Wallet.findOneAndUpdate(
            {
                userId,
                balance: { $gte: amount }
            },
            {
                $inc: { balance: -amount }
            },
            {
                new: true,
                session
            }
        );

        if (!updatedWallet) {
            throw new Error("Insufficient balance");
        }

        const referenceId = randomUUID();

        // 3️⃣ Create withdrawal record
        const withdrawal = await Withdrawal.create(
            [
                {
                    userId,
                    amount,
                    destination,
                    idempotencyKey,
                    referenceId,
                    status: WITHDRAWAL_STATUS.PENDING
                }
            ],
            { session }
        );

        // 4️⃣ Create immutable transaction log
        await TransactionLog.create(
            [
                {
                    userId,
                    walletId: wallet._id,
                    type: "withdrawal_initiated",
                    amount,
                    balanceBefore,
                    balanceAfter: updatedWallet.balance,
                    status: "success",
                    referenceId,
                    withdrawalId: withdrawal[0]._id
                }
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        // ✅ SIMULATION STARTS HERE (AFTER COMMIT)
        const withdrawalId = withdrawal[0]._id;

        await withdrawalQueue.getQueue().add("process-withdrawal", {
            withdrawalId
        });


        return withdrawal[0];

    } catch (err) {
        console.log("error", err);
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

export async function updateWithdrawalStatus({
    withdrawalId,
    newStatus,
    failureReason
}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const withdrawal = await Withdrawal.findById(withdrawalId).session(session);

        console.log("withdrawal", withdrawalId, newStatus, failureReason, withdrawal);

        if (!withdrawal) {
            throw new Error("Withdrawal not found");
        }

        // 🔒 Validate state transition using model method
        if (!withdrawal.canTransitionTo(newStatus)) {
            throw new Error(
                `Invalid status transition from ${withdrawal.status} to ${newStatus}`
            );
        }

        withdrawal.transitionStatus(newStatus);

        if (newStatus === WITHDRAWAL_STATUS.FAILED && failureReason) {
            withdrawal.failureReason = failureReason;

            const wallet = await Wallet.findOne({ userId }).session(session);
            if (!wallet) throw new Error("Wallet not found");


            // 🔁 Refund wallet if withdrawal failed AFTER deduction
            const updatedWallet = await Wallet.findOneAndUpdate(
                { userId: withdrawal.userId },
                { $inc: { balance: withdrawal.amount } },
                { new: true, session }
            );



            // 🧾 Log refund transaction
            await TransactionLog.create(
                [
                    {
                        userId: withdrawal.userId,
                        walletId: wallet._id,
                        type: "refund",
                        amount: withdrawal.amount,
                        balanceAfter: updatedWallet.balance,
                        balanceBefore: wallet.balance,
                        status: "success",
                        referenceId: withdrawal.referenceId,
                        withdrawalId: withdrawal._id
                    }
                ],
                { session }
            );
        }

        await withdrawal.save({ session });

        await session.commitTransaction();
        session.endSession();

        return withdrawal;

    } catch (err) {
        console.log("Update Withdrawal Status error", err);
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}


export async function markWithdrawalSuccess(withdrawalId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const withdrawal = await Withdrawal.findById(withdrawalId).session(session);

        if (!withdrawal) {
            throw new Error("Withdrawal not found");
        }

        console.log("withdrawal", withdrawal);

        // 🔒 Ensure valid transition
        if (!withdrawal.canTransitionTo(WITHDRAWAL_STATUS.SUCCESS)) {
            throw new Error(
                `Invalid transition from ${withdrawal.status} to success`
            );
        }

        withdrawal.transitionStatus(WITHDRAWAL_STATUS.SUCCESS);

        await withdrawal.save({ session });

        //   await TransactionLog.create(
        //     [
        //       {
        //         userId: withdrawal.userId,
        //         type: "withdrawal_completed",
        //         amount: withdrawal.amount,
        //         status: "success",
        //         referenceId: withdrawal.referenceId,
        //         withdrawalId: withdrawal._id
        //       }
        //     ],
        //     { session }
        //   );

        await session.commitTransaction();
        session.endSession();

        return withdrawal;

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}