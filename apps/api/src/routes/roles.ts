import { Router } from "express";

import {
  addRole,
  getRole,
  listRoles
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

export default router;