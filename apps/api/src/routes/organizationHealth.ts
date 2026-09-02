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
  from "../controllers/organizationHealthController.js";

const router =
  Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/definitions",
  requirePermission(
    "health.view"
  ),
  controller.definitions
);

router.patch(
  "/definitions/:id",
  requirePermission(
    "health.manage"
  ),
  controller.updateDefinition
);

router.get(
  "/snapshots",
  requirePermission(
    "health.view"
  ),
  controller.snapshots
);

router.get(
  "/snapshots/:id",
  requirePermission(
    "health.view"
  ),
  controller.snapshot
);

router.get(
  "/scopes/:scopeType/latest",
  requirePermission(
    "health.view"
  ),
  controller.latest
);

router.get(
  "/scopes/:scopeType/:scopeId/latest",
  requirePermission(
    "health.view"
  ),
  controller.latest
);

router.post(
  "/evaluate",
  requirePermission(
    "health.evaluate"
  ),
  controller.evaluate
);

export default router;
