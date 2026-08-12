import { prisma } from "../../../../packages/database/index.js";

export async function userHasPermission(
  userId: string,
  organizationId: string,
  permissionCode: string
) {
  const membership =
    await prisma.organizationUser.findFirst({
      where: {
        userId,
        organizationId,
        status: "ACTIVE"
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

  if (!membership) {
    return false;
  }

  return membership.role.rolePermissions.some(
    (rolePermission) =>
      rolePermission.permission.code === permissionCode
  );
}