import mongoose, { Schema } from "mongoose";

const settlementSchema = Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "Payment settlement",
      trim: true,
    },
  },
  { timestamps: true },
);

export const Settlement = mongoose.model("Settlement", settlementSchema);
