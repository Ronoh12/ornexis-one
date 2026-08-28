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

import {
  create,
  getOne,
  list,
  markAllRead,
  markRead,
  unreadCount
} from "../controllers/notificationController.js";

const router =
  Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/",
  requirePermission(
    "notifications.view"
  ),
  list
);

router.get(
  "/unread-count",
  requirePermission(
    "notifications.view"
  ),
  unreadCount
);

router.patch(
  "/read-all",
  requirePermission(
    "notifications.view"
  ),
  markAllRead
);

router.get(
  "/:id",
  requirePermission(
    "notifications.view"
  ),
  getOne
);

router.patch(
  "/:id/read",
  requirePermission(
    "notifications.view"
  ),
  markRead
);

router.post(
  "/",
  requirePermission(
    "notifications.manage"
  ),
  create
);

export default router;
