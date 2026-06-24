import { ApiError } from "./ApiError.js";
import { Group } from "../models/group.model.js";
import { Expense } from "../models/expense.model.js";

const calculateNetBalances = async (groupId, session) => {
  try {
    console.log("Entered calculateNetBalances");
    const expenses = await Expense.find({ group: groupId })
      .session(session)
      .populate("paidBy", "_id")
      .populate("splitInfo.userId", "_id");

    console.log("All expenses:", expenses);

    const balances = {};

    // Initialize balances for all group members
    const group = await Group.findById(groupId)
      .session(session)
      .populate("members");
    group.members.forEach((member) => {
      balances[member._id.toString()] = 0;
    });

    // Calculate balances from expenses
    expenses.forEach((expense) => {
      const paidById = expense.paidBy._id.toString();

      // Person who paid gets credit
      if (!balances[paidById]) {
        balances[paidById] = 0;
      }

      // Calculate what each person owes
      expense.splitInfo.forEach((split) => {
        const userId = split.userId._id.toString();
        if (!balances[userId]) {
          balances[userId] = 0;
        }

        // This person owes money (positive amount means owes)
        balances[userId] += split.shareAmount;
        // Person who paid is owed money (negative balance)
        balances[paidById] -= split.shareAmount;
      });
    });

    return balances;
  } catch (error) {
    throw new ApiError(500, `Error calculating balances: ${error.message}`);
  }
};

const getSettlementPlan = (balances) => {
  const debtors = []; // People who owe money (positive balance)
  const creditors = []; // People who are owed money (negative balance)
  const settlements = [];

  // Separate debtors and creditors
  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance > 0.01) {
      // Account for floating point errors
      debtors.push({ userId, amount: balance });
    } else if (balance < -0.01) {
      creditors.push({ userId, amount: Math.abs(balance) });
    }
  });

  // Sort to ensure consistent order
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  // Greedy matching: match highest debtor with highest creditor
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settlementAmount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(settlementAmount * 100) / 100,
    });

    debtor.amount -= settlementAmount;
    creditor.amount -= settlementAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
};

const calculateEqualSplit = async (amount, userIds) => {
  const shareAmount = amount / userIds.length;

  // return array of objects
  return userIds.map((userId) => ({
    userId,
    shareAmount: Math.round(shareAmount * 100) / 100,
  }));
};

// expected splitInfo:
// format: [{userId: <_id>, percentage:<number>}]
const calculatePercentageSplit = async (amount, splitInfo) => {
  console.log("entered calculatepercentageSplit");
  const totalPercentage = splitInfo.reduce(
    (sum, split) => sum + (split.percentage || 0),
    0,
  );

  console.log(totalPercentage);

  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Percentages must add up to 100, got ${totalPercentage}`);
  }

  // retirn array of Objects
  return splitInfo.map((split) => ({
    userId: split.userId,
    shareAmount: Math.round(((amount * split.percentage) / 100) * 100) / 100,
    percentage: split.percentage,
  }));
};

const validateSplitInfo = async (splitInfo, amount, groupId) => {
  try {
    // Check if split amounts add up to total expense
    console.log(splitInfo, groupId, amount);

    const totalSplit = splitInfo.reduce(
      (sum, split) => sum + split.shareAmount,
      0,
    );

    console.log(totalSplit);

    if (Math.abs(totalSplit - amount) > 0.01) {
      throw new ApiError(
        400,
        `Split amounts (${totalSplit}) do not equal expense amount (${amount})`,
      );
    }

    console.log("hello");

    // Verify all users are group members
    const group = await Group.findById(groupId).select("members");

    const memberIds = group.members;
    console.log(memberIds);

    for (const split of splitInfo) {
      if (!memberIds.includes(split.userId.toString())) {
        throw new ApiError(
          403,
          `User ${split.userId} is not a member of this group`,
        );
      }
    }

    console.log("Im prajwal");

    return true;
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while validating the splits",
    );
  }
};

const updateGroupBalances = async (groupId, session) => {
  try {
    console.log("Entered updateGroupBalces");
    console.log(groupId);

    const balances = await calculateNetBalances(groupId, session);
    const settlementPlan = getSettlementPlan(balances);

    console.log(balances, settlementPlan);

    // Convert settlement plan to group balance format
    const groupBalances = settlementPlan.map((settlement) => ({
      from: settlement.from,
      to: settlement.to,
      amount: settlement.amount,
    }));

    await Group.findByIdAndUpdate(
      groupId,
      { balances: groupBalances },
      { session, returnDocument: "after" },
    );

    return groupBalances;
  } catch (error) {
    throw new Error(`Error updating group balances: ${error.message}`);
  }
};

export {
  calculateEqualSplit,
  calculatePercentageSplit,
  validateSplitInfo,
  updateGroupBalances,
  calculateNetBalances,
  getSettlementPlan,
};
