import { Router } from "express";

import {
  activate,
  login,
  me
} from "../controllers/authController.js";

import {
  authenticate
} from "../middleware/authenticate.js";

const router = Router();

router.post("/activate", activate);
router.post("/login", login);

router.get(
  "/me",
  authenticate,
  me
);

export default router;