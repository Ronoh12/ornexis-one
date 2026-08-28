import type {
  Request,
  Response
} from "express";

import {
  NotificationServiceError,
  createNotification,
  getNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../services/notificationService.js";

import {
  NotificationValidationError,
  parseCreateNotificationBody,
  parseNotificationListQuery
} from "../validators/notificationValidator.js";

type AuthRequest = Request & {
  auth?: {
    userId: string;
    organizationId: string;
    organizationUserId: string;
  };
};

function actor(
  req: AuthRequest
) {
  const userId =
    req.auth?.userId;

  const organizationId =
    req.auth?.organizationId;

  const organizationUserId =
    req.auth?.organizationUserId;

  if (
    !userId ||
    !organizationId
  ) {
    throw new Error(
      "Authentication required"
    );
  }

  if (!organizationUserId) {
    throw new Error(
      "Organization membership required"
    );
  }

  return {
    userId,
    organizationId,
    organizationUserId
  };
}

function handleError(
  res: Response,
  error: unknown
) {
  if (
    error instanceof
      NotificationValidationError
  ) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (
    error instanceof
      NotificationServiceError
  ) {
    if (
      error.code ===
        "NOTIFICATION_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.code ===
        "NOTIFICATION_RECIPIENT_INVALID"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (error instanceof Error) {
    if (
      error.message ===
        "Authentication required"
    ) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message ===
        "Organization membership required"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  throw error;
}

export async function list(
  req: AuthRequest,
  res: Response
) {
  try {
    const ctx =
      actor(req);

    const query =
      parseNotificationListQuery(
        req.query
      );

    const data =
      await listNotifications(
        ctx,
        query
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function getOne(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await getNotification(
        actor(req),
        String(req.params.id)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function unreadCount(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await getUnreadCount(
        actor(req)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function markRead(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await markNotificationRead(
        actor(req),
        String(req.params.id)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function markAllRead(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await markAllNotificationsRead(
        actor(req)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

/**
 * Administrative/API creation endpoint.
 *
 * Normal product modules should use createNotification()
 * directly from notificationService instead of calling
 * this HTTP endpoint internally.
 */
export async function create(
  req: AuthRequest,
  res: Response
) {
  try {
    const ctx =
      actor(req);

    const input =
      parseCreateNotificationBody(
        req.body
      );

    const data =
      await createNotification({
        organizationId:
          ctx.organizationId,

        recipientOrganizationUserId:
          input.recipientOrganizationUserId,

        type:
          input.type,

        title:
          input.title,

        message:
          input.message,

        ...(input.priority !== undefined
          ? {
              priority:
                input.priority
            }
          : {}),

        ...(input.sourceType !== undefined
          ? {
              sourceType:
                input.sourceType
            }
          : {}),

        ...(input.sourceId !== undefined
          ? {
              sourceId:
                input.sourceId
            }
          : {}),

        ...(input.actionUrl !== undefined
          ? {
              actionUrl:
                input.actionUrl
            }
          : {}),

        ...(input.metadata !== undefined
          ? {
              metadata:
                input.metadata
            }
          : {})
      });

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}
