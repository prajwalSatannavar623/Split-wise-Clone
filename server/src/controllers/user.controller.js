import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Group } from "../models/group.model.js";
import mongoose from "mongoose";

import jwt from "jsonwebtoken";

import {
  uploadOnCloudinary,
  deletingOldCloudinaryImages,
} from "../services/cloudinary.service.js";
import { application } from "express";

const registerUser = asyncHandler(async (req, res) => {
  const { userName, fullName, email, password } = req.body;

  // validation :
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All required fields are mandatory");
  }

  //checking for existing user:
  const existedUser = await User.find({
    email,
  });

  if (existedUser.length != 0) {
    throw new ApiError(400, "User with this email already exist");
  }

  const existedUserName = await User.find({ userName });

  if (existedUserName.length != 0) {
    throw new ApiError(400, "username already taken");
  }

  // avatar:
  let avatarLocalPath;
  if (req.file && req.file.fieldname === "avatar") {
    avatarLocalPath = req.file.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Upload on cloudinary with retries
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Something went wrong while updating Avatar");
  }

  //Create an user on database
  const user = await User.create({
    userName: userName.toLowerCase(),
    fullName: fullName,
    email: email,
    avatar: avatar.url,
    password: password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "ERROR while generating access and refreshTokens");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //validating:
  if (!email || !password) {
    throw new ApiError(400, "email and password required");
  }

  const user = await User.findOne({ email }).select("-refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  //checking for password:
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Incorrect username or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  // cookie based access tokens for web based apps, and inside headers for mobile based apps
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully...",
      ),
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request");
  }

  try {
    const decodedUser = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedUser?._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(401, "Refresh token expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      decodedUser?._id,
    );

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: user,
            accessToken,
            refreshToken,
          },
          "Token refreshed refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid refresh token");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      returnDocument: "after",
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { email, fullName, userName } = req.body;

  if (!email && !fullName && !userName) {
    throw new ApiError(
      400,
      "One of update fields email, fullName or username required",
    );
  }

  const updateInfo = {};
  if (email) {
    updateInfo.email = email;
  }
  if (fullName) {
    updateInfo.fullName = fullName;
  }
  if (userName) {
    updateInfo.userName = userName;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateInfo, {
    returnDocument: "after",
  }).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(201, updatedUser, "User info updated successfully"));
});

// use case not speciefied in requirements...
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "No userId found");
  }

  const deletedUser = await User.findByIdAndDelete(userId);

  if (!deleteUser) {
    throw new ApiError(404, "User Not Found");
  }

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {},
        "Account deleted successfully and tokens cleared",
      ),
    );
});

const getPublicIdFromUrl = (url) => {
  // Splits by '/', takes the last part, then splits by '.' to remove extension
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1];
  return lastPart.split(".")[0];
};

const updateAvatar = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "No userId Found");
  }

  let avatarLocalPath;
  if (req.file && req.file.fieldname === "avatar") {
    avatarLocalPath = req.file.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is requireds");
  }

  // upload on cloudinay:
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Something went wrong while updating Avatar");
  }

  //delete old file from cloudinary:
  const oldUrl = req.user.avatar;

  const oldPublicID = getPublicIdFromUrl(oldUrl);

  const deleteResponse = await deletingOldCloudinaryImages(oldPublicID);

  //update the avatar url:
  const updatedAvatarUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: avatar.url,
    },
    {
      returnDocument: "after",
    },
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedAvatarUser,
        "User Avatar updated successfully",
      ),
    );
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!newPassword && !oldPassword && !confirmPassword) {
    throw new ApiError(400, "All fields are required");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Password not Matching");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User Not found");
  }

  const isOldPasswordCorrect = user.isPasswordCorrect(oldPassword);

  if (!isOldPasswordCorrect) {
    throw new ApiError(400, "Password Incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User password updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .populate("groupsIn", "name _id")
    .select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

const getOtherUser = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;

  if (!otherUserId) {
    throw new ApiError(400, "No userId Found");
  }

  const otherUser = await User.findById(otherUserId).select(
    "fullName userName email avatar",
  );

  if (!otherUser) {
    throw new ApiError(404, "User Not Found");
  }

  const commonGroups = await Group.find({
    members: { $all: [otherUserId, req.user._id] },
  }).select("_id name balances");

  if (!commonGroups) {
    throw new ApiError(400, "No common groups found");
  }

  const settlementMap = [];

  commonGroups.forEach((group) => {
    group.balances.forEach((balance) => {
      const settlement = {};
      const from = balance.from.toString();
      const to = balance.to.toString();

      if (req.user._id.toString() === from && otherUserId.toString() === to) {
        settlement.position = "owe";
        settlement.amount = balance.amount;
        settlement.group = group.name;
        settlement.groupId = group._id;
        settlementMap.push(settlement);
      } else if (
        otherUserId.toString() === from &&
        req.user._id.toString() === to
      ) {
        settlement.postion = "owed";
        settlement.amount = balance.amount;
        settlement.group = group.name;
        settlement.groupId = group._id;
        settlementMap.push(settlement);
      }
    });
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userInfo: otherUser, transactionHistory: settlementMap },
        "User data fetched successfully",
      ),
    );
});

