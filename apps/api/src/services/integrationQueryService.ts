import {
  prisma
} from "../../../../packages/database/index.js";

import {
  loadAuthorizedIntegrationMembership
} from "./integrationAuthorizationService.js";

import {
  validateIntegrationLimit
} from "./integrationIdentityService.js";

import {
  INTEGRATION_DEFAULT_LIMIT,
  INTEGRATION_MAX_LIMIT,
  IntegrationServiceError,
  type IntegrationActor,
  type IntegrationCursor,
  type IntegrationEventListInput,
  type WebhookDeliveryListInput
} from "./integrationTypes.js";

function encodeCursor(
  cursor:
    IntegrationCursor
) {
  return Buffer.from(
    JSON.stringify(
      cursor
    ),
    "utf8"
  ).toString(
    "base64url"
  );
}

function decodeCursor(
  value:
    string |
    undefined
) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed =
      JSON.parse(
        Buffer.from(
          value,
          "base64url"
        ).toString(
          "utf8"
        )
      ) as
        Partial<
          IntegrationCursor
        >;

    if (
      typeof parsed.id !==
        "string" ||
      typeof parsed.createdAt !==
        "string"
    ) {
      throw new Error(
        "Invalid cursor"
      );
    }

    const createdAt =
      new Date(
        parsed.createdAt
      );

    if (
      Number.isNaN(
        createdAt.getTime()
      )
    ) {
      throw new Error(
        "Invalid cursor"
      );
    }

    return {
      id:
        parsed.id,
      createdAt
    };
  } catch {
    throw new IntegrationServiceError(
      "INTEGRATION_QUERY_INVALID",
      "Integration cursor is invalid."
    );
  }
}

function nextCursor(
  records:
    Array<{
      id: string;
      createdAt: Date;
    }>,
  limit:
    number
) {
  if (
    records.length <=
      limit
  ) {
    return null;
  }

  const last =
    records[
      limit - 1
    ];

  if (!last) {
    return null;
  }

  return encodeCursor({
    id:
      last.id,
    createdAt:
      last.createdAt
        .toISOString()
  });
}

export async function listIntegrationEvents(
  actor:
    IntegrationActor,
  input:
    IntegrationEventListInput
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.deliveries"
  );

  const limit =
    validateIntegrationLimit(
      input.limit,
      INTEGRATION_DEFAULT_LIMIT,
      INTEGRATION_MAX_LIMIT
    );

  const cursor =
    decodeCursor(
      input.cursor
    );

  const records =
    await prisma
      .integrationEvent
      .findMany({
        where: {
          organizationId:
            actor.organizationId,
          ...(input.eventType
            ? {
                eventType:
                  input.eventType
              }
            : {}),
          ...(input.entityType
            ? {
                entityType:
                  input.entityType
              }
            : {}),
          ...(input.entityId
            ? {
                entityId:
                  input.entityId
              }
            : {}),
          ...(input.correlationId
            ? {
                correlationId:
                  input.correlationId
              }
            : {}),
          ...(input.createdFrom ||
          input.createdTo
            ? {
                createdAt: {
                  ...(input.createdFrom
                    ? {
                        gte:
                          input.createdFrom
                      }
                    : {}),
                  ...(input.createdTo
                    ? {
                        lte:
                          input.createdTo
                      }
                    : {})
                }
              }
            : {}),
          ...(cursor
            ? {
                OR: [
                  {
                    createdAt: {
                      lt:
                        cursor.createdAt
                    }
                  },
                  {
                    createdAt:
                      cursor.createdAt,
                    id: {
                      lt:
                        cursor.id
                    }
                  }
                ]
              }
            : {})
        },
        orderBy: [
          {
            createdAt:
              "desc"
          },
          {
            id:
              "desc"
          }
        ],
        take:
          limit + 1,
        select: {
          id: true,
          organizationId:
            true,
          eventType: true,
          payloadVersion:
            true,
          entityType: true,
          entityId: true,
          payloadHash: true,
          source: true,
          idempotencyKey:
            true,
          requestId: true,
          correlationId:
            true,
          occurredAt: true,
          publishedAt: true,
          createdByOrganizationUserId:
            true,
          createdAt: true,
          _count: {
            select: {
              deliveries:
                true
            }
          }
        }
      });

  return {
    items:
      records.slice(
        0,
        limit
      ),
    nextCursor:
      nextCursor(
        records,
        limit
      )
  };
}

