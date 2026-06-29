import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";

import { getCurrentUserBalance } from "../controllers/settlement.controller.js";

const router = Router();

// static routes
// self routes
router.route("/me/balances").get(verifyToken, getCurrentUserBalance);

export default router;
