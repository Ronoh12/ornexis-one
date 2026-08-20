import { prisma } from "../../../../packages/database/index.js";

export type CreateOrganizationUserInput = {
  organizationId: string;
  userId: string;
  roleId: string;
  branchId?: string | null;
  departmentId?: string | null;
  status?: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
  invitedBy?: string;
};

export type UpdateOrganizationUserInput = {
  roleId?: string;
  branchId?: string | null;
  departmentId?: string | null;
  status?: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
};

const organizationUserInclude = {
  organization: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  },
  role: true,
  branch: true,
  department: {
    include: {
      branch: true
    }
  }
} as const;

async function validateStructureAssignment(
  organizationId: string,
  branchId: string | null | undefined,
  departmentId: string | null | undefined
) {
  let branch:
    | Awaited<
        ReturnType<
          typeof prisma.branch.findFirst
        >
      >
    | null = null;

  let department:
    | Awaited<
        ReturnType<
          typeof prisma.department.findFirst
        >
      >
    | null = null;

  if (
    branchId !== undefined &&
    branchId !== null
  ) {
    branch =
      await prisma.branch.findFirst({
        where: {
          id: branchId,
          organizationId
        }
      });

    if (!branch) {
      return {
        success: false as const,
        reason:
          "INVALID_BRANCH" as const
      };
    }
  }

  if (
    departmentId !== undefined &&
    departmentId !== null
  ) {
    department =
      await prisma.department.findFirst({
        where: {
          id: departmentId,
          organizationId
        }
      });

    if (!department) {
      return {
        success: false as const,
        reason:
          "INVALID_DEPARTMENT" as const
      };
    }
  }

  if (
    branch !== null &&
    department !== null &&
    department.branchId !== null &&
    department.branchId !== branch.id
  ) {
    return {
      success: false as const,
      reason:
        "BRANCH_DEPARTMENT_MISMATCH" as const
    };
  }

  return {
    success: true as const
  };
}

