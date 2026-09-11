import {
  prisma
} from "../../../../packages/database/index.js";

import {
  HierarchyServiceError,
  type HierarchyActor,
  type HierarchyMembership
} from "./hierarchyTypes.js";

import {
  assignmentIsEffective
} from "./hierarchyIdentityService.js";

export type HierarchyPermissionCode =
  | "hierarchy.view"
  | "hierarchy.manage"
  | "hierarchy.assign"
  | "hierarchy.reconcile";

export async function loadHierarchyMembership(
  actor: HierarchyActor
): Promise<HierarchyMembership> {
  const membership =
    await prisma.organizationUser.findFirst({
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
        id: true,
        organizationId: true,
        userId: true,
        branchId: true,
        departmentId: true,
        role: {
          select: {
            name: true,
            isSystemRole: true,
            rolePermissions: {
              select: {
                permission: {
                  select: {
                    code: true
                  }
                }
              }
            }
          }
        }
      }
    });

  if (!membership) {
    throw new HierarchyServiceError(
      "HIERARCHY_MEMBERSHIP_REQUIRED",
      "An active organization membership is required."
    );
  }

  return {
    id:
      membership.id,
    organizationId:
      membership.organizationId,
    userId:
      membership.userId,
    branchId:
      membership.branchId,
    departmentId:
      membership.departmentId,
    isAdministrator:
      membership.role
        .isSystemRole &&
      membership.role.name ===
        "Administrator",
    permissions:
      new Set(
        membership.role
          .rolePermissions
          .map(
            (rolePermission) =>
              rolePermission
                .permission
                .code
          )
      )
  };
}

export function membershipHasHierarchyPermission(
  membership:
    HierarchyMembership,
  permission:
    HierarchyPermissionCode
) {
  return membership
    .permissions
    .has(
      permission
    );
}

export function requireHierarchyPermission(
  membership:
    HierarchyMembership,
  permission:
    HierarchyPermissionCode
) {
  if (
    !membershipHasHierarchyPermission(
      membership,
      permission
    )
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_FORBIDDEN",
      "You are not authorized to perform this hierarchy operation."
    );
  }
}

export async function loadAuthorizedHierarchyMembership(
  actor:
    HierarchyActor,
  permission:
    HierarchyPermissionCode
) {
  const membership =
    await loadHierarchyMembership(
      actor
    );

  requireHierarchyPermission(
    membership,
    permission
  );

  return membership;
}

export async function loadEffectiveHierarchyAssignments(
  actor:
    HierarchyActor,
  organizationUserId:
    string,
  at =
    new Date()
) {
  const assignments =
    await prisma
      .organizationalUnitAssignment
      .findMany({
        where: {
          organizationId:
            actor.organizationId,
          organizationUserId,
          isActive:
            true,
          AND: [
            {
              OR: [
                {
                  effectiveStart:
                    null
                },
                {
                  effectiveStart: {
                    lte:
                      at
                  }
                }
              ]
            },
            {
              OR: [
                {
                  effectiveEnd:
                    null
                },
                {
                  effectiveEnd: {
                    gte:
                      at
                  }
                }
              ]
            }
          ]
        },
        include: {
          organizationalUnit: {
            include: {
              unitType: true
            }
          }
        },
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
        ]
      });

  return assignments.filter(
    (assignment) =>
      assignmentIsEffective(
        assignment,
        at
      )
  );
}

export function assignmentProvidesDescendantAccess(
  assignment: {
    assignmentRole:
      "MEMBER" |
      "MANAGER" |
      "OWNER" |
      "RESPONSIBLE";
  }
) {
  return (
    assignment.assignmentRole ===
      "MANAGER" ||
    assignment.assignmentRole ===
      "OWNER" ||
    assignment.assignmentRole ===
      "RESPONSIBLE"
  );
}
