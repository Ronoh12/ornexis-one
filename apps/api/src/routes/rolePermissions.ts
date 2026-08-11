import { Router } from "express";

import {
  addRolePermission,
  listRolePermissions
} from "../controllers/rolePermissionController.js";

const router = Router();

router.get("/", listRolePermissions);
router.post("/", addRolePermission);

export default router;