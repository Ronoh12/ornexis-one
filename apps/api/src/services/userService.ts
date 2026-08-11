import { prisma } from "../../../../packages/database/index.js";

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
};

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: {
      id
    }
  });
}

export async function createUser(
  data: CreateUserInput
) {
  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      ...(data.phone !== undefined
        ? { phone: data.phone }
        : {})
    }
  });
}