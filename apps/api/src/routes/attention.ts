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
  from "../controllers/attentionController.js";

const router = Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/",
  requirePermission("attention.view"),
  controller.list
);

router.post(
  "/evaluate",
  requirePermission("attention.evaluate"),
  controller.evaluate
);

router.get(
  "/:id",
  requirePermission("attention.view"),
  controller.get
);

router.post(
  "/:id/acknowledge",
  requirePermission("attention.manage"),
  controller.acknowledge
);

router.post(
  "/:id/dismiss",
  requirePermission("attention.manage"),
  controller.dismiss
);

export default router;
