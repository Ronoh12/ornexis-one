import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  assignmentProvidesDescendantAccess,
  loadAuthorizedHierarchyMembership,
  loadEffectiveHierarchyAssignments
} from "./hierarchyAuthorizationService.js";

import {
  normalizeOptionalText,
  validateEffectivePeriod,
  validateHierarchyLimit
} from "./hierarchyIdentityService.js";

import {
  loadHierarchyAncestorsInternal,
  loadHierarchyUnitRecord,
  type HierarchyUnitRecord
} from "./hierarchyTraversalService.js";

import {
  lockHierarchyMutation
} from "./organizationalUnitService.js";

import {
  HierarchyServiceError,
  type CreateOrganizationalUnitAssignmentInput,
  type HierarchyActor,
  type HierarchyMembership
} from "./hierarchyTypes.js";

const assignmentInclude = {
  organizationalUnit: {
    include: {
      unitType: true
    }
  },
  organizationUser: {
    select: {
      id: true,
      userId: true,
      status: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  },
  assignedBy: {
    select: {
      id: true,
      userId: true
    }
  }
} satisfies Prisma.OrganizationalUnitAssignmentInclude;

function translateAssignmentError(
  error: unknown
): never {
  if (
    error instanceof
      HierarchyServiceError
  ) {
    throw error;
  }

  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (
      error.code ===
        "P2002"
    ) {
      const target =
        Array.isArray(
          error.meta?.target
        )
          ? error.meta.target
              .join(" ")
          : String(
              error.meta?.target ??
              ""
            );

      if (
        target.includes(
          "active_primary"
        )
      ) {
        throw new HierarchyServiceError(
          "HIERARCHY_PRIMARY_ASSIGNMENT_CONFLICT",
          "The organization user already has an active primary unit assignment."
        );
      }

      throw new HierarchyServiceError(
        "HIERARCHY_ASSIGNMENT_DUPLICATE",
        "That active organizational unit assignment already exists."
      );
    }

    if (
      error.code ===
        "P2003"
    ) {
      throw new HierarchyServiceError(
        "HIERARCHY_ASSIGNMENT_INVALID",
        "The organizational unit assignment references an invalid resource."
      );
    }
  }

  throw error;
}

async function loadActiveOrganizationUser(
  tx:
    Prisma.TransactionClient,
  organizationId: string,
  organizationUserId: string
) {
  const organizationUser =
    await tx
      .organizationUser
      .findFirst({
        where: {
          id:
            organizationUserId,
          organizationId,
          status:
            "ACTIVE"
        },
        select: {
          id: true,
          userId: true,
          status: true
        }
      });

  if (!organizationUser) {
    throw new HierarchyServiceError(
      "HIERARCHY_ASSIGNMENT_INVALID",
      "An active organization user was not found."
    );
  }

  return organizationUser;
}

async function loadActiveAssignmentUnit(
  tx:
    Prisma.TransactionClient,
  organizationId: string,
  unitId: string
) {
  const unit =
    await tx
      .organizationalUnit
      .findFirst({
        where: {
          id:
            unitId,
          organizationId,
          isActive:
            true,
          unitType: {
            isActive:
              true
          }
        },
        include: {
          unitType: true,
          parent: {
            select: {
              id: true,
              name: true,
              code: true,
              parentId: true,
              isActive: true
            }
          },
          _count: {
            select: {
              children: true,
              assignments: true
            }
          }
        }
      });

  if (!unit) {
    throw new HierarchyServiceError(
      "HIERARCHY_UNIT_NOT_FOUND",
      "An active organizational unit was not found."
    );
  }

  return unit;
}

