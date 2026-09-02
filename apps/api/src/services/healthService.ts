import {
  HealthScopeType,
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  evaluateOrganizationHealth
} from "./healthEvaluationService.js";

import type {
  parseEvaluateHealthBody,
  parseHealthDefinitionUpdate,
  parseHealthSnapshotQuery
} from "../validators/healthValidator.js";


export async function checkDatabaseHealth() {
  await prisma.$queryRaw`SELECT 1`;

  return {
    database: "connected"
  };
}

type HealthActor = {
  userId: string;
  organizationId: string;
  organizationUserId: string;
};

type SnapshotQuery =
  ReturnType<
    typeof parseHealthSnapshotQuery
  >;

type DefinitionUpdate =
  ReturnType<
    typeof parseHealthDefinitionUpdate
  >;

type EvaluationInput =
  ReturnType<
    typeof parseEvaluateHealthBody
  >;

export class HealthServiceError
  extends Error {
  code: string;

  constructor(
    code: string,
    message: string
  ) {
    super(message);
    this.name =
      "HealthServiceError";
    this.code =
      code;
  }
}

async function actorMembership(
  actor: HealthActor
) {
  const membership =
    await prisma.organizationUser.findFirst({
      where: {
        id:
          actor.organizationUserId,
        userId:
          actor.userId,
        organizationId:
          actor.organizationId,
        status:
          "ACTIVE"
      },
      select: {
        id: true,
        branchId: true,
        departmentId: true,
        role: {
          select: {
            name: true,
            isSystemRole: true
          }
        }
      }
    });

  if (!membership) {
    throw new HealthServiceError(
      "HEALTH_MEMBERSHIP_INVALID",
      "Active organization membership is required."
    );
  }

  return {
    ...membership,
    isAdministrator:
      membership.role.name ===
        "Administrator" &&
      membership.role.isSystemRole
  };
}

function membershipSnapshotFilter(
  membership:
    Awaited<
      ReturnType<
        typeof actorMembership
      >
    >
): Prisma.HealthSnapshotWhereInput {
  if (
    membership.isAdministrator
  ) {
    return {};
  }

  const allowed:
    Prisma.HealthSnapshotWhereInput[] = [];

  if (membership.branchId) {
    allowed.push({
      scopeType:
        HealthScopeType.BRANCH,
      branchId:
        membership.branchId
    });
  }

  if (membership.departmentId) {
    allowed.push({
      scopeType:
        HealthScopeType.DEPARTMENT,
      departmentId:
        membership.departmentId
    });
  }

  if (allowed.length === 0) {
    return {
      id: {
        equals:
          "00000000-0000-0000-0000-000000000000"
      }
    };
  }

  return {
    OR:
      allowed
  };
}

async function assertScopeAccess(
  actor: HealthActor,
  scope: EvaluationInput["scope"]
) {
  const membership =
    await actorMembership(actor);

  if (
    membership.isAdministrator
  ) {
    return membership;
  }

  const allowedBranch =
    scope.scopeType ===
      HealthScopeType.BRANCH &&
    membership.branchId !== null &&
    membership.branchId ===
      scope.branchId;

  const allowedDepartment =
    scope.scopeType ===
      HealthScopeType.DEPARTMENT &&
    membership.departmentId !== null &&
    membership.departmentId ===
      scope.departmentId;

  if (
    !allowedBranch &&
    !allowedDepartment
  ) {
    throw new HealthServiceError(
      "HEALTH_SCOPE_FORBIDDEN",
      "You do not have access to this health scope."
    );
  }

  return membership;
}

export async function listHealthDefinitions(
  actor: HealthActor
) {
  await actorMembership(actor);

  return prisma.healthIndicatorDefinition.findMany({
    where: {
      organizationId:
        actor.organizationId
    },
    orderBy: {
      code: "asc"
    }
  });
}

export async function updateHealthDefinition(
  actor: HealthActor,
  id: string,
  input: DefinitionUpdate
) {
  await actorMembership(actor);

  const existing =
    await prisma.healthIndicatorDefinition.findFirst({
      where: {
        id,
        organizationId:
          actor.organizationId
      }
    });

  if (!existing) {
    throw new HealthServiceError(
      "HEALTH_DEFINITION_NOT_FOUND",
      "Health Indicator definition was not found."
    );
  }

  const updated =
    await prisma.healthIndicatorDefinition.update({
      where: {
        id:
          existing.id
      },
      data: {
        ...(input.weight !== undefined
          ? {
              weight:
                new Prisma.Decimal(
                  input.weight
                )
            }
          : {}),
        ...(input.isActive !== undefined
          ? {
              isActive:
                input.isActive
            }
          : {}),
        ...(input.name !== undefined
          ? {
              name:
                input.name
            }
          : {}),
        ...(input.description !== undefined
          ? {
              description:
                input.description
            }
          : {})
      }
    });

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "HEALTH_INDICATOR_UPDATED",
    entityType:
      "HEALTH_INDICATOR_DEFINITION",
    entityId:
      updated.id,
    oldValues: {
      name:
        existing.name,
      description:
        existing.description,
      weight:
        existing.weight.toString(),
      isActive:
        existing.isActive
    },
    newValues: {
      name:
        updated.name,
      description:
        updated.description,
      weight:
        updated.weight.toString(),
      isActive:
        updated.isActive
    }
  });

  return updated;
}

