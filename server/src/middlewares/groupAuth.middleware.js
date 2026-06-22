import { Group } from "../models/group.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyGroupAdmin = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;

  if (!groupId) {
    throw new ApiError(400, "No groupId Found");
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group Not Found");
  }

  const groupAdmin = group.admin;

  if (groupAdmin.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Access denied: Admin rights reserved"); // change message to generic one
  }

  req.group = group;

  next();
});

const verifyMembership = asyncHandler(async (req, res, next) => {
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
      "Access denied: You are not a member of this group", // change message to generic one
    );
  }

  req.group = group;

  next();
});

export { verifyGroupAdmin, verifyMembership };
