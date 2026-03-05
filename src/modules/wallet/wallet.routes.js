import express from "express";
import { getWallet, creditWallet } from "./wallet.controller.js";

const router = express.Router();

router.get("/:userId", getWallet);
router.post("/:userId/credit", creditWallet);

export default router;