import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  AuditEventCategory,
  AuditEventSource,
  IntegrationClientStatus,
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
  loadAuthorizedIntegrationClient,
  loadAuthorizedIntegrationMembership,
  loadAuthorizedWebhookEndpoint,
  requireIntegrationPermissions
} from "./integrationAuthorizationService.js";

import {
  getIntegrationEventDefinition
} from "./integrationEventRegistry.js";

import {
  normalizeOptionalText,
  normalizeRequiredText,
  validateIntegrationLimit
} from "./integrationIdentityService.js";

import {
  encryptWebhookSecret
} from "./integrationSecurityService.js";

import {
  INTEGRATION_DEFAULT_LIMIT,
  INTEGRATION_MAX_ENDPOINTS,
  INTEGRATION_MAX_LIMIT,
  INTEGRATION_MAX_SUBSCRIPTIONS,
  IntegrationServiceError,
  type CreateWebhookEndpointInput,
  type IntegrationActor,
  type IntegrationRequestContext,
  type ReplaceWebhookSubscriptionsInput,
  type UpdateWebhookEndpointInput,
  type WebhookEndpointListInput
} from "./integrationTypes.js";

import {
  validateWebhookDestination,
  type WebhookAddressResolver
} from "./webhookDestinationSecurityService.js";

const endpointSelect = {
  id: true,
  organizationId: true,
  integrationClientId:
    true,
  name: true,
  url: true,
  description: true,
  secretKeyVersion:
    true,
  status: true,
  createdByOrganizationUserId:
    true,
  createdAt: true,
  updatedAt: true,
  disabledAt: true,
  lastSuccessfulDeliveryAt:
    true,
  integrationClient: {
    select: {
      id: true,
      code: true,
      name: true,
      status: true
    }
  },
  _count: {
    select: {
      subscriptions:
        true,
      deliveries:
        true
    }
  }
} satisfies
  Prisma.WebhookEndpointSelect;

function translateWebhookConfigurationError(
  error: unknown
): never {
  if (
    error instanceof
      IntegrationServiceError
  ) {
    throw error;
  }

  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (
      error.code ===
        "P2002"
    ) {
      throw new IntegrationServiceError(
        "INTEGRATION_DUPLICATE",
        "The webhook configuration already exists."
      );
    }

    if (
      error.code ===
        "P2003"
    ) {
      throw new IntegrationServiceError(
        "INTEGRATION_CONFLICT",
        "The webhook configuration is still in use."
      );
    }
  }

  throw error;
}

function auditContext(
  context:
    IntegrationRequestContext
) {
  return {
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
  };
}

