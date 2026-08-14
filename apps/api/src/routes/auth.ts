import { Router } from "express";

import {
  activate,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  resetPasswordController
} from "../controllers/authController.js";

import {
  authenticate
} from "../middleware/authenticate.js";

const router = Router();

router.post("/activate", activate);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password",
  resetPasswordController
);

router.get(
  "/me",
  authenticate,
  me
);

export default router;