import {
  HealthScopeType
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

export type KpiActor = {
  userId: string;
  organizationId: string;
  organizationUserId: string;
};

export type KpiScope = {
  scopeType: HealthScopeType;
  scopeId: string;
  scopeName: string;
};

export class KpiServiceError
  extends Error {
  code: string;

  constructor(
    code: string,
    message: string
  ) {
    super(message);
    this.name =
      "KpiServiceError";
    this.code =
      code;
  }
}

export async function loadKpiMembership(
  actor: KpiActor
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
        userId: true,
        organizationId: true,
        branchId: true,
        departmentId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        },
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
    throw new KpiServiceError(
      "KPI_MEMBERSHIP_INVALID",
      "Active organization membership is required."
    );
  }

  return {
    ...membership,
    permissions:
      new Set(
        membership.role
          .rolePermissions
          .map(
            (rolePermission) =>
              rolePermission
                .permission.code
          )
      ),
    isAdministrator:
      membership.role.name ===
        "Administrator" &&
      membership.role.isSystemRole
  };
}

export async function resolveKpiScope(
  actor: KpiActor,
  requested?: {
    scopeType: HealthScopeType;
    scopeId: string;
  }
) {
  const membership =
    await loadKpiMembership(
      actor
    );

  if (!requested) {
    if (
      membership.isAdministrator
    ) {
      return {
        scope: {
          scopeType:
            HealthScopeType.ORGANIZATION,
          scopeId:
            membership.organization.id,
          scopeName:
            membership.organization.name
        } satisfies KpiScope,
        membership
      };
    }

    if (
      membership.departmentId &&
      membership.department
    ) {
      return {
        scope: {
          scopeType:
            HealthScopeType.DEPARTMENT,
          scopeId:
            membership.department.id,
          scopeName:
            membership.department.name
        } satisfies KpiScope,
        membership
      };
    }

    if (
      membership.branchId &&
      membership.branch
    ) {
      return {
        scope: {
          scopeType:
            HealthScopeType.BRANCH,
          scopeId:
            membership.branch.id,
          scopeName:
            membership.branch.name
        } satisfies KpiScope,
        membership
      };
    }

    throw new KpiServiceError(
      "KPI_SCOPE_UNASSIGNED",
      "No supported KPI scope is assigned to this membership."
    );
  }

  if (
    requested.scopeType ===
    HealthScopeType.ORGANIZATION
  ) {
    if (
      requested.scopeId !==
        actor.organizationId
    ) {
      throw new KpiServiceError(
        "KPI_SCOPE_NOT_FOUND",
        "KPI scope was not found."
      );
    }

    if (
      !membership.isAdministrator
    ) {
      throw new KpiServiceError(
        "KPI_SCOPE_FORBIDDEN",
        "Organization KPI access is restricted."
      );
    }

    return {
      scope: {
        scopeType:
          HealthScopeType.ORGANIZATION,
        scopeId:
          membership.organization.id,
        scopeName:
          membership.organization.name
      } satisfies KpiScope,
      membership
    };
  }

  if (
    requested.scopeType ===
    HealthScopeType.BRANCH
  ) {
    const branch =
      await prisma.branch.findFirst({
        where: {
          id:
            requested.scopeId,
          organizationId:
            actor.organizationId
        },
        select: {
          id: true,
          name: true,
          isActive: true
        }
      });

    if (!branch) {
      throw new KpiServiceError(
        "KPI_SCOPE_NOT_FOUND",
        "KPI scope was not found."
      );
    }

    if (
      !membership.isAdministrator &&
      membership.branchId !==
        branch.id
    ) {
      throw new KpiServiceError(
        "KPI_SCOPE_FORBIDDEN",
        "You do not have access to this Branch KPI scope."
      );
    }

    return {
      scope: {
        scopeType:
          HealthScopeType.BRANCH,
        scopeId:
          branch.id,
        scopeName:
          branch.name
      } satisfies KpiScope,
      membership
    };
  }

  const department =
    await prisma.department.findFirst({
      where: {
        id:
          requested.scopeId,
        organizationId:
          actor.organizationId
      },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });

  if (!department) {
    throw new KpiServiceError(
      "KPI_SCOPE_NOT_FOUND",
      "KPI scope was not found."
    );
  }

  if (
    !membership.isAdministrator &&
    membership.departmentId !==
      department.id
  ) {
    throw new KpiServiceError(
      "KPI_SCOPE_FORBIDDEN",
      "You do not have access to this Department KPI scope."
    );
  }

  return {
    scope: {
      scopeType:
        HealthScopeType.DEPARTMENT,
      scopeId:
        department.id,
      scopeName:
        department.name
    } satisfies KpiScope,
    membership
  };
}

export async function requireActiveKpiScope(
  actor: KpiActor,
  requested: {
    scopeType: HealthScopeType;
    scopeId: string;
  }
) {
  const resolved =
    await resolveKpiScope(
      actor,
      requested
    );

  if (
    resolved.scope.scopeType ===
      HealthScopeType.BRANCH &&
    resolved.membership
      .isAdministrator
  ) {
    const branch =
      await prisma.branch.findFirst({
        where: {
          id:
            resolved.scope.scopeId,
          organizationId:
            actor.organizationId,
          isActive: true
        },
        select: {
          id: true
        }
      });

    if (!branch) {
      throw new KpiServiceError(
        "KPI_SCOPE_INACTIVE",
        "An active KPI scope is required."
      );
    }
  }

  if (
    resolved.scope.scopeType ===
      HealthScopeType.DEPARTMENT
  ) {
    const department =
      await prisma.department.findFirst({
        where: {
          id:
            resolved.scope.scopeId,
          organizationId:
            actor.organizationId,
          isActive: true
        },
        select: {
          id: true
        }
      });

    if (!department) {
      throw new KpiServiceError(
        "KPI_SCOPE_INACTIVE",
        "An active KPI scope is required."
      );
    }
  }

  return resolved;
}

export function kpiStructuralScopeFilter(
  scope: KpiScope
): {
  branchId?: string;
  departmentId?: string;
} {
  if (
    scope.scopeType ===
    HealthScopeType.BRANCH
  ) {
    return {
      branchId:
        scope.scopeId
    };
  }

  if (
    scope.scopeType ===
    HealthScopeType.DEPARTMENT
  ) {
    return {
      departmentId:
        scope.scopeId
    };
  }

  return {};
}

export function kpiDefinitionScopeData(
  scope: KpiScope
): {
  scopeType: HealthScopeType;
  branchId?: string;
  departmentId?: string;
} {
  return {
    scopeType:
      scope.scopeType,
    ...kpiStructuralScopeFilter(
      scope
    )
  };
}

export function kpiScopeId(
  organizationId: string,
  record: {
    scopeType: HealthScopeType;
    branchId: string | null;
    departmentId: string | null;
  }
) {
  if (
    record.scopeType ===
    HealthScopeType.BRANCH
  ) {
    return record.branchId;
  }

  if (
    record.scopeType ===
    HealthScopeType.DEPARTMENT
  ) {
    return record.departmentId;
  }

  return organizationId;
}
