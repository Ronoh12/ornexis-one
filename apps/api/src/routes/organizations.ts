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

router.get("/:id", getOrganization);
router.post("/", addOrganization);
router.delete("/:id", removeOrganization);

export default router;