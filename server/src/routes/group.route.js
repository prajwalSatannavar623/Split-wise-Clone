import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";

import {
  createGroup,
  addMember,
  deleteGroup,
  getGroupDetails,
  updateGroup,
  removeMember,
  exitGroup,
  getGroupMembers,
  getGroupBalances,
} from "../controllers/group.controller.js";
import {
  verifyGroupAdmin,
  verifyMembership,
} from "../middlewares/groupAuth.middleware.js";

const router = Router();

router.route("/create-group").post(verifyToken, createGroup);
router
  .route("/:groupId/add-member")
  .post(verifyToken, verifyMembership, verifyGroupAdmin, addMember);
router
  .route("/:groupId")
  .delete(verifyToken, verifyMembership, verifyGroupAdmin, deleteGroup);

router.route("/:groupId").get(verifyToken, verifyMembership, getGroupDetails);
router
  .route("/:groupId")
  .put(verifyToken, verifyMembership, verifyGroupAdmin, updateGroup);

router
  .route("/:groupId/remove-member")
  .post(verifyToken, verifyMembership, verifyGroupAdmin, removeMember);

router.route("/:groupId/exit").post(verifyToken, verifyMembership, exitGroup);

router
  .route("/:groupId/members")
  .get(verifyToken, verifyMembership, getGroupMembers);

router
  .route("/:groupId/balances")
  .get(verifyToken, verifyMembership, getGroupBalances);

export default router;
