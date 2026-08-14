import { Router } from "express";

import {
  addRolePermission,
  listRolePermissions
} from "../controllers/rolePermissionController.js";

import { authenticate } from "../middleware/authenticate.js";
import { organizationContext } from "../middleware/organizationContext.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();

router.get(
  "/",
  authenticate,
  organizationContext,
  requirePermission("role_permissions.view"),
  listRolePermissions
);

router.post(
  "/",
  authenticate,
  organizationContext,
  requirePermission("role_permissions.manage"),
  addRolePermission
);

export default router;
