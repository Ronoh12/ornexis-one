import {
  randomUUID
} from "node:crypto";

import type {
  Request
} from "express";

import type {
  AuditRequestContext
} from "./auditTypes.js";

type AuthenticatedRequest =
  Request & {
    auth?: {
      userId?: string;
      organizationId?: string;
      organizationUserId?: string;
    };
  };

function safeHeader(
  value:
    string |
    string[] |
    undefined,
  maximumLength:
    number
) {
  const candidate =
    Array.isArray(value)
      ? value[0]
      : value;

  if (!candidate) {
    return undefined;
  }

  const normalized =
    candidate.trim();

  if (
    !normalized ||
    normalized.length >
      maximumLength
  ) {
    return undefined;
  }

  return normalized;
}

export function auditRequestContext(
  request:
    AuthenticatedRequest
): AuditRequestContext {
  const requestId =
    safeHeader(
      request.headers[
        "x-request-id"
      ],
      128
    ) ??
    randomUUID();

  const correlationId =
    safeHeader(
      request.headers[
        "x-correlation-id"
      ],
      128
    );

  const userAgent =
    safeHeader(
      request.headers[
        "user-agent"
      ],
      1024
    );

  const requestPath =
    request.originalUrl
      .split("?")[0]
      ?.slice(
        0,
        512
      );

  return {
    ...(request.auth?.userId
      ? {
          userId:
            request.auth.userId
        }
      : {}),

    ...(request.auth
      ?.organizationId
      ? {
          organizationId:
            request.auth
              .organizationId
        }
      : {}),

    ...(request.auth
      ?.organizationUserId
      ? {
          organizationUserId:
            request.auth
              .organizationUserId
        }
      : {}),

    ...(request.ip
      ? {
          ipAddress:
            request.ip
        }
      : {}),

    ...(userAgent
      ? { userAgent }
      : {}),

    requestId,

    ...(correlationId
      ? { correlationId }
      : {}),

    httpMethod:
      request.method
        .toUpperCase(),

    ...(requestPath
      ? { requestPath }
      : {})
  };
}
