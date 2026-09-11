import {
  Router
} from "express";

import * as controller
  from "../controllers/hierarchyController.js";

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

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/unit-types",
  requirePermission(
    "hierarchy.view"
  ),
  controller.unitTypes
);

router.post(
  "/unit-types",
  requirePermission(
    "hierarchy.manage"
  ),
  controller.createUnitType
);

router.patch(
  "/unit-types/:id",
  requirePermission(
    "hierarchy.manage"
  ),
  controller.updateUnitType
);

router.delete(
  "/unit-types/:id",
  requirePermission(
    "hierarchy.manage"
  ),
  controller.removeUnitType
);

router.get(
  "/units",
  requirePermission(
    "hierarchy.view"
  ),
  controller.units
);

router.post(
  "/units",
  requirePermission(
    "hierarchy.manage"
  ),
  controller.createUnit
);

router.get(
  "/units/:id/ancestors",
  requirePermission(
    "hierarchy.view"
  ),
  controller.ancestors
);

router.get(
  "/units/:id/descendants",
  requirePermission(
    "hierarchy.view"
  ),
  controller.descendants
);

router.get(
  "/units/:id/members",
  requirePermission(
    "hierarchy.view"
  ),
  controller.members
);

router.get(
  "/units/:id",
  requirePermission(
    "hierarchy.view"
  ),
  controller.unit
);

router.patch(
  "/units/:id",
  requirePermission(
    "hierarchy.manage"
  ),
  controller.updateUnit
);

router.delete(
  "/units/:id",
  requirePermission(
    "hierarchy.manage"
  ),
  controller.removeUnit
);

router.post(
  "/assignments",
  requirePermission(
    "hierarchy.assign"
  ),
  controller.createAssignment
);

router.patch(
  "/assignments/:id",
  requirePermission(
    "hierarchy.assign"
  ),
  controller.updateAssignment
);

router.delete(
  "/assignments/:id",
  requirePermission(
    "hierarchy.assign"
  ),
  controller.removeAssignment
);

router.get(
  "/memberships/:organizationUserId",
  requirePermission(
    "hierarchy.view"
  ),
  controller.memberships
);

router.post(
  "/reconcile",
  requirePermission(
    "hierarchy.reconcile"
  ),
  controller.reconcile
);

export default router;
