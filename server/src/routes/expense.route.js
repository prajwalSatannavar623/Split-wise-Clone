import { Router } from "express";
import {
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getGroupExpenses,
  getCurrentUserExpenses,
  searchExpenses,
} from "../controllers/expense.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  verifyMembership,
  verifyGroupAdmin,
} from "../middlewares/groupAuth.middleware.js";

const router = Router();

router.route("/:groupId").post(verifyToken, verifyMembership, createExpense);
router.route("/detail/:expenseId").get(verifyToken, getExpenseById);

router.route("/:expenseId").put(verifyToken, updateExpense);
router.route("/:expenseId").delete(verifyToken, deleteExpense);

router
  .route("/group/:groupId")
  .get(verifyToken, verifyMembership, getGroupExpenses);
router.route("/user/me").get(verifyToken, getCurrentUserExpenses);
router.route("/search/all").get(verifyToken, searchExpenses);

export default router;
