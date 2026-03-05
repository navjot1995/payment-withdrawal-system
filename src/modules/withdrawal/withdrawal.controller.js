import * as withdrawalService from "./withdrawal.service.js";

export async function getWithdrawalById(req, res) {
    try {
      const { withdrawalId } = req.params;
  
      const withdrawal = await withdrawalService.getWithdrawalById(withdrawalId);
  
      return res.json(withdrawal);
  
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  }

export async function createWithdrawal(req, res) {
  try {
    const { userId, amount, destination } = req.body;
    const idempotencyKey = req.headers["idempotency-key"];

    if (!userId || !amount || !destination) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!idempotencyKey) {
      return res.status(400).json({ message: "Idempotency-Key header required" });
    }

    const withdrawal = await withdrawalService.createWithdrawal({
      userId,
      amount,
      destination,
      idempotencyKey
    });

    return res.status(201).json(withdrawal);

  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function refundWithdrawalStatus(req, res) {
    try {
      const { withdrawalId } = req.params;
      const { status, failureReason } = req.body;
  
      if (!status) {
        return res.status(400).json({ message: "status is required" });
      }
  
      const updated = await withdrawalService.updateWithdrawalStatus({
        withdrawalId,
        newStatus: status,
        failureReason
      });
  
      return res.json(updated);
  
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

export async function markSuccess(req, res) {
    try {
      const { withdrawalId } = req.params;
  
      const result = await withdrawalService.markWithdrawalSuccess(withdrawalId);
  
      return res.json(result);
  
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }