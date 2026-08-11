import { prisma } from "../../../../packages/database/index.js";

export type CreatePermissionInput = {
  code: string;
  name: string;
  description?: string;
  module: string;
};

export async function getPermissions() {
  return prisma.permission.findMany({
    orderBy: [
      {
        module: "asc"
      },
      {
        code: "asc"
      }
    ]
  });
}

export async function getPermissionById(id: string) {
  return prisma.permission.findUnique({
    where: {
      id
    }
  });
}

export async function createPermission(
  data: CreatePermissionInput
) {
  return prisma.permission.create({
    data: {
      code: data.code,
      name: data.name,
      module: data.module,
      ...(data.description !== undefined
        ? { description: data.description }
        : {})
    }
  });
}