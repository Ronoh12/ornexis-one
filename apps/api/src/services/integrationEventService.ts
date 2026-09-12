import {
  createHash
} from "node:crypto";

import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  AuditEventCategory,
  AuditEventSource as AuditSource,
  IntegrationClientStatus,
  IntegrationEventSource,
  WebhookDeliveryStatus,
  WebhookEndpointStatus,
  WebhookSubscriptionStatus
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  loadAuthorizedIntegrationMembership
} from "./integrationAuthorizationService.js";

import {
  getIntegrationEventDefinition
} from "./integrationEventRegistry.js";

import {
  normalizeEntityType,
  normalizeEventType,
  normalizeOptionalText,
  normalizeRequiredText
} from "./integrationIdentityService.js";

import {
  redactAuditValue
} from "./auditRedactionService.js";

import {
  INTEGRATION_MAX_EVENT_BYTES,
  IntegrationServiceError,
  type IntegrationActor,
  type IntegrationMachineActor,
  type IntegrationRequestContext,
  type PublishIntegrationEventInput
} from "./integrationTypes.js";

type IntegrationPublisher =
  IntegrationActor |
  IntegrationMachineActor;

const eventSelect = {
  id: true,
  organizationId: true,
  eventType: true,
  payloadVersion: true,
  entityType: true,
  entityId: true,
  payload: true,
  payloadHash: true,
  source: true,
  idempotencyKey: true,
  requestId: true,
  correlationId: true,
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
      createdAt: true
    }
  }
} satisfies
  Prisma.IntegrationEventSelect;

function isMachinePublisher(
  publisher:
    IntegrationPublisher
): publisher is
  IntegrationMachineActor {
  return "scopes" in
    publisher;
}

async function authorizePublisher(
  publisher:
    IntegrationPublisher
) {
  if (
    isMachinePublisher(
      publisher
    )
  ) {
    if (
      !publisher.scopes.has(
        "integrations.publish"
      )
    ) {
      throw new IntegrationServiceError(
        "INTEGRATION_FORBIDDEN",
        "Integration publish scope is required."
      );
    }

    return;
  }

  await loadAuthorizedIntegrationMembership(
    publisher,
    "integrations.publish"
  );
}

function canonicalize(
  value: unknown
): string {
  if (
    value ===
      null
  ) {
    return "null";
  }

  if (
    typeof value ===
      "string"
  ) {
    return JSON.stringify(
      value
    );
  }

  if (
    typeof value ===
      "number"
  ) {
    if (
      !Number.isFinite(
        value
      )
    ) {
      throw new IntegrationServiceError(
        "INTEGRATION_EVENT_INVALID",
        "Integration event payload contains an invalid number."
      );
    }

    return JSON.stringify(
      value
    );
  }

  if (
    typeof value ===
      "boolean"
  ) {
    return value
      ? "true"
      : "false";
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return `[${
      value.map(
        canonicalize
      ).join(
        ","
      )
    }]`;
  }

  if (
    typeof value ===
      "object"
  ) {
    const entries =
      Object.entries(
        value as
          Record<
            string,
            unknown
          >
      )
        .filter(
          (
            [, item]
          ) =>
            item !==
              undefined
        )
        .sort(
          (
            [left],
            [right]
          ) =>
            left.localeCompare(
              right
            )
        );

    return `{${
      entries.map(
        (
          [key, item]
        ) =>
          `${
            JSON.stringify(
              key
            )
          }:${
            canonicalize(
              item
            )
          }`
      ).join(
        ","
      )
    }`;
  }

  throw new IntegrationServiceError(
    "INTEGRATION_EVENT_INVALID",
    "Integration event payload must contain JSON-compatible values."
  );
}

function preparePayload(
  value: unknown
) {
  const redacted =
    redactAuditValue(
      value
    );

  const canonical =
    canonicalize(
      redacted
    );

  const size =
    Buffer.byteLength(
      canonical,
      "utf8"
    );

  if (
    size >
      INTEGRATION_MAX_EVENT_BYTES
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_LIMIT_EXCEEDED",
      `Integration event payload must not exceed ${INTEGRATION_MAX_EVENT_BYTES} bytes.`
    );
  }

  return {
    payload:
      redacted as
        Prisma.InputJsonValue,
    payloadHash:
      createHash(
        "sha256"
      )
        .update(
          canonical,
          "utf8"
        )
        .digest(
          "hex"
        )
  };
}

