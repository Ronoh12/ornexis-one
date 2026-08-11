import { prisma } from "../../../../packages/database/index.js";

export type CreateRoleInput = {
  organizationId: string;
  name: string;
  description?: string;
  isSystemRole?: boolean;
};

export async function getRoles() {
  return prisma.role.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getRoleById(id: string) {
  return prisma.role.findUnique({
    where: {
      id
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