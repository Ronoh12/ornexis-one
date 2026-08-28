import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  NotificationPriority
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import type {
  NotificationListQuery
} from "../validators/notificationValidator.js";

export class NotificationServiceError extends Error {
  code: string;

  constructor(
    code: string,
    message: string
  ) {
    super(message);
    this.name = "NotificationServiceError";
    this.code = code;
  }
}

export type NotificationActor = {
  organizationId: string;
  organizationUserId: string;
  userId?: string;
};

export type CreateNotificationInput = {
  organizationId: string;
  recipientOrganizationUserId: string;
  type: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  sourceType?: string | null;
  sourceId?: string | null;
  actionUrl?: string | null;
  metadata?: unknown;
};

async function requireActiveRecipient(
  organizationId: string,
  organizationUserId: string
) {
  const recipient =
    await prisma.organizationUser.findFirst({
      where: {
        id: organizationUserId,
        organizationId,
        status: "ACTIVE"
      },

      select: {
        id: true,
        organizationId: true
      }
    });

  if (!recipient) {
    throw new NotificationServiceError(
      "NOTIFICATION_RECIPIENT_INVALID",
      "Active notification recipient was not found in this organization."
    );
  }

  return recipient;
}

function metadataValue(
  value: unknown | undefined
):
  | Prisma.InputJsonValue
  | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

/**
 * Shared internal notification creation service.
 *
 * Business modules should call this function rather than
 * implementing their own notification persistence logic.
 *
 * A notification never grants access to its source entity.
 * Consumers must still authorize source access separately.
 */
export async function createNotification(
  input: CreateNotificationInput
) {
  await requireActiveRecipient(
    input.organizationId,
    input.recipientOrganizationUserId
  );

  const metadata =
    metadataValue(input.metadata);

  return prisma.notification.create({
    data: {
      organizationId:
        input.organizationId,

      recipientOrganizationUserId:
        input.recipientOrganizationUserId,

      type:
        input.type.trim(),

      title:
        input.title.trim(),

      message:
        input.message.trim(),

      priority:
        input.priority ??
        NotificationPriority.NORMAL,

      sourceType:
        input.sourceType ?? null,

      sourceId:
        input.sourceId ?? null,

      actionUrl:
        input.actionUrl ?? null,

      ...(metadata !== undefined
        ? { metadata }
        : {})
    }
  });
}

export async function listNotifications(
  actor: NotificationActor,
  query: NotificationListQuery
) {
  const where:
    Prisma.NotificationWhereInput = {
      organizationId:
        actor.organizationId,

      recipientOrganizationUserId:
        actor.organizationUserId,

      ...(query.unreadOnly
        ? {
            readAt: null
          }
        : {}),

      ...(query.priority
        ? {
            priority:
              query.priority
          }
        : {}),

      ...(query.type
        ? {
            type:
              query.type
          }
        : {}),

      ...(query.sourceType
        ? {
            sourceType:
              query.sourceType
          }
        : {})
    };

  const skip =
    (query.page - 1) *
    query.limit;

  const [items, total] =
    await prisma.$transaction([
      prisma.notification.findMany({
        where,

        orderBy: [
          {
            createdAt: "desc"
          },
          {
            id: "desc"
          }
        ],

        skip,
        take: query.limit
      }),

      prisma.notification.count({
        where
      })
    ]);

  return {
    items,

    pagination: {
      page:
        query.page,

      limit:
        query.limit,

      total,

      pages:
        Math.ceil(
          total / query.limit
        )
    }
  };
}

export async function getNotification(
  actor: NotificationActor,
  notificationId: string
) {
  const notification =
    await prisma.notification.findFirst({
      where: {
        id:
          notificationId,

        organizationId:
          actor.organizationId,

        recipientOrganizationUserId:
          actor.organizationUserId
      }
    });

  if (!notification) {
    throw new NotificationServiceError(
      "NOTIFICATION_NOT_FOUND",
      "Notification was not found."
    );
  }

  return notification;
}

export async function getUnreadCount(
  actor: NotificationActor
) {
  const count =
    await prisma.notification.count({
      where: {
        organizationId:
          actor.organizationId,

        recipientOrganizationUserId:
          actor.organizationUserId,

        readAt: null
      }
    });

  return {
    count
  };
}

export async function markNotificationRead(
  actor: NotificationActor,
  notificationId: string
) {
  const notification =
    await getNotification(
      actor,
      notificationId
    );

  if (notification.readAt) {
    return notification;
  }

  return prisma.notification.update({
    where: {
      id:
        notification.id
    },

    data: {
      readAt:
        new Date()
    }
  });
}

export async function markAllNotificationsRead(
  actor: NotificationActor
) {
  const now =
    new Date();

  const result =
    await prisma.notification.updateMany({
      where: {
        organizationId:
          actor.organizationId,

        recipientOrganizationUserId:
          actor.organizationUserId,

        readAt: null
      },

      data: {
        readAt:
          now
      }
    });

  return {
    updatedCount:
      result.count,

    readAt:
      now
  };
}
