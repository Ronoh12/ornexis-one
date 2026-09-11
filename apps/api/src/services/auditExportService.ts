import {
  AuditEventCategory,
  AuditEventResult,
  AuditEventSource
} from "../../../../packages/database/generated/client/enums.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  loadAuditEventsForExport
} from "./auditQueryService.js";

import type {
  AuditActor,
  AuditExportInput,
  AuditRequestContext
} from "./auditTypes.js";

function formulaSafe(
  value: string
) {
  return /^[=+\-@\t\r]/.test(
    value
  )
    ? `'${value}`
    : value;
}

function csvCell(
  value: unknown
) {
  let text: string;

  if (
    value === null ||
    value === undefined
  ) {
    text = "";
  } else if (
    value instanceof Date
  ) {
    text =
      value.toISOString();
  } else if (
    typeof value ===
      "object"
  ) {
    text =
      JSON.stringify(value);
  } else {
    text =
      String(value);
  }

  const safe =
    formulaSafe(text);

  return `"${safe.replace(
    /"/g,
    '""'
  )}"`;
}

const columns = [
  "id",
  "createdAt",
  "organizationId",
  "userId",
  "organizationUserId",
  "actorEmail",
  "actorFirstName",
  "actorLastName",
  "actorRole",
  "action",
  "entityType",
  "entityId",
  "category",
  "source",
  "result",
  "requestId",
  "correlationId",
  "httpMethod",
  "requestPath",
  "httpStatusCode",
  "ipAddress",
  "userAgent",
  "oldValues",
  "newValues",
  "metadata",
  "integrityHash"
] as const;

function eventRow(
  event:
    Awaited<
      ReturnType<
        typeof loadAuditEventsForExport
      >
    >[number]
) {
  return [
    event.id,
    event.createdAt,
    event.organizationId,
    event.userId,
    event.organizationUserId,
    event.user?.email,
    event.user?.firstName,
    event.user?.lastName,
    event.organizationUser
      ?.role.name,
    event.action,
    event.entityType,
    event.entityId,
    event.category,
    event.source,
    event.result,
    event.requestId,
    event.correlationId,
    event.httpMethod,
    event.requestPath,
    event.httpStatusCode,
    event.ipAddress,
    event.userAgent,
    event.oldValues,
    event.newValues,
    event.metadata,
    event.integrityHash
  ]
    .map(csvCell)
    .join(",");
}

export async function exportAuditEvents(
  actor:
    AuditActor,
  input:
    AuditExportInput,
  requestContext:
    AuditRequestContext
) {
  const events =
    await loadAuditEventsForExport(
      actor,
      input
    );

  const csv = [
    columns
      .map(csvCell)
      .join(","),
    ...events.map(
      eventRow
    )
  ].join("\n");

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    organizationUserId:
      actor.organizationUserId,
    action:
      "AUDIT_LOG_EXPORTED",
    entityType:
      "AUDIT_LOG",
    category:
      AuditEventCategory.SECURITY,
    source:
      AuditEventSource.API,
    result:
      AuditEventResult.SUCCESS,
    metadata: {
      filters:
        input,
      exportedCount:
        events.length
    },
    ...(requestContext.ipAddress
      ? {
          ipAddress:
            requestContext.ipAddress
        }
      : {}),
    ...(requestContext.userAgent
      ? {
          userAgent:
            requestContext.userAgent
        }
      : {}),
    ...(requestContext.requestId
      ? {
          requestId:
            requestContext.requestId
        }
      : {}),
    ...(requestContext
      .correlationId
      ? {
          correlationId:
            requestContext
              .correlationId
        }
      : {}),
    ...(requestContext.httpMethod
      ? {
          httpMethod:
            requestContext.httpMethod
        }
      : {}),
    ...(requestContext.requestPath
      ? {
          requestPath:
            requestContext.requestPath
        }
      : {}),
    httpStatusCode:
      200
  });

  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        "-"
      );

  return {
    csv,
    count:
      events.length,
    filename:
      `ornexis-audit-${timestamp}.csv`
  };
}
