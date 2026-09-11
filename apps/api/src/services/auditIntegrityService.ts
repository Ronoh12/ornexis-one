import {
  createHash
} from "node:crypto";

export type AuditIntegrityEvent = {
  id: string;
  organizationId?: string | null;
  userId?: string | null;
  organizationUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  category: string;
  source: string;
  result: string;
  oldValues?: unknown;
  newValues?: unknown;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  correlationId?: string | null;
  httpMethod?: string | null;
  requestPath?: string | null;
  httpStatusCode?: number | null;
  createdAt: Date | string;
};

function canonicalize(
  value: unknown
): unknown {
  if (
    value === null ||
    typeof value ===
      "string" ||
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
      "bigint"
  ) {
    return value.toString();
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(
      canonicalize
    );
  }

  if (
    typeof value ===
      "object"
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(
          ([left], [right]) =>
            left.localeCompare(
              right
            )
        )
        .map(
          ([key, nestedValue]) => [
            key,
            canonicalize(
              nestedValue
            )
          ]
        )
    );
  }

  return String(value);
}

function integrityPayload(
  event: AuditIntegrityEvent
) {
  return {
    id:
      event.id,
    organizationId:
      event.organizationId ??
      null,
    userId:
      event.userId ??
      null,
    organizationUserId:
      event.organizationUserId ??
      null,
    action:
      event.action,
    entityType:
      event.entityType,
    entityId:
      event.entityId ??
      null,
    category:
      event.category,
    source:
      event.source,
    result:
      event.result,
    oldValues:
      event.oldValues ??
      null,
    newValues:
      event.newValues ??
      null,
    metadata:
      event.metadata ??
      null,
    ipAddress:
      event.ipAddress ??
      null,
    userAgent:
      event.userAgent ??
      null,
    requestId:
      event.requestId ??
      null,
    correlationId:
      event.correlationId ??
      null,
    httpMethod:
      event.httpMethod ??
      null,
    requestPath:
      event.requestPath ??
      null,
    httpStatusCode:
      event.httpStatusCode ??
      null,
    createdAt:
      event.createdAt instanceof Date
        ? event.createdAt.toISOString()
        : event.createdAt
  };
}

export function createAuditIntegrityHash(
  event: AuditIntegrityEvent
) {
  const canonical =
    JSON.stringify(
      canonicalize(
        integrityPayload(
          event
        )
      )
    );

  return createHash("sha256")
    .update(canonical)
    .digest("hex");
}

export function verifyAuditIntegrity(
  event:
    AuditIntegrityEvent & {
      integrityHash?:
        string | null;
    }
) {
  if (!event.integrityHash) {
    return false;
  }

  return (
    createAuditIntegrityHash(
      event
    ) ===
    event.integrityHash
  );
}
