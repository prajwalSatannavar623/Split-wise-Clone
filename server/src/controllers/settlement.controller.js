import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Group } from "../models/group.model.js";

import { calculateNetBalances } from "../utils/balanceUtils.js";
import { ApiError } from "../utils/ApiError.js";

const getCurrentUserBalance = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch only the necessary fields from groups where the user is a member
  const groups = await Group.find(
    { members: userId },
    "balances", // We only need the balances array
  );

  if (!groups || groups.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { userId, totalOwes: 0, totalOwed: 0, netBalance: 0 },
          "No groups found",
        ),
      );
  }

  let totalOwes = 0;
  let totalOwed = 0;

  // 2. Iterate through each group
  for (const group of groups) {
    // 3. Iterate through each balance entry in the group
    for (const balance of group.balances) {
      const fromId = balance.from.toString();
      const toId = balance.to.toString();

      if (fromId === userId.toString()) {
        // User is the sender (they owe)
        totalOwes += balance.amount;
      } else if (toId === userId.toString()) {
        // User is the receiver (they are owed)
        totalOwed += balance.amount;
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userId,
        totalOwes: Math.round(totalOwes * 100) / 100,
        totalOwed: Math.round(totalOwed * 100) / 100,
        netBalance: Math.round((totalOwed - totalOwes) * 100) / 100,
      },
      "Balances retrieved successfully",
    ),
  );
});

const getUserBalanceWithOther = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  const userId = req.user._id;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(otherUserId)
  ) {
    throw new ApiError(400, "Invalid user IDs");
  }

  // Find common groups
  const commonGroups = await Group.find({
    members: { $all: [userId, otherUserId] },
  });

  if (commonGroups.length === 0) {
    throw new ApiError(404, "Users are not in any common group");
  }

  let totalBalance = 0;
  const groupBalances = [];

  // Calculate balance in each common group
  for (const group of commonGroups) {
    const balances = await calculateNetBalances(group._id);
    const userBalance = balances[userId] || 0;
    const otherBalance = balances[otherUserId] || 0;

    // Direct balance between them
    // Calculate who owes who from the expense splits
    const expenses = await Expense.find({
      group: group._id,
      $or: [{ paidBy: userId }, { "splitInfo.userId": userId }],
    }).populate("paidBy");

    let groupAmount = 0;

    for (const expense of expenses) {
      // If userId paid
      if (expense.paidBy._id.toString() === userId) {
        const otherPersonSplit = expense.splitInfo.find(
          (s) => s.userId.toString() === otherUserId,
        );
        if (otherPersonSplit) {
          groupAmount += otherPersonSplit.shareAmount;
        }
      }

      // If otherUserId paid
      if (expense.paidBy._id.toString() === otherUserId) {
        const userPersonSplit = expense.splitInfo.find(
          (s) => s.userId.toString() === userId,
        );
        if (userPersonSplit) {
          groupAmount -= userPersonSplit.shareAmount;
        }
      }
    }

    groupBalances.push({
      groupId: group._id,
      groupName: group.name,
      amount: Math.round(groupAmount * 100) / 100,
    });

    totalBalance += groupAmount;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userId,
        otherUserId,
        totalBalance: Math.round(totalBalance * 100) / 100,
        note:
          totalBalance > 0
            ? `${userId} owes ${otherUserId}`
            : totalBalance < 0
              ? `${otherUserId} owes ${userId}`
              : "Square",
        byGroup: groupBalances,
      },
      "Balance between users retrieved successfully",
    ),
  );
});

const getCurrentUserBalancesDetailed = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch groups where the user is a member
  // We include the 'balances' field to get the debt information
  const groups = await Group.find({ members: userId })
    .populate("members", "name")
    .select("name balances");

  let overallOwes = 0;
  let overallOwed = 0;

  const balanceByGroup = groups.map((group) => {
    let groupOwes = 0;
    let groupOwed = 0;
    const breakdown = [];

    // 2. Filter the balances array for this specific user
    group.balances.forEach((bal) => {
      const fromId = bal.from.toString();
      const toId = bal.to.toString();

      if (fromId === userId) {
        // User owes someone
        groupOwes += bal.amount;
        breakdown.push({ memberId: toId, amount: bal.amount, status: "owes" });
      } else if (toId === userId) {
        // Someone owes user
        groupOwed += bal.amount;
        breakdown.push({
          memberId: fromId,
          amount: bal.amount,
          status: "owed",
        });
      }
    });

    overallOwes += groupOwes;
    overallOwed += groupOwed;

    return {
      groupId: group._id,
      groupName: group.name,
      groupOwes: Math.round(groupOwes * 100) / 100,
      groupOwed: Math.round(groupOwed * 100) / 100,
      breakdown,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userId,
        overallOwes: Math.round(overallOwes * 100) / 100,
        overallOwed: Math.round(overallOwed * 100) / 100,
        netBalance: Math.round((overallOwed - overallOwes) * 100) / 100,
        balanceByGroup,
      },
      "Balances retrieved successfully",
    ),
  );
});

export {
  getCurrentUserBalance,
  getUserBalanceWithOther,
  getCurrentUserBalancesDetailed,
};
