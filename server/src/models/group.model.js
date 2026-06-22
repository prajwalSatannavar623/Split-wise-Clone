import mongoose, { mongo, Schema } from "mongoose";

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "splitwise group",
      trim: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    balances: [
      {
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
          default: 0.0,
        },
      },
    ],
    expenses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Expense",
      },
    ],
  },
  { timestamps: true },
);

export const Group = mongoose.model("Group", groupSchema);
