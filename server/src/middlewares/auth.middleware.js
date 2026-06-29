import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyToken = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken || req.header("authorization")?.split(" ")[1];

  if (!token) {
    throw new ApiError(400, "User not authenticated");
  }

  try {
    const decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedUser._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(401, "Expired or Corrupted Access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid Access Token");
  }
});

export { verifyToken };
