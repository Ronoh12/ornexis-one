import bcrypt from "bcryptjs";

import { prisma } from "../../../../packages/database/index.js";

import {
  generateSecureToken,
  hashToken
} from "../utils/tokenSecurity.js";

const PASSWORD_RESET_EXPIRY_MINUTES = 60;

export async function createPasswordResetToken(
  email: string
) {
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!user) {
    return {
      success: true as const
    };
  }

  if (
    user.status === "SUSPENDED" ||
    user.status === "DISABLED"
  ) {
    return {
      success: true as const
    };
  }

  const resetToken =
    generateSecureToken();

  const tokenHash =
    hashToken(resetToken);

  const expiresAt = new Date();

  expiresAt.setMinutes(
    expiresAt.getMinutes() +
      PASSWORD_RESET_EXPIRY_MINUTES
  );

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      consumedAt: null
    },
    data: {
      consumedAt: new Date()
    }
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  return {
    success: true as const,
    resetToken
  };
}

export async function resetPassword(
  resetToken: string,
  newPassword: string
) {
  const tokenHash =
    hashToken(resetToken);

  const record =
    await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
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

  if (!record) {
    return {
      success: false as const,
      reason: "INVALID_RESET_TOKEN" as const
    };
  }

  if (
    record.user.status === "SUSPENDED" ||
    record.user.status === "DISABLED"
  ) {
    return {
      success: false as const,
      reason: "ACCOUNT_INACTIVE" as const
    };
  }

  const passwordHash =
    await bcrypt.hash(
      newPassword,
      12
    );

  const now = new Date();

  await prisma.$transaction(
    async (tx) => {
      await tx.user.update({
        where: {
          id: record.userId
        },
        data: {
          passwordHash
        }
      });

      await tx.passwordResetToken.update({
        where: {
          id: record.id
        },
        data: {
          consumedAt: now
        }
      });

      await tx.refreshSession.updateMany({
        where: {
          userId: record.userId,
          revokedAt: null
        },
        data: {
          revokedAt: now
        }
      });
    }
  );

  return {
    success: true as const,
    data: {
      userId: record.userId
    }
  };
}