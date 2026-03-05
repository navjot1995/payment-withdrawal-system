import mongoose from "mongoose";

const { Schema } = mongoose;

const walletSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },

        balance: {
            type: Schema.Types.Decimal128,
            required: true,
            default: () => mongoose.Types.Decimal128.fromString("0.00"),
            get: (v) => (v ? v.toString() : "0.00")
        },

        currency: {
            type: String,
            default: "USD",
            immutable: true
        },

        version: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: { getters: true },
        toObject: { getters: true }
    }
);


walletSchema.set("strict", true);


walletSchema.index({ userId: 1 }, { unique: true });

walletSchema.pre("findOneAndUpdate", function () {
    const update = this.getUpdate();

    if (!update.$inc) {
        update.$inc = {};
    }

    update.$inc.version = 1;

    this.setUpdate(update);
});


walletSchema.methods.hasSufficientBalance = function (amount) {
    const current = parseFloat(this.balance.toString());
    return current >= parseFloat(amount);
};

export default mongoose.model("Wallet", walletSchema);