async function assertAssignmentAuthority(
  actor:
    HierarchyActor,
  membership:
    HierarchyMembership,
  unit:
    HierarchyUnitRecord
) {
  if (
    membership.isAdministrator
  ) {
    return;
  }

  const assignments =
    await loadEffectiveHierarchyAssignments(
      actor,
      membership.id
    );

  const governingAssignments =
    assignments.filter(
      assignmentProvidesDescendantAccess
    );

  if (
    governingAssignments.some(
      (assignment) =>
        assignment
          .organizationalUnitId ===
        unit.id
    )
  ) {
    return;
  }

  const ancestors =
    await loadHierarchyAncestorsInternal(
      actor.organizationId,
      unit
    );

  if (
    governingAssignments.some(
      (assignment) =>
        ancestors.some(
          (ancestor) =>
            ancestor.id ===
              assignment
                .organizationalUnitId
        )
    )
  ) {
    return;
  }

  throw new HierarchyServiceError(
    "HIERARCHY_UNIT_NOT_FOUND",
    "The organizational unit was not found."
  );
}

async function validatePrimaryAvailability(
  tx:
    Prisma.TransactionClient,
  organizationId: string,
  organizationUserId: string,
  excludeAssignmentId?:
    string
) {
  const existingPrimary =
    await tx
      .organizationalUnitAssignment
      .findFirst({
        where: {
          organizationId,
          organizationUserId,
          isActive:
            true,
          isPrimary:
            true,
          ...(excludeAssignmentId
            ? {
                id: {
                  not:
                    excludeAssignmentId
                }
              }
            : {})
        },
        select: {
          id: true
        }
      });

  if (
    existingPrimary
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_PRIMARY_ASSIGNMENT_CONFLICT",
      "The organization user already has an active primary unit assignment."
    );
  }
}

export async function createOrganizationalUnitAssignment(
  actor: HierarchyActor,
  input:
    CreateOrganizationalUnitAssignmentInput
) {
  const membership =
    await loadAuthorizedHierarchyMembership(
      actor,
      "hierarchy.assign"
    );

  validateEffectivePeriod(
    input.effectiveStart,
    input.effectiveEnd
  );

  const responsibilityLabel =
    normalizeOptionalText(
      input.responsibilityLabel,
      160
    );

  try {
    const assignment =
      await prisma.$transaction(
        async (
          tx
        ) => {
          await lockHierarchyMutation(
            tx,
            actor.organizationId
          );

          const unit =
            await loadActiveAssignmentUnit(
              tx,
              actor.organizationId,
              input.organizationalUnitId
            );

          await assertAssignmentAuthority(
            actor,
            membership,
            unit
          );

          await loadActiveOrganizationUser(
            tx,
            actor.organizationId,
            input.organizationUserId
          );

          if (
            input.isPrimary ===
              true
          ) {
            await validatePrimaryAvailability(
              tx,
              actor.organizationId,
              input.organizationUserId
            );
          }

          return tx
            .organizationalUnitAssignment
            .create({
              data: {
                organizationId:
                  actor.organizationId,
                organizationalUnitId:
                  input.organizationalUnitId,
                organizationUserId:
                  input.organizationUserId,
                assignmentRole:
                  input.assignmentRole,
                isPrimary:
                  input.isPrimary ??
                  false,
                isActive:
                  true,
                ...(responsibilityLabel !==
                undefined
                  ? {
                      responsibilityLabel
                    }
                  : {}),
                ...(input.effectiveStart !==
                undefined
                  ? {
                      effectiveStart:
                        input.effectiveStart
                    }
                  : {}),
                ...(input.effectiveEnd !==
                undefined
                  ? {
                      effectiveEnd:
                        input.effectiveEnd
                    }
                  : {}),
                assignedByOrganizationUserId:
                  actor.organizationUserId
              },
              include:
                assignmentInclude
            });
        }
      );

    await createAuditLog({
      organizationId:
        actor.organizationId,
      userId:
        actor.userId,
      action:
        "HIERARCHY_ASSIGNMENT_CREATED",
      entityType:
        "OrganizationalUnitAssignment",
      entityId:
        assignment.id,
      newValues: {
        organizationalUnitId:
          assignment
            .organizationalUnitId,
        organizationUserId:
          assignment
            .organizationUserId,
        assignmentRole:
          assignment.assignmentRole,
        isPrimary:
          assignment.isPrimary,
        isActive:
          assignment.isActive,
        effectiveStart:
          assignment.effectiveStart,
        effectiveEnd:
          assignment.effectiveEnd
      }
    });

    return assignment;
  } catch (error) {
    translateAssignmentError(
      error
    );
  }
}

