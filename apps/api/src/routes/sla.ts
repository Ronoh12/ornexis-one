import {
  Router
} from "express";

import {
  authenticate
} from "../middleware/authenticate.js";

import {
  organizationContext
} from "../middleware/organizationContext.js";

import {
  requirePermission
} from "../middleware/requirePermission.js";

import * as controller
  from "../controllers/slaController.js";

const router =
  Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/policies",
  requirePermission(
    "sla.view"
  ),
  controller.listPolicies
);

router.post(
  "/policies",
  requirePermission(
    "sla.manage"
  ),
  controller.createPolicy
);

router.get(
  "/policies/:id",
  requirePermission(
    "sla.view"
  ),
  controller.getPolicy
);

router.patch(
  "/policies/:id",
  requirePermission(
    "sla.manage"
  ),
  controller.updatePolicy
);

router.post(
  "/policies/:id/targets",
  requirePermission(
    "sla.manage"
  ),
  controller.createTarget
);

router.patch(
  "/targets/:id",
  requirePermission(
    "sla.manage"
  ),
  controller.updateTarget
);

router.get(
  "/instances",
  requirePermission(
    "sla.view"
  ),
  controller.listInstances
);

router.post(
  "/instances",
  requirePermission(
    "sla.manage"
  ),
  controller.createInstance
);

router.get(
  "/instances/:id",
  requirePermission(
    "sla.view"
  ),
  controller.getInstance
);

router.post(
  "/evaluate",
  requirePermission(
    "sla.evaluate"
  ),
  controller.evaluate
);

export default router;
