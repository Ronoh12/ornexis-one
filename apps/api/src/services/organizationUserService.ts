import { prisma } from "../../../../packages/database/index.js";

export type CreateOrganizationUserInput = {
  organizationId: string;
  userId: string;
  roleId: string;
  status?: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
  invitedBy?: string;
};

export async function getOrganizationUsers() {
  return prisma.organizationUser.findMany({
    include: {
      organization: true,
      user: true,
      role: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getOrganizationUserById(id: string) {
  return prisma.organizationUser.findUnique({
    where: {
      id
    },
    include: {
      organization: true,
      user: true,
      role: true
    }
  });
}

export async function createOrganizationUser(
  data: CreateOrganizationUserInput
) {
  return prisma.organizationUser.create({
    data: {
      organizationId: data.organizationId,
      userId: data.userId,
      roleId: data.roleId,
      status: data.status ?? "ACTIVE",
      joinedAt:
        data.status === "INVITED"
          ? null
          : new Date(),
      ...(data.invitedBy !== undefined
        ? { invitedBy: data.invitedBy }
        : {})
    },
    include: {
      organization: true,
      user: true,
      role: true
    }
  });
}