export {
  assignmentInclude,
  assertAssignmentAuthority,
  loadActiveAssignmentUnit,
  loadActiveOrganizationUser,
  translateAssignmentError,
  validatePrimaryAvailability
};

async function loadAssignment(
  organizationId: string,
  assignmentId: string
) {
  const assignment =
    await prisma
      .organizationalUnitAssignment
      .findFirst({
        where: {
          id:
            assignmentId,
          organizationId
        },
        include:
          assignmentInclude
      });

  if (!assignment) {
    throw new HierarchyServiceError(
      "HIERARCHY_ASSIGNMENT_NOT_FOUND",
      "The organizational unit assignment was not found."
    );
  }

  return assignment;
}

export async function updateOrganizationalUnitAssignment(
  actor: HierarchyActor,
  assignmentId: string,
  input:
    import("./hierarchyTypes.js")
      .UpdateOrganizationalUnitAssignmentInput
) {
  const membership =
    await loadAuthorizedHierarchyMembership(
      actor,
      "hierarchy.assign"
    );

  const existing =
    await loadAssignment(
      actor.organizationId,
      assignmentId
    );

  const authorityUnit =
    await loadHierarchyUnitRecord(
      actor.organizationId,
      existing
        .organizationalUnitId
    );

  await assertAssignmentAuthority(
    actor,
    membership,
    authorityUnit
  );

  const targetStart =
    input.effectiveStart !==
      undefined
      ? input.effectiveStart
      : existing.effectiveStart;

  const targetEnd =
    input.effectiveEnd !==
      undefined
      ? input.effectiveEnd
      : existing.effectiveEnd;

  validateEffectivePeriod(
    targetStart,
    targetEnd
  );

  const responsibilityLabel =
    normalizeOptionalText(
      input.responsibilityLabel,
      160
    );

  try {
    const assignment =
      await prisma.$transaction(
        async (
          tx
        ) => {
          await lockHierarchyMutation(
            tx,
            actor.organizationId
          );

          const current =
            await tx
              .organizationalUnitAssignment
              .findFirst({
                where: {
                  id:
                    assignmentId,
                  organizationId:
                    actor.organizationId
                }
              });

          if (!current) {
            throw new HierarchyServiceError(
              "HIERARCHY_ASSIGNMENT_NOT_FOUND",
              "The organizational unit assignment was not found."
            );
          }

          const targetActive =
            input.isActive ??
            current.isActive;

          const targetPrimary =
            targetActive
              ? (
                  input.isPrimary ??
                  current.isPrimary
                )
              : false;

          if (
            targetActive
          ) {
            await loadActiveAssignmentUnit(
              tx,
              actor.organizationId,
              current
                .organizationalUnitId
            );

            await loadActiveOrganizationUser(
              tx,
              actor.organizationId,
              current
                .organizationUserId
            );
          }

          if (
            targetPrimary
          ) {
            await validatePrimaryAvailability(
              tx,
              actor.organizationId,
              current
                .organizationUserId,
              current.id
            );
          }

          return tx
            .organizationalUnitAssignment
            .update({
              where: {
                id:
                  current.id
              },
              data: {
                ...(input.assignmentRole !==
                undefined
                  ? {
                      assignmentRole:
                        input.assignmentRole
                    }
                  : {}),
                isPrimary:
                  targetPrimary,
                ...(input.isActive !==
                undefined
                  ? {
                      isActive:
                        input.isActive
                    }
                  : {}),
                ...(responsibilityLabel !==
                undefined
                  ? {
                      responsibilityLabel
                    }
                  : {}),
                ...(input.effectiveStart !==
                undefined
                  ? {
                      effectiveStart:
                        input.effectiveStart
                    }
                  : {}),
                ...(input.effectiveEnd !==
                undefined
                  ? {
                      effectiveEnd:
                        input.effectiveEnd
                    }
                  : {})
              },
              include:
                assignmentInclude
            });
        }
      );

    const action =
      existing.isActive &&
      !assignment.isActive
        ? "HIERARCHY_ASSIGNMENT_DEACTIVATED"
        : "HIERARCHY_ASSIGNMENT_UPDATED";

    await createAuditLog({
      organizationId:
        actor.organizationId,
      userId:
        actor.userId,
      action,
      entityType:
        "OrganizationalUnitAssignment",
      entityId:
        assignment.id,
      oldValues: {
        assignmentRole:
          existing.assignmentRole,
        isPrimary:
          existing.isPrimary,
        isActive:
          existing.isActive,
        responsibilityLabel:
          existing
            .responsibilityLabel,
        effectiveStart:
          existing.effectiveStart,
        effectiveEnd:
          existing.effectiveEnd
      },
      newValues: {
        assignmentRole:
          assignment.assignmentRole,
        isPrimary:
          assignment.isPrimary,
        isActive:
          assignment.isActive,
        responsibilityLabel:
          assignment
            .responsibilityLabel,
        effectiveStart:
          assignment.effectiveStart,
        effectiveEnd:
          assignment.effectiveEnd
      }
    });

    return assignment;
  } catch (error) {
    translateAssignmentError(
      error
    );
  }
}

