import { prisma } from "../../../../packages/database/index.js";

export type CreateRolePermissionInput = {
  roleId: string;
  permissionId: string;
};

const rolePermissionInclude = {
  role: true,
  permission: true
} as const;

export async function getRolePermissions(
  organizationId: string
) {
  return prisma.rolePermission.findMany({
    where: {
      role: {
        organizationId
      }
    },
    include: rolePermissionInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function createRolePermission(
  organizationId: string,
  data: CreateRolePermissionInput
) {
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

  if (role.isSystemRole) {
    return {
      success: false as const,
      reason: "SYSTEM_ROLE" as const
    };
  }

  const permission =
    await prisma.permission.findUnique({
      where: {
        id: data.permissionId
      }
    });

  if (!permission) {
    return {
      success: false as const,
      reason: "INVALID_PERMISSION" as const
    };
  }

  const existingAssignment =
    await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: data.roleId,
          permissionId: data.permissionId
        }
      }
    });

  if (existingAssignment) {
    return {
      success: false as const,
      reason: "ALREADY_ASSIGNED" as const
    };
  }

  const rolePermission =
    await prisma.rolePermission.create({
      data: {
        roleId: data.roleId,
        permissionId: data.permissionId
      },
      include: rolePermissionInclude
    });

  return {
    success: true as const,
    data: rolePermission
  };
}

export async function deleteRolePermission(
  organizationId: string,
  rolePermissionId: string
) {
  const rolePermission =
    await prisma.rolePermission.findFirst({
      where: {
        id: rolePermissionId,
        role: {
          organizationId
        }
      },
      include: rolePermissionInclude
    });

  if (!rolePermission) {
    return {
      success: false as const,
      reason: "NOT_FOUND" as const
    };
  }

  if (rolePermission.role.isSystemRole) {
    return {
      success: false as const,
      reason: "SYSTEM_ROLE" as const
    };
  }

  await prisma.rolePermission.delete({
    where: {
      id: rolePermission.id
    }
  });

  return {
    success: true as const,
    data: rolePermission
  };
}