export async function getOrganizationUsers(
  organizationId: string
) {
  return prisma.organizationUser.findMany({
    where: {
      organizationId
    },
    include:
      organizationUserInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getOrganizationUserById(
  id: string,
  organizationId: string
) {
  return prisma.organizationUser.findFirst({
    where: {
      id,
      organizationId
    },
    include:
      organizationUserInclude
  });
}

export async function createOrganizationUser(
  data: CreateOrganizationUserInput
) {
  const role =
    await prisma.role.findFirst({
      where: {
        id: data.roleId,
        organizationId:
          data.organizationId
      }
    });

  if (!role) {
    return {
      success: false as const,
      reason: "INVALID_ROLE" as const
    };
  }

  const structureValidation =
    await validateStructureAssignment(
      data.organizationId,
      data.branchId,
      data.departmentId
    );

  if (!structureValidation.success) {
    return structureValidation;
  }

  const membership =
    await prisma.organizationUser.create({
      data: {
        organizationId:
          data.organizationId,
        userId:
          data.userId,
        roleId:
          data.roleId,
        ...(data.branchId !== undefined
          ? {
              branchId:
                data.branchId
            }
          : {}),
        ...(data.departmentId !== undefined
          ? {
              departmentId:
                data.departmentId
            }
          : {}),
        status:
          data.status ?? "ACTIVE",
        joinedAt:
          data.status === "INVITED"
            ? null
            : new Date(),
        ...(data.invitedBy !== undefined
          ? {
              invitedBy:
                data.invitedBy
            }
          : {})
      },
      include:
        organizationUserInclude
    });

  return {
    success: true as const,
    data: membership
  };
}

async function countActiveAdministrators(
  organizationId: string
) {
  return prisma.organizationUser.count({
    where: {
      organizationId,
      status: "ACTIVE",
      role: {
        name: "Administrator",
        isSystemRole: true
      }
    }
  });
}

export async function updateOrganizationUser(
  id: string,
  organizationId: string,
  data: UpdateOrganizationUserInput
) {
  const existingMembership =
    await prisma.organizationUser.findFirst({
      where: {
        id,
        organizationId
      }
    });

  if (!existingMembership) {
    return {
      success: false as const,
      reason: "NOT_FOUND" as const
    };
  }

  const existingRole =
    await prisma.role.findFirst({
      where: {
        id:
          existingMembership.roleId,
        organizationId
      }
    });

  const isCurrentAdministrator =
    existingRole?.name === "Administrator" &&
    existingRole.isSystemRole === true;

  const isLeavingAdministratorRole =
    data.roleId !== undefined &&
    data.roleId !==
      existingMembership.roleId;

  const isBecomingInactive =
    data.status !== undefined &&
    data.status !== "ACTIVE";

  if (
    isCurrentAdministrator &&
    (
      isLeavingAdministratorRole ||
      isBecomingInactive
    )
  ) {
    const activeAdministratorCount =
      await countActiveAdministrators(
        organizationId
      );

    if (
      activeAdministratorCount <= 1
    ) {
      return {
        success: false as const,
        reason:
          "LAST_ACTIVE_ADMINISTRATOR" as const
      };
    }
  }

  if (data.roleId !== undefined) {
    const role =
      await prisma.role.findFirst({
        where: {
          id: data.roleId,
          organizationId
        }
      });

    if (!role) {
      return {
        success: false as const,
        reason: "INVALID_ROLE" as const
      };
    }
  }

  const targetBranchId =
    data.branchId !== undefined
      ? data.branchId
      : existingMembership.branchId;

  const targetDepartmentId =
    data.departmentId !== undefined
      ? data.departmentId
      : existingMembership.departmentId;

  const structureValidation =
    await validateStructureAssignment(
      organizationId,
      targetBranchId,
      targetDepartmentId
    );

  if (!structureValidation.success) {
    return structureValidation;
  }

  const membership =
    await prisma.organizationUser.update({
      where: {
        id
      },
      data: {
        ...(data.roleId !== undefined
          ? {
              roleId:
                data.roleId
            }
          : {}),

        ...(data.branchId !== undefined
          ? {
              branchId:
                data.branchId
            }
          : {}),

        ...(data.departmentId !== undefined
          ? {
              departmentId:
                data.departmentId
            }
          : {}),

        ...(data.status !== undefined
          ? {
              status:
                data.status,

              ...(data.status === "ACTIVE" &&
              existingMembership.joinedAt === null
                ? {
                    joinedAt:
                      new Date()
                  }
                : {})
            }
          : {})
      },
      include:
        organizationUserInclude
    });

  return {
    success: true as const,
    data: membership
  };
}

export async function removeOrganizationUser(
  id: string,
  organizationId: string
) {
  const existingMembership =
    await prisma.organizationUser.findFirst({
      where: {
        id,
        organizationId
      }
    });

  if (!existingMembership) {
    return {
      success: false as const,
      reason: "NOT_FOUND" as const
    };
  }

  if (
    existingMembership.status ===
    "REMOVED"
  ) {
    return {
      success: false as const,
      reason:
        "ALREADY_REMOVED" as const
    };
  }

  const existingRole =
    await prisma.role.findFirst({
      where: {
        id:
          existingMembership.roleId,
        organizationId
      }
    });

  const isCurrentAdministrator =
    existingRole?.name === "Administrator" &&
    existingRole.isSystemRole === true;

  if (isCurrentAdministrator) {
    const activeAdministratorCount =
      await countActiveAdministrators(
        organizationId
      );

    if (
      existingMembership.status === "ACTIVE" &&
      activeAdministratorCount <= 1
    ) {
      return {
        success: false as const,
        reason:
          "LAST_ACTIVE_ADMINISTRATOR" as const
      };
    }
  }

  const membership =
    await prisma.organizationUser.update({
      where: {
        id
      },
      data: {
        status: "REMOVED"
      },
      include:
        organizationUserInclude
    });

  return {
    success: true as const,
    data: membership
  };
}