import { prisma } from "../../../../packages/database/index.js";

import {
  generateSecureToken,
  hashToken
} from "../utils/tokenSecurity.js";

type CreateRefreshSessionInput = {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
};

const REFRESH_SESSION_DAYS = 30;

export async function createRefreshSession(
  data: CreateRefreshSessionInput
) {
  const refreshToken = generateSecureToken();

  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + REFRESH_SESSION_DAYS
  );

  const session =
    await prisma.refreshSession.create({
      data: {
        userId: data.userId,
        tokenHash,
        expiresAt,
        ...(data.ipAddress !== undefined
          ? { ipAddress: data.ipAddress }
          : {}),
        ...(data.userAgent !== undefined
          ? { userAgent: data.userAgent }
          : {})
      }
    });

  return {
    refreshToken,
    session
  };
}

export async function getActiveRefreshSession(
  refreshToken: string
) {
  const tokenHash = hashToken(refreshToken);

  return prisma.refreshSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });
}

export async function rotateRefreshSession(
  refreshToken: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }
) {
  const existingSession =
    await getActiveRefreshSession(
      refreshToken
    );

  if (!existingSession) {
    return {
      success: false as const,
      reason: "INVALID_REFRESH_TOKEN" as const
    };
  }

  if (
    existingSession.user.status !== "ACTIVE"
  ) {
    await prisma.refreshSession.update({
      where: {
        id: existingSession.id
      },
      data: {
        revokedAt: new Date()
      }
    });

    return {
      success: false as const,
      reason: "ACCOUNT_INACTIVE" as const
    };
  }

  const newRefreshToken =
    generateSecureToken();

  const newTokenHash =
    hashToken(newRefreshToken);

  const newExpiresAt = new Date();

  newExpiresAt.setDate(
    newExpiresAt.getDate() +
      REFRESH_SESSION_DAYS
  );

  const rotatedSession =
    await prisma.$transaction(
      async (tx) => {
        await tx.refreshSession.update({
          where: {
            id: existingSession.id
          },
          data: {
            revokedAt: new Date(),
            lastUsedAt: new Date()
          }
        });

        return tx.refreshSession.create({
          data: {
            userId:
              existingSession.userId,
            tokenHash:
              newTokenHash,
            expiresAt:
              newExpiresAt,
            ...(metadata?.ipAddress !== undefined
              ? {
                  ipAddress:
                    metadata.ipAddress
                }
              : {}),
            ...(metadata?.userAgent !== undefined
              ? {
                  userAgent:
                    metadata.userAgent
                }
              : {})
          }
        });
      }
    );

  return {
    success: true as const,
    data: {
      userId:
        existingSession.userId,
      refreshToken:
        newRefreshToken,
      session:
        rotatedSession
    }
  };
}

export async function revokeRefreshSession(
  sessionId: string
) {
  return prisma.refreshSession.update({
    where: {
      id: sessionId
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function revokeRefreshSessionByToken(
  refreshToken: string
) {
  const tokenHash =
    hashToken(refreshToken);

  const session =
    await prisma.refreshSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    });

  if (!session) {
    return {
      success: false as const,
      reason: "INVALID_REFRESH_TOKEN" as const
    };
  }

  const revokedSession =
    await prisma.refreshSession.update({
      where: {
        id: session.id
      },
      data: {
        revokedAt: new Date()
      }
    });

  return {
    success: true as const,
    data: revokedSession
  };
}