import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";

import {
  getCurrentUserBalance,
  getUserBalanceWithOther,
  getCurrentUserBalancesDetailed,
} from "../controllers/settlement.controller.js";

const router = Router();

router.route("/me/balances").get(verifyToken, getCurrentUserBalance);
router.route("/:userId/balances").get(verifyToken, getUserBalanceWithOther);
router
  .route("/me/balances/detailed")
  .get(verifyToken, getCurrentUserBalancesDetailed);

export default router;
