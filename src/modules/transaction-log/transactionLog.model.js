import mongoose from "mongoose";

const { Schema } = mongoose;

export const TRANSACTION_TYPES = {
  WITHDRAWAL_INITIATED: "withdrawal_initiated",
  WITHDRAWAL_COMPLETED: "withdrawal_completed",
  REFUND: "refund",
  CREDIT: "credit"
};

export const TRANSACTION_STATUS = {
  SUCCESS: "success",
  FAILED: "failed"
};

const transactionLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true
    },

    withdrawalId: {
      type: Schema.Types.ObjectId,
      ref: "Withdrawal",
      index: true
    },

    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
      index: true
    },

    amount: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (v) => v.toString()
    },

    balanceBefore: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (v) => v.toString()
    },

    balanceAfter: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (v) => v.toString()
    },

    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      required: true,
      index: true
    },

    referenceId: {
      type: String,
      required: true,
      index: true
    },

    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, 
    versionKey: false,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);


transactionLogSchema.index({ walletId: 1, createdAt: 1 });
transactionLogSchema.index({ userId: 1, createdAt: -1 });
transactionLogSchema.index({ referenceId: 1 });
transactionLogSchema.index({ withdrawalId: 1 });

transactionLogSchema.pre("save", function (next) {
  if (!this.isNew) {
    return next(new Error("Transaction logs are immutable"));
  }
  next();
});

transactionLogSchema.pre("findOneAndUpdate", function () {
  throw new Error("Transaction logs are immutable");
});

transactionLogSchema.pre("updateOne", function () {
  throw new Error("Transaction logs are immutable");
});

transactionLogSchema.pre("deleteOne", function () {
  throw new Error("Transaction logs cannot be deleted");
});

transactionLogSchema.pre("deleteMany", function () {
  throw new Error("Transaction logs cannot be deleted");
});

export default mongoose.model("TransactionLog", transactionLogSchema);