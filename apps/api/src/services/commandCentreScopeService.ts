import {
  HealthScopeType
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

export type CommandCentreActor = {
  userId: string;
  organizationId: string;
  organizationUserId: string;
};

export type CommandCentreScope = {
  scopeType: HealthScopeType;
  scopeId: string;
  scopeName: string;
  audience:
    | "EXECUTIVE"
    | "BRANCH"
    | "DEPARTMENT";
};

export type CommandCentreSourceAccess = {
  health: boolean;
  attention: boolean;
  work: boolean;
  requests: boolean;
  sla: boolean;
  workflow: boolean;
};

export class CommandCentreServiceError
  extends Error {
  code: string;

  constructor(
    code: string,
    message: string
  ) {
    super(message);
    this.name =
      "CommandCentreServiceError";
    this.code =
      code;
  }
}

async function loadActorMembership(
  actor: CommandCentreActor
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
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
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
    throw new CommandCentreServiceError(
      "COMMAND_MEMBERSHIP_INVALID",
      "Active organization membership is required."
    );
  }

  const permissions =
    new Set(
      membership.role.rolePermissions.map(
        (rolePermission) =>
          rolePermission.permission.code
      )
    );

  return {
    ...membership,
    permissions,
    isAdministrator:
      membership.role.name ===
        "Administrator" &&
      membership.role.isSystemRole
  };
}

function sourceAccess(
  permissions: Set<string>
): CommandCentreSourceAccess {
  return {
    health:
      permissions.has(
        "health.view"
      ),
    attention:
      permissions.has(
        "attention.view"
      ),
    work:
      permissions.has(
        "work_items.view"
      ),
    requests:
      permissions.has(
        "requests.view"
      ),
    sla:
      permissions.has(
        "sla.view"
      ),
    workflow:
      permissions.has(
        "workflow.view"
      )
  };
}

export async function resolveCommandCentreScope(
  actor: CommandCentreActor,
  requested?: {
    scopeType: HealthScopeType;
    scopeId: string;
  }
) {
  const membership =
    await loadActorMembership(
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
            membership.organization.name,
          audience:
            "EXECUTIVE"
        } satisfies CommandCentreScope,
        sourceAccess:
          sourceAccess(
            membership.permissions
          ),
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
            membership.department.name,
          audience:
            "DEPARTMENT"
        } satisfies CommandCentreScope,
        sourceAccess:
          sourceAccess(
            membership.permissions
          ),
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
            membership.branch.name,
          audience:
            "BRANCH"
        } satisfies CommandCentreScope,
        sourceAccess:
          sourceAccess(
            membership.permissions
          ),
        membership
      };
    }

    throw new CommandCentreServiceError(
      "COMMAND_SCOPE_UNASSIGNED",
      "No supported Command Centre scope is assigned to this membership."
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
      throw new CommandCentreServiceError(
        "COMMAND_SCOPE_NOT_FOUND",
        "Command Centre scope was not found."
      );
    }

    if (
      !membership.isAdministrator
    ) {
      throw new CommandCentreServiceError(
        "COMMAND_SCOPE_FORBIDDEN",
        "Organization Command Centre access is restricted."
      );
    }

    return {
      scope: {
        scopeType:
          HealthScopeType.ORGANIZATION,
        scopeId:
          membership.organization.id,
        scopeName:
          membership.organization.name,
        audience:
          "EXECUTIVE"
      } satisfies CommandCentreScope,
      sourceAccess:
        sourceAccess(
          membership.permissions
        ),
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
          name: true
        }
      });

    if (!branch) {
      throw new CommandCentreServiceError(
        "COMMAND_SCOPE_NOT_FOUND",
        "Command Centre scope was not found."
      );
    }

    if (
      !membership.isAdministrator &&
      membership.branchId !==
        branch.id
    ) {
      throw new CommandCentreServiceError(
        "COMMAND_SCOPE_FORBIDDEN",
        "You do not have access to this Branch Command Centre."
      );
    }

    return {
      scope: {
        scopeType:
          HealthScopeType.BRANCH,
        scopeId:
          branch.id,
        scopeName:
          branch.name,
        audience:
          "BRANCH"
      } satisfies CommandCentreScope,
      sourceAccess:
        sourceAccess(
          membership.permissions
        ),
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
        name: true
      }
    });

  if (!department) {
    throw new CommandCentreServiceError(
      "COMMAND_SCOPE_NOT_FOUND",
      "Command Centre scope was not found."
    );
  }

  if (
    !membership.isAdministrator &&
    membership.departmentId !==
      department.id
  ) {
    throw new CommandCentreServiceError(
      "COMMAND_SCOPE_FORBIDDEN",
      "You do not have access to this Department Command Centre."
    );
  }

  return {
    scope: {
      scopeType:
        HealthScopeType.DEPARTMENT,
      scopeId:
        department.id,
      scopeName:
        department.name,
      audience:
        "DEPARTMENT"
    } satisfies CommandCentreScope,
    sourceAccess:
      sourceAccess(
        membership.permissions
      ),
    membership
  };
}

export function structuralScopeFilter(
  scope: CommandCentreScope
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
