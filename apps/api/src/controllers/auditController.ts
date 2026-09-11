import type {
  Request,
  Response
} from "express";

import {
  exportAuditEvents
} from "../services/auditExportService.js";

import {
  getAuditEvent,
  listAuditEvents
} from "../services/auditQueryService.js";

import {
  auditRequestContext
} from "../services/auditRequestContextService.js";

import {
  AuditServiceError,
  type AuditActor
} from "../services/auditTypes.js";

import {
  parseAuditEventId,
  parseAuditExportQuery,
  parseAuditListQuery
} from "../validators/auditValidator.js";

type AuthRequest =
  Request & {
    auth?: {
      userId: string;
      organizationId: string;
      organizationUserId?: string;
    };
  };

function actor(
  req:
    AuthRequest
): AuditActor {
  const userId =
    req.auth?.userId;

  const organizationId =
    req.auth?.organizationId;

  const organizationUserId =
    req.auth
      ?.organizationUserId;

  if (
    !userId ||
    !organizationId
  ) {
    throw new AuditServiceError(
      "AUDIT_MEMBERSHIP_REQUIRED",
      "Authentication and organization context are required."
    );
  }

  if (!organizationUserId) {
    throw new AuditServiceError(
      "AUDIT_MEMBERSHIP_REQUIRED",
      "Active organization membership is required."
    );
  }

  return {
    userId,
    organizationId,
    organizationUserId
  };
}

function handleError(
  res:
    Response,
  error:
    unknown
) {
  if (
    error instanceof
      AuditServiceError
  ) {
    if (
      error.code ===
        "AUDIT_EVENT_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          error.message
      });
    }

    if (
      error.code ===
        "AUDIT_FORBIDDEN" ||
      error.code ===
        "AUDIT_EXPORT_FORBIDDEN" ||
      error.code ===
        "AUDIT_MEMBERSHIP_REQUIRED"
    ) {
      return res.status(403).json({
        success: false,
        message:
          error.message
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  console.error(
    "Audit request failed.",
    error
  );

  return res.status(500).json({
    success: false,
    message:
      "Audit request failed."
  });
}

export async function listAuditLogs(
  req:
    AuthRequest,
  res:
    Response
) {
  try {
    const data =
      await listAuditEvents(
        actor(req),
        parseAuditListQuery(
          req.query
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function getAuditLog(
  req:
    AuthRequest,
  res:
    Response
) {
  try {
    const data =
      await getAuditEvent(
        actor(req),
        parseAuditEventId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function exportAuditLogs(
  req:
    AuthRequest,
  res:
    Response
) {
  try {
    const currentActor =
      actor(req);

    const data =
      await exportAuditEvents(
        currentActor,
        parseAuditExportQuery(
          req.query
        ),
        auditRequestContext(
          req
        )
      );

    res.setHeader(
      "content-type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "content-disposition",
      `attachment; filename="${data.filename}"`
    );

    res.setHeader(
      "x-audit-record-count",
      String(data.count)
    );

    return res.status(200).send(
      data.csv
    );
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}
