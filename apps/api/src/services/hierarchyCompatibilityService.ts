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
  normalizeHierarchyName
} from "./hierarchyIdentityService.js";

import {
  lockHierarchyMutation
} from "./organizationalUnitService.js";

import {
  HierarchyServiceError,
  type HierarchyActor
} from "./hierarchyTypes.js";

type ReconciliationCounts = {
  typesCreated: number;
  typesUpdated: number;
  typesExisting: number;
  unitsCreated: number;
  unitsUpdated: number;
  unitsExisting: number;
  skipped: number;
  failed: number;
  failures:
    Array<{
      sourceType:
        "BRANCH" |
        "DEPARTMENT";
      sourceId: string;
      message: string;
    }>;
};

function compatibilityCode(
  sourceCode:
    string |
    null,
  sourceType:
    "BRANCH" |
    "DEPARTMENT",
  sourceId: string
) {
  if (
    sourceCode &&
    sourceCode.trim()
  ) {
    try {
      return normalizeHierarchyCode(
        sourceCode
      );
    } catch {
      const safe =
        sourceCode
          .trim()
          .toUpperCase()
          .replace(
            /[^A-Z0-9_-]+/g,
            "_"
          )
          .replace(
            /^[_-]+|[_-]+$/g,
            ""
          )
          .slice(
            0,
            48
          );

      if (safe) {
        return `${safe}_${
          sourceId
            .replaceAll("-", "")
            .slice(0, 8)
        }`;
      }
    }
  }

  return `${
    sourceType
  }_${
    sourceId.replaceAll(
      "-",
      ""
    )
  }`;
}

async function reconcileSystemType(
  tx:
    Prisma.TransactionClient,
  organizationId: string,
  input: {
    code:
      "BRANCH" |
      "DEPARTMENT";
    name: string;
    displayOrder: number;
  },
  counts:
    ReconciliationCounts
) {
  const existing =
    await tx
      .organizationalUnitType
      .findFirst({
        where: {
          organizationId,
          code:
            input.code
        }
      });

  if (!existing) {
    counts.typesCreated +=
      1;

    return tx
      .organizationalUnitType
      .create({
        data: {
          organizationId,
          code:
            input.code,
          name:
            input.name,
          description:
            `System-managed compatibility type for legacy ${input.name} records.`,
          displayOrder:
            input.displayOrder,
          isActive:
            true,
          isSystemManaged:
            true
        }
      });
  }

  if (
    !existing.isSystemManaged
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_COMPATIBILITY_PROTECTED",
      `The reserved ${input.code} unit-type code is already used by a custom type.`
    );
  }

  const changed =
    existing.name !==
      input.name ||
    existing.displayOrder !==
      input.displayOrder ||
    !existing.isActive;

  if (!changed) {
    counts.typesExisting +=
      1;

    return existing;
  }

  counts.typesUpdated +=
    1;

  return tx
    .organizationalUnitType
    .update({
      where: {
        id:
          existing.id
      },
      data: {
        name:
          input.name,
        displayOrder:
          input.displayOrder,
        isActive:
          true,
        isSystemManaged:
          true
      }
    });
}

async function reconcileBranchUnits(
  tx:
    Prisma.TransactionClient,
  organizationId: string,
  branchTypeId: string,
  counts:
    ReconciliationCounts
) {
  const branches =
    await tx.branch.findMany({
      where: {
        organizationId
      },
      orderBy: [
        {
          name:
            "asc"
        },
        {
          id:
            "asc"
        }
      ]
    });

  for (
    const branch
    of branches
  ) {
    try {
      const {
        name,
        normalizedName
      } =
        normalizeHierarchyName(
          branch.name
        );

      const code =
        compatibilityCode(
          branch.code,
          "BRANCH",
          branch.id
        );

      const existing =
        await tx
          .organizationalUnit
          .findFirst({
            where: {
              organizationId,
              legacyBranchId:
                branch.id
            }
          });

      if (!existing) {
        await tx
          .organizationalUnit
          .create({
            data: {
              organizationId,
              unitTypeId:
                branchTypeId,
              parentId:
                null,
              code,
              name,
              normalizedName,
              description:
                branch.description,
              isActive:
                branch.isActive,
              legacyBranchId:
                branch.id,
              legacyDepartmentId:
                null
            }
          });

        counts.unitsCreated +=
          1;

        continue;
      }

      const changed =
        existing.unitTypeId !==
          branchTypeId ||
        existing.code !==
          code ||
        existing.name !==
          name ||
        existing.normalizedName !==
          normalizedName ||
        existing.description !==
          branch.description ||
        existing.isActive !==
          branch.isActive ||
        existing
          .legacyDepartmentId !==
          null;

      if (!changed) {
        counts.unitsExisting +=
          1;

        continue;
      }

      await tx
        .organizationalUnit
        .update({
          where: {
            id:
              existing.id
          },
          data: {
            unitTypeId:
              branchTypeId,
            code,
            name,
            normalizedName,
            description:
              branch.description,
            isActive:
              branch.isActive,
            legacyDepartmentId:
              null
          }
        });

      counts.unitsUpdated +=
        1;
    } catch (
      error
    ) {
      counts.failed +=
        1;

      counts.failures.push({
        sourceType:
          "BRANCH",
        sourceId:
          branch.id,
        message:
          error instanceof Error
            ? error.message
            : "Branch compatibility reconciliation failed."
      });
    }
  }
}