export async function listWebhookEndpoints(
  actor:
    IntegrationActor,
  input:
    WebhookEndpointListInput
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.view"
  );

  const limit =
    validateIntegrationLimit(
      input.limit,
      INTEGRATION_DEFAULT_LIMIT,
      INTEGRATION_MAX_LIMIT
    );

  return prisma
    .webhookEndpoint
    .findMany({
      where: {
        organizationId:
          actor.organizationId,
        ...(input.integrationClientId
          ? {
              integrationClientId:
                input.integrationClientId
            }
          : {}),
        ...(input.status
          ? {
              status:
                input.status
            }
          : {}),
        ...(input.search
          ? {
              OR: [
                {
                  name: {
                    contains:
                      input.search,
                    mode:
                      "insensitive"
                  }
                },
                {
                  url: {
                    contains:
                      input.search,
                    mode:
                      "insensitive"
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
        limit,
      select:
        endpointSelect
    });
}

export async function getWebhookEndpoint(
  actor:
    IntegrationActor,
  webhookEndpointId:
    string
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.view"
  );

  const endpoint =
    await prisma
      .webhookEndpoint
      .findFirst({
        where: {
          id:
            webhookEndpointId,
          organizationId:
            actor.organizationId
        },
        select:
          endpointSelect
      });

  if (!endpoint) {
    throw new IntegrationServiceError(
      "INTEGRATION_NOT_FOUND",
      "Webhook endpoint was not found."
    );
  }

  return endpoint;
}

export async function createWebhookEndpoint(
  actor:
    IntegrationActor,
  input:
    CreateWebhookEndpointInput,
  context:
    IntegrationRequestContext = {},
  resolver?:
    WebhookAddressResolver
) {
  await requireIntegrationPermissions(
    actor,
    [
      "integrations.webhooks",
      "integrations.credentials"
    ]
  );

  const client =
    await loadAuthorizedIntegrationClient(
      actor,
      input.integrationClientId
    );

  if (
    client.status !==
      IntegrationClientStatus.ACTIVE
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "Webhook endpoints require an active integration client."
    );
  }

  const name =
    normalizeRequiredText(
      input.name,
      "Webhook endpoint name",
      200
    );

  const description =
    normalizeOptionalText(
      input.description,
      "Webhook endpoint description",
      2_000
    );

  const destination =
    resolver
      ? await validateWebhookDestination(
          input.url,
          resolver
        )
      : await validateWebhookDestination(
          input.url
        );

  const secret =
    encryptWebhookSecret();

  try {
    const endpoint =
      await prisma.$transaction(
        async (
          tx
        ) => {
          const count =
            await tx
              .webhookEndpoint
              .count({
                where: {
                  organizationId:
                    actor.organizationId,
                  integrationClientId:
                    client.id
                }
              });

          if (
            count >=
              INTEGRATION_MAX_ENDPOINTS
          ) {
            throw new IntegrationServiceError(
              "INTEGRATION_LIMIT_EXCEEDED",
              `An integration client may have at most ${INTEGRATION_MAX_ENDPOINTS} webhook endpoints.`
            );
          }

          const created =
            await tx
              .webhookEndpoint
              .create({
                data: {
                  organizationId:
                    actor.organizationId,
                  integrationClientId:
                    client.id,
                  name,
                  url:
                    destination.url,
                  ...(description !==
                  undefined
                    ? {
                        description
                      }
                    : {}),
                  encryptedSecret:
                    secret.encryptedSecret,
                  secretIv:
                    secret.secretIv,
                  secretAuthTag:
                    secret.secretAuthTag,
                  secretKeyVersion:
                    secret.secretKeyVersion,
                  createdByOrganizationUserId:
                    actor.organizationUserId
                },
                select:
                  endpointSelect
              });

          await createAuditLog(
            {
              organizationId:
                actor.organizationId,
              userId:
                actor.userId,
              organizationUserId:
                actor.organizationUserId,
              action:
                "WEBHOOK_ENDPOINT_CREATED",
              entityType:
                "WEBHOOK_ENDPOINT",
              entityId:
                created.id,
              category:
                AuditEventCategory.INTEGRATION,
              source:
                AuditEventSource.API,
              newValues: {
                integrationClientId:
                  created.integrationClientId,
                name:
                  created.name,
                url:
                  created.url,
                status:
                  created.status,
                secretKeyVersion:
                  created.secretKeyVersion
              },
              ...auditContext(
                context
              )
            },
            tx
          );

          return created;
        }
      );

    return {
      ...endpoint,
      signingSecret:
        secret.plaintext
    };
  } catch (
    error
  ) {
    translateWebhookConfigurationError(
      error
    );
  }
}

export async function updateWebhookEndpoint(
  actor:
    IntegrationActor,
  webhookEndpointId:
    string,
  input:
    UpdateWebhookEndpointInput,
  context:
    IntegrationRequestContext = {},
  resolver?:
    WebhookAddressResolver
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.webhooks"
  );

  const existing =
    await loadAuthorizedWebhookEndpoint(
      actor,
      webhookEndpointId
    );

  const name =
    input.name !==
      undefined
      ? normalizeRequiredText(
          input.name,
          "Webhook endpoint name",
          200
        )
      : undefined;

  const description =
    normalizeOptionalText(
      input.description,
      "Webhook endpoint description",
      2_000
    );

  const destination =
    input.url !==
      undefined
      ? resolver
        ? await validateWebhookDestination(
            input.url,
            resolver
          )
        : await validateWebhookDestination(
            input.url
          )
      : undefined;

  try {
    return await prisma.$transaction(
      async (
        tx
      ) => {
        const updated =
          await tx
            .webhookEndpoint
            .update({
              where: {
                id:
                  existing.id
              },
              data: {
                ...(name !==
                undefined
                  ? {
                      name
                    }
                  : {}),
                ...(description !==
                undefined
                  ? {
                      description
                    }
                  : {}),
                ...(destination
                  ? {
                      url:
                        destination.url
                    }
                  : {})
              },
              select:
                endpointSelect
            });

        await createAuditLog(
          {
            organizationId:
              actor.organizationId,
            userId:
              actor.userId,
            organizationUserId:
              actor.organizationUserId,
            action:
              "WEBHOOK_ENDPOINT_UPDATED",
            entityType:
              "WEBHOOK_ENDPOINT",
            entityId:
              updated.id,
            category:
              AuditEventCategory.INTEGRATION,
            source:
              AuditEventSource.API,
            oldValues: {
              name:
                existing.name,
              url:
                existing.url,
              description:
                existing.description
            },
            newValues: {
              name:
                updated.name,
              url:
                updated.url,
              description:
                updated.description
            },
            ...auditContext(
              context
            )
          },
          tx
        );

        return updated;
      }
    );
  } catch (
    error
  ) {
    translateWebhookConfigurationError(
      error
    );
  }
}

export async function disableWebhookEndpoint(
  actor:
    IntegrationActor,
  webhookEndpointId:
    string,
  context:
    IntegrationRequestContext = {}
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.webhooks"
  );

  const existing =
    await loadAuthorizedWebhookEndpoint(
      actor,
      webhookEndpointId
    );

  if (
    existing.status !==
      WebhookEndpointStatus.ACTIVE
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "Only an active webhook endpoint may be disabled."
    );
  }

  const now =
    new Date();

  try {
    return await prisma.$transaction(
      async (
        tx
      ) => {
        const changed =
          await tx
            .webhookEndpoint
            .updateMany({
              where: {
                id:
                  existing.id,
                organizationId:
                  actor.organizationId,
                status:
                  WebhookEndpointStatus.ACTIVE
              },
              data: {
                status:
                  WebhookEndpointStatus.DISABLED,
                disabledAt:
                  now
              }
            });

        if (
          changed.count !==
            1
        ) {
          throw new IntegrationServiceError(
            "INTEGRATION_STATE_CONFLICT",
            "The webhook endpoint changed concurrently."
          );
        }

        const updated =
          await tx
            .webhookEndpoint
            .findUniqueOrThrow({
              where: {
                id:
                  existing.id
              },
              select:
                endpointSelect
            });

        await createAuditLog(
          {
            organizationId:
              actor.organizationId,
            userId:
              actor.userId,
            organizationUserId:
              actor.organizationUserId,
            action:
              "WEBHOOK_ENDPOINT_DISABLED",
            entityType:
              "WEBHOOK_ENDPOINT",
            entityId:
              updated.id,
            category:
              AuditEventCategory.INTEGRATION,
            source:
              AuditEventSource.API,
            oldValues: {
              status:
                existing.status
            },
            newValues: {
              status:
                updated.status,
              disabledAt:
                updated.disabledAt
            },
            ...auditContext(
              context
            )
          },
          tx
        );

        return updated;
      }
    );
  } catch (
    error
  ) {
    translateWebhookConfigurationError(
      error
    );
  }
}

