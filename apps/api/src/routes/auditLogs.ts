import {
  Router
} from "express";

import {
  exportAuditLogs,
  getAuditLog,
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

const router =
  Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/",
  requirePermission(
    "audit_logs.view"
  ),
  listAuditLogs
);

router.get(
  "/export",
  requirePermission(
    "audit_logs.view"
  ),
  requirePermission(
    "audit_logs.export"
  ),
  exportAuditLogs
);

router.get(
  "/:id",
  requirePermission(
    "audit_logs.view"
  ),
  getAuditLog
);

export default router;
