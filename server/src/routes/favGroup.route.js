import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyMembership } from "../middlewares/groupAuth.middleware.js";

const router = Router();

import {
  getFavGroups,
  addFavGroup,
  removeFavGroup,
} from "../controllers/favGroup.controller.js";

router.route("/").get(verifyToken, getFavGroups);
router.route("/:groupId/add").put(verifyToken, verifyMembership, addFavGroup);
router
  .route("/:groupId/remove")
  .put(verifyToken, verifyMembership, removeFavGroup);

export default router;
