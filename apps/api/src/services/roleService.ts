import { prisma } from "../../../../packages/database/index.js";

export type CreateRoleInput = {
  organizationId: string;
  name: string;
  description?: string;
  isSystemRole?: boolean;
};

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
      organizationId: data.organizationId,
      name: data.name,
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.isSystemRole !== undefined
        ? { isSystemRole: data.isSystemRole }
        : {})
    }
  });
}