export async function activateWebhookEndpoint(
  actor:
    IntegrationActor,
  webhookEndpointId:
    string,
  context:
    IntegrationRequestContext = {},
  resolver?:
    WebhookAddressResolver
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.webhooks"
  );

  const existing =
    await loadAuthorizedWebhookEndpoint(
      actor,
      webhookEndpointId
    );

  if (
    existing.status !==
      WebhookEndpointStatus.DISABLED
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "Only a disabled webhook endpoint may be activated."
    );
  }

  const client =
    await loadAuthorizedIntegrationClient(
      actor,
      existing.integrationClientId
    );

  if (
    client.status !==
      IntegrationClientStatus.ACTIVE
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "Webhook activation requires an active integration client."
    );
  }

  if (resolver) {
    await validateWebhookDestination(
      existing.url,
      resolver
    );
  } else {
    await validateWebhookDestination(
      existing.url
    );
  }

  try {
    return await prisma.$transaction(
      async (
        tx
      ) => {
        const changed =
          await tx
            .webhookEndpoint
            .updateMany({
              where: {
                id:
                  existing.id,
                organizationId:
                  actor.organizationId,
                status:
                  WebhookEndpointStatus.DISABLED
              },
              data: {
                status:
                  WebhookEndpointStatus.ACTIVE,
                disabledAt:
                  null
              }
            });

        if (
          changed.count !==
            1
        ) {
          throw new IntegrationServiceError(
            "INTEGRATION_STATE_CONFLICT",
            "The webhook endpoint changed concurrently."
          );
        }

        const updated =
          await tx
            .webhookEndpoint
            .findUniqueOrThrow({
              where: {
                id:
                  existing.id
              },
              select:
                endpointSelect
            });

        await createAuditLog(
          {
            organizationId:
              actor.organizationId,
            userId:
              actor.userId,
            organizationUserId:
              actor.organizationUserId,
            action:
              "WEBHOOK_ENDPOINT_ACTIVATED",
            entityType:
              "WEBHOOK_ENDPOINT",
            entityId:
              updated.id,
            category:
              AuditEventCategory.INTEGRATION,
            source:
              AuditEventSource.API,
            oldValues: {
              status:
                existing.status
            },
            newValues: {
              status:
                updated.status
            },
            ...auditContext(
              context
            )
          },
          tx
        );

        return updated;
      }
    );
  } catch (
    error
  ) {
    translateWebhookConfigurationError(
      error
    );
  }
}

