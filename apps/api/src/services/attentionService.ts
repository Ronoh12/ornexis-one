import {
  AttentionItemStatus,
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditLog
} from "./auditService.js";

import type {
  AttentionActionBody,
  AttentionListQuery
} from "../validators/attentionValidator.js";

export class AttentionServiceError extends Error {
  code: string;

  constructor(
    code: string,
    message: string
  ) {
    super(message);
    this.name = "AttentionServiceError";
    this.code = code;
  }
}

export type AttentionActor = {
  organizationId: string;
  organizationUserId: string;
  userId: string;
};

async function visibilityWhere(
  actor: AttentionActor
): Promise<Prisma.AttentionItemWhereInput> {
  const membership =
    await prisma.organizationUser.findFirst({
      where: {
        id: actor.organizationUserId,
        organizationId: actor.organizationId,
        userId: actor.userId,
        status: "ACTIVE"
      },
      include: {
        role: {
          select: {
            name: true,
            isSystemRole: true
          }
        }
      }
    });

  if (!membership) {
    throw new AttentionServiceError(
      "ATTENTION_MEMBERSHIP_INVALID",
      "Active organization membership was not found."
    );
  }

  const isAdministrator =
    membership.role.isSystemRole &&
    membership.role.name === "Administrator";

  if (isAdministrator) {
    return {};
  }

  return {
    responsibleOrganizationUserId:
      actor.organizationUserId
  };
}

function itemInclude() {
  return {
    responsibleOrganizationUser: {
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true
          }
        }
      }
    },
    branch: true,
    department: true
  } satisfies Prisma.AttentionItemInclude;
}

export async function listAttentionItems(
  actor: AttentionActor,
  query: AttentionListQuery
) {
  const visibility =
    await visibilityWhere(actor);

  const where:
    Prisma.AttentionItemWhereInput = {
      organizationId:
        actor.organizationId,
      ...visibility,
      ...(query.status
        ? { status: query.status }
        : {}),
      ...(query.severity
        ? { severity: query.severity }
        : {}),
      ...(query.signalType
        ? { signalType: query.signalType }
        : {}),
      ...(query.sourceType
        ? { sourceType: query.sourceType }
        : {}),
      ...(query.responsibleOrganizationUserId
        ? {
            responsibleOrganizationUserId:
              query.responsibleOrganizationUserId
          }
        : {}),
      ...(query.branchId
        ? { branchId: query.branchId }
        : {}),
      ...(query.departmentId
        ? { departmentId: query.departmentId }
        : {})
    };

  const skip =
    (query.page - 1) *
    query.limit;

  const [items, total] =
    await prisma.$transaction([
      prisma.attentionItem.findMany({
        where,
        include: itemInclude(),
        orderBy: [
          { status: "asc" },
          { severity: "desc" },
          { dueAt: "asc" },
          { detectedAt: "desc" }
        ],
        skip,
        take: query.limit
      }),
      prisma.attentionItem.count({
        where
      })
    ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(
        total / query.limit
      )
    }
  };
}

export async function getAttentionItem(
  actor: AttentionActor,
  id: string
) {
  const visibility =
    await visibilityWhere(actor);

  const item =
    await prisma.attentionItem.findFirst({
      where: {
        id,
        organizationId:
          actor.organizationId,
        ...visibility
      },
      include: itemInclude()
    });

  if (!item) {
    throw new AttentionServiceError(
      "ATTENTION_ITEM_NOT_FOUND",
      "Attention item not found."
    );
  }

  return item;
}

export async function acknowledgeAttentionItem(
  actor: AttentionActor,
  id: string,
  input: AttentionActionBody
) {
  const existing =
    await getAttentionItem(actor, id);

  if (
    existing.status ===
    AttentionItemStatus.ACKNOWLEDGED
  ) {
    return existing;
  }

  if (
    existing.status ===
      AttentionItemStatus.RESOLVED ||
    existing.status ===
      AttentionItemStatus.DISMISSED
  ) {
    throw new AttentionServiceError(
      "ATTENTION_ITEM_TERMINAL",
      "A terminal attention item cannot be acknowledged."
    );
  }

  const now = new Date();

  const updated =
    await prisma.attentionItem.update({
      where: {
        id: existing.id
      },
      data: {
        status:
          AttentionItemStatus.ACKNOWLEDGED,
        acknowledgedAt: now
      },
      include: itemInclude()
    });

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "ATTENTION_ITEM_ACKNOWLEDGED",
    entityType:
      "ATTENTION_ITEM",
    entityId:
      updated.id,
    oldValues: {
      status:
        existing.status
    },
    newValues: {
      status:
        updated.status,
      acknowledgedAt:
        updated.acknowledgedAt,
      ...(input.comment
        ? { comment: input.comment }
        : {})
    }
  });

  return updated;
}

export async function dismissAttentionItem(
  actor: AttentionActor,
  id: string,
  input: AttentionActionBody
) {
  const existing =
    await getAttentionItem(actor, id);

  if (
    existing.status ===
    AttentionItemStatus.DISMISSED
  ) {
    return existing;
  }

  if (
    existing.status ===
    AttentionItemStatus.RESOLVED
  ) {
    throw new AttentionServiceError(
      "ATTENTION_ITEM_TERMINAL",
      "A resolved attention item cannot be dismissed."
    );
  }

  const now = new Date();

  const updated =
    await prisma.attentionItem.update({
      where: {
        id: existing.id
      },
      data: {
        status:
          AttentionItemStatus.DISMISSED,
        dismissedAt: now
      },
      include: itemInclude()
    });

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "ATTENTION_ITEM_DISMISSED",
    entityType:
      "ATTENTION_ITEM",
    entityId:
      updated.id,
    oldValues: {
      status:
        existing.status
    },
    newValues: {
      status:
        updated.status,
      dismissedAt:
        updated.dismissedAt,
      ...(input.comment
        ? { comment: input.comment }
        : {})
    }
  });

  return updated;
}
