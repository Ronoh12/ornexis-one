import { prisma } from "../../../../packages/database/index.js";

export type CreateRolePermissionInput = {
  roleId: string;
  permissionId: string;
};

export async function getRolePermissions() {
  return prisma.rolePermission.findMany({
    include: {
      role: true,
      permission: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function createRolePermission(
  data: CreateRolePermissionInput
) {
  return prisma.rolePermission.create({
    data: {
      roleId: data.roleId,
      permissionId: data.permissionId
    },
    include: {
      role: true,
      permission: true
    }
  });
}