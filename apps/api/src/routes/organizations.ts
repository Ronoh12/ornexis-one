import { Router } from "express";

import {
  addOrganization,
  getOrganization,
  listOrganizations,
  removeOrganization
} from "../controllers/organizationController.js";

import { devAuth } from "../middleware/devAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();

router.get(
  "/",
  devAuth,
  requirePermission("organizations.view"),
  listOrganizations
);

router.get("/:id", getOrganization);
router.post("/", addOrganization);
router.delete("/:id", removeOrganization);

export default router;