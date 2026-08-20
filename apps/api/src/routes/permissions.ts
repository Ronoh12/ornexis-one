import { Router } from "express";

import {
  getPermission,
  listPermissions
} from "../controllers/permissionController.js";

import {
  authenticate
} from "../middleware/authenticate.js";

import {
  organizationContext
} from "../middleware/organizationContext.js";

import {
  requirePermission
} from "../middleware/requirePermission.js";

const router = Router();

router.get(
  "/",
  authenticate,
  organizationContext,
  requirePermission("permissions.view"),
  listPermissions
);

router.get(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("permissions.view"),
  getPermission
);

export default router;