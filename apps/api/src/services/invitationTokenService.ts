import { prisma } from "../../../../packages/database/index.js";

import {
  generateSecureToken,
  hashToken
} from "../utils/tokenSecurity.js";

type CreateInvitationTokenInput = {
  userId: string;
  organizationUserId: string;
};

const INVITATION_EXPIRY_HOURS = 72;

export async function createInvitationToken(
  data: CreateInvitationTokenInput
) {
  const invitationToken =
    generateSecureToken();

  const tokenHash =
    hashToken(invitationToken);

  const expiresAt = new Date();

  expiresAt.setHours(
    expiresAt.getHours() +
      INVITATION_EXPIRY_HOURS
  );

  await prisma.invitationToken.updateMany({
    where: {
      organizationUserId:
        data.organizationUserId,
      consumedAt: null
    },
    data: {
      consumedAt: new Date()
    }
  });

  const record =
    await prisma.invitationToken.create({
      data: {
        userId: data.userId,
        organizationUserId:
          data.organizationUserId,
        tokenHash,
        expiresAt
      }
    });

  return {
    invitationToken,
    record
  };
}

export async function getValidInvitationToken(
  invitationToken: string
) {
  const tokenHash =
    hashToken(invitationToken);

  return prisma.invitationToken.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true,
      organizationUser: true
    }
  });
}

export async function consumeInvitationToken(
  invitationTokenId: string
) {
  return prisma.invitationToken.update({
    where: {
      id: invitationTokenId
    },
    data: {
      consumedAt: new Date()
    }
  });
}