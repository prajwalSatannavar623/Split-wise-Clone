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
  const { expenseId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, "Invalid expense ID");
  }

  const expense = await Expense.findById(expenseId)
    .populate("paidBy", "fullName userName avatar")
    .populate("group", "name members")
    .populate("splitInfo.userId", "fullName userName avatar");

  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }

  const isValidAccess = expense.group.members.some(
    (memId) => memId.toString() === req.user._id.toString(),
  );

  if (!isValidAccess) {
    throw new ApiError(403, "Unauthorised Access");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, expense, "Expense retrieved successfully"));
});

const updateExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const { description, amount, splitStrategy, splitInfo, category } = req.body;
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

  const query = {};

  // 1. Group ID check (Only if provided in the query)
  if (groupId) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new ApiError(400, "Invalid group ID");
    }

    const belongsTo = req.user.groupsIn.some(
      (group) => group.toString() === groupId.toString(),
    );

    if (!belongsTo) {
      throw new ApiError(
        403,
        "Unauthorised request: Not a member of this group",
      );
    }

    query.group = groupId;
  } else {
    // Optional: If no groupId is provided, explicitly limit to groups the user is in
    query.group = { $in: req.user.groupsIn };
  }

  // 2. Type filtering
  if (type === "paid") {
    // Expenses where I paid the bill
    query.paidBy = userId;
  } else if (type === "owed") {
    // Expenses where I am part of the split, BUT someone else paid the bill
    query["splitInfo.userId"] = userId;
    query.paidBy = { $ne: userId }; // <-- THIS FIXES THE BUG
  } else {
    // "All" - either they paid, or they are in the split info
    query.$or = [{ paidBy: userId }, { "splitInfo.userId": userId }];
  }

  // 3. Date filtering
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const totalExpenses = await Expense.countDocuments(query);

  // 4. Fetch and populate consistently using your actual schema fields (fullName)
  const expenses = await Expense.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .populate("paidBy", "fullName userName avatar")
    .populate("group", "name")
    .populate("splitInfo.userId", "fullName userName avatar");

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

export { createExpense, getExpenseById, updateExpense, getCurrentUserExpenses };
