import {
  Router
} from "express";

import {
  getOverview
} from "../controllers/dashboardController.js";

import {
  authenticate
} from "../middleware/authenticate.js";

import {
  organizationContext
} from "../middleware/organizationContext.js";

import {
  requirePermission
} from "../middleware/requirePermission.js";

const router =
  Router();

router.get(
  "/overview",
  authenticate,
  organizationContext,
  requirePermission("dashboard.view"),
  getOverview
);

export default router;