export async function deactivateOrganizationalUnitAssignment(
  actor: HierarchyActor,
  assignmentId: string
) {
  return updateOrganizationalUnitAssignment(
    actor,
    assignmentId,
    {
      isActive:
        false,
      isPrimary:
        false
    }
  );
}

export async function listOrganizationalUnitMembers(
  actor: HierarchyActor,
  unitId: string,
  input?: {
    active?:
      boolean | undefined;
    limit?:
      number | undefined;
  }
) {
  const membership =
    await loadAuthorizedHierarchyMembership(
      actor,
      "hierarchy.view"
    );

  const unit =
    await loadHierarchyUnitRecord(
      actor.organizationId,
      unitId
    );

  await assertAssignmentAuthority(
    actor,
    membership,
    unit
  );

  const limit =
    validateHierarchyLimit(
      input?.limit
    );

  return prisma
    .organizationalUnitAssignment
    .findMany({
      where: {
        organizationId:
          actor.organizationId,
        organizationalUnitId:
          unit.id,
        ...(input?.active !==
        undefined
          ? {
              isActive:
                input.active
            }
          : {})
      },
      include:
        assignmentInclude,
      orderBy: [
        {
          isPrimary:
            "desc"
        },
        {
          assignmentRole:
            "asc"
        },
        {
          createdAt:
            "asc"
        },
        {
          id:
            "asc"
        }
      ],
      take:
        limit
    });
}

export async function listOrganizationUserUnitAssignments(
  actor: HierarchyActor,
  organizationUserId: string,
  input?: {
    active?:
      boolean | undefined;
    limit?:
      number | undefined;
  }
) {
  const membership =
    await loadAuthorizedHierarchyMembership(
      actor,
      "hierarchy.view"
    );

  if (
    !membership.isAdministrator &&
    membership.id !==
      organizationUserId
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_ASSIGNMENT_NOT_FOUND",
      "The organizational unit assignments were not found."
    );
  }

  const organizationUser =
    await prisma
      .organizationUser
      .findFirst({
        where: {
          id:
            organizationUserId,
          organizationId:
            actor.organizationId
        },
        select: {
          id: true
        }
      });

  if (!organizationUser) {
    throw new HierarchyServiceError(
      "HIERARCHY_ASSIGNMENT_NOT_FOUND",
      "The organizational unit assignments were not found."
    );
  }

  const limit =
    validateHierarchyLimit(
      input?.limit
    );

  return prisma
    .organizationalUnitAssignment
    .findMany({
      where: {
        organizationId:
          actor.organizationId,
        organizationUserId:
          organizationUser.id,
        ...(input?.active !==
        undefined
          ? {
              isActive:
                input.active
            }
          : {})
      },
      include:
        assignmentInclude,
      orderBy: [
        {
          isPrimary:
            "desc"
        },
        {
          assignmentRole:
            "asc"
        },
        {
          createdAt:
            "asc"
        },
        {
          id:
            "asc"
        }
      ],
      take:
        limit
    });
}
