import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

import { uploadOnCloudinary } from "../services/cloudinary.service.js";

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
    throw new ApiError(400, "Avatar file is required");
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

export { registerUser };
