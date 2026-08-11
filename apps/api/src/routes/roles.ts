import { Router } from "express";

import {
  addRole,
  getRole,
  listRoles
} from "../controllers/roleController.js";

const router = Router();

router.get("/", listRoles);
router.get("/:id", getRole);
router.post("/", addRole);

export default router;