import { Router } from "express";
import {
  createExpense,
  getExpenseById,
  updateExpense,
  getCurrentUserExpenses,
} from "../controllers/expense.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

import {
  verifyMembership,
  verifyGroupAdmin,
} from "../middlewares/groupAuth.middleware.js";

const router = Router();

// Static routes
router.route("/user/me").get(verifyToken, getCurrentUserExpenses);

// Dynamic routes
router.route("/:expenseId").get(verifyToken, getExpenseById);
router.route("/:expenseId").put(verifyToken, updateExpense);
router.route("/:groupId").post(verifyToken, verifyMembership, createExpense);

export default router;
