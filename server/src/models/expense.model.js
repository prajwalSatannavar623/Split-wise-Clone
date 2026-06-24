import mongoose, { Schema } from "mongoose";

const expenseSchema = new Schema(
  {
    category: {
      type: String,
      enum: [
        "FOOD AND DRINKS",
        "GROCERIES",
        "STAY",
        "HOME",
        "TRANSPORTATION",
        "ENTERTAINMENT",
        "MUSIC",
        "GAS",
        "CLOTHING",
        "OTHER",
      ],
      default: "OTHER",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currencyType: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    splitStrategy: {
      type: String,
      enum: ["EQUAL", "UNEQUAL", "PERCENTAGE"],
      default: "EQUAL",
    },
    splitInfo: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        shareAmount: {
          type: Number,
          required: true,
          min: 0,
        },
        percentage: {
          type: Number,
          default: null,
        },
      },
    ],
  },
  { timestamps: true },
);

export const Expense = mongoose.model("Expense", expenseSchema);
