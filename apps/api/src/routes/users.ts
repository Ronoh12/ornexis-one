import { Router } from "express";

import {
  addUser,
  getUser,
  listUsers
} from "../controllers/userController.js";

import { authenticate } from "../middleware/authenticate.js";
import { organizationContext } from "../middleware/organizationContext.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();

router.get(
  "/",
  authenticate,
  organizationContext,
  requirePermission("organization_users.view"),
  listUsers
);

router.get(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("organization_users.view"),
  getUser
);

router.post(
  "/",
  authenticate,
  organizationContext,
  requirePermission("organization_users.manage"),
  addUser
);

export default router;