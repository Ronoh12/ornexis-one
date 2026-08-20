import { prisma } from "../../../../packages/database/index.js";

export type CreateRoleInput = {
  organizationId: string;
  name: string;
  description?: string;
  isSystemRole?: boolean;
};

export type UpdateRoleInput = {
  name?: string;
  description?: string | null;
};

const roleInclude = {
  rolePermissions: {
    include: {
      permission: true
    }
  }
} as const;

export async function getRoles(
  organizationId: string
) {
  return prisma.role.findMany({
    where: {
      organizationId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getRoleById(
  id: string,
  organizationId: string
) {
  return prisma.role.findFirst({
    where: {
      id,
      organizationId
    }
  });
}

export async function createRole(
  data: CreateRoleInput
) {
  return prisma.role.create({
    data: {
      organizationId:
        data.organizationId,
      name:
        data.name,
      ...(data.description !== undefined
        ? {
            description:
              data.description
          }
        : {}),
      ...(data.isSystemRole !== undefined
        ? {
            isSystemRole:
              data.isSystemRole
          }
        : {})
    }
  });
}

export async function updateRole(
  id: string,
  organizationId: string,
  data: UpdateRoleInput
) {
  const existingRole =
    await prisma.role.findFirst({
      where: {
        id,
        organizationId
      }
    });

  if (!existingRole) {
    return {
      success: false as const,
      reason: "NOT_FOUND" as const
    };
  }

  if (existingRole.isSystemRole) {
    return {
      success: false as const,
      reason: "SYSTEM_ROLE" as const
    };
  }

  if (
    data.name !== undefined &&
    data.name !== existingRole.name
  ) {
    const duplicateRole =
      await prisma.role.findFirst({
        where: {
          organizationId,
          name: data.name,
          id: {
            not: id
          }
        }
      });

    if (duplicateRole) {
      return {
        success: false as const,
        reason:
          "DUPLICATE_NAME" as const
      };
    }
  }

  const role =
    await prisma.role.update({
      where: {
        id
      },
      data: {
        ...(data.name !== undefined
          ? {
              name:
                data.name
            }
          : {}),
        ...(data.description !== undefined
          ? {
              description:
                data.description
            }
          : {})
      },
      include:
        roleInclude
    });

  return {
    success: true as const,
    data: role,
    oldValues: {
      name:
        existingRole.name,
      description:
        existingRole.description
    }
  };
}

export async function deleteRole(
  id: string,
  organizationId: string
) {
  const existingRole =
    await prisma.role.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        organizationUsers: {
          select: {
            id: true,
            status: true
          }
        },
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

  if (!existingRole) {
    return {
      success: false as const,
      reason: "NOT_FOUND" as const
    };
  }

  if (existingRole.isSystemRole) {
    return {
      success: false as const,
      reason: "SYSTEM_ROLE" as const
    };
  }

  if (
    existingRole.organizationUsers.length > 0
  ) {
    return {
      success: false as const,
      reason: "ROLE_IN_USE" as const
    };
  }

  await prisma.role.delete({
    where: {
      id
    }
  });

  return {
    success: true as const,
    data: existingRole
  };
}