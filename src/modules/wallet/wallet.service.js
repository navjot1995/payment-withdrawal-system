import mongoose from "mongoose";
import Wallet from "./wallet.model.js";
import TransactionLog from "../transaction-log/transactionLog.model.js";

export async function getWallet(userId) {
  const wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return wallet;
}

export async function creditWallet(userId, amount) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ userId }).session(session);
  

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const balanceBefore = wallet.balance;
    const amountDecimal = mongoose.Types.Decimal128.fromString(amount);

    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amountDecimal } },
      { new: true, session }
    );

    await TransactionLog.create(
      [{
        userId,
        walletId: wallet._id,
        type: "credit",
        amount: amountDecimal,
        balanceBefore,
        balanceAfter: updatedWallet.balance,
        status: "success",
        referenceId: crypto.randomUUID()
      }],
      { session }
    );

    await session.commitTransaction();
    return updatedWallet;

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}