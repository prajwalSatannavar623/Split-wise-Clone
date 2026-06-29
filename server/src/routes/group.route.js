import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";

import {
  createGroup,
  addMember,
  getGroupDetails,
  updateGroup,
} from "../controllers/group.controller.js";
import {
  verifyGroupAdmin,
  verifyMembership,
} from "../middlewares/groupAuth.middleware.js";

const router = Router();

// static routes
// utility routes
router.route("/create-group").post(verifyToken, createGroup);

// dynamic routes
router.route("/:groupId").get(verifyToken, verifyMembership, getGroupDetails);
router
  .route("/:groupId")
  .put(verifyToken, verifyMembership, verifyGroupAdmin, updateGroup);

// utility routes
router
  .route("/:groupId/add-member")
  .post(verifyToken, verifyMembership, verifyGroupAdmin, addMember);

export default router;
