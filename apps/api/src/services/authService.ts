import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../../../../packages/database/index.js";

type LoginInput = {
  email: string;
  password: string;
};

type ActivateUserInput = {
  userId: string;
  password: string;
};

export async function activateUser(
  data: ActivateUserInput
) {
  const passwordHash = await bcrypt.hash(
    data.password,
    12
  );

  return prisma.user.update({
    where: {
      id: data.userId
    },
    data: {
      passwordHash,
      status: "ACTIVE"
    }
  });
}

export async function loginUser(
  data: LoginInput
) {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email
    }
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const passwordMatches =
    await bcrypt.compare(
      data.password,
      user.passwordHash
    );

  if (!passwordMatches) {
    return null;
  }

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  const token = jwt.sign(
    {
      userId: user.id
    },
    jwtSecret,
    {
      expiresIn: "1h"
    }
  );

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status
    },
    token
  };
}