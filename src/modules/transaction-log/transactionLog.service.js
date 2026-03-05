import TransactionLog from "./transactionLog.model.js";

export async function getUserTransactions(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const transactions = await TransactionLog.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)


  const total = await TransactionLog.countDocuments({ userId });

  return {
    data: transactions,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getTransactionByReference(referenceId) {
  const transaction = await TransactionLog.findOne({ referenceId }).lean();

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
}

export async function getTransactionByWithdrawal(withdrawalId) {
  const transaction = await TransactionLog.findOne({ withdrawalId }).lean();

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
}