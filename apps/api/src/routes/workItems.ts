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
  from "../controllers/workItemController.js";

const router = Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/",
  requirePermission(
    "work_items.view"
  ),
  controller.list
);

router.post(
  "/",
  requirePermission(
    "work_items.create"
  ),
  controller.create
);

router.get(
  "/:id",
  requirePermission(
    "work_items.view"
  ),
  controller.getOne
);

router.patch(
  "/:id",
  requirePermission(
    "work_items.update"
  ),
  controller.update
);

router.patch(
  "/:id/assignment",
  requirePermission(
    "work_items.assign"
  ),
  controller.assign
);

router.patch(
  "/:id/status",
  requirePermission(
    "work_items.view"
  ),
  controller.status
);

router.get(
  "/:id/comments",
  requirePermission(
    "work_items.view"
  ),
  controller.comments
);

router.post(
  "/:id/comments",
  requirePermission(
    "work_items.comment"
  ),
  controller.comment
);

router.get(
  "/:id/activity",
  requirePermission(
    "work_items.view"
  ),
  controller.activity
);

router.get(
  "/:id/attachments",
  requirePermission(
    "work_items.view"
  ),
  controller.attachments
);

router.post(
  "/:id/attachments",
  requirePermission(
    "work_items.attach"
  ),
  controller.attach
);

router.delete(
  "/:id/attachments/:attachmentId",
  requirePermission(
    "work_items.attach"
  ),
  controller.detach
);

export default router;
