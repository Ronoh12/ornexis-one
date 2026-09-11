import {
  randomUUID
} from "node:crypto";

import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  AuditEventCategory,
  AuditEventResult,
  AuditEventSource
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditIntegrityHash
} from "./auditIntegrityService.js";

import {
  redactAuditValue
} from "./auditRedactionService.js";

import {
  AUDIT_MAX_ENTITY_TYPE_LENGTH,
  AUDIT_MAX_IDENTIFIER_LENGTH,
  AUDIT_MAX_REQUEST_PATH_LENGTH,
  AuditServiceError,
  type AuditWriteClient,
  type CreateAuditLogInput
} from "./auditTypes.js";

export type {
  CreateAuditLogInput
} from "./auditTypes.js";

function normalizeIdentifier(
  value: string,
  label: string,
  maximumLength:
    number
) {
  if (
    typeof value !==
      "string"
  ) {
    throw new AuditServiceError(
      "AUDIT_EVENT_INVALID",
      `${label} is required.`
    );
  }

  const normalized =
    value
      .trim()
      .replace(
        /[^a-zA-Z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      )
      .toUpperCase();

  if (!normalized) {
    throw new AuditServiceError(
      "AUDIT_EVENT_INVALID",
      `${label} is required.`
    );
  }

  if (
    normalized.length >
      maximumLength
  ) {
    throw new AuditServiceError(
      "AUDIT_EVENT_INVALID",
      `${label} must be at most ${maximumLength} characters.`
    );
  }

  return normalized;
}

function optionalString(
  value: string | undefined,
  label: string,
  maximumLength:
    number
) {
  if (value === undefined) {
    return undefined;
  }

  const normalized =
    value.trim();

  if (!normalized) {
    throw new AuditServiceError(
      "AUDIT_EVENT_INVALID",
      `${label} cannot be blank.`
    );
  }

  if (
    normalized.length >
      maximumLength
  ) {
    throw new AuditServiceError(
      "AUDIT_EVENT_INVALID",
      `${label} must be at most ${maximumLength} characters.`
    );
  }

  return normalized;
}

function auditJsonValue(
  value: unknown
):
  Prisma.InputJsonValue |
  typeof Prisma.JsonNull {
  const redacted =
    redactAuditValue(
      value
    );

  if (redacted === null) {
    return Prisma.JsonNull;
  }

  return redacted as
    Prisma.InputJsonValue;
}

async function resolveActor(
  client:
    AuditWriteClient,
  data:
    CreateAuditLogInput
) {
  if (
    !data.organizationUserId
  ) {
    return {
      organizationId:
        data.organizationId,
      userId:
        data.userId,
      organizationUserId:
        undefined
    };
  }

  const membership =
    await client
      .organizationUser
      .findFirst({
        where: {
          id:
            data.organizationUserId,
          ...(data.organizationId
            ? {
                organizationId:
                  data.organizationId
              }
            : {}),
          ...(data.userId
            ? {
                userId:
                  data.userId
              }
            : {}),
          status:
            "ACTIVE"
        },
        select: {
          id: true,
          organizationId: true,
          userId: true
        }
      });

  if (!membership) {
    throw new AuditServiceError(
      "AUDIT_EVENT_INVALID",
      "Audit organization membership is invalid."
    );
  }

  return {
    organizationId:
      membership.organizationId,
    userId:
      membership.userId,
    organizationUserId:
      membership.id
  };
}

export async function createAuditLog(
  data:
    CreateAuditLogInput,
  client:
    AuditWriteClient =
      prisma
) {
  const actor =
    await resolveActor(
      client,
      data
    );

  const action =
    normalizeIdentifier(
      data.action,
      "Audit action",
      AUDIT_MAX_IDENTIFIER_LENGTH
    );

  const entityType =
    normalizeIdentifier(
      data.entityType,
      "Audit entity type",
      AUDIT_MAX_ENTITY_TYPE_LENGTH
    );

  const entityId =
    optionalString(
      data.entityId,
      "Audit entity ID",
      AUDIT_MAX_IDENTIFIER_LENGTH
    );

  const ipAddress =
    optionalString(
      data.ipAddress,
      "Audit IP address",
      128
    );

  const userAgent =
    optionalString(
      data.userAgent,
      "Audit user agent",
      1024
    );

  const requestId =
    optionalString(
      data.requestId,
      "Audit request ID",
      AUDIT_MAX_IDENTIFIER_LENGTH
    );

  const correlationId =
    optionalString(
      data.correlationId,
      "Audit correlation ID",
      AUDIT_MAX_IDENTIFIER_LENGTH
    );

  const httpMethod =
    optionalString(
      data.httpMethod,
      "Audit HTTP method",
      16
    )?.toUpperCase();

  const requestPath =
    optionalString(
      data.requestPath,
      "Audit request path",
      AUDIT_MAX_REQUEST_PATH_LENGTH
    );

  if (
    data.httpStatusCode !==
      undefined &&
    (
      !Number.isInteger(
        data.httpStatusCode
      ) ||
      data.httpStatusCode <
        100 ||
      data.httpStatusCode >
        599
    )
  ) {
    throw new AuditServiceError(
      "AUDIT_EVENT_INVALID",
      "Audit HTTP status code must be an integer from 100 to 599."
    );
  }

  const category =
    data.category ??
    AuditEventCategory.BUSINESS;

  const source =
    data.source ??
    AuditEventSource.APPLICATION;

  const result =
    data.result ??
    AuditEventResult.SUCCESS;

  const id =
    randomUUID();

  const createdAt =
    new Date();

  const oldValues =
    data.oldValues !==
      undefined
      ? redactAuditValue(
          data.oldValues
        )
      : undefined;

  const newValues =
    data.newValues !==
      undefined
      ? redactAuditValue(
          data.newValues
        )
      : undefined;

  const metadata =
    data.metadata !==
      undefined
      ? redactAuditValue(
          data.metadata
        )
      : undefined;

  const integrityHash =
    createAuditIntegrityHash({
      id,
      organizationId:
        actor.organizationId ??
        null,
      userId:
        actor.userId ??
        null,
      organizationUserId:
        actor.organizationUserId ??
        null,
      action,
      entityType,
      entityId:
        entityId ??
        null,
      category,
      source,
      result,
      oldValues:
        oldValues ??
        null,
      newValues:
        newValues ??
        null,
      metadata:
        metadata ??
        null,
      ipAddress:
        ipAddress ??
        null,
      userAgent:
        userAgent ??
        null,
      requestId:
        requestId ??
        null,
      correlationId:
        correlationId ??
        null,
      httpMethod:
        httpMethod ??
        null,
      requestPath:
        requestPath ??
        null,
      httpStatusCode:
        data.httpStatusCode ??
        null,
      createdAt
    });

  return client.auditLog.create({
    data: {
      id,
      createdAt,
      action,
      entityType,
      category,
      source,
      result,
      integrityHash,

      ...(actor.organizationId
        ? {
            organizationId:
              actor.organizationId
          }
        : {}),

      ...(actor.userId
        ? {
            userId:
              actor.userId
          }
        : {}),

      ...(actor.organizationUserId
        ? {
            organizationUserId:
              actor.organizationUserId
          }
        : {}),

      ...(entityId
        ? { entityId }
        : {}),

      ...(oldValues !==
      undefined
        ? {
            oldValues:
              auditJsonValue(
                oldValues
              )
          }
        : {}),

      ...(newValues !==
      undefined
        ? {
            newValues:
              auditJsonValue(
                newValues
              )
          }
        : {}),

      ...(metadata !==
      undefined
        ? {
            metadata:
              auditJsonValue(
                metadata
              )
          }
        : {}),

      ...(ipAddress
        ? { ipAddress }
        : {}),

      ...(userAgent
        ? { userAgent }
        : {}),

      ...(requestId
        ? { requestId }
        : {}),

      ...(correlationId
        ? { correlationId }
        : {}),

      ...(httpMethod
        ? { httpMethod }
        : {}),

      ...(requestPath
        ? { requestPath }
        : {}),

      ...(data.httpStatusCode !==
      undefined
        ? {
            httpStatusCode:
              data.httpStatusCode
          }
        : {})
    }
  });
}