export async function getIntegrationEvent(
  actor:
    IntegrationActor,
  integrationEventId:
    string
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.deliveries"
  );

  const event =
    await prisma
      .integrationEvent
      .findFirst({
        where: {
          id:
            integrationEventId,
          organizationId:
            actor.organizationId
        },
        select: {
          id: true,
          organizationId:
            true,
          eventType: true,
          payloadVersion:
            true,
          entityType: true,
          entityId: true,
          payload: true,
          payloadHash: true,
          source: true,
          idempotencyKey:
            true,
          requestId: true,
          correlationId:
            true,
          occurredAt: true,
          publishedAt: true,
          createdByOrganizationUserId:
            true,
          createdAt: true,
          deliveries: {
            orderBy: [
              {
                createdAt:
                  "asc"
              },
              {
                id:
                  "asc"
              }
            ],
            select: {
              id: true,
              webhookEndpointId:
                true,
              status: true,
              attemptCount:
                true,
              nextAttemptAt:
                true,
              lastHttpStatus:
                true,
              lastErrorCode:
                true,
              firstAttemptAt:
                true,
              deliveredAt:
                true,
              terminalAt:
                true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

  if (!event) {
    throw new IntegrationServiceError(
      "INTEGRATION_NOT_FOUND",
      "Integration event was not found."
    );
  }

  return event;
}

export async function listWebhookDeliveries(
  actor:
    IntegrationActor,
  input:
    WebhookDeliveryListInput
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.deliveries"
  );

  const limit =
    validateIntegrationLimit(
      input.limit,
      INTEGRATION_DEFAULT_LIMIT,
      INTEGRATION_MAX_LIMIT
    );

  const cursor =
    decodeCursor(
      input.cursor
    );

  const records =
    await prisma
      .webhookDelivery
      .findMany({
        where: {
          organizationId:
            actor.organizationId,
          ...(input.integrationEventId
            ? {
                integrationEventId:
                  input.integrationEventId
              }
            : {}),
          ...(input.webhookEndpointId
            ? {
                webhookEndpointId:
                  input.webhookEndpointId
              }
            : {}),
          ...(input.status
            ? {
                status:
                  input.status
              }
            : {}),
          ...(input.createdFrom ||
          input.createdTo
            ? {
                createdAt: {
                  ...(input.createdFrom
                    ? {
                        gte:
                          input.createdFrom
                      }
                    : {}),
                  ...(input.createdTo
                    ? {
                        lte:
                          input.createdTo
                      }
                    : {})
                }
              }
            : {}),
          ...(cursor
            ? {
                OR: [
                  {
                    createdAt: {
                      lt:
                        cursor.createdAt
                    }
                  },
                  {
                    createdAt:
                      cursor.createdAt,
                    id: {
                      lt:
                        cursor.id
                    }
                  }
                ]
              }
            : {})
        },
        orderBy: [
          {
            createdAt:
              "desc"
          },
          {
            id:
              "desc"
          }
        ],
        take:
          limit + 1,
        select: {
          id: true,
          organizationId:
            true,
          integrationEventId:
            true,
          webhookEndpointId:
            true,
          status: true,
          attemptCount:
            true,
          nextAttemptAt:
            true,
          lastHttpStatus:
            true,
          lastErrorCode:
            true,
          lastErrorMessage:
            true,
          firstAttemptAt:
            true,
          deliveredAt:
            true,
          terminalAt:
            true,
          createdAt: true,
          updatedAt: true,
          event: {
            select: {
              eventType:
                true,
              entityType:
                true,
              entityId:
                true,
              occurredAt:
                true
            }
          },
          endpoint: {
            select: {
              name: true,
              url: true,
              status: true,
              integrationClientId:
                true
            }
          }
        }
      });

  return {
    items:
      records.slice(
        0,
        limit
      ),
    nextCursor:
      nextCursor(
        records,
        limit
      )
  };
}

export async function getWebhookDelivery(
  actor:
    IntegrationActor,
  webhookDeliveryId:
    string
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.deliveries"
  );

  const delivery =
    await prisma
      .webhookDelivery
      .findFirst({
        where: {
          id:
            webhookDeliveryId,
          organizationId:
            actor.organizationId
        },
        select: {
          id: true,
          organizationId:
            true,
          integrationEventId:
            true,
          webhookEndpointId:
            true,
          status: true,
          attemptCount:
            true,
          nextAttemptAt:
            true,
          lastHttpStatus:
            true,
          lastErrorCode:
            true,
          lastErrorMessage:
            true,
          firstAttemptAt:
            true,
          deliveredAt:
            true,
          terminalAt:
            true,
          createdAt: true,
          updatedAt: true,
          event: {
            select: {
              id: true,
              eventType:
                true,
              payloadVersion:
                true,
              entityType:
                true,
              entityId:
                true,
              payloadHash:
                true,
              occurredAt:
                true
            }
          },
          endpoint: {
            select: {
              id: true,
              name: true,
              url: true,
              status: true,
              integrationClientId:
                true
            }
          }
        }
      });

  if (!delivery) {
    throw new IntegrationServiceError(
      "INTEGRATION_NOT_FOUND",
      "Webhook delivery was not found."
    );
  }

  return delivery;
}

export async function listWebhookDeliveryAttempts(
  actor:
    IntegrationActor,
  webhookDeliveryId:
    string
) {
  await getWebhookDelivery(
    actor,
    webhookDeliveryId
  );

  return prisma
    .webhookDeliveryAttempt
    .findMany({
      where: {
        organizationId:
          actor.organizationId,
        webhookDeliveryId
      },
      orderBy: {
        attemptNumber:
          "asc"
      },
      select: {
        id: true,
        webhookDeliveryId:
          true,
        attemptNumber:
          true,
        result: true,
        startedAt: true,
        completedAt: true,
        durationMs: true,
        httpStatus: true,
        errorCode: true,
        errorMessage:
          true,
        responseSummary:
          true,
        requestTimestamp:
          true,
        createdAt: true
      }
    });
}
