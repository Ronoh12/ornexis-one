import { Router } from "express";

import {
  addOrganization,
  getOrganization,
  listOrganizations,
  removeOrganization
} from "../controllers/organizationController.js";

import { authenticate } from "../middleware/authenticate.js";
import { organizationContext } from "../middleware/organizationContext.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();

router.get(
  "/",
  authenticate,
  organizationContext,
  requirePermission("organizations.view"),
  listOrganizations
);

router.get(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("organizations.view"),
  getOrganization
);

router.post(
  "/",
  authenticate,
  organizationContext,
  requirePermission("organizations.create"),
  addOrganization
);

router.delete(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("organizations.delete"),
  removeOrganization
);
export default router;