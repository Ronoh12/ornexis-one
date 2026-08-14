import { prisma } from "../../../../packages/database/index.js";

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

const safeUserSelect = {
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
} as const;

export async function getUsers(
  organizationId: string
) {
  return prisma.user.findMany({
    where: {
      organizationUsers: {
        some: {
          organizationId,
          status: {
            not: "REMOVED"
          }
        }
      }
    },
    select: safeUserSelect,
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getUserById(
  id: string,
  organizationId: string
) {
  return prisma.user.findFirst({
    where: {
      id,
      organizationUsers: {
        some: {
          organizationId,
          status: {
            not: "REMOVED"
          }
        }
      }
    },
    select: safeUserSelect
  });
}

export async function createUser(
  data: CreateUserInput
) {
  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.trim().toLowerCase(),
      ...(data.phone !== undefined
        ? { phone: data.phone }
        : {})
    },
    select: safeUserSelect
  });
}