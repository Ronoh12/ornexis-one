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
  from "../controllers/requestController.js";

const router = Router();

router.use(
  authenticate,
  organizationContext
);

/* ============================================================
   REQUEST TYPES
============================================================ */

router.get(
  "/types",
  requirePermission(
    "requests.view"
  ),
  controller.requestTypes
);

router.post(
  "/types",
  requirePermission(
    "requests.manage_types"
  ),
  controller.createType
);

router.get(
  "/types/:id",
  requirePermission(
    "requests.view"
  ),
  controller.requestType
);

router.patch(
  "/types/:id",
  requirePermission(
    "requests.manage_types"
  ),
  controller.updateType
);

/* ============================================================
   REQUESTS
============================================================ */

router.get(
  "/",
  requirePermission(
    "requests.view"
  ),
  controller.list
);

router.post(
  "/",
  requirePermission(
    "requests.create"
  ),
  controller.create
);

router.get(
  "/:id",
  requirePermission(
    "requests.view"
  ),
  controller.getOne
);

router.patch(
  "/:id",
  requirePermission(
    "requests.update"
  ),
  controller.update
);

router.patch(
  "/:id/assignment",
  requirePermission(
    "requests.assign"
  ),
  controller.assign
);

router.patch(
  "/:id/priority",
  requirePermission(
    "requests.update"
  ),
  controller.priority
);

router.patch(
  "/:id/status",
  requirePermission(
    "requests.update"
  ),
  controller.status
);

router.post(
  "/:id/comments",
  requirePermission(
    "requests.comment"
  ),
  controller.comment
);

router.get(
  "/:id/activity",
  requirePermission(
    "requests.view"
  ),
  controller.activity
);


/* ============================================================
   REQUEST ATTACHMENTS
============================================================ */

router.get(
  "/:id/attachments",
  requirePermission(
    "requests.view"
  ),
  controller.attachments
);

router.post(
  "/:id/attachments",
  requirePermission(
    "requests.update"
  ),
  controller.attach
);

router.delete(
  "/:id/attachments/:attachmentId",
  requirePermission(
    "requests.update"
  ),
  controller.detach
);

export default router;
