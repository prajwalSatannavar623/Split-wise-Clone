import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getFavGroups = asyncHandler(async (req, res) => {
  const favGroups = user.favGroups;

  return res
    .status(200)
    .json(
      new ApiResponse(200, favGroups, "User's favGroups fetched successfully"),
    );
});

const addFavGroup = asyncHandler(async (req, res) => {
  const favGroupId = req.params.groupId;

  if (!favGroupId) {
    throw new ApiError(400, "FavGroup Id Not Found");
  }

  //confirm if the group is already present in the user's favGroups
  const isFavGroupPresent = req.user.favGroups.includes(favGroupId);

  if (isFavGroupPresent) {
    throw new ApiError(400, "Group already present in user's favGroups");
  }

  const favGroupUpdatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        favGroups: favGroupId,
      },
    },
    {
      returnDocument: "after",
    },
  ).select("_id userName fullName groupsIn favGroups");

  if (!favGroupUpdatedUser) {
    throw new ApiError(500, "Error while adding favGroup");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, favGroupUpdatedUser, "FavGroup added successfully"),
    );
});

const removeFavGroup = asyncHandler(async (req, res) => {
  const toBeRemovedFavGroup = req.params.groupId;

  if (!toBeRemovedFavGroup) {
    throw new ApiError(400, "GroupId Not Found");
  }

  //confirm if the group is present in the user's favGroups
  const isFavGroupPresent = req.user.favGroups.includes(toBeRemovedFavGroup);

  if (!isFavGroupPresent) {
    throw new ApiError(400, "Group not present in user's favGroups");
  }

  const removedFavGroupUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        favGroups: toBeRemovedFavGroup,
      },
    },
    {
      returnDocument: "after",
    },
  ).select("_id userName fullName groupsIn favGroups");

  if (!removedFavGroupUser) {
    throw new ApiError(500, "Error while removing from FavGroups");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        removedFavGroupUser,
        "Removed from favGroups successfully",
      ),
    );
});

export { getFavGroups, addFavGroup, removeFavGroup };
