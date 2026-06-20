import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/auth/register").post(upload.single("avatar"), registerUser);

// router.route("/auth/login").post();
// router.route("/auth/refresh").post();

// router.use(authenticate);

// //Userprofile:
// router.route("/:userId").get();
// router.route("/:userId").get();
// router.route("/:userId").get();
// router.route("/:userId").get();

export default router;
