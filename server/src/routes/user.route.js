import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyMembership } from "../middlewares/groupAuth.middleware.js";

import {
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  updateAvatar,
  getCurrentUser,
  getOtherUser,
  changePassword,
  searchUsers,
  getCurrentUserGroups,
  getCommonGroups,
  getMyFriends,
} from "../controllers/user.controller.js";

const router = Router();

// Static routes

//auth routes
router.route("/auth/register").post(upload.single("avatar"), registerUser);
router.route("/auth/login").post(loginUser);
router.route("/auth/logout").post(verifyToken, logoutUser);

// Self routes

router.route("/me").get(verifyToken, getCurrentUser);
router.route("/me").put(verifyToken, updateUser);
router
  .route("/me/avatar")
  .put(verifyToken, upload.single("avatar"), updateAvatar);
router.route("/me/groups").get(verifyToken, getCurrentUserGroups);
router.route("/me/friends").get(verifyToken, getMyFriends);

// Utility routes

router.route("/change-password").post(verifyToken, changePassword);
router.route("/search").get(verifyToken, searchUsers);

// Dynamic routes

router.route("/:userId").get(verifyToken, getOtherUser);
router.route("/:userId/groups").get(verifyToken, getCommonGroups);

export default router;
