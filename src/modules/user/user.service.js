import mongoose from "mongoose";
import User, { USER_STATUSES } from "./user.model.js";
import Wallet from "../wallet/wallet.model.js";

export async function createUser(email) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existing = await User.findOne({ email }).session(session);
    if (existing) {
      throw new Error("User already exists");
    }

    const user = await User.create([{ email }], { session });

    await Wallet.create(
      [
        {
          userId: user[0]._id,
          balance: mongoose.Types.Decimal128.fromString("0.00")
        }
      ],
      { session }
    );

    await session.commitTransaction();
    return user[0];

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  return user;
}

export async function updateUserStatus(userId, newStatus) {
  if (!Object.values(USER_STATUSES).includes(newStatus)) {
    throw new Error("Invalid status");
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.status === USER_STATUSES.CLOSED) {
    throw new Error("Closed user cannot be modified");
  }

  user.status = newStatus;
  await user.save();

  return user;
}