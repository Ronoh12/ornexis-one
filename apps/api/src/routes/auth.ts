import { Router } from "express";

import {
  activate,
  login
} from "../controllers/authController.js";

const router = Router();

router.post("/activate", activate);
router.post("/login", login);

export default router;