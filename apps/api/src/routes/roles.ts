import { Router } from "express";

import {
  addRole,
  getRole,
  listRoles,
  removeRoleController,
  updateRoleController
} from "../controllers/roleController.js";

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
  requirePermission("roles.view"),
  listRoles
);

router.get(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("roles.view"),
  getRole
);

router.post(
  "/",
  authenticate,
  organizationContext,
  requirePermission("roles.manage"),
  addRole
);

router.patch(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("roles.manage"),
  updateRoleController
);

router.delete(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("roles.manage"),
  removeRoleController
);

export default router;