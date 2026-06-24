import { Expense } from "../models/expense.model.js";
import { Group } from "../models/group.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

import {
  calculateEqualSplit,
  calculateNetBalances,
  calculatePercentageSplit,
  getSettlementPlan,
  updateGroupBalances,
  validateSplitInfo,
} from "../utils/balanceUtils.js";

const createExpense = asyncHandler(async (req, res) => {
  const {
    description,
    amount,
    currencyType = "INR",
    paidBy,
    splitStrategy = "EQUAL",
    splitInfo,
    category,
  } = req.body;
  const groupId = req.params.groupId;

  console.log(req.body, groupId);

  // Validation
  if (!description || !amount || !paidBy || !groupId) {
    throw new ApiError(
      400,
      "Description, amount, paidBy, and groupId are required",
    );
  }

  if (amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  // group existence
  const group = await Group.findById(groupId).populate("members");
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  // Start transaction session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let finalSplitInfo = splitInfo;

    // Calculate splits based on strategy
    if (splitStrategy === "EQUAL") {
      const memberIds = group.members.map((m) => m._id);
      finalSplitInfo = await calculateEqualSplit(amount, memberIds);
    } else if (splitStrategy === "PERCENTAGE" && splitInfo) {
      finalSplitInfo = await calculatePercentageSplit(amount, splitInfo);
    }

    console.log(finalSplitInfo);

    // Double checking
    await validateSplitInfo(finalSplitInfo, amount, groupId);

    console.log("hello");

    // Create expense
    const expense = new Expense({
      description,
      amount,
      currencyType,
      paidBy,
      group: groupId,
      splitStrategy,
      splitInfo: finalSplitInfo,
      category: category || "OTHER",
    });

    console.log(expense);

    await expense.save({ session });

    console.log("Expense created");

    // Add expense to group
    await Group.findByIdAndUpdate(
      groupId,
      {
        $push: { expenses: expense._id },
      },
      { session, returnDocument: "after" },
    );

    // Recalculate and update group balances
    await updateGroupBalances(groupId, session);

    // Commit transaction
    await session.commitTransaction();

    // Populate expense details for response
    await expense.populate("paidBy", "name email avatar");
    await expense.populate("splitInfo.userId", "name email");

    return res
      .status(201)
      .json(new ApiResponse(201, expense, "Expense created successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(500, error?.message || "Error creating expense");
  } finally {
    session.endSession();
  }
});

const getExpenseById = asyncHandler(async (req, res) => {
  console.log("Entered getExpenseById");
  const { expenseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, "Invalid expense ID");
  }

  const expense = await Expense.findById(expenseId)
    .populate("paidBy", "name email avatar")
    .populate("group", "name members")
    .populate("splitInfo.userId", "name email");

  console.log(expense.group);

  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }

  // if accessor belongs to the group the expense belongs:
  const isValidAccess = expense.group.members.some(
    (memIds) => memIds.toString() === req.user._id.toString(),
  );

  if (!isValidAccess) {
    throw new ApiError(403, "Unauthorised Excess");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, expense, "Expense retrieved successfully"));
});

const getGroupExpenses = asyncHandler(async (req, res) => {
  const groupId = req.group._id;
  const {
    startDate,
    endDate,
    limit = 20,
    offset = 0,
    category,
    sortBy = "createdAt",
    sortOrder = "inc",
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new ApiError(400, "Invalid group ID");
  }

  // Build query
  const query = { group: groupId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  if (category) {
    query.category = category;
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

  const totalExpenses = await Expense.countDocuments(query);

  const expenses = await Expense.find(query)
    .sort(sortObj)
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .populate("paidBy", "name email avatar")
    .populate("splitInfo.userId", "name email");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        expenses,
        total: totalExpenses,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      "Expenses retrieved successfully",
    ),
  );
});

const updateExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const {
    description,
    amount,
    currencyType,
    splitStrategy,
    splitInfo,
    category,
  } = req.body;
  const userId = req.user._id.toString();

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, "Invalid expense ID");
  }

  const expense = await Expense.findById(expenseId);
  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }

  // Check permissions
  const group = await Group.findById(expense.group);
  const isAdmin = group.admin.toString() === userId;
  const isPaidBy = expense.paidBy.toString() === userId;

  if (!isAdmin && !isPaidBy) {
    throw new ApiError(403, "You don't have permission to delete this expense");
  }

  // Validate amount if being updated
  if (amount && amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Store old expense data for rollback if needed
    const oldAmount = expense.amount;
    const oldSplitInfo = expense.splitInfo;

    // Update expense fields
    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (currencyType) expense.currencyType = currencyType;
    if (category) expense.category = category;
    if (splitStrategy) expense.splitStrategy = splitStrategy;

    // Recalculate splits if amount or strategy changed
    if (amount || splitStrategy || splitInfo) {
      const finalAmount = amount || oldAmount;

      if (
        splitStrategy === "EQUAL" ||
        (amount && expense.splitStrategy === "EQUAL")
      ) {
        const groupMembers = await Group.findById(expense.group).select(
          "members",
        );
        expense.splitInfo = await calculateEqualSplit(
          finalAmount,
          groupMembers.members,
        );
      } else if (splitInfo) {
        expense.splitInfo = await calculatePercentageSplit(
          finalAmount,
          splitInfo,
        );
      }

      // Validate updated splits
      await validateSplitInfo(
        expense.splitInfo,
        finalAmount,
        expense.group.toString(),
      );
    }

    await expense.save({ session });

    // Recalculate group balances
    await updateGroupBalances(expense.group.toString(), session);

    await session.commitTransaction();

    // Populate for response
    await expense.populate("paidBy", "name email avatar");
    await expense.populate("splitInfo.userId", "name email");

    return res
      .status(200)
      .json(new ApiResponse(200, expense, "Expense updated successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(500, error.message || "Error updating expense");
  } finally {
    session.endSession();
  }
});

const deleteExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user._id.toString();

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, "Invalid expense ID");
  }

  const expense = await Expense.findById(expenseId);
  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }

  // Check permissions
  const group = await Group.findById(expense.group);
  const isAdmin = group.admin.toString() === userId;
  const isPaidBy = expense.paidBy.toString() === userId;

  if (!isAdmin && !isPaidBy) {
    throw new ApiError(403, "You don't have permission to delete this expense");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const groupId = expense.group.toString();

    // Delete expense
    await Expense.findByIdAndDelete(expenseId, { session });

    // Remove expense from group
    await Group.findByIdAndUpdate(
      groupId,
      {
        $pull: { expenses: expenseId },
      },
      { session, returnDocument: "after" },
    );

    // Recalculate and update group balances (will be zero if no expenses left)
    await updateGroupBalances(groupId, session);

    await session.commitTransaction();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Expense deleted successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(500, error.message || "Error deleting expense");
  } finally {
    session.endSession();
  }
});

const getUserExpensesAggregated = async (
  userId,
  groupId,
  startDate,
  endDate,
  limit,
  offset,
  res,
) => {
  const matchStage = {
    $match: {
      $or: [
        { paidBy: new mongoose.Types.ObjectId(userId) },
        { "splitInfo.userId": new mongoose.Types.ObjectId(userId) },
      ],
    },
  };

  if (groupId) {
    matchStage.$match.group = new mongoose.Types.ObjectId(groupId);
  }

  if (startDate || endDate) {
    matchStage.$match.createdAt = {};
    if (startDate) {
      matchStage.$match.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      matchStage.$match.createdAt.$lte = new Date(endDate);
    }
  }

  const expenses = await Expense.aggregate([
    matchStage,
    { $sort: { createdAt: -1 } },
    { $skip: parseInt(offset) },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: "users",
        localField: "paidBy",
        foreignField: "_id",
        as: "paidByDetails",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "splitInfo.userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
  ]);

  const totalExpenses = await Expense.countDocuments(matchStage.$match);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        expenses,
        total: totalExpenses,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      "User expenses retrieved successfully",
    ),
  );
};

const getCurrentUserExpenses = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const {
    type,
    groupId,
    startDate,
    endDate,
    limit = 20,
    offset = 0,
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const groupsUserBelongsTo = req.user.groupsIn;

  const belongsTo = groupsUserBelongsTo.some(
    (group) => group.toString() === groupId.toString(),
  );

  if (!belongsTo) {
    throw new ApiError(404, "Unauthorised request");
  }

  const query = {};

  // Type: paid or owed
  if (type === "paid") {
    query.paidBy = userId;
  } else if (type === "owed") {
    query["splitInfo.userId"] = userId;
  } else if (!type) {
    // Get both paid and owed (using aggregation)
    return getUserExpensesAggregated(
      userId,
      groupId,
      startDate,
      endDate,
      limit,
      offset,
      res,
    );
  }

  if (groupId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new ApiError(400, "Invalid group ID");
    }
    query.group = groupId;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const totalExpenses = await Expense.countDocuments(query);

  const expenses = await Expense.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .populate("paidBy", "name email avatar")
    .populate("group", "name")
    .populate("splitInfo.userId", "name email");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        expenses,
        total: totalExpenses,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      "User expenses retrieved successfully",
    ),
  );
});

const searchExpenses = asyncHandler(async (req, res) => {
  const {
    description,
    minAmount,
    maxAmount,
    groupId,
    category,
    startDate,
    endDate,
    limit = 20,
    offset = 0,
  } = req.query;

  console.log(req.query);

  const query = {};

  if (description) {
    query.description = { $regex: description, $options: "i" };
  }

  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) {
      query.amount.$gte = parseFloat(minAmount);
    }
    if (maxAmount) {
      query.amount.$lte = parseFloat(maxAmount);
    }
  }

  // if (groupId) {
  //   if (!mongoose.Types.ObjectId.isValid(groupId)) {
  //     throw new ApiError(400, "Invalid group ID");
  //   }
  //   query.group = groupId;
  // }

  //check group membership
  if (groupId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new ApiError(400, "Invalid group ID");
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new ApiError(404, "Group not found");
    }
    const isMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      throw new ApiError(403, "You are not a member of this group");
    }

    query.group = groupId;
  }

  if (category) {
    query.category = category;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const totalExpenses = await Expense.countDocuments(query);

  console.log("Total expenses found:", totalExpenses);

  const expenses = await Expense.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .populate("paidBy", "name email avatar")
    .populate("group", "name")
    .populate("splitInfo.userId", "name email");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        expenses,
        total: totalExpenses,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      "Expenses found successfully",
    ),
  );
});

export {
  createExpense,
  getExpenseById,
  getGroupExpenses,
  updateExpense,
  deleteExpense,
  getCurrentUserExpenses,
  searchExpenses,
};
