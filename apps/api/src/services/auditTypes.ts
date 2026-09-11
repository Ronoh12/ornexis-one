import type {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import type {
  AuditEventCategory,
  AuditEventResult,
  AuditEventSource
} from "../../../../packages/database/generated/client/enums.js";

export const AUDIT_DEFAULT_LIMIT =
  50;

export const AUDIT_MAX_LIMIT =
  200;

export const AUDIT_EXPORT_LIMIT =
  10_000;

export const AUDIT_MAX_IDENTIFIER_LENGTH =
  128;

export const AUDIT_MAX_ENTITY_TYPE_LENGTH =
  128;

export const AUDIT_MAX_SEARCH_LENGTH =
  200;

export const AUDIT_MAX_REQUEST_PATH_LENGTH =
  512;

export type AuditWriteClient =
  Pick<
    Prisma.TransactionClient,
    "auditLog" |
    "organizationUser"
  >;

export type CreateAuditLogInput = {
  organizationId?: string;
  userId?: string;
  organizationUserId?: string;

  action: string;

  entityType: string;
  entityId?: string;

  category?: AuditEventCategory;
  source?: AuditEventSource;
  result?: AuditEventResult;

  oldValues?: unknown;
  newValues?: unknown;
  metadata?: unknown;

  ipAddress?: string;
  userAgent?: string;

  requestId?: string;
  correlationId?: string;
  httpMethod?: string;
  requestPath?: string;
  httpStatusCode?: number;
};

export type AuditActor = {
  userId: string;
  organizationId: string;
  organizationUserId: string;
};

export type AuditListInput = {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  organizationUserId?: string;
  category?: AuditEventCategory;
  source?: AuditEventSource;
  result?: AuditEventResult;
  requestId?: string;
  correlationId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  search?: string;
  cursor?: string;
  limit?: number;
};

export type AuditExportInput =
  Omit<
    AuditListInput,
    "cursor" |
    "limit"
  >;

export type AuditCursor = {
  createdAt: string;
  id: string;
};

export type AuditRequestContext = {
  userId?: string;
  organizationId?: string;
  organizationUserId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  httpMethod?: string;
  requestPath?: string;
};

export class AuditServiceError
  extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);

    this.name =
      "AuditServiceError";
  }
}
