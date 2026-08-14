import { Router } from "express";

import {
  addOrganizationUser,
  getOrganizationUser,
  listOrganizationUsers
} from "../controllers/organizationUserController.js";

import { authenticate } from "../middleware/authenticate.js";
import { organizationContext } from "../middleware/organizationContext.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();

router.get(
  "/",
  authenticate,
  organizationContext,
  requirePermission("organization_users.view"),
  listOrganizationUsers
);

router.get(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("organization_users.view"),
  getOrganizationUser
);

router.post(
  "/",
  authenticate,
  organizationContext,
  requirePermission("organization_users.manage"),
  addOrganizationUser
);

export default router;