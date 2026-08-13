import { Router } from "express";

import {
  listAuditLogs
} from "../controllers/auditController.js";

import {
  authenticate
} from "../middleware/authenticate.js";

import {
  organizationContext
} from "../middleware/organizationContext.js";

import {
  requirePermission
} from "../middleware/requirePermission.js";

const router = Router();

router.get(
  "/",
  authenticate,
  organizationContext,
  requirePermission("audit_logs.view"),
  listAuditLogs
);

export default router;