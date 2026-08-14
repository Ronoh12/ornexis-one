import { prisma } from "../../../../packages/database/index.js";

export type CreateOrganizationUserInput = {
  organizationId: string;
  userId: string;
  roleId: string;
  status?: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
  invitedBy?: string;
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
  role: true
} as const;

export async function getOrganizationUsers(
  organizationId: string
) {
  return prisma.organizationUser.findMany({
    where: {
      organizationId
    },
    include: organizationUserInclude,
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
    include: organizationUserInclude
  });
}

export async function createOrganizationUser(
  data: CreateOrganizationUserInput
) {
  const role = await prisma.role.findFirst({
    where: {
      id: data.roleId,
      organizationId: data.organizationId
    }
  });

  if (!role) {
    return {
      success: false as const,
      reason: "INVALID_ROLE" as const
    };
  }

  const membership =
    await prisma.organizationUser.create({
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
      include: organizationUserInclude
    });

  return {
    success: true as const,
    data: membership
  };
}