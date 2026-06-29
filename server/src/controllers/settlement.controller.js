import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Group } from "../models/group.model.js";

import { calculateNetBalances } from "../utils/balanceUtils.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getCurrentUserBalance = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch
  const groups = await Group.find({ members: userId }, "balances");

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

  for (const group of groups) {
    for (const balance of group.balances) {
      const fromId = balance.from.toString();
      const toId = balance.to.toString();

      if (fromId === userId.toString()) {
        // User is the sender
        totalOwes += balance.amount;
      } else if (toId === userId.toString()) {
        // User is the receiver
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

export { getCurrentUserBalance };
