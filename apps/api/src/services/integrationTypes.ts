import type {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import type {
  IntegrationClientStatus,
  IntegrationEventSource,
  WebhookDeliveryStatus,
  WebhookEndpointStatus
} from "../../../../packages/database/generated/client/enums.js";

export const INTEGRATION_DEFAULT_LIMIT =
  50;

export const INTEGRATION_MAX_LIMIT =
  200;

export const INTEGRATION_MAX_CLIENTS =
  100;

export const INTEGRATION_MAX_CREDENTIALS =
  10;

export const INTEGRATION_MAX_ENDPOINTS =
  50;

export const INTEGRATION_MAX_SUBSCRIPTIONS =
  100;

export const INTEGRATION_MAX_EVENT_BYTES =
  256 * 1024;

export const INTEGRATION_DELIVERY_BATCH_LIMIT =
  100;

export const INTEGRATION_MAX_DELIVERY_ATTEMPTS =
  6;

export const INTEGRATION_MAX_RESPONSE_SUMMARY =
  2_000;

export const INTEGRATION_LEASE_SECONDS =
  60;

export const INTEGRATION_RETRY_DELAYS_MS = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  6 * 60 * 60_000
] as const;

export type IntegrationActor = {
  userId: string;
  organizationId: string;
  organizationUserId: string;
};

export type IntegrationMachineActor = {
  organizationId: string;
  integrationClientId: string;
  integrationCredentialId: string;
  clientCode: string;
  scopes: Set<string>;
};

export type IntegrationRequestContext = {
  requestId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  httpMethod?: string;
  requestPath?: string;
};

export type CreateIntegrationClientInput = {
  code: string;
  name: string;
  description?:
    string | null | undefined;
  externalSystemId?:
    string | null | undefined;
  metadata?:
    unknown;
};

export type UpdateIntegrationClientInput = {
  name?:
    string | undefined;
  description?:
    string | null | undefined;
  externalSystemId?:
    string | null | undefined;
  metadata?:
    unknown;
};

export type CreateIntegrationCredentialInput = {
  name: string;
  expiresAt?:
    Date | null | undefined;
};

export type ReplaceIntegrationScopesInput = {
  permissionIds:
    string[];
};

export type CreateWebhookEndpointInput = {
  integrationClientId: string;
  name: string;
  url: string;
  description?:
    string | null | undefined;
};

export type UpdateWebhookEndpointInput = {
  name?:
    string | undefined;
  url?:
    string | undefined;
  description?:
    string | null | undefined;
};

export type ReplaceWebhookSubscriptionsInput = {
  eventTypes:
    string[];
};

export type PublishIntegrationEventInput = {
  eventType: string;
  payloadVersion?:
    string | undefined;
  entityType: string;
  entityId?:
    string | null | undefined;
  payload: unknown;
  source?:
    IntegrationEventSource | undefined;
  idempotencyKey?:
    string | null | undefined;
  occurredAt?:
    Date | undefined;
};

export type IntegrationListInput = {
  status?:
    IntegrationClientStatus | undefined;
  search?:
    string | undefined;
  cursor?:
    string | undefined;
  limit?:
    number | undefined;
};

export type WebhookEndpointListInput = {
  integrationClientId?:
    string | undefined;
  status?:
    WebhookEndpointStatus | undefined;
  search?:
    string | undefined;
  cursor?:
    string | undefined;
  limit?:
    number | undefined;
};

export type IntegrationEventListInput = {
  eventType?:
    string | undefined;
  entityType?:
    string | undefined;
  entityId?:
    string | undefined;
  correlationId?:
    string | undefined;
  createdFrom?:
    Date | undefined;
  createdTo?:
    Date | undefined;
  cursor?:
    string | undefined;
  limit?:
    number | undefined;
};

export type WebhookDeliveryListInput = {
  integrationEventId?:
    string | undefined;
  webhookEndpointId?:
    string | undefined;
  status?:
    WebhookDeliveryStatus | undefined;
  createdFrom?:
    Date | undefined;
  createdTo?:
    Date | undefined;
  cursor?:
    string | undefined;
  limit?:
    number | undefined;
};

export type IntegrationCursor = {
  createdAt: string;
  id: string;
};

export type IntegrationWriteClient =
  Pick<
    Prisma.TransactionClient,
    | "integrationClient"
    | "integrationCredential"
    | "integrationClientPermission"
    | "webhookEndpoint"
    | "webhookSubscription"
    | "integrationEvent"
    | "webhookDelivery"
    | "webhookDeliveryAttempt"
    | "permission"
    | "organizationUser"
    | "auditLog"
  >;

export type GeneratedIntegrationCredential = {
  credential: string;
  prefix: string;
  credentialHash: string;
};

export type EncryptedIntegrationSecret = {
  plaintext: string;
  encryptedSecret: string;
  secretIv: string;
  secretAuthTag: string;
  secretKeyVersion: string;
};

export type WebhookTransportRequest = {
  url: string;
  body: string;
  headers:
    Record<string, string>;
  timeoutMs: number;
};

export type WebhookTransportResponse = {
  status: number;
  body?: string | undefined;
};

export type WebhookTransport = (
  request:
    WebhookTransportRequest
) =>
  Promise<
    WebhookTransportResponse
  >;

export class IntegrationServiceError
  extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);

    this.name =
      "IntegrationServiceError";
  }
}
