import { Group } from "../models/group.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //validation
  if (!name) {
    throw new ApiError(400, "name field is mandatory");
  }
  const adminId = req.user._id;

  const createdGroup = await Group.create({
    name: name,
    description: description,
    admin: adminId,
    members: [adminId],
  });

  if (!createdGroup) {
    throw new ApiError(500, "Error while creating a group");
  }

  await User.findByIdAndUpdate(
    req.user._id,
    { $push: { groupsIn: createdGroup._id } },
    { returnDocument: "after" },
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdGroup, "Group created successfully"));
});

const addMember = asyncHandler(async (req, res) => {
  const { userIdToAdd } = req.body;
  const groupId = req.group._id;

  if (!userIdToAdd) {
    throw new ApiError(404, "User Doesn't Exist");
  }

  // Verify the target user actually exists in the database
  const targetUser = await User.findById(userIdToAdd);
  if (!targetUser) {
    throw new ApiError(404, "The user you are trying to add does not exist.");
  }

  // Check if user is already in the group
  const isAlreadyMember = req.group.members.some(
    (memberId) => memberId.toString() === userIdToAdd,
  );

  if (isAlreadyMember) {
    throw new ApiError(400, "User is already a member of this group");
  }

  // Update the group and the user
  const updatedGroup = await Group.findByIdAndUpdate(
    groupId,
    { $push: { members: userIdToAdd } },
    { returnDocument: "after" },
  );

  // Update the user's "groups" array
  await User.findByIdAndUpdate(
    userIdToAdd,
    {
      $push: { groupsIn: groupId },
    },
    { returnDocument: "after" },
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, updatedGroup, "Member added to group successfully"),
    );
});

const deleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  // Check if all balances are settled
  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group Not Found");
  }

  const hasUnsettledBalances = group.balances?.some(
    (balance) => balance.amount !== 0,
  );

  if (hasUnsettledBalances) {
    throw new ApiError(
      400,
      "All expenses are not settled yet. Cannot delete the group.",
    );
  }

  // Delete the group from the groupsIn array of all members
  await User.updateMany(
    { _id: { $in: group.members } },
    { $pull: { groupsIn: groupId } },
  );

  // Delete the group from the database
  const deletedGroup = await Group.findByIdAndDelete(groupId);

  if (!deletedGroup) {
    throw new ApiError(500, "Error while deleting the group");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Group deleted successfully"));
});

const getGroupDetails = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  if (!groupId) {
    throw new ApiError(400, "No groupId Found");
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group Not Found");
  }

  if (!group.members.includes(req.user._id)) {
    throw new ApiError(
      403,
      "Access denied: You are not a member of this group",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, group, "Group details fetched successfully"));
});

const updateGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  if (!groupId) {
    throw new ApiError(400, "No groupId Found");
  }

  const { name, description } = req.body;

  if (!name && !description) {
    throw new ApiError(
      400,
      "At least one field (name or description) must be provided for update",
    );
  }

  const updateInfo = {};
  if (name) updateInfo.name = name;
  if (description) updateInfo.description = description;

  const UpdatedGroup = await Group.findByIdAndUpdate(
    groupId,
    {
      $set: updateInfo,
    },
    {
      returnDocument: "after",
    },
  );

  if (!UpdatedGroup) {
    throw new ApiError(404, "Group Not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, UpdatedGroup, "Group updated successfully"));
});

