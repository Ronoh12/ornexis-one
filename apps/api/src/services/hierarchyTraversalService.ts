import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  assignmentProvidesDescendantAccess,
  loadEffectiveHierarchyAssignments
} from "./hierarchyAuthorizationService.js";

import {
  validateHierarchyDepth,
  validateHierarchyLimit
} from "./hierarchyIdentityService.js";

import {
  HIERARCHY_MAX_DEPTH,
  HierarchyServiceError,
  type HierarchyActor,
  type HierarchyMembership,
  type HierarchyTraversalInput
} from "./hierarchyTypes.js";

export const hierarchyUnitInclude = {
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
} satisfies Prisma.OrganizationalUnitInclude;

export type HierarchyUnitRecord =
  Prisma.OrganizationalUnitGetPayload<{
    include:
      typeof hierarchyUnitInclude;
  }>;

const hierarchyUnitOrder =
  [
    {
      unitType: {
        displayOrder:
          "asc"
      }
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
  ] satisfies
    Prisma.OrganizationalUnitOrderByWithRelationInput[];

export async function loadHierarchyUnitRecord(
  organizationId: string,
  unitId: string
) {
  const unit =
    await prisma
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

export async function loadHierarchyAncestorsInternal(
  organizationId: string,
  unit:
    Pick<
      HierarchyUnitRecord,
      "id" |
      "parentId"
    >
) {
  const ancestors:
    HierarchyUnitRecord[] =
      [];

  const visited =
    new Set<string>([
      unit.id
    ]);

  let parentId =
    unit.parentId;

  while (parentId) {
    if (
      visited.has(
        parentId
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
        `The organizational hierarchy exceeds ${HIERARCHY_MAX_DEPTH} levels.`
      );
    }

    visited.add(
      parentId
    );

    const parent =
      await loadHierarchyUnitRecord(
        organizationId,
        parentId
      );

    ancestors.push(
      parent
    );

    parentId =
      parent.parentId;
  }

  return ancestors.reverse();
}

export async function hierarchyUnitIsDescendantOf(
  organizationId: string,
  candidateUnit:
    Pick<
      HierarchyUnitRecord,
      "id" |
      "parentId"
    >,
  ancestorUnitId: string
) {
  if (
    candidateUnit.id ===
      ancestorUnitId
  ) {
    return false;
  }

  const ancestors =
    await loadHierarchyAncestorsInternal(
      organizationId,
      candidateUnit
    );

  return ancestors.some(
    (ancestor) =>
      ancestor.id ===
        ancestorUnitId
  );
}

export async function assertHierarchyUnitVisible(
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

  if (
    assignments.some(
      (assignment) =>
        assignment
          .organizationalUnitId ===
        unit.id
    )
  ) {
    return;
  }

  for (
    const assignment
    of assignments
  ) {
    const assignedAncestors =
      await loadHierarchyAncestorsInternal(
        actor.organizationId,
        assignment
          .organizationalUnit
      );

    if (
      assignedAncestors.some(
        (ancestor) =>
          ancestor.id ===
            unit.id
      )
    ) {
      return;
    }
  }

  const unitAncestors =
    await loadHierarchyAncestorsInternal(
      actor.organizationId,
      unit
    );

  for (
    const assignment
    of assignments
  ) {
    if (
      assignmentProvidesDescendantAccess(
        assignment
      ) &&
      unitAncestors.some(
        (ancestor) =>
          ancestor.id ===
            assignment
              .organizationalUnitId
      )
    ) {
      return;
    }
  }

  throw new HierarchyServiceError(
    "HIERARCHY_UNIT_NOT_FOUND",
    "The organizational unit was not found."
  );
}

export async function loadAuthorizedHierarchyUnit(
  actor:
    HierarchyActor,
  membership:
    HierarchyMembership,
  unitId: string
) {
  const unit =
    await loadHierarchyUnitRecord(
      actor.organizationId,
      unitId
    );

  await assertHierarchyUnitVisible(
    actor,
    membership,
    unit
  );

  return unit;
}

export async function loadHierarchyAncestors(
  actor:
    HierarchyActor,
  membership:
    HierarchyMembership,
  unitId: string
) {
  const unit =
    await loadAuthorizedHierarchyUnit(
      actor,
      membership,
      unitId
    );

  const ancestors =
    await loadHierarchyAncestorsInternal(
      actor.organizationId,
      unit
    );

  const visible:
    Array<{
      unit:
        HierarchyUnitRecord;
      depth:
        number;
    }> =
      [];

  for (
    let index = 0;
    index <
      ancestors.length;
    index += 1
  ) {
    const ancestor =
      ancestors[index];

    if (!ancestor) {
      continue;
    }

    try {
      await assertHierarchyUnitVisible(
        actor,
        membership,
        ancestor
      );

      visible.push({
        unit:
          ancestor,
        depth:
          index
      });
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

export async function loadHierarchyDescendants(
  actor:
    HierarchyActor,
  membership:
    HierarchyMembership,
  unitId: string,
  input?:
    HierarchyTraversalInput
) {
  const root =
    await loadAuthorizedHierarchyUnit(
      actor,
      membership,
      unitId
    );

  const maxDepth =
    validateHierarchyDepth(
      input?.maxDepth
    );

  const limit =
    validateHierarchyLimit(
      input?.limit,
      200
    );

  const descendants:
    Array<{
      unit:
        HierarchyUnitRecord;
      depth:
        number;
    }> =
      [];

  const visited =
    new Set<string>([
      root.id
    ]);

  async function visit(
    parentId: string,
    depth: number
  ) {
    if (
      depth >
        maxDepth ||
      descendants.length >=
        limit
    ) {
      return;
    }

    const children =
      await prisma
        .organizationalUnit
        .findMany({
          where: {
            organizationId:
              actor.organizationId,
            parentId
          },
          include:
            hierarchyUnitInclude,
          orderBy:
            hierarchyUnitOrder
        });

    for (
      const child
      of children
    ) {
      if (
        descendants.length >=
          limit
      ) {
        return;
      }

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

      try {
        await assertHierarchyUnitVisible(
          actor,
          membership,
          child
        );

        descendants.push({
          unit:
            child,
          depth
        });
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

      await visit(
        child.id,
        depth + 1
      );
    }
  }

  await visit(
    root.id,
    1
  );

  return descendants;
}

export async function calculateHierarchyDepth(
  organizationId: string,
  unit:
    Pick<
      HierarchyUnitRecord,
      "id" |
      "parentId"
    >
) {
  const ancestors =
    await loadHierarchyAncestorsInternal(
      organizationId,
      unit
    );

  return ancestors.length;
}

export {
  hierarchyUnitOrder
};
