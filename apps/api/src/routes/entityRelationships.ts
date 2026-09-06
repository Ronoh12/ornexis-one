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
  from "../controllers/entityRelationshipController.js";

const router =
  Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/",
  requirePermission(
    "relationships.view"
  ),
  controller.list
);

router.post(
  "/",
  requirePermission(
    "relationships.manage"
  ),
  controller.create
);

router.get(
  "/:id",
  requirePermission(
    "relationships.view"
  ),
  controller.get
);

router.delete(
  "/:id",
  requirePermission(
    "relationships.manage"
  ),
  controller.remove
);

export default router;