const getCurrentAvatar = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const avatarUser = await User.findById(userId);

  if (!avatarUser) {
    throw new ApiResponse(404, "User Not Found");
  }

  const AvatarUserUrl = avatarUser.avatar;

  if (!AvatarUserUrl) {
    throw new ApiError(404, "No avatar url found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatarUrl: AvatarUserUrl },
        "User Avatar Url fetched successfully",
      ),
    );
});

const getOtherAvatar = asyncHandler(async (req, res) => {
  const { otherUserId } = req.params;

  if (!otherUserId) {
    throw new ApiResponse(400, "No usedId Found");
  }

  const otherUser = await User.findById(otherUserId);

  if (!otherUser) {
    throw new ApiResponse(404, "User Not Found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatarUrl: otherUser.avatar },
        "User Avatar fetched successfully",
      ),
    );
});

const getCurrentUserGroups = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const groupsIn = await Group.find({
    members: userId,
  }).select("_id name balances");

  const groupSummaries = groupsIn.map((group) => {
    let totalOwe = 0;
    let totalOwed = 0;

    group.balances.forEach((balance) => {
      if (balance.from.toString() === userId.toString()) {
        totalOwe += balance.amount;
      } else if (balance.to.toString() === userId.toString()) {
        totalOwed += balance.amount;
      }
    });

    return {
      groupId: group._id,
      groupName: group.name,
      totalOwe: totalOwe,
      totalOwed: totalOwed,
      netBalance: totalOwed - totalOwe,
    };
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        groupSummaries,
        "Group balances aggregated successfully",
      ),
    );
});

// redundant
const getCommonGroups = asyncHandler(async (req, res) => {
  console.log("Entered getCommonGroups");
  const otherUserId = req.params.userId;

  if (!otherUserId) {
    throw new ApiError(400, "No userId Found");
  }

  const commonGroups = await Group.aggregate([
    {
      $match: {
        members: {
          $all: [req.user._id, new mongoose.Types.ObjectId(otherUserId)],
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        admin: 1,
        memberCount: { $size: "$members" },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, commonGroups, "Common groups fetched successfully"),
    );
});

const searchUsers = asyncHandler(async (req, res) => {
  const searchQuery = req.query.q || "";
  const limit = req.query.limit || 10;

  if (!searchQuery.trim()) {
    throw new ApiResponse(200, { users: [] }, "No users found");
  }

  const searchedUsers = await User.find({
    $or: [
      { userName: { $regex: searchQuery, $options: "i" } },
      { fullName: { $regex: searchQuery, $options: "i" } },
    ],
  })
    .select("_id userName fullName avatar email")
    .limit(limit);

  return res
    .status(200)
    .json(new ApiResponse(200, searchedUsers, "Fetched searched users"));
});

const getMyFriends = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  // 1. Find all groups where the current user is a member
  // 2. Project all members from those groups
  // 3. Filter out the current user
  // 4. Return unique users
  const friends = await Group.aggregate([
    { $match: { members: currentUserId } },
    { $unwind: "$members" },
    { $match: { members: { $ne: currentUserId } } },
    {
      $group: {
        _id: "$members", // Group by user ID to get unique friends
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: "$userDetails" },
    {
      $project: {
        _id: 1,
        fullName: "$userDetails.fullName",
        userName: "$userDetails.userName",
        avatar: "$userDetails.avatar",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, friends, "Friends list fetched successfully"));
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  updateUser,
  deleteUser,
  updateAvatar,
  getCurrentUser,
  getCurrentAvatar,
  getOtherUser,
  getOtherAvatar,
  changePassword,
  searchUsers,
  getCurrentUserGroups,
  getCommonGroups,
  getMyFriends,
};
