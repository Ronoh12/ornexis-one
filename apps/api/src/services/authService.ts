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
  const user = await prisma.user.findUnique({
    where: {
      id: data.userId
    }
  });

  if (!user) {
    return {
      success: false as const,
      reason: "NOT_FOUND" as const
    };
  }

  if (user.status === "ACTIVE") {
    return {
      success: false as const,
      reason: "ALREADY_ACTIVE" as const
    };
  }

  const passwordHash = await bcrypt.hash(
    data.password,
    12
  );

  const activatedUser =
    await prisma.user.update({
      where: {
        id: data.userId
      },
      data: {
        passwordHash,
        status: "ACTIVE"
      }
    });

  return {
    success: true as const,
    data: activatedUser
  };
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
    return {
      success: false as const,
      reason: "INVALID_CREDENTIALS" as const
    };
  }

  if (user.status === "SUSPENDED") {
    return {
      success: false as const,
      reason: "SUSPENDED" as const
    };
  }

  if (user.status === "DISABLED") {
    return {
      success: false as const,
      reason: "DISABLED" as const
    };
  }

  const passwordMatches =
    await bcrypt.compare(
      data.password,
      user.passwordHash
    );

  if (!passwordMatches) {
    return {
      success: false as const,
      reason: "INVALID_CREDENTIALS" as const
    };
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
    success: true as const,
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status
      },
      token
    }
  };
}

export async function getCurrentUser(
  userId: string
) {
  return prisma.user.findUnique({
    where: {
      id: userId
    },
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
  });
}