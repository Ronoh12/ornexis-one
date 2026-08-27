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
  from "../controllers/workflowController.js";


const router =
  Router();


router.use(
  authenticate,
  organizationContext
);


router.post(
  "/",
  requirePermission(
    "workflow.start"
  ),
  controller.start
);


router.get(
  "/:id",
  requirePermission(
    "workflow.view"
  ),
  controller.getInstance
);


router.post(
  "/:id/transitions",
  requirePermission(
    "workflow.transition"
  ),
  controller.transition
);


router.post(
  "/:id/approvals",
  requirePermission(
    "workflow.approve"
  ),
  controller.approve
);


router.post(
  "/:id/cancel",
  requirePermission(
    "workflow.cancel"
  ),
  controller.cancel
);


export default router;