export async function rotateWebhookEndpointSecret(
  actor:
    IntegrationActor,
  webhookEndpointId:
    string,
  context:
    IntegrationRequestContext = {}
) {
  await requireIntegrationPermissions(
    actor,
    [
      "integrations.webhooks",
      "integrations.credentials"
    ]
  );

  const existing =
    await loadAuthorizedWebhookEndpoint(
      actor,
      webhookEndpointId
    );

  const client =
    await loadAuthorizedIntegrationClient(
      actor,
      existing.integrationClientId
    );

  if (
    client.status ===
      IntegrationClientStatus.REVOKED
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "Secrets cannot be rotated for a revoked integration client."
    );
  }

  const secret =
    encryptWebhookSecret();

  try {
    const endpoint =
      await prisma.$transaction(
        async (
          tx
        ) => {
          const updated =
            await tx
              .webhookEndpoint
              .update({
                where: {
                  id:
                    existing.id
                },
                data: {
                  encryptedSecret:
                    secret.encryptedSecret,
                  secretIv:
                    secret.secretIv,
                  secretAuthTag:
                    secret.secretAuthTag,
                  secretKeyVersion:
                    secret.secretKeyVersion
                },
                select:
                  endpointSelect
              });

          await createAuditLog(
            {
              organizationId:
                actor.organizationId,
              userId:
                actor.userId,
              organizationUserId:
                actor.organizationUserId,
              action:
                "WEBHOOK_SECRET_ROTATED",
              entityType:
                "WEBHOOK_ENDPOINT",
              entityId:
                updated.id,
              category:
                AuditEventCategory.INTEGRATION,
              source:
                AuditEventSource.API,
              oldValues: {
                secretKeyVersion:
                  existing.secretKeyVersion
              },
              newValues: {
                secretKeyVersion:
                  updated.secretKeyVersion
              },
              ...auditContext(
                context
              )
            },
            tx
          );

          return updated;
        }
      );

    return {
      ...endpoint,
      signingSecret:
        secret.plaintext
    };
  } catch (
    error
  ) {
    translateWebhookConfigurationError(
      error
    );
  }
}

export async function listWebhookSubscriptions(
  actor:
    IntegrationActor,
  webhookEndpointId:
    string
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.view"
  );

  await loadAuthorizedWebhookEndpoint(
    actor,
    webhookEndpointId
  );

  return prisma
    .webhookSubscription
    .findMany({
      where: {
        organizationId:
          actor.organizationId,
        webhookEndpointId
      },
      orderBy: {
        eventType:
          "asc"
      },
      select: {
        id: true,
        organizationId:
          true,
        webhookEndpointId:
          true,
        eventType: true,
        payloadVersion:
          true,
        status: true,
        createdByOrganizationUserId:
          true,
        createdAt: true,
        updatedAt: true
      }
    });
}