function publisherOrganizationUserId(
  publisher:
    IntegrationPublisher
) {
  return isMachinePublisher(
    publisher
  )
    ? undefined
    : publisher
        .organizationUserId;
}

function publisherUserId(
  publisher:
    IntegrationPublisher
) {
  return isMachinePublisher(
    publisher
  )
    ? undefined
    : publisher.userId;
}

function sameEventIdentity(
  existing: {
    entityType: string;
    entityId:
      string |
      null;
    payloadVersion:
      string;
    payloadHash:
      string;
  },
  expected: {
    entityType: string;
    entityId:
      string |
      null;
    payloadVersion:
      string;
    payloadHash:
      string;
  }
) {
  return (
    existing.entityType ===
      expected.entityType &&
    existing.entityId ===
      expected.entityId &&
    existing.payloadVersion ===
      expected.payloadVersion &&
    existing.payloadHash ===
      expected.payloadHash
  );
}

async function loadIdempotentEvent(
  organizationId:
    string,
  eventType:
    string,
  idempotencyKey:
    string
) {
  return prisma
    .integrationEvent
    .findUnique({
      where: {
        organizationId_eventType_idempotencyKey: {
          organizationId,
          eventType,
          idempotencyKey
        }
      },
      select:
        eventSelect
    });
}

export async function publishIntegrationEvent(
  publisher:
    IntegrationPublisher,
  input:
    PublishIntegrationEventInput,
  context:
    IntegrationRequestContext = {}
) {
  await authorizePublisher(
    publisher
  );

  const eventType =
    normalizeEventType(
      input.eventType
    );

  const definition =
    getIntegrationEventDefinition(
      eventType
    );

  const entityType =
    normalizeEntityType(
      input.entityType
    );

  if (
    entityType !==
      definition.entityType
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_EVENT_INVALID",
      "Integration event entity type does not match the registered event."
    );
  }

  const payloadVersion =
    input.payloadVersion !==
      undefined
      ? normalizeRequiredText(
          input.payloadVersion,
          "Payload version",
          32
        )
      : definition.payloadVersion;

  if (
    payloadVersion !==
      definition.payloadVersion
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_EVENT_INVALID",
      "Integration event payload version is unsupported."
    );
  }

  const entityId =
    normalizeOptionalText(
      input.entityId,
      "Entity identifier",
      128
    ) ??
    null;

  const idempotencyKey =
    normalizeOptionalText(
      input.idempotencyKey,
      "Idempotency key",
      128
    ) ??
    null;

  const occurredAt =
    input.occurredAt ??
    new Date();

  if (
    Number.isNaN(
      occurredAt.getTime()
    )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_EVENT_INVALID",
      "Integration event occurrence time is invalid."
    );
  }

  const prepared =
    preparePayload(
      input.payload
    );

  const expectedIdentity = {
    entityType,
    entityId,
    payloadVersion,
    payloadHash:
      prepared.payloadHash
  };

  if (idempotencyKey) {
    const existing =
      await loadIdempotentEvent(
        publisher.organizationId,
        eventType,
        idempotencyKey
      );

    if (existing) {
      if (
        !sameEventIdentity(
          existing,
          expectedIdentity
        )
      ) {
        throw new IntegrationServiceError(
          "INTEGRATION_IDEMPOTENCY_CONFLICT",
          "The idempotency key is already associated with different event content."
        );
      }

      return {
        event:
          existing,
        idempotent:
          true
      };
    }
  }

  const source =
    input.source ??
    (
      isMachinePublisher(
        publisher
      )
        ? IntegrationEventSource.INTEGRATION
        : IntegrationEventSource.API
    );

  const auditUserId =
    publisherUserId(
      publisher
    );

  const auditOrganizationUserId =
    publisherOrganizationUserId(
      publisher
    );

  try {
    const event =
      await prisma.$transaction(
        async (
          tx
        ) => {
          const subscriptions =
            await tx
              .webhookSubscription
              .findMany({
                where: {
                  organizationId:
                    publisher.organizationId,
                  eventType,
                  status:
                    WebhookSubscriptionStatus.ACTIVE,
                  endpoint: {
                    status:
                      WebhookEndpointStatus.ACTIVE,
                    integrationClient: {
                      status:
                        IntegrationClientStatus.ACTIVE
                    }
                  }
                },
                select: {
                  webhookEndpointId:
                    true
                },
                distinct: [
                  "webhookEndpointId"
                ]
              });

          const created =
            await tx
              .integrationEvent
              .create({
                data: {
                  organizationId:
                    publisher.organizationId,
                  eventType,
                  payloadVersion,
                  entityType,
                  entityId,
                  payload:
                    prepared.payload,
                  payloadHash:
                    prepared.payloadHash,
                  source,
                  idempotencyKey,
                  ...(context.requestId
                    ? {
                        requestId:
                          context.requestId
                      }
                    : {}),
                  ...(context.correlationId
                    ? {
                        correlationId:
                          context.correlationId
                      }
                    : {}),
                  occurredAt,
                  ...(auditOrganizationUserId
                    ? {
                        createdByOrganizationUserId:
                          auditOrganizationUserId
                      }
                    : {})
                }
              });

          if (
            subscriptions.length >
              0
          ) {
            await tx
              .webhookDelivery
              .createMany({
                data:
                  subscriptions.map(
                    (
                      subscription
                    ) => ({
                      organizationId:
                        publisher.organizationId,
                      integrationEventId:
                        created.id,
                      webhookEndpointId:
                        subscription
                          .webhookEndpointId,
                      status:
                        WebhookDeliveryStatus.PENDING,
                      nextAttemptAt:
                        new Date()
                    })
                  ),
                skipDuplicates:
                  true
              });
          }

          await createAuditLog(
            {
              organizationId:
                publisher.organizationId,
              ...(auditUserId
                ? {
                    userId:
                      auditUserId
                  }
                : {}),
              ...(auditOrganizationUserId
                ? {
                    organizationUserId:
                      auditOrganizationUserId
                  }
                : {}),
              action:
                "INTEGRATION_EVENT_PUBLISHED",
              entityType:
                "INTEGRATION_EVENT",
              entityId:
                created.id,
              category:
                AuditEventCategory.INTEGRATION,
              source:
                AuditSource.API,
              newValues: {
                eventType,
                payloadVersion,
                entityType,
                entityId,
                payloadHash:
                  prepared.payloadHash,
                deliveryCount:
                  subscriptions.length
              },
              ...(context.requestId
                ? {
                    requestId:
                      context.requestId
                  }
                : {}),
              ...(context.correlationId
                ? {
                    correlationId:
                      context.correlationId
                  }
                : {}),
              ...(context.ipAddress
                ? {
                    ipAddress:
                      context.ipAddress
                  }
                : {}),
              ...(context.userAgent
                ? {
                    userAgent:
                      context.userAgent
                  }
                : {}),
              ...(context.httpMethod
                ? {
                    httpMethod:
                      context.httpMethod
                  }
                : {}),
              ...(context.requestPath
                ? {
                    requestPath:
                      context.requestPath
                  }
                : {})
            },
            tx
          );

          return tx
            .integrationEvent
            .findUniqueOrThrow({
              where: {
                id:
                  created.id
              },
              select:
                eventSelect
            });
        }
      );

    return {
      event,
      idempotent:
        false
    };
  } catch (
    error
  ) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        "P2002" &&
      idempotencyKey
    ) {
      const existing =
        await loadIdempotentEvent(
          publisher.organizationId,
          eventType,
          idempotencyKey
        );

      if (
        existing &&
        sameEventIdentity(
          existing,
          expectedIdentity
        )
      ) {
        return {
          event:
            existing,
          idempotent:
            true
        };
      }

      throw new IntegrationServiceError(
        "INTEGRATION_IDEMPOTENCY_CONFLICT",
        "The idempotency key is already associated with different event content."
      );
    }

    if (
      error instanceof
        IntegrationServiceError
    ) {
      throw error;
    }

    throw error;
  }
}
