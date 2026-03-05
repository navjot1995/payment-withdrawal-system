import mongoose from "mongoose";

const { Schema } = mongoose;

// withdrawal statuses
export const WITHDRAWAL_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed"
};

const withdrawalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    amount: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (v) => v.toString()
    },

    currency: {
      type: String,
      default: "USD",
      immutable: true
    },

    destination: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },

    status: {
      type: String,
      enum: Object.values(WITHDRAWAL_STATUS),
      default: WITHDRAWAL_STATUS.PENDING,
      index: true
    },

    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    referenceId: {
      type: String,
      required: true,
      index: true
    },

    failureReason: {
      type: String
    },

    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);


withdrawalSchema.set("strict", true);


withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ referenceId: 1 });

withdrawalSchema.methods.canTransitionTo = function (nextStatus) {
  const transitions = {
    pending: ["processing", "failed"],
    processing: ["success", "failed"],
    success: [],
    failed: []
  };

  return transitions[this.status]?.includes(nextStatus);
};

withdrawalSchema.methods.transitionStatus = function (nextStatus) {
  if (!this.canTransitionTo(nextStatus)) {
    throw new Error(
      `Invalid status transition from ${this.status} to ${nextStatus}`
    );
  }

  this.status = nextStatus;
};

export default mongoose.model("Withdrawal", withdrawalSchema);