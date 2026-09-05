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
  from "../controllers/kpiController.js";

const router =
  Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/categories",
  requirePermission(
    "kpi.view"
  ),
  controller.categories
);

router.post(
  "/categories",
  requirePermission(
    "kpi.manage"
  ),
  controller.createCategory
);

router.patch(
  "/categories/:id",
  requirePermission(
    "kpi.manage"
  ),
  controller.updateCategory
);

router.get(
  "/definitions",
  requirePermission(
    "kpi.view"
  ),
  controller.definitions
);

router.post(
  "/definitions",
  requirePermission(
    "kpi.manage"
  ),
  controller.createDefinition
);

router.get(
  "/definitions/:id/latest",
  requirePermission(
    "kpi.view"
  ),
  controller.latestMeasurement
);

router.post(
  "/definitions/:id/measurements",
  requirePermission(
    "kpi.evaluate"
  ),
  controller.submitManualMeasurement
);

router.get(
  "/definitions/:id",
  requirePermission(
    "kpi.view"
  ),
  controller.definition
);

router.patch(
  "/definitions/:id",
  requirePermission(
    "kpi.manage"
  ),
  controller.updateDefinition
);

router.get(
  "/measurements",
  requirePermission(
    "kpi.view"
  ),
  controller.measurements
);

router.get(
  "/measurements/:id",
  requirePermission(
    "kpi.view"
  ),
  controller.measurement
);

router.post(
  "/evaluate",
  requirePermission(
    "kpi.evaluate"
  ),
  controller.evaluate
);

export default router;
