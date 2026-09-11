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
  validateHierarchyLimit
} from "./hierarchyIdentityService.js";

import {
  HierarchyServiceError,
  type CreateOrganizationalUnitTypeInput,
  type HierarchyActor,
  type UpdateOrganizationalUnitTypeInput
} from "./hierarchyTypes.js";

const unitTypeInclude = {
  _count: {
    select: {
      units: true
    }
  }
} satisfies Prisma.OrganizationalUnitTypeInclude;

function translateUnitTypeError(
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
      Prisma.PrismaClientKnownRequestError &&
    error.code ===
      "P2002"
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_UNIT_TYPE_DUPLICATE",
      "An organizational unit type with that code or name already exists."
    );
  }

  throw error;
}

async function loadUnitType(
  organizationId: string,
  unitTypeId: string
) {
  const unitType =
    await prisma
      .organizationalUnitType
      .findFirst({
        where: {
          id:
            unitTypeId,
          organizationId
        },
        include:
          unitTypeInclude
      });

  if (!unitType) {
    throw new HierarchyServiceError(
      "HIERARCHY_UNIT_TYPE_NOT_FOUND",
      "The organizational unit type was not found."
    );
  }

  return unitType;
}

export async function listOrganizationalUnitTypes(
  actor: HierarchyActor,
  input?: {
    active?:
      boolean | undefined;
    limit?:
      number | undefined;
  }
) {
  await loadAuthorizedHierarchyMembership(
    actor,
    "hierarchy.view"
  );

  const limit =
    validateHierarchyLimit(
      input?.limit
    );

  return prisma
    .organizationalUnitType
    .findMany({
      where: {
        organizationId:
          actor.organizationId,
        ...(input?.active !==
        undefined
          ? {
              isActive:
                input.active
            }
          : {})
      },
      include:
        unitTypeInclude,
      orderBy: [
        {
          displayOrder:
            "asc"
        },
        {
          name:
            "asc"
        },
        {
          code:
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

export async function getOrganizationalUnitType(
  actor: HierarchyActor,
  unitTypeId: string
) {
  await loadAuthorizedHierarchyMembership(
    actor,
    "hierarchy.view"
  );

  return loadUnitType(
    actor.organizationId,
    unitTypeId
  );
}

export async function createOrganizationalUnitType(
  actor: HierarchyActor,
  input:
    CreateOrganizationalUnitTypeInput
) {
  await loadAuthorizedHierarchyMembership(
    actor,
    "hierarchy.manage"
  );

  const code =
    normalizeHierarchyCode(
      input.code
    );

  if (
    code ===
      "BRANCH" ||
    code ===
      "DEPARTMENT"
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_COMPATIBILITY_PROTECTED",
      "BRANCH and DEPARTMENT are reserved system-managed unit-type codes."
    );
  }

  const {
    name
  } =
    normalizeHierarchyName(
      input.name
    );

  const description =
    normalizeOptionalText(
      input.description
    );

  try {
    const unitType =
      await prisma
        .organizationalUnitType
        .create({
          data: {
            organizationId:
              actor.organizationId,
            code,
            name,
            ...(description !==
            undefined
              ? {
                  description
                }
              : {}),
            displayOrder:
              input.displayOrder ??
              0,
            isActive:
              input.isActive ??
              true,
            isSystemManaged:
              false
          },
          include:
            unitTypeInclude
        });

    await createAuditLog({
      organizationId:
        actor.organizationId,
      userId:
        actor.userId,
      action:
        "HIERARCHY_UNIT_TYPE_CREATED",
      entityType:
        "OrganizationalUnitType",
      entityId:
        unitType.id,
      newValues: {
        code:
          unitType.code,
        name:
          unitType.name,
        displayOrder:
          unitType.displayOrder,
        isActive:
          unitType.isActive
      }
    });

    return unitType;
  } catch (error) {
    translateUnitTypeError(
      error
    );
  }
}

export async function updateOrganizationalUnitType(
  actor: HierarchyActor,
  unitTypeId: string,
  input:
    UpdateOrganizationalUnitTypeInput
) {
  await loadAuthorizedHierarchyMembership(
    actor,
    "hierarchy.manage"
  );

  const existing =
    await loadUnitType(
      actor.organizationId,
      unitTypeId
    );

  if (
    existing.isSystemManaged &&
    (
      input.name !==
        undefined ||
      input.isActive ===
        false
    )
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_COMPATIBILITY_PROTECTED",
      "System-managed organizational unit types cannot be renamed or deactivated."
    );
  }

  const normalizedName =
    input.name !==
      undefined
      ? normalizeHierarchyName(
          input.name
        ).name
      : undefined;

  const description =
    normalizeOptionalText(
      input.description
    );

  try {
    const unitType =
      await prisma
        .organizationalUnitType
        .update({
          where: {
            id:
              existing.id
          },
          data: {
            ...(normalizedName !==
            undefined
              ? {
                  name:
                    normalizedName
                }
              : {}),
            ...(description !==
            undefined
              ? {
                  description
                }
              : {}),
            ...(input.displayOrder !==
            undefined
              ? {
                  displayOrder:
                    input.displayOrder
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
            unitTypeInclude
        });

    await createAuditLog({
      organizationId:
        actor.organizationId,
      userId:
        actor.userId,
      action:
        "HIERARCHY_UNIT_TYPE_UPDATED",
      entityType:
        "OrganizationalUnitType",
      entityId:
        unitType.id,
      oldValues: {
        name:
          existing.name,
        description:
          existing.description,
        displayOrder:
          existing.displayOrder,
        isActive:
          existing.isActive
      },
      newValues: {
        name:
          unitType.name,
        description:
          unitType.description,
        displayOrder:
          unitType.displayOrder,
        isActive:
          unitType.isActive
      }
    });

    return unitType;
  } catch (error) {
    translateUnitTypeError(
      error
    );
  }
}

export async function deleteOrganizationalUnitType(
  actor: HierarchyActor,
  unitTypeId: string
) {
  await loadAuthorizedHierarchyMembership(
    actor,
    "hierarchy.manage"
  );

  const existing =
    await loadUnitType(
      actor.organizationId,
      unitTypeId
    );

  if (
    existing.isSystemManaged
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_COMPATIBILITY_PROTECTED",
      "System-managed organizational unit types cannot be deleted."
    );
  }

  if (
    existing._count.units >
      0
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_UNIT_TYPE_IN_USE",
      "The organizational unit type is in use and cannot be deleted."
    );
  }

  await prisma
    .organizationalUnitType
    .delete({
      where: {
        id:
          existing.id
      }
    });

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "HIERARCHY_UNIT_TYPE_DELETED",
    entityType:
      "OrganizationalUnitType",
    entityId:
      existing.id,
    oldValues: {
      code:
        existing.code,
      name:
        existing.name,
      displayOrder:
        existing.displayOrder,
      isActive:
        existing.isActive
    }
  });

  return existing;
}
