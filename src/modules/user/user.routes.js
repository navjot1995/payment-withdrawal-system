import express from "express";
import {
  createUser,
  getUser,
  updateUserStatus
} from "./user.controller.js";

const router = express.Router();

router.post("/", createUser);
router.get("/:userId", getUser);
router.patch("/:userId/status", updateUserStatus);

export default router;