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
  loadAuthorizedHierarchyMembership
} from "./hierarchyAuthorizationService.js";

import {
  normalizeHierarchyCode,
  normalizeHierarchyName,
  normalizeOptionalText,
  requireCustomHierarchyUnit,
  validateHierarchyLimit
} from "./hierarchyIdentityService.js";

import {
  assertHierarchyUnitVisible,
  hierarchyUnitInclude,
  hierarchyUnitOrder,
  loadAuthorizedHierarchyUnit
} from "./hierarchyTraversalService.js";

import {
  HIERARCHY_MAX_DEPTH,
  HierarchyServiceError,
  type CreateOrganizationalUnitInput,
  type HierarchyActor,
  type HierarchyListInput,
  type UpdateOrganizationalUnitInput
} from "./hierarchyTypes.js";

async function lockHierarchyMutation(
  tx:
    Prisma.TransactionClient,
  organizationId: string
) {
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(
      hashtextextended(
        ${organizationId},
        0::bigint
      )
    )
  `;
}

function translateOrganizationalUnitError(
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
      throw new HierarchyServiceError(
        "HIERARCHY_UNIT_DUPLICATE",
        "An organizational unit with that code or sibling identity already exists."
      );
    }

    if (
      error.code ===
        "P2003"
    ) {
      throw new HierarchyServiceError(
        "HIERARCHY_PARENT_INVALID",
        "The organizational unit parent or type is invalid."
      );
    }
  }

  throw error;
}

async function loadTransactionUnit(
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
          organizationId
        },
        include:
          hierarchyUnitInclude
      });

  if (!unit) {
    throw new HierarchyServiceError(
      "HIERARCHY_UNIT_NOT_FOUND",
      "The organizational unit was not found."
    );
  }

  return unit;
}

async function loadActiveTransactionUnitType(
  tx:
    Prisma.TransactionClient,
  organizationId: string,
  unitTypeId: string
) {
  const unitType =
    await tx
      .organizationalUnitType
      .findFirst({
        where: {
          id:
            unitTypeId,
          organizationId,
          isActive:
            true
        }
      });

  if (!unitType) {
    throw new HierarchyServiceError(
      "HIERARCHY_UNIT_TYPE_NOT_FOUND",
      "An active organizational unit type was not found."
    );
  }

  return unitType;
}

async function transactionAncestorChain(
  tx:
    Prisma.TransactionClient,
  organizationId: string,
  startParentId:
    string |
    null
) {
  const ancestors:
    Array<{
      id: string;
      parentId:
        string | null;
      isActive:
        boolean;
    }> =
      [];

  const visited =
    new Set<string>();

  let currentId =
    startParentId;

  while (currentId) {
    if (
      visited.has(
        currentId
      )
    ) {
      throw new HierarchyServiceError(
        "HIERARCHY_CYCLE_DETECTED",
        "A cycle was detected in the organizational hierarchy."
      );
    }

    if (
      ancestors.length >=
        HIERARCHY_MAX_DEPTH
    ) {
      throw new HierarchyServiceError(
        "HIERARCHY_DEPTH_EXCEEDED",
        `The organizational hierarchy cannot exceed ${HIERARCHY_MAX_DEPTH} levels.`
      );
    }

    visited.add(
      currentId
    );

    const current =
      await tx
        .organizationalUnit
        .findFirst({
          where: {
            id:
              currentId,
            organizationId
          },
          select: {
            id: true,
            parentId: true,
            isActive: true
          }
        });

    if (!current) {
      throw new HierarchyServiceError(
        "HIERARCHY_PARENT_INVALID",
        "The organizational unit parent was not found."
      );
    }

    ancestors.push(
      current
    );

    currentId =
      current.parentId;
  }

  return ancestors;
}

async function validateTransactionParent(
  tx:
    Prisma.TransactionClient,
  organizationId: string,
  parentId:
    string |
    null,
  input: {
    activeUnit:
      boolean;
    movingUnitId?:
      string | undefined;
  }
) {
  if (
    parentId === null
  ) {
    return;
  }

  if (
    input.movingUnitId &&
    parentId ===
      input.movingUnitId
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_CYCLE_DETECTED",
      "An organizational unit cannot be its own parent."
    );
  }

  const ancestors =
    await transactionAncestorChain(
      tx,
      organizationId,
      parentId
    );

  const parent =
    ancestors[0];

  if (!parent) {
    throw new HierarchyServiceError(
      "HIERARCHY_PARENT_INVALID",
      "The organizational unit parent was not found."
    );
  }

  if (
    input.activeUnit &&
    !parent.isActive
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_PARENT_INVALID",
      "An active organizational unit requires an active parent."
    );
  }

  if (
    input.movingUnitId &&
    ancestors.some(
      (ancestor) =>
        ancestor.id ===
          input.movingUnitId
    )
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_CYCLE_DETECTED",
      "An organizational unit cannot be moved beneath one of its descendants."
    );
  }

  if (
    ancestors.length >=
      HIERARCHY_MAX_DEPTH
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_DEPTH_EXCEEDED",
      `The organizational hierarchy cannot exceed ${HIERARCHY_MAX_DEPTH} levels.`
    );
  }
}

export async function listOrganizationalUnits(
  actor: HierarchyActor,
  input?:
    HierarchyListInput
) {
  const membership =
    await loadAuthorizedHierarchyMembership(
      actor,
      "hierarchy.view"
    );

  const limit =
    validateHierarchyLimit(
      input?.limit
    );

  const where:
    Prisma.OrganizationalUnitWhereInput =
      {
        organizationId:
          actor.organizationId,
        ...(input?.active !==
        undefined
          ? {
              isActive:
                input.active
            }
          : {}),
        ...(input?.unitTypeId
          ? {
              unitTypeId:
                input.unitTypeId
            }
          : {}),
        ...(input?.parentId !==
        undefined
          ? {
              parentId:
                input.parentId
            }
          : {})
      };

  const candidates =
    await prisma
      .organizationalUnit
      .findMany({
        where,
        include:
          hierarchyUnitInclude,
        orderBy:
          hierarchyUnitOrder,
        take:
          200
      });

  if (
    membership.isAdministrator
  ) {
    return candidates.slice(
      0,
      limit
    );
  }

  const visible:
    typeof candidates =
      [];

  for (
    const candidate
    of candidates
  ) {
    try {
      await assertHierarchyUnitVisible(
        actor,
        membership,
        candidate
      );

      visible.push(
        candidate
      );

      if (
        visible.length >=
          limit
      ) {
        break;
      }
    } catch (
      error
    ) {
      if (
        !(
          error instanceof
            HierarchyServiceError
        ) ||
        error.code !==
          "HIERARCHY_UNIT_NOT_FOUND"
      ) {
        throw error;
      }
    }
  }

  return visible;
}

export async function getOrganizationalUnit(
  actor: HierarchyActor,
  unitId: string
) {
  const membership =
    await loadAuthorizedHierarchyMembership(
      actor,
      "hierarchy.view"
    );

  return loadAuthorizedHierarchyUnit(
    actor,
    membership,
    unitId
  );
}

export async function createOrganizationalUnit(
  actor: HierarchyActor,
  input:
    CreateOrganizationalUnitInput
) {
  await loadAuthorizedHierarchyMembership(
    actor,
    "hierarchy.manage"
  );

  const code =
    normalizeHierarchyCode(
      input.code
    );

  const {
    name,
    normalizedName
  } =
    normalizeHierarchyName(
      input.name
    );

  const description =
    normalizeOptionalText(
      input.description
    );

  const isActive =
    input.isActive ??
    true;

  try {
    const unit =
      await prisma.$transaction(
        async (
          tx
        ) => {
          await lockHierarchyMutation(
            tx,
            actor.organizationId
          );

          await loadActiveTransactionUnitType(
            tx,
            actor.organizationId,
            input.unitTypeId
          );

          const parentId =
            input.parentId ??
            null;

          await validateTransactionParent(
            tx,
            actor.organizationId,
            parentId,
            {
              activeUnit:
                isActive
            }
          );

          return tx
            .organizationalUnit
            .create({
              data: {
                organizationId:
                  actor.organizationId,
                unitTypeId:
                  input.unitTypeId,
                parentId,
                code,
                name,
                normalizedName,
                ...(description !==
                undefined
                  ? {
                      description
                    }
                  : {}),
                isActive,
                legacyBranchId:
                  null,
                legacyDepartmentId:
                  null
              },
              include:
                hierarchyUnitInclude
            });
        }
      );

    await createAuditLog({
      organizationId:
        actor.organizationId,
      userId:
        actor.userId,
      action:
        "HIERARCHY_UNIT_CREATED",
      entityType:
        "OrganizationalUnit",
      entityId:
        unit.id,
      newValues: {
        unitTypeId:
          unit.unitTypeId,
        parentId:
          unit.parentId,
        code:
          unit.code,
        name:
          unit.name,
        isActive:
          unit.isActive
      }
    });

    return unit;
  } catch (error) {
    translateOrganizationalUnitError(
      error
    );
  }
}

export {
  loadTransactionUnit,
  lockHierarchyMutation,
  translateOrganizationalUnitError,
  transactionAncestorChain,
  validateTransactionParent
};

async function transactionSubtreeHeight(
  tx:
    Prisma.TransactionClient,
  organizationId: string,
  rootId: string
) {
  const visited =
    new Set<string>([
      rootId
    ]);

  let frontier =
    [
      rootId
    ];

  let height =
    0;

  while (
    frontier.length >
      0
  ) {
    const children =
      await tx
        .organizationalUnit
        .findMany({
          where: {
            organizationId,
            parentId: {
              in:
                frontier
            }
          },
          select: {
            id: true
          }
        });

    if (
      children.length ===
        0
    ) {
      break;
    }

    height +=
      1;

    if (
      height >=
        HIERARCHY_MAX_DEPTH
    ) {
      throw new HierarchyServiceError(
        "HIERARCHY_DEPTH_EXCEEDED",
        `The organizational hierarchy cannot exceed ${HIERARCHY_MAX_DEPTH} levels.`
      );
    }

    const next:
      string[] =
      [];

    for (
      const child
      of children
    ) {
      if (
        visited.has(
          child.id
        )
      ) {
        throw new HierarchyServiceError(
          "HIERARCHY_CYCLE_DETECTED",
          "A cycle was detected in the organizational hierarchy."
        );
      }

      visited.add(
        child.id
      );

      next.push(
        child.id
      );
    }

    frontier =
      next;
  }

  return height;
}

export async function updateOrganizationalUnit(
  actor: HierarchyActor,
  unitId: string,
  input:
    UpdateOrganizationalUnitInput
) {
  await loadAuthorizedHierarchyMembership(
    actor,
    "hierarchy.manage"
  );

  const normalizedCode =
    input.code !==
      undefined
      ? normalizeHierarchyCode(
          input.code
        )
      : undefined;

  const normalizedName =
    input.name !==
      undefined
      ? normalizeHierarchyName(
          input.name
        )
      : undefined;

  const description =
    normalizeOptionalText(
      input.description
    );

  try {
    const result =
      await prisma.$transaction(
        async (
          tx
        ) => {
          await lockHierarchyMutation(
            tx,
            actor.organizationId
          );

          const existing =
            await loadTransactionUnit(
              tx,
              actor.organizationId,
              unitId
            );

          requireCustomHierarchyUnit(
            existing
          );

          const targetActive =
            input.isActive ??
            existing.isActive;

          const targetParentId =
            input.parentId !==
              undefined
              ? input.parentId
              : existing.parentId;

          if (
            input.unitTypeId !==
              undefined
          ) {
            await loadActiveTransactionUnitType(
              tx,
              actor.organizationId,
              input.unitTypeId
            );
          }

          await validateTransactionParent(
            tx,
            actor.organizationId,
            targetParentId,
            {
              activeUnit:
                targetActive,
              movingUnitId:
                existing.id
            }
          );

          const parentAncestors =
            targetParentId
              ? await transactionAncestorChain(
                  tx,
                  actor.organizationId,
                  targetParentId
                )
              : [];

          const subtreeHeight =
            await transactionSubtreeHeight(
              tx,
              actor.organizationId,
              existing.id
            );

          if (
            parentAncestors.length +
              subtreeHeight >=
            HIERARCHY_MAX_DEPTH
          ) {
            throw new HierarchyServiceError(
              "HIERARCHY_DEPTH_EXCEEDED",
              `The organizational hierarchy cannot exceed ${HIERARCHY_MAX_DEPTH} levels.`
            );
          }

          if (
            input.isActive ===
              false
          ) {
            const activeChildren =
              await tx
                .organizationalUnit
                .count({
                  where: {
                    organizationId:
                      actor.organizationId,
                    parentId:
                      existing.id,
                    isActive:
                      true
                  }
                });

            if (
              activeChildren >
                0
            ) {
              throw new HierarchyServiceError(
                "HIERARCHY_UNIT_IN_USE",
                "An organizational unit with active children cannot be deactivated."
              );
            }
          }

          const unit =
            await tx
              .organizationalUnit
              .update({
                where: {
                  id:
                    existing.id
                },
                data: {
                  ...(input.unitTypeId !==
                  undefined
                    ? {
                        unitTypeId:
                          input.unitTypeId
                      }
                    : {}),
                  ...(input.parentId !==
                  undefined
                    ? {
                        parentId:
                          input.parentId
                      }
                    : {}),
                  ...(normalizedCode !==
                  undefined
                    ? {
                        code:
                          normalizedCode
                      }
                    : {}),
                  ...(normalizedName !==
                  undefined
                    ? {
                        name:
                          normalizedName
                            .name,
                        normalizedName:
                          normalizedName
                            .normalizedName
                      }
                    : {}),
                  ...(description !==
                  undefined
                    ? {
                        description
                      }
                    : {}),
                  ...(input.isActive !==
                  undefined
                    ? {
                        isActive:
                          input.isActive
                      }
                    : {})
                },
                include:
                  hierarchyUnitInclude
              });

          return {
            existing,
            unit
          };
        }
      );

    await createAuditLog({
      organizationId:
        actor.organizationId,
      userId:
        actor.userId,
      action:
        "HIERARCHY_UNIT_UPDATED",
      entityType:
        "OrganizationalUnit",
      entityId:
        result.unit.id,
      oldValues: {
        unitTypeId:
          result.existing
            .unitTypeId,
        parentId:
          result.existing
            .parentId,
        code:
          result.existing.code,
        name:
          result.existing.name,
        description:
          result.existing
            .description,
        isActive:
          result.existing
            .isActive
      },
      newValues: {
        unitTypeId:
          result.unit.unitTypeId,
        parentId:
          result.unit.parentId,
        code:
          result.unit.code,
        name:
          result.unit.name,
        description:
          result.unit.description,
        isActive:
          result.unit.isActive
      }
    });

    return result.unit;
  } catch (error) {
    translateOrganizationalUnitError(
      error
    );
  }
}

export async function deleteOrganizationalUnit(
  actor: HierarchyActor,
  unitId: string
) {
  await loadAuthorizedHierarchyMembership(
    actor,
    "hierarchy.manage"
  );

  try {
    const existing =
      await prisma.$transaction(
        async (
          tx
        ) => {
          await lockHierarchyMutation(
            tx,
            actor.organizationId
          );

          const unit =
            await loadTransactionUnit(
              tx,
              actor.organizationId,
              unitId
            );

          requireCustomHierarchyUnit(
            unit
          );

          const [
            childCount,
            assignmentCount
          ] =
            await Promise.all([
              tx.organizationalUnit
                .count({
                  where: {
                    organizationId:
                      actor.organizationId,
                    parentId:
                      unit.id
                  }
                }),
              tx
                .organizationalUnitAssignment
                .count({
                  where: {
                    organizationId:
                      actor.organizationId,
                    organizationalUnitId:
                      unit.id
                  }
                })
            ]);

          if (
            childCount >
              0 ||
            assignmentCount >
              0
          ) {
            throw new HierarchyServiceError(
              "HIERARCHY_UNIT_IN_USE",
              "The organizational unit is in use and cannot be deleted."
            );
          }

          await tx
            .organizationalUnit
            .delete({
              where: {
                id:
                  unit.id
              }
            });

          return unit;
        }
      );

    await createAuditLog({
      organizationId:
        actor.organizationId,
      userId:
        actor.userId,
      action:
        "HIERARCHY_UNIT_DELETED",
      entityType:
        "OrganizationalUnit",
      entityId:
        existing.id,
      oldValues: {
        unitTypeId:
          existing.unitTypeId,
        parentId:
          existing.parentId,
        code:
          existing.code,
        name:
          existing.name,
        isActive:
          existing.isActive
      }
    });

    return existing;
  } catch (error) {
    translateOrganizationalUnitError(
      error
    );
  }
}
