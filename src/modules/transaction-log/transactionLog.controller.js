import * as transactionService from "./transactionLog.service.js";

export async function getUserTransactions(req, res) {
  try {
    const { userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await transactionService.getUserTransactions(
      userId,
      page,
      limit
    );

    return res.json(result);

  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function getByReference(req, res) {
  try {
    const { referenceId } = req.params;

    const transaction =
      await transactionService.getTransactionByReference(referenceId);

    return res.json(transaction);

  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
}

export async function getByWithdrawal(req, res) {
  try {
    const { withdrawalId } = req.params;

    const transaction =
      await transactionService.getTransactionByWithdrawal(withdrawalId);

    return res.json(transaction);

  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
}