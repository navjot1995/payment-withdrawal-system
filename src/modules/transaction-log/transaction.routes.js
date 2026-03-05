import express from "express";
import {
  getUserTransactions,
  getByReference,
  getByWithdrawal
} from "./transactionLog.controller.js";

const router = express.Router();

// GET /api/transactions?userId=xxx&page=1&limit=20
router.get("/", getUserTransactions);
router.get("/reference/:referenceId", getByReference);
router.get("/withdrawal/:withdrawalId", getByWithdrawal);

export default router;