export async function listHealthSnapshots(
  actor: HealthActor,
  query: SnapshotQuery
) {
  const membership =
    await actorMembership(actor);

  const visibility =
    membershipSnapshotFilter(
      membership
    );

  const filters:
    Prisma.HealthSnapshotWhereInput = {
      organizationId:
        actor.organizationId,
      ...visibility,
      ...(query.scopeType
        ? {
            scopeType:
              query.scopeType
          }
        : {}),
      ...(query.status
        ? {
            status:
              query.status
          }
        : {}),
      ...(query.scopeType ===
          HealthScopeType.BRANCH &&
        query.scopeId
        ? {
            branchId:
              query.scopeId
          }
        : {}),
      ...(query.scopeType ===
          HealthScopeType.DEPARTMENT &&
        query.scopeId
        ? {
            departmentId:
              query.scopeId
          }
        : {})
    };

  const [
    total,
    items
  ] = await Promise.all([
    prisma.healthSnapshot.count({
      where:
        filters
    }),
    prisma.healthSnapshot.findMany({
      where:
        filters,
      orderBy: [
        {
          evaluatedAt: "desc"
        },
        {
          id: "desc"
        }
      ],
      skip:
        (
          query.page - 1
        ) * query.limit,
      take:
        query.limit,
      include: {
        contributions: {
          orderBy: {
            indicatorCode: "asc"
          }
        }
      }
    })
  ]);

  return {
    items,
    pagination: {
      page:
        query.page,
      limit:
        query.limit,
      total,
      pages:
        Math.ceil(
          total /
          query.limit
        )
    }
  };
}

export async function getHealthSnapshot(
  actor: HealthActor,
  id: string
) {
  const membership =
    await actorMembership(actor);

  const snapshot =
    await prisma.healthSnapshot.findFirst({
      where: {
        id,
        organizationId:
          actor.organizationId,
        ...membershipSnapshotFilter(
          membership
        )
      },
      include: {
        contributions: {
          orderBy: {
            indicatorCode: "asc"
          },
          include: {
            healthIndicatorDefinition: true
          }
        }
      }
    });

  if (!snapshot) {
    throw new HealthServiceError(
      "HEALTH_SNAPSHOT_NOT_FOUND",
      "Health snapshot was not found."
    );
  }

  return snapshot;
}

export async function getLatestHealthSnapshot(
  actor: HealthActor,
  scopeType: HealthScopeType,
  scopeId?: string
) {
  const membership =
    await actorMembership(actor);

  const snapshot =
    await prisma.healthSnapshot.findFirst({
      where: {
        organizationId:
          actor.organizationId,
        ...membershipSnapshotFilter(
          membership
        ),
        scopeType,
        ...(scopeType ===
            HealthScopeType.BRANCH
          ? {
              branchId:
                scopeId ?? ""
            }
          : {}),
        ...(scopeType ===
            HealthScopeType.DEPARTMENT
          ? {
              departmentId:
                scopeId ?? ""
            }
          : {})
      },
      orderBy: {
        evaluatedAt: "desc"
      },
      include: {
        contributions: {
          orderBy: {
            indicatorCode: "asc"
          }
        }
      }
    });

  if (!snapshot) {
    throw new HealthServiceError(
      "HEALTH_SNAPSHOT_NOT_FOUND",
      "Health snapshot was not found."
    );
  }

  return snapshot;
}

export async function manuallyEvaluateHealth(
  actor: HealthActor,
  input: EvaluationInput
) {
  const scope = {
    scopeType:
      input.scope.scopeType,
    branchId:
      input.scope.branchId ?? null,
    departmentId:
      input.scope.departmentId ?? null
  };

  await assertScopeAccess(
    actor,
    scope
  );

  return evaluateOrganizationHealth(
    actor.organizationId,
    scope,
    {
      ...(input.now
        ? {
            now:
              input.now
          }
        : {}),
      ...(input.periodStart
        ? {
            periodStart:
              input.periodStart
          }
        : {}),
      ...(input.periodEnd
        ? {
            periodEnd:
              input.periodEnd
          }
        : {})
    }
  );
}
