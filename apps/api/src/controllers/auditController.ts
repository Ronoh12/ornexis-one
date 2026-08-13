import type { Request, Response } from "express";

import {
  getAuditLogsForOrganization
} from "../services/auditQueryService.js";

export async function listAuditLogs(
  req: Request,
  res: Response
) {
  const auth =
    (req as Request & {
      auth?: {
        userId?: string;
        organizationId?: string;
      };
    }).auth;

  const organizationId = auth?.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  const auditLogs =
    await getAuditLogsForOrganization(
      organizationId
    );

  return res.json({
    success: true,
    data: auditLogs
  });
}