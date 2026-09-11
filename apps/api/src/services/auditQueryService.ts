import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  userHasPermission
} from "./authorizationService.js";

import {
  AUDIT_EXPORT_LIMIT,
  AuditServiceError,
  type AuditActor,
  type AuditExportInput,
  type AuditListInput
} from "./auditTypes.js";

import {
  decodeAuditCursor,
  encodeAuditCursor
} from "../validators/auditValidator.js";

const auditInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  },
  organizationUser: {
    select: {
      id: true,
      status: true,
      role: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} satisfies
  Prisma.AuditLogInclude;

export type AuditEventRecord =
  Prisma.AuditLogGetPayload<{
    include:
      typeof auditInclude;
  }>;

async function authorizeAuditActor(
  actor:
    AuditActor,
  permission:
    "audit_logs.view" |
    "audit_logs.export"
) {
  const membership =
    await prisma
      .organizationUser
      .findFirst({
        where: {
          id:
            actor.organizationUserId,
          organizationId:
            actor.organizationId,
          userId:
            actor.userId,
          status:
            "ACTIVE"
        },
        select: {
          id: true
        }
      });

  if (!membership) {
    throw new AuditServiceError(
      "AUDIT_MEMBERSHIP_REQUIRED",
      "Active organization membership is required."
    );
  }

  const allowed =
    await userHasPermission(
      actor.userId,
      actor.organizationId,
      permission
    );

  if (!allowed) {
    throw new AuditServiceError(
      permission ===
        "audit_logs.export"
        ? "AUDIT_EXPORT_FORBIDDEN"
        : "AUDIT_FORBIDDEN",
      "Audit permission is required."
    );
  }
}

function auditWhere(
  organizationId:
    string,
  input:
    AuditExportInput
): Prisma.AuditLogWhereInput {
  const conditions:
    Prisma.AuditLogWhereInput[] =
      [];

  if (input.action) {
    conditions.push({
      action: {
        equals:
          input.action,
        mode:
          "insensitive"
      }
    });
  }

  if (input.entityType) {
    conditions.push({
      entityType: {
        equals:
          input.entityType,
        mode:
          "insensitive"
      }
    });
  }

  if (input.entityId) {
    conditions.push({
      entityId:
        input.entityId
    });
  }

  if (input.userId) {
    conditions.push({
      userId:
        input.userId
    });
  }

  if (
    input.organizationUserId
  ) {
    conditions.push({
      organizationUserId:
        input.organizationUserId
    });
  }

  if (input.category) {
    conditions.push({
      category:
        input.category
    });
  }

  if (input.source) {
    conditions.push({
      source:
        input.source
    });
  }

  if (input.result) {
    conditions.push({
      result:
        input.result
    });
  }

  if (input.requestId) {
    conditions.push({
      requestId:
        input.requestId
    });
  }

  if (input.correlationId) {
    conditions.push({
      correlationId:
        input.correlationId
    });
  }

  if (
    input.createdFrom ||
    input.createdTo
  ) {
    conditions.push({
      createdAt: {
        ...(input.createdFrom
          ? {
              gte:
                input.createdFrom
            }
          : {}),
        ...(input.createdTo
          ? {
              lte:
                input.createdTo
            }
          : {})
      }
    });
  }

  if (input.search) {
    conditions.push({
      OR: [
        {
          action: {
            contains:
              input.search,
            mode:
              "insensitive"
          }
        },
        {
          entityType: {
            contains:
              input.search,
            mode:
              "insensitive"
          }
        },
        {
          entityId: {
            contains:
              input.search,
            mode:
              "insensitive"
          }
        },
        {
          requestId: {
            contains:
              input.search,
            mode:
              "insensitive"
          }
        },
        {
          correlationId: {
            contains:
              input.search,
            mode:
              "insensitive"
          }
        },
        {
          user: {
            is: {
              OR: [
                {
                  email: {
                    contains:
                      input.search,
                    mode:
                      "insensitive"
                  }
                },
                {
                  firstName: {
                    contains:
                      input.search,
                    mode:
                      "insensitive"
                  }
                },
                {
                  lastName: {
                    contains:
                      input.search,
                    mode:
                      "insensitive"
                  }
                }
              ]
            }
          }
        }
      ]
    });
  }

  return {
    organizationId,
    ...(conditions.length > 0
      ? {
          AND:
            conditions
        }
      : {})
  };
}

export async function listAuditEvents(
  actor:
    AuditActor,
  input:
    AuditListInput
) {
  await authorizeAuditActor(
    actor,
    "audit_logs.view"
  );

  const limit =
    input.limit ??
    50;

  const where =
    auditWhere(
      actor.organizationId,
      input
    );

  if (input.cursor) {
    const cursor =
      decodeAuditCursor(
        input.cursor
      );

    const createdAt =
      new Date(
        cursor.createdAt
      );

    const cursorCondition:
      Prisma.AuditLogWhereInput =
        {
          OR: [
            {
              createdAt: {
                lt:
                  createdAt
              }
            },
            {
              createdAt,
              id: {
                lt:
                  cursor.id
              }
            }
          ]
        };

    const existingAnd =
      Array.isArray(
        where.AND
      )
        ? where.AND
        : where.AND
          ? [where.AND]
          : [];

    where.AND = [
      ...existingAnd,
      cursorCondition
    ];
  }

  const rows =
    await prisma.auditLog.findMany({
      where,
      include:
        auditInclude,
      orderBy: [
        {
          createdAt:
            "desc"
        },
        {
          id:
            "desc"
        }
      ],
      take:
        limit + 1
    });

  const hasMore =
    rows.length >
      limit;

  const items =
    hasMore
      ? rows.slice(
          0,
          limit
        )
      : rows;

  const last =
    items.at(-1);

  return {
    items,
    hasMore,
    limit,
    nextCursor:
      hasMore &&
      last
        ? encodeAuditCursor({
            createdAt:
              last.createdAt
                .toISOString(),
            id:
              last.id
          })
        : null
  };
}

export async function getAuditEvent(
  actor:
    AuditActor,
  eventId:
    string
) {
  await authorizeAuditActor(
    actor,
    "audit_logs.view"
  );

  const event =
    await prisma.auditLog.findFirst({
      where: {
        id:
          eventId,
        organizationId:
          actor.organizationId
      },
      include:
        auditInclude
    });

  if (!event) {
    throw new AuditServiceError(
      "AUDIT_EVENT_NOT_FOUND",
      "Audit event was not found."
    );
  }

  return event;
}

export async function loadAuditEventsForExport(
  actor:
    AuditActor,
  input:
    AuditExportInput
) {
  await authorizeAuditActor(
    actor,
    "audit_logs.view"
  );

  await authorizeAuditActor(
    actor,
    "audit_logs.export"
  );

  const rows =
    await prisma.auditLog.findMany({
      where:
        auditWhere(
          actor.organizationId,
          input
        ),
      include:
        auditInclude,
      orderBy: [
        {
          createdAt:
            "desc"
        },
        {
          id:
            "desc"
        }
      ],
      take:
        AUDIT_EXPORT_LIMIT +
        1
    });

  if (
    rows.length >
      AUDIT_EXPORT_LIMIT
  ) {
    throw new AuditServiceError(
      "AUDIT_EXPORT_LIMIT_EXCEEDED",
      `Audit export is limited to ${AUDIT_EXPORT_LIMIT} events.`
    );
  }

  return rows;
}

export async function getAuditLogsForOrganization(
  organizationId:
    string
) {
  return prisma.auditLog.findMany({
    where: {
      organizationId
    },
    orderBy: [
      {
        createdAt:
          "desc"
      },
      {
        id:
          "desc"
      }
    ],
    take:
      200,
    include:
      auditInclude
  });
}
