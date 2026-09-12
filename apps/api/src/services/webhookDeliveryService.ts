import {
  randomUUID
} from "node:crypto";

import {
  AuditEventCategory,
  AuditEventResult,
  AuditEventSource,
  IntegrationClientStatus,
  WebhookAttemptResult,
  WebhookDeliveryStatus,
  WebhookEndpointStatus
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  createWebhookSignature,
  decryptWebhookSecret
} from "./integrationSecurityService.js";

import {
  INTEGRATION_DELIVERY_BATCH_LIMIT,
  INTEGRATION_LEASE_SECONDS,
  INTEGRATION_MAX_DELIVERY_ATTEMPTS,
  INTEGRATION_RETRY_DELAYS_MS,
  IntegrationServiceError,
  type WebhookTransport
} from "./integrationTypes.js";

import {
  secureWebhookTransport
} from "./webhookTransportService.js";

type DeliveryWorkerOptions = {
  workerId?:
    string | undefined;
  batchSize?:
    number | undefined;
  now?:
    Date | undefined;
  transport?:
    WebhookTransport | undefined;
};

type ClaimedDelivery = {
  id: string;
};

type DeliveryOutcome = {
  result:
    WebhookAttemptResult;
  httpStatus:
    number |
    null;
  errorCode:
    string |
    null;
  errorMessage:
    string |
    null;
  responseSummary:
    string |
    null;
};

function normalizeBatchSize(
  value:
    number |
    undefined
) {
  if (
    value ===
      undefined
  ) {
    return 25;
  }

  if (
    !Number.isInteger(
      value
    ) ||
    value < 1 ||
    value >
      INTEGRATION_DELIVERY_BATCH_LIMIT
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_WORKER_INVALID",
      `Delivery batch size must be from 1 to ${INTEGRATION_DELIVERY_BATCH_LIMIT}.`
    );
  }

  return value;
}

function safeErrorMessage(
  error: unknown
) {
  const message =
    error instanceof
      Error
      ? error.message
      : "Webhook transport failed.";

  return message
    .replace(
      /[\u0000-\u001f\u007f]+/g,
      " "
    )
    .trim()
    .slice(
      0,
      1_000
    ) ||
    "Webhook transport failed.";
}

function responseSummary(
  body:
    string |
    undefined
) {
  if (
    body ===
      undefined
  ) {
    return null;
  }

  return `Remote response contained ${Buffer.byteLength(
    body,
    "utf8"
  )} bytes.`;
}

function eventBody(
  event: {
    id: string;
    eventType: string;
    payloadVersion:
      string;
    entityType:
      string;
    entityId:
      string |
      null;
    occurredAt:
      Date;
    payload:
      unknown;
  }
) {
  return JSON.stringify({
    id:
      event.id,
    eventType:
      event.eventType,
    payloadVersion:
      event.payloadVersion,
    occurredAt:
      event.occurredAt
        .toISOString(),
    entity: {
      type:
        event.entityType,
      id:
        event.entityId
    },
    payload:
      event.payload
  });
}

function nextRetryTime(
  attemptNumber:
    number,
  completedAt:
    Date
) {
  const delay =
    INTEGRATION_RETRY_DELAYS_MS[
      attemptNumber - 1
    ];

  if (
    delay ===
      undefined
  ) {
    return null;
  }

  return new Date(
    completedAt.getTime() +
    delay
  );
}

async function claimWebhookDeliveries(
  workerId:
    string,
  batchSize:
    number,
  now:
    Date
) {
  const leaseExpiresAt =
    new Date(
      now.getTime() +
      INTEGRATION_LEASE_SECONDS *
        1_000
    );

  const candidates =
    await prisma
      .webhookDelivery
      .findMany({
        where: {
          endpoint: {
            status:
              WebhookEndpointStatus.ACTIVE,
            integrationClient: {
              status:
                IntegrationClientStatus.ACTIVE
            }
          },
          OR: [
            {
              status: {
                in: [
                  WebhookDeliveryStatus.PENDING,
                  WebhookDeliveryStatus.FAILED
                ]
              },
              OR: [
                {
                  nextAttemptAt:
                    null
                },
                {
                  nextAttemptAt: {
                    lte:
                      now
                  }
                }
              ]
            },
            {
              status:
                WebhookDeliveryStatus.PROCESSING,
              leaseExpiresAt: {
                lte:
                  now
              }
            }
          ]
        },
        orderBy: [
          {
            nextAttemptAt:
              "asc"
          },
          {
            createdAt:
              "asc"
          },
          {
            id:
              "asc"
          }
        ],
        take:
          batchSize,
        select: {
          id: true
        }
      });

  const claimed:
    ClaimedDelivery[] = [];

  for (
    const candidate
    of candidates
  ) {
    const result =
      await prisma
        .webhookDelivery
        .updateMany({
          where: {
            id:
              candidate.id,
            endpoint: {
              status:
                WebhookEndpointStatus.ACTIVE,
              integrationClient: {
                status:
                  IntegrationClientStatus.ACTIVE
              }
            },
            OR: [
              {
                status: {
                  in: [
                    WebhookDeliveryStatus.PENDING,
                    WebhookDeliveryStatus.FAILED
                  ]
                },
                OR: [
                  {
                    nextAttemptAt:
                      null
                  },
                  {
                    nextAttemptAt: {
                      lte:
                        now
                    }
                  }
                ]
              },
              {
                status:
                  WebhookDeliveryStatus.PROCESSING,
                leaseExpiresAt: {
                  lte:
                    now
                }
              }
            ]
          },
          data: {
            status:
              WebhookDeliveryStatus.PROCESSING,
            leaseOwner:
              workerId,
            leaseExpiresAt
          }
        });

    if (
      result.count ===
        1
    ) {
      claimed.push({
        id:
          candidate.id
      });
    }
  }

  return claimed;
}

async function performDelivery(
  transport:
    WebhookTransport,
  input: {
    url: string;
    secret: string;
    eventId: string;
    deliveryId: string;
    eventType: string;
    timestamp: string;
    body: string;
  }
):
  Promise<
    DeliveryOutcome
  > {
  const signature =
    createWebhookSignature(
      input.secret,
      input.timestamp,
      input.body
    );

  try {
    const response =
      await transport({
        url:
          input.url,
        body:
          input.body,
        timeoutMs:
          15_000,
        headers: {
          "content-type":
            "application/json",
          "content-length":
            String(
              Buffer.byteLength(
                input.body,
                "utf8"
              )
            ),
          "x-ornexis-event-id":
            input.eventId,
          "x-ornexis-delivery-id":
            input.deliveryId,
          "x-ornexis-event-type":
            input.eventType,
          "x-ornexis-timestamp":
            input.timestamp,
          "x-ornexis-signature":
            signature
        }
      });

    if (
      response.status >=
        200 &&
      response.status <=
        299
    ) {
      return {
        result:
          WebhookAttemptResult.DELIVERED,
        httpStatus:
          response.status,
        errorCode:
          null,
        errorMessage:
          null,
        responseSummary:
          responseSummary(
            response.body
          )
      };
    }

    return {
      result:
        WebhookAttemptResult.HTTP_FAILURE,
      httpStatus:
        response.status,
      errorCode:
        `HTTP_${response.status}`,
      errorMessage:
        "The webhook destination returned a non-success status.",
      responseSummary:
        responseSummary(
          response.body
        )
    };
  } catch (
    error
  ) {
    return {
      result:
        WebhookAttemptResult.TRANSPORT_FAILURE,
      httpStatus:
        null,
      errorCode:
        "TRANSPORT_FAILURE",
      errorMessage:
        safeErrorMessage(
          error
        ),
      responseSummary:
        null
    };
  }
}

async function processClaimedDelivery(
  deliveryId:
    string,
  workerId:
    string,
  startedAt:
    Date,
  transport:
    WebhookTransport
) {
  const delivery =
    await prisma
      .webhookDelivery
      .findFirst({
        where: {
          id:
            deliveryId,
          status:
            WebhookDeliveryStatus.PROCESSING,
          leaseOwner:
            workerId
        },
        include: {
          event:
            true,
          endpoint: {
            include: {
              integrationClient:
                true
            }
          }
        }
      });

  if (!delivery) {
    return {
      status:
        "SKIPPED" as const,
      deliveryId
    };
  }

  if (
    delivery.endpoint.status !==
      WebhookEndpointStatus.ACTIVE ||
    delivery.endpoint
      .integrationClient
      .status !==
      IntegrationClientStatus.ACTIVE
  ) {
    const terminalAt =
      new Date(
        Math.max(
          Date.now(),
          startedAt.getTime()
        )
      );

    await prisma
      .webhookDelivery
      .updateMany({
        where: {
          id:
            delivery.id,
          status:
            WebhookDeliveryStatus.PROCESSING,
          leaseOwner:
            workerId
        },
        data: {
          status:
            WebhookDeliveryStatus.CANCELLED,
          terminalAt,
          nextAttemptAt:
            null,
          leaseOwner:
            null,
          leaseExpiresAt:
            null,
          lastErrorCode:
            "ENDPOINT_INACTIVE",
          lastErrorMessage:
            "The webhook endpoint or integration client is inactive."
        }
      });

    return {
      status:
        "CANCELLED" as const,
      deliveryId:
        delivery.id
    };
  }

  const body =
    eventBody(
      delivery.event
    );

  const timestamp =
    Math.floor(
      startedAt.getTime() /
      1_000
    ).toString();

  let outcome:
    DeliveryOutcome;

  try {
    const secret =
      decryptWebhookSecret({
        encryptedSecret:
          delivery.endpoint
            .encryptedSecret,
        secretIv:
          delivery.endpoint
            .secretIv,
        secretAuthTag:
          delivery.endpoint
            .secretAuthTag,
        secretKeyVersion:
          delivery.endpoint
            .secretKeyVersion
      });

    outcome =
      await performDelivery(
        transport,
        {
          url:
            delivery.endpoint.url,
          secret,
          eventId:
            delivery.event.id,
          deliveryId:
            delivery.id,
          eventType:
            delivery.event
              .eventType,
          timestamp,
          body
        }
      );
  } catch (
    error
  ) {
    outcome = {
      result:
        WebhookAttemptResult.SECURITY_REJECTED,
      httpStatus:
        null,
      errorCode:
        "SECRET_UNAVAILABLE",
      errorMessage:
        safeErrorMessage(
          error
        ),
      responseSummary:
        null
    };
  }

  const completedAt =
    new Date(
      Math.max(
        Date.now(),
        startedAt.getTime()
      )
    );

  const durationMs =
    Math.max(
      0,
      completedAt.getTime() -
      startedAt.getTime()
    );

  const attemptNumber =
    delivery.attemptCount +
    1;

  const delivered =
    outcome.result ===
      WebhookAttemptResult.DELIVERED;

  const deadLetter =
    !delivered &&
    attemptNumber >=
      INTEGRATION_MAX_DELIVERY_ATTEMPTS;

  const nextAttemptAt =
    delivered ||
    deadLetter
      ? null
      : nextRetryTime(
          attemptNumber,
          completedAt
        );

  const nextStatus =
    delivered
      ? WebhookDeliveryStatus.DELIVERED
      : deadLetter
        ? WebhookDeliveryStatus.DEAD_LETTER
        : WebhookDeliveryStatus.FAILED;

  return prisma.$transaction(
    async (
      tx
    ) => {
      const changed =
        await tx
          .webhookDelivery
          .updateMany({
            where: {
              id:
                delivery.id,
              organizationId:
                delivery.organizationId,
              status:
                WebhookDeliveryStatus.PROCESSING,
              leaseOwner:
                workerId
            },
            data: {
              status:
                nextStatus,
              attemptCount:
                attemptNumber,
              nextAttemptAt,
              leaseOwner:
                null,
              leaseExpiresAt:
                null,
              lastHttpStatus:
                outcome.httpStatus,
              lastErrorCode:
                outcome.errorCode,
              lastErrorMessage:
                outcome.errorMessage,
              firstAttemptAt:
                delivery.firstAttemptAt ??
                startedAt,
              deliveredAt:
                delivered
                  ? completedAt
                  : null,
              terminalAt:
                delivered ||
                deadLetter
                  ? completedAt
                  : null
            }
          });

      if (
        changed.count !==
          1
      ) {
        throw new IntegrationServiceError(
          "INTEGRATION_DELIVERY_CONFLICT",
          "The webhook delivery lease is no longer owned by this worker."
        );
      }

      await tx
        .webhookDeliveryAttempt
        .create({
          data: {
            organizationId:
              delivery.organizationId,
            webhookDeliveryId:
              delivery.id,
            attemptNumber,
            result:
              outcome.result,
            startedAt,
            completedAt,
            durationMs,
            httpStatus:
              outcome.httpStatus,
            errorCode:
              outcome.errorCode,
            errorMessage:
              outcome.errorMessage,
            responseSummary:
              outcome.responseSummary,
            requestTimestamp:
              timestamp
          }
        });

      if (delivered) {
        await tx
          .webhookEndpoint
          .update({
            where: {
              id:
                delivery.endpoint.id
            },
            data: {
              lastSuccessfulDeliveryAt:
                completedAt
            }
          });
      }

      if (
        delivered ||
        deadLetter
      ) {
        await createAuditLog(
          {
            organizationId:
              delivery.organizationId,
            action:
              delivered
                ? "WEBHOOK_DELIVERY_SUCCEEDED"
                : "WEBHOOK_DELIVERY_DEAD_LETTERED",
            entityType:
              "WEBHOOK_DELIVERY",
            entityId:
              delivery.id,
            category:
              AuditEventCategory.INTEGRATION,
            source:
              AuditEventSource.SYSTEM,
            result:
              delivered
                ? AuditEventResult.SUCCESS
                : AuditEventResult.FAILURE,
            newValues: {
              eventId:
                delivery.event.id,
              endpointId:
                delivery.endpoint.id,
              status:
                nextStatus,
              attemptNumber,
              httpStatus:
                outcome.httpStatus,
              errorCode:
                outcome.errorCode
            }
          },
          tx
        );
      }

      return {
        status:
          nextStatus,
        deliveryId:
          delivery.id,
        attemptNumber,
        nextAttemptAt
      };
    }
  );
}

export async function processWebhookDeliveries(
  options:
    DeliveryWorkerOptions = {}
) {
  const workerId =
    options.workerId ??
    randomUUID();

  const batchSize =
    normalizeBatchSize(
      options.batchSize
    );

  const now =
    options.now ??
    new Date();

  if (
    Number.isNaN(
      now.getTime()
    )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_WORKER_INVALID",
      "Delivery worker time is invalid."
    );
  }

  const transport =
    options.transport ??
    secureWebhookTransport;

  const claimed =
    await claimWebhookDeliveries(
      workerId,
      batchSize,
      now
    );

  const results:
    Array<
      Record<
        string,
        unknown
      >
    > = [];

  for (
    const delivery
    of claimed
  ) {
    try {
      const result =
        await processClaimedDelivery(
          delivery.id,
          workerId,
          now,
          transport
        );

      results.push(
        result
      );
    } catch (
      error
    ) {
      const message =
        safeErrorMessage(
          error
        );

      await prisma
        .webhookDelivery
        .updateMany({
          where: {
            id:
              delivery.id,
            status:
              WebhookDeliveryStatus.PROCESSING,
            leaseOwner:
              workerId
          },
          data: {
            status:
              WebhookDeliveryStatus.FAILED,
            nextAttemptAt:
              now,
            leaseOwner:
              null,
            leaseExpiresAt:
              null,
            lastErrorCode:
              "WORKER_FAILURE",
            lastErrorMessage:
              message
          }
        });

      results.push({
        status:
          "WORKER_FAILURE",
        deliveryId:
          delivery.id,
        error:
          message
      });
    }
  }

  return {
    workerId,
    claimed:
      claimed.length,
    processed:
      results.length,
    results
  };
}
