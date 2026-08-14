import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../../../../packages/database/index.js";

import {
  createRefreshSession
} from "./refreshSessionService.js";

import {
  getValidInvitationToken
} from "./invitationTokenService.js";

function createAccessToken(
  userId: string
) {
  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return jwt.sign(
    {
      userId
    },
    jwtSecret,
    {
      expiresIn: "1h"
    }
  );
}

type LoginInput = {
  email: string;
  password: string;
};

type ActivateUserInput = {
  invitationToken: string;
  password: string;
};

type SessionMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

export async function activateUser(
  data: ActivateUserInput
) {
  const invitation =
    await getValidInvitationToken(
      data.invitationToken
    );

  if (!invitation) {
    return {
      success: false as const,
      reason: "INVALID_INVITATION" as const
    };
  }

  if (invitation.user.status === "ACTIVE") {
    return {
      success: false as const,
      reason: "ALREADY_ACTIVE" as const
    };
  }

  if (
    invitation.user.status === "SUSPENDED" ||
    invitation.user.status === "DISABLED"
  ) {
    return {
      success: false as const,
      reason: "ACCOUNT_INACTIVE" as const
    };
  }

  if (
    invitation.organizationUser.status !==
    "INVITED"
  ) {
    return {
      success: false as const,
      reason: "INVALID_INVITATION" as const
    };
  }

  const passwordHash =
    await bcrypt.hash(
      data.password,
      12
    );

  const now = new Date();

  const result =
    await prisma.$transaction(
      async (tx) => {
        const activatedUser =
          await tx.user.update({
            where: {
              id: invitation.userId
            },
            data: {
              passwordHash,
              status: "ACTIVE"
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true
            }
          });

        const membership =
          await tx.organizationUser.update({
            where: {
              id:
                invitation.organizationUserId
            },
            data: {
              status: "ACTIVE",
              joinedAt: now
            }
          });

        await tx.invitationToken.update({
          where: {
            id: invitation.id
          },
          data: {
            consumedAt: now
          }
        });

        return {
          activatedUser,
          membership
        };
      }
    );

  return {
    success: true as const,
    data: result
  };
}

export async function loginUser(
  data: LoginInput,
  sessionMetadata?: SessionMetadata
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

  if (user.status !== "ACTIVE") {
    return {
      success: false as const,
      reason: "INVALID_CREDENTIALS" as const
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

  const accessToken =
    createAccessToken(user.id);

  const refreshSession =
    await createRefreshSession({
      userId: user.id,
      ...(sessionMetadata?.ipAddress !== undefined
        ? {
            ipAddress:
              sessionMetadata.ipAddress
          }
        : {}),
      ...(sessionMetadata?.userAgent !== undefined
        ? {
            userAgent:
              sessionMetadata.userAgent
          }
        : {})
    });

  const updatedUser =
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        lastLoginAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true
      }
    });

  return {
    success: true as const,
    data: {
      user: updatedUser,
      accessToken,
      refreshToken:
        refreshSession.refreshToken
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

export function issueAccessToken(
  userId: string
) {
  return createAccessToken(userId);
}