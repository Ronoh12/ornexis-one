import { prisma } from "../../../../packages/database/index.js";

export type CreateOrganizationUserInput = {
  organizationId: string;
  userId: string;
  roleId: string;
  status?: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
  invitedBy?: string;
};

export type UpdateOrganizationUserInput = {
  roleId?: string;
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
        id: existingMembership.roleId,
        organizationId
      }
    });

  const isCurrentAdministrator =
    existingRole?.name === "Administrator" &&
    existingRole.isSystemRole === true;

  const isLeavingAdministratorRole =
    data.roleId !== undefined &&
    data.roleId !== existingMembership.roleId;

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

    if (activeAdministratorCount <= 1) {
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

  const membership =
    await prisma.organizationUser.update({
      where: {
        id
      },
      data: {
        ...(data.roleId !== undefined
          ? { roleId: data.roleId }
          : {}),

        ...(data.status !== undefined
          ? {
              status: data.status,

              ...(data.status === "ACTIVE" &&
              existingMembership.joinedAt === null
                ? { joinedAt: new Date() }
                : {})
            }
          : {})
      },
      include: organizationUserInclude
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

  if (existingMembership.status === "REMOVED") {
    return {
      success: false as const,
      reason: "ALREADY_REMOVED" as const
    };
  }

  const existingRole =
    await prisma.role.findFirst({
      where: {
        id: existingMembership.roleId,
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
      include: organizationUserInclude
    });

  return {
    success: true as const,
    data: membership
  };
}