async function reconcileDepartmentUnits(
  tx:
    Prisma.TransactionClient,
  organizationId: string,
  departmentTypeId: string,
  counts:
    ReconciliationCounts
) {
  const departments =
    await tx.department.findMany({
      where: {
        organizationId
      },
      orderBy: [
        {
          name:
            "asc"
        },
        {
          id:
            "asc"
        }
      ]
    });

  for (
    const department
    of departments
  ) {
    try {
      const {
        name,
        normalizedName
      } =
        normalizeHierarchyName(
          department.name
        );

      const code =
        compatibilityCode(
          department.code,
          "DEPARTMENT",
          department.id
        );

      const parent =
        department.branchId
          ? await tx
              .organizationalUnit
              .findFirst({
                where: {
                  organizationId,
                  legacyBranchId:
                    department
                      .branchId
                },
                select: {
                  id: true
                }
              })
          : null;

      if (
        department.branchId &&
        !parent
      ) {
        counts.skipped +=
          1;

        counts.failures.push({
          sourceType:
            "DEPARTMENT",
          sourceId:
            department.id,
          message:
            "The linked Branch compatibility unit was not available."
        });

        continue;
      }

      const existing =
        await tx
          .organizationalUnit
          .findFirst({
            where: {
              organizationId,
              legacyDepartmentId:
                department.id
            }
          });

      if (!existing) {
        await tx
          .organizationalUnit
          .create({
            data: {
              organizationId,
              unitTypeId:
                departmentTypeId,
              parentId:
                parent?.id ??
                null,
              code,
              name,
              normalizedName,
              description:
                department.description,
              isActive:
                department.isActive,
              legacyBranchId:
                null,
              legacyDepartmentId:
                department.id
            }
          });

        counts.unitsCreated +=
          1;

        continue;
      }

      const targetParentId =
        parent?.id ??
        null;

      const changed =
        existing.unitTypeId !==
          departmentTypeId ||
        existing.parentId !==
          targetParentId ||
        existing.code !==
          code ||
        existing.name !==
          name ||
        existing.normalizedName !==
          normalizedName ||
        existing.description !==
          department.description ||
        existing.isActive !==
          department.isActive ||
        existing.legacyBranchId !==
          null;

      if (!changed) {
        counts.unitsExisting +=
          1;

        continue;
      }

      await tx
        .organizationalUnit
        .update({
          where: {
            id:
              existing.id
          },
          data: {
            unitTypeId:
              departmentTypeId,
            parentId:
              targetParentId,
            code,
            name,
            normalizedName,
            description:
              department.description,
            isActive:
              department.isActive,
            legacyBranchId:
              null
          }
        });

      counts.unitsUpdated +=
        1;
    } catch (
      error
    ) {
      counts.failed +=
        1;

      counts.failures.push({
        sourceType:
          "DEPARTMENT",
        sourceId:
          department.id,
        message:
          error instanceof Error
            ? error.message
            : "Department compatibility reconciliation failed."
      });
    }
  }
}

export async function reconcileOrganizationalHierarchy(
  actor: HierarchyActor
) {
  await loadAuthorizedHierarchyMembership(
    actor,
    "hierarchy.reconcile"
  );

  const counts:
    ReconciliationCounts =
      {
        typesCreated: 0,
        typesUpdated: 0,
        typesExisting: 0,
        unitsCreated: 0,
        unitsUpdated: 0,
        unitsExisting: 0,
        skipped: 0,
        failed: 0,
        failures: []
      };

  await prisma.$transaction(
    async (
      tx
    ) => {
      await lockHierarchyMutation(
        tx,
        actor.organizationId
      );

      const branchType =
        await reconcileSystemType(
          tx,
          actor.organizationId,
          {
            code:
              "BRANCH",
            name:
              "Branch",
            displayOrder:
              100
          },
          counts
        );

      const departmentType =
        await reconcileSystemType(
          tx,
          actor.organizationId,
          {
            code:
              "DEPARTMENT",
            name:
              "Department",
            displayOrder:
              200
          },
          counts
        );

      await reconcileBranchUnits(
        tx,
        actor.organizationId,
        branchType.id,
        counts
      );

      await reconcileDepartmentUnits(
        tx,
        actor.organizationId,
        departmentType.id,
        counts
      );
    }
  );

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "HIERARCHY_COMPATIBILITY_RECONCILED",
    entityType:
      "Organization",
    entityId:
      actor.organizationId,
    newValues: {
      typesCreated:
        counts.typesCreated,
      typesUpdated:
        counts.typesUpdated,
      typesExisting:
        counts.typesExisting,
      unitsCreated:
        counts.unitsCreated,
      unitsUpdated:
        counts.unitsUpdated,
      unitsExisting:
        counts.unitsExisting,
      skipped:
        counts.skipped,
      failed:
        counts.failed
    }
  });

  return counts;
}
