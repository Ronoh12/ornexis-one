import { Router } from "express";

import {
  addOrganization,
  getOrganization,
  listOrganizations,
  removeOrganization,
  updateOrganization
} from "../controllers/organizationController.js";

import { authenticate } from "../middleware/authenticate.js";
import { organizationContext } from "../middleware/organizationContext.js";
import { requirePermission } from "../middleware/requirePermission.js";

import {
  getOrganizationSetting,
  updateOrganizationSetting
} from "../controllers/organizationSettingController.js";

import {
  getOrganizationBrandingController,
  updateOrganizationBrandingController
} from "../controllers/organizationBrandingController.js";

const router = Router();

router.get(
  "/",
  authenticate,
  organizationContext,
  requirePermission("organizations.view"),
  listOrganizations
);

router.get(
  "/:id/branding",
  authenticate,
  organizationContext,
  requirePermission("organization_branding.view"),
  getOrganizationBrandingController
);

router.patch(
  "/:id/branding",
  authenticate,
  organizationContext,
  requirePermission("organization_branding.manage"),
  updateOrganizationBrandingController
);

router.get(
  "/:id/settings",
  authenticate,
  organizationContext,
  requirePermission("organization_settings.view"),
  getOrganizationSetting
);

router.patch(
  "/:id/settings",
  authenticate,
  organizationContext,
  requirePermission("organization_settings.manage"),
  updateOrganizationSetting
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

router.patch(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("organizations.update"),
  updateOrganization
);

router.delete(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("organizations.delete"),
  removeOrganization
);
export default router;