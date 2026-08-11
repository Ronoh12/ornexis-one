import { Router } from "express";

import {
  addPermission,
  getPermission,
  listPermissions
} from "../controllers/permissionController.js";

const router = Router();

router.get("/", listPermissions);
router.get("/:id", getPermission);
router.post("/", addPermission);

export default router;