import { Router } from "express";

import {
  addUser,
  getUser,
  listUsers
} from "../controllers/userController.js";

const router = Router();

router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", addUser);

export default router;