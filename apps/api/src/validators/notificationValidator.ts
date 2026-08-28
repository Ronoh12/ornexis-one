import {
  NotificationPriority
} from "../../../../packages/database/generated/client/enums.js";

export class NotificationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationValidationError";
  }
}

export type NotificationListQuery = {
  page: number;
  limit: number;
  unreadOnly: boolean;
  priority?: NotificationPriority;
  type?: string;
  sourceType?: string;
};

function record(value: unknown): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new NotificationValidationError(
      "Request body must be an object."
    );
  }

  return value as Record<string, unknown>;
}

function optionalString(
  value: unknown,
  field: string
) {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new NotificationValidationError(
      `${field} must be a non-empty string.`
    );
  }

  return value.trim();
}

function integerQuery(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw new NotificationValidationError(
      `Expected an integer between ${minimum} and ${maximum}.`
    );
  }

  return parsed;
}

export function parseNotificationListQuery(
  query: Record<string, unknown>
): NotificationListQuery {
  const page =
    integerQuery(
      query.page,
      1,
      1,
      1000000
    );

  const limit =
    integerQuery(
      query.limit,
      25,
      1,
      100
    );

  let unreadOnly = false;

  if (query.unreadOnly !== undefined) {
    if (
      query.unreadOnly !== "true" &&
      query.unreadOnly !== "false"
    ) {
      throw new NotificationValidationError(
        "unreadOnly must be true or false."
      );
    }

    unreadOnly =
      query.unreadOnly === "true";
  }

  let priority:
    NotificationPriority | undefined;

  if (query.priority !== undefined) {
    if (
      typeof query.priority !== "string" ||
      !Object.values(
        NotificationPriority
      ).includes(
        query.priority as NotificationPriority
      )
    ) {
      throw new NotificationValidationError(
        "Invalid notification priority."
      );
    }

    priority =
      query.priority as NotificationPriority;
  }

  const type =
    optionalString(
      query.type,
      "type"
    );

  const sourceType =
    optionalString(
      query.sourceType,
      "sourceType"
    );

  return {
    page,
    limit,
    unreadOnly,
    ...(priority !== undefined
      ? { priority }
      : {}),
    ...(type !== undefined
      ? { type }
      : {}),
    ...(sourceType !== undefined
      ? { sourceType }
      : {})
  };
}

export type CreateNotificationBody = {
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

export function parseCreateNotificationBody(
  body: unknown
): CreateNotificationBody {
  const input = record(body);

  const recipientOrganizationUserId =
    optionalString(
      input.recipientOrganizationUserId,
      "recipientOrganizationUserId"
    );

  const type =
    optionalString(
      input.type,
      "type"
    );

  const title =
    optionalString(
      input.title,
      "title"
    );

  const message =
    optionalString(
      input.message,
      "message"
    );

  if (!recipientOrganizationUserId) {
    throw new NotificationValidationError(
      "recipientOrganizationUserId is required."
    );
  }

  if (!type) {
    throw new NotificationValidationError(
      "type is required."
    );
  }

  if (!title) {
    throw new NotificationValidationError(
      "title is required."
    );
  }

  if (!message) {
    throw new NotificationValidationError(
      "message is required."
    );
  }

  let priority:
    NotificationPriority | undefined;

  if (input.priority !== undefined) {
    if (
      typeof input.priority !== "string" ||
      !Object.values(
        NotificationPriority
      ).includes(
        input.priority as NotificationPriority
      )
    ) {
      throw new NotificationValidationError(
        "Invalid notification priority."
      );
    }

    priority =
      input.priority as NotificationPriority;
  }

  const sourceType =
    input.sourceType === null
      ? null
      : optionalString(
          input.sourceType,
          "sourceType"
        );

  const sourceId =
    input.sourceId === null
      ? null
      : optionalString(
          input.sourceId,
          "sourceId"
        );

  const actionUrl =
    input.actionUrl === null
      ? null
      : optionalString(
          input.actionUrl,
          "actionUrl"
        );

  return {
    recipientOrganizationUserId,
    type,
    title,
    message,

    ...(priority !== undefined
      ? { priority }
      : {}),

    ...(sourceType !== undefined
      ? { sourceType }
      : {}),

    ...(sourceId !== undefined
      ? { sourceId }
      : {}),

    ...(actionUrl !== undefined
      ? { actionUrl }
      : {}),

    ...(input.metadata !== undefined
      ? {
          metadata:
            input.metadata
        }
      : {})
  };
}
