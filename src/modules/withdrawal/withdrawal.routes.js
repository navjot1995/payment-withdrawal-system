import express from "express";
import { createWithdrawal, getWithdrawalById } from "./withdrawal.controller.js";

const router = express.Router();

router.get("/:withdrawalId", getWithdrawalById);
router.post("/", createWithdrawal);
// router.patch("/:withdrawalId/success", markSuccess);
// router.patch("/:withdrawalId/failure", refundWithdrawalStatus);

export default router;