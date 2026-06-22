import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyMembership } from "../middlewares/groupAuth.middleware.js";

import {
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
} from "../controllers/user.controller.js";

const router = Router();

// auth routes
router.route("/auth/register").post(upload.single("avatar"), registerUser);
router.route("/auth/login").post(loginUser);
router.route("/auth/refresh-token").post(refreshAccessToken);
router.route("/auth/logout").post(verifyToken, logoutUser);

// self-Only
router.route("/me").get(verifyToken, getCurrentUser);
router.route("/me").put(verifyToken, updateUser);
router.route("/me").delete(verifyToken, deleteUser);
router.route("/me/avatar").get(verifyToken, getCurrentAvatar);
router
  .route("/me/avatar")
  .put(verifyToken, upload.single("avatar"), updateAvatar);
router.route("/change-password").post(verifyToken, changePassword);

//user Profile routes
router.route("/:userId").get(verifyToken, getOtherUser);
router.route("/:userId/avatar").get(verifyToken, getOtherAvatar);

// user Groups routes
router.route("/me/groups").get(verifyToken, getCurrentUserGroups);

router.route("/:userId/groups").get(verifyToken, getCommonGroups);

router.route("/search").get(verifyToken, searchUsers);

export default router;
