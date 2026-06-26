import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./utils/GlobalErrorHandler.js";

const app = express();

// CORS middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    optionsSuccessStatus: 200,
    credentials: true,
  }),
);

// in-built middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRoute from "./routes/user.route.js";
import groupRoute from "./routes/group.route.js";
import favGroupRoute from "./routes/favGroup.route.js";
import expenseRoute from "./routes/expense.route.js";
import settlementRoute from "./routes/settlement.route.js";

app.use("/api/v1/users", userRoute);
app.use("/api/v1/groups", groupRoute);
app.use("/api/v1/fav-groups", favGroupRoute);
app.use("/api/v1/expenses", expenseRoute);
app.use("/api/v1/settlements", settlementRoute);

// // global error handler
app.use(globalErrorHandler);

export default app;
