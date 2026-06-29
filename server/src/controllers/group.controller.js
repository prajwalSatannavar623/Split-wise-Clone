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

const getGroupDetails = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  if (!groupId) {
    throw new ApiError(400, "No groupId Found");
  }

  // 1. Fetch and deeply populate the group
  const group = await Group.findById(groupId)
    .populate("members", "fullName userName email avatar")
    .populate("balances.from", "fullName userName avatar")
    .populate("balances.to", "fullName userName avatar")
    .populate({
      path: "expenses",
      options: { sort: { createdAt: -1 } },
      populate: { path: "paidBy", select: "fullName avatar" },
    });

  if (!group) {
    throw new ApiError(404, "Group Not Found");
  }

  const isMember = group.members.some(
    (member) => member._id.toString() === req.user._id.toString(),
  );

  if (!isMember) {
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

export { createGroup, addMember, getGroupDetails, updateGroup };
