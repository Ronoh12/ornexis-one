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


/* =========================================================
   WORKFLOW DEFINITIONS
========================================================= */

router.get(
  "/",
  requirePermission(
    "workflow.view"
  ),
  controller.list
);


router.post(
  "/",
  requirePermission(
    "workflow.manage_definitions"
  ),
  controller.create
);


router.get(
  "/:id",
  requirePermission(
    "workflow.view"
  ),
  controller.getOne
);


router.patch(
  "/:id",
  requirePermission(
    "workflow.manage_definitions"
  ),
  controller.update
);


/* =========================================================
   WORKFLOW CONFIGURATION
========================================================= */

router.post(
  "/:id/states",
  requirePermission(
    "workflow.manage_definitions"
  ),
  controller.createState
);


router.patch(
  "/:id/states/:stateId",
  requirePermission(
    "workflow.manage_definitions"
  ),
  controller.updateState
);


router.post(
  "/:id/transitions",
  requirePermission(
    "workflow.manage_definitions"
  ),
  controller.createTransition
);


router.patch(
  "/:id/transitions/:transitionId",
  requirePermission(
    "workflow.manage_definitions"
  ),
  controller.updateTransition
);


router.post(
  "/:id/approval-steps",
  requirePermission(
    "workflow.manage_definitions"
  ),
  controller.createApproval
);


export default router;