export async function replaceWebhookSubscriptions(
  actor:
    IntegrationActor,
  webhookEndpointId:
    string,
  input:
    ReplaceWebhookSubscriptionsInput,
  context:
    IntegrationRequestContext = {}
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.webhooks"
  );

  const endpoint =
    await loadAuthorizedWebhookEndpoint(
      actor,
      webhookEndpointId
    );

  const eventTypes = [
    ...new Set(
      input.eventTypes.map(
        (
          eventType
        ) =>
          eventType
            .trim()
            .toLowerCase()
      )
    )
  ];

  if (
    eventTypes.length >
      INTEGRATION_MAX_SUBSCRIPTIONS
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_LIMIT_EXCEEDED",
      `An endpoint may have at most ${INTEGRATION_MAX_SUBSCRIPTIONS} subscriptions.`
    );
  }

  const definitions =
    eventTypes.map(
      (
        eventType
      ) =>
        getIntegrationEventDefinition(
          eventType
        )
    );

  try {
    return await prisma.$transaction(
      async (
        tx
      ) => {
        const previous =
          await tx
            .webhookSubscription
            .findMany({
              where: {
                organizationId:
                  actor.organizationId,
                webhookEndpointId:
                  endpoint.id,
                status:
                  WebhookSubscriptionStatus.ACTIVE
              },
              orderBy: {
                eventType:
                  "asc"
              }
            });

        await tx
          .webhookSubscription
          .updateMany({
            where: {
              organizationId:
                actor.organizationId,
              webhookEndpointId:
                endpoint.id,
              status:
                WebhookSubscriptionStatus.ACTIVE
            },
            data: {
              status:
                WebhookSubscriptionStatus.INACTIVE
            }
          });

        for (
          const definition
          of definitions
        ) {
          await tx
            .webhookSubscription
            .upsert({
              where: {
                webhookEndpointId_eventType: {
                  webhookEndpointId:
                    endpoint.id,
                  eventType:
                    definition.eventType
                }
              },
              create: {
                organizationId:
                  actor.organizationId,
                webhookEndpointId:
                  endpoint.id,
                eventType:
                  definition.eventType,
                payloadVersion:
                  definition.payloadVersion,
                status:
                  WebhookSubscriptionStatus.ACTIVE,
                createdByOrganizationUserId:
                  actor.organizationUserId
              },
              update: {
                payloadVersion:
                  definition.payloadVersion,
                status:
                  WebhookSubscriptionStatus.ACTIVE
              }
            });
        }

        const updated =
          await tx
            .webhookSubscription
            .findMany({
              where: {
                organizationId:
                  actor.organizationId,
                webhookEndpointId:
                  endpoint.id
              },
              orderBy: {
                eventType:
                  "asc"
              },
              select: {
                id: true,
                organizationId:
                  true,
                webhookEndpointId:
                  true,
                eventType: true,
                payloadVersion:
                  true,
                status: true,
                createdByOrganizationUserId:
                  true,
                createdAt: true,
                updatedAt: true
              }
            });

        await createAuditLog(
          {
            organizationId:
              actor.organizationId,
            userId:
              actor.userId,
            organizationUserId:
              actor.organizationUserId,
            action:
              "WEBHOOK_SUBSCRIPTIONS_REPLACED",
            entityType:
              "WEBHOOK_ENDPOINT",
            entityId:
              endpoint.id,
            category:
              AuditEventCategory.INTEGRATION,
            source:
              AuditEventSource.API,
            oldValues: {
              eventTypes:
                previous.map(
                  (
                    item
                  ) =>
                    item.eventType
                )
            },
            newValues: {
              eventTypes
            },
            ...auditContext(
              context
            )
          },
          tx
        );

        return updated;
      }
    );
  } catch (
    error
  ) {
    translateWebhookConfigurationError(
      error
    );
  }
}