const removeMember = asyncHandler(async (req, res) => {
  const { userIdToRemove } = req.body;
  const { groupId } = req.params;

  if (!userIdToRemove) {
    throw new ApiError(400, "No userIdToRemove Found");
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group Not Found");
  }

  // admin cannot remove themselves from the group as of now
  if (userIdToRemove.toString() === group.admin.toString()) {
    throw new ApiError(400, "Admin cannot remove themselves from the group");
  }

  if (!group.members.includes(userIdToRemove)) {
    throw new ApiError(400, "User is not a member of this group");
  }

  // check all balances are cleared or not:
  const hasUnsettledBalances = group.balances.some((balance) => {
    const isInvolved =
      balance.from.toString() === userIdToRemove.toString() ||
      balance.to.toString() === userIdToRemove.toString();

    return isInvolved && balance.amount !== 0;
  });

  if (hasUnsettledBalances) {
    throw new ApiError(
      400,
      "User has balance settlements, cant be removed from group",
    );
  }

  // remove the member
  group.members = group.members.filter(
    (id) => id.toString() !== userIdToRemove,
  );
  await group.save({ validateBeforeSave: false });

  // Update the user's "groupsIn" array
  await User.findByIdAndUpdate(
    userIdToRemove,
    { $pull: { groupsIn: groupId } },
    { returnDocument: "after" },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, group, "Member removed successfully"));
});

const exitGroup = asyncHandler(async (req, res) => {
  const userIdToRemove = req.user._id;
  const { groupId } = req.params;

  if (!userIdToRemove) {
    throw new ApiError(400, "No userIdToRemove Found");
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group Not Found");
  }

  if (group.admin.toString() === userIdToRemove.toString()) {
    throw new ApiError(400, "Admin cannot exit the group");
  }

  if (!group.members.includes(userIdToRemove)) {
    throw new ApiError(400, "User is not a member of this group");
  }

  // check all balances are cleared or not:
  const hasUnsettledBalances = group.balances.some((balance) => {
    const isInvolved =
      balance.from.toString() === userIdToRemove.toString() ||
      balance.to.toString() === userIdToRemove.toString();

    return isInvolved && balance.amount !== 0;
  });

  if (hasUnsettledBalances) {
    throw new ApiError(
      400,
      "User has balance settlements, cant exit from group",
    );
  }

  // remove the member
  group.members = group.members.filter(
    (id) => id.toString() !== userIdToRemove.toString(),
  );
  await group.save({ validateBeforeSave: false });

  // Update the user's "groupsIn" array
  await User.findByIdAndUpdate(
    userIdToRemove,
    { $pull: { groupsIn: groupId } },
    { returnDocument: "after" },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, group, "Exited from group successfully"));
});

const getGroupMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ _id: { $in: req.group.members } }).select(
    "fullName userName email avatar",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, members, "Group members fetched successfully"));
});

const getGroupBalances = asyncHandler(async (req, res) => {
  const group = req.group;

  if (!group) {
    throw new ApiError(404, "Group Not Found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        group.balances,
        "Group balances fetched successfully",
      ),
    );
});

// checking pending
const getGroupSummary = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new ApiError(400, "Invalid group ID");
  }

  const group = await Group.findById(groupId).populate("members", "name email");
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  // Get all expenses in group
  const expenses = await Expense.find({ group: groupId }).populate(
    "paidBy",
    "name email",
  );

  // Calculate summary
  const summary = {
    groupId,
    groupName: group.name,
    totalExpenses: expenses.length,
    totalAmount: 0,
    memberCount: group.members.length,
    members: {},
  };

  // Initialize member summaries
  group.members.forEach((member) => {
    summary.members[member._id.toString()] = {
      memberId: member._id,
      name: member.name,
      email: member.email,
      paid: 0, // How much they paid
      owes: 0, // How much they should pay
      balance: 0, // paid - owes (positive = paid more, negative = owes more)
    };
  });

  // Process each expense
  expenses.forEach((expense) => {
    const paidById = expense.paidBy._id.toString();

    // Add to paid amount
    summary.members[paidById].paid += expense.amount;
    summary.totalAmount += expense.amount;

    // Add to owes amount for each split
    expense.splitInfo.forEach((split) => {
      const userId = split.userId.toString();
      summary.members[userId].owes += split.shareAmount;
    });
  });
});

export {
  createGroup,
  addMember,
  deleteGroup,
  getGroupSummary,
  getGroupDetails,
  updateGroup,
  removeMember,
  exitGroup,
  getGroupMembers,
  getGroupBalances,
};
