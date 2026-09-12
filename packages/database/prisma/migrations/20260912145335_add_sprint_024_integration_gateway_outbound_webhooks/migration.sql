-- CreateEnum
CREATE TYPE "IntegrationClientStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "IntegrationCredentialStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WebhookEndpointStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "WebhookSubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "IntegrationEventSource" AS ENUM ('API', 'APPLICATION', 'SYSTEM', 'JOB', 'INTEGRATION');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'DEAD_LETTER', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WebhookAttemptResult" AS ENUM ('DELIVERED', 'HTTP_FAILURE', 'TRANSPORT_FAILURE', 'SECURITY_REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "integration_assignable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "integration_clients" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" VARCHAR(128) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "IntegrationClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "external_system_id" VARCHAR(200),
    "metadata" JSONB,
    "created_by_organization_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "suspended_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "integration_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_credentials" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "integration_client_id" UUID NOT NULL,
    "prefix" VARCHAR(64) NOT NULL,
    "credential_hash" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" "IntegrationCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_by_organization_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_client_permissions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "integration_client_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "assigned_by_organization_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_client_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "integration_client_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "description" TEXT,
    "encrypted_secret" TEXT NOT NULL,
    "secret_iv" VARCHAR(64) NOT NULL,
    "secret_auth_tag" VARCHAR(64) NOT NULL,
    "secret_key_version" VARCHAR(64) NOT NULL,
    "status" "WebhookEndpointStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_organization_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "disabled_at" TIMESTAMP(3),
    "last_successful_delivery_at" TIMESTAMP(3),

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_subscriptions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "webhook_endpoint_id" UUID NOT NULL,
    "event_type" VARCHAR(128) NOT NULL,
    "payload_version" VARCHAR(32) NOT NULL DEFAULT '1',
    "status" "WebhookSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_organization_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "event_type" VARCHAR(128) NOT NULL,
    "payload_version" VARCHAR(32) NOT NULL DEFAULT '1',
    "entity_type" VARCHAR(128) NOT NULL,
    "entity_id" VARCHAR(128),
    "payload" JSONB NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "source" "IntegrationEventSource" NOT NULL DEFAULT 'APPLICATION',
    "idempotency_key" VARCHAR(128),
    "request_id" VARCHAR(128),
    "correlation_id" VARCHAR(128),
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_organization_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "integration_event_id" UUID NOT NULL,
    "webhook_endpoint_id" UUID NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "lease_owner" VARCHAR(128),
    "lease_expires_at" TIMESTAMP(3),
    "last_http_status" INTEGER,
    "last_error_code" VARCHAR(128),
    "last_error_message" VARCHAR(1000),
    "first_attempt_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "terminal_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_delivery_attempts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "webhook_delivery_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "result" "WebhookAttemptResult" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "http_status" INTEGER,
    "error_code" VARCHAR(128),
    "error_message" VARCHAR(1000),
    "response_summary" VARCHAR(2000),
    "request_timestamp" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integration_clients_organization_id_status_created_at_idx" ON "integration_clients"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "integration_clients_organization_id_external_system_id_idx" ON "integration_clients"("organization_id", "external_system_id");

-- CreateIndex
CREATE INDEX "integration_clients_created_by_organization_user_id_idx" ON "integration_clients"("created_by_organization_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_clients_id_organization_id_key" ON "integration_clients"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_clients_org_code" ON "integration_clients"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "integration_credentials_prefix_key" ON "integration_credentials"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "integration_credentials_credential_hash_key" ON "integration_credentials"("credential_hash");

-- CreateIndex
CREATE INDEX "integration_credentials_organization_id_integration_client__idx" ON "integration_credentials"("organization_id", "integration_client_id", "status");

-- CreateIndex
CREATE INDEX "integration_credentials_organization_id_status_expires_at_idx" ON "integration_credentials"("organization_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "integration_credentials_created_by_organization_user_id_idx" ON "integration_credentials"("created_by_organization_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_credentials_id_organization_id_key" ON "integration_credentials"("id", "organization_id");

-- CreateIndex
CREATE INDEX "integration_client_permissions_organization_id_integration__idx" ON "integration_client_permissions"("organization_id", "integration_client_id");

-- CreateIndex
CREATE INDEX "integration_client_permissions_permission_id_idx" ON "integration_client_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "integration_client_permissions_assigned_by_organization_use_idx" ON "integration_client_permissions"("assigned_by_organization_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_client_permissions_id_organization_id_key" ON "integration_client_permissions"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_client_permissions_client_permission" ON "integration_client_permissions"("integration_client_id", "permission_id");

-- CreateIndex
CREATE INDEX "webhook_endpoints_organization_id_status_created_at_idx" ON "webhook_endpoints"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "webhook_endpoints_organization_id_integration_client_id_idx" ON "webhook_endpoints"("organization_id", "integration_client_id");

-- CreateIndex
CREATE INDEX "webhook_endpoints_created_by_organization_user_id_idx" ON "webhook_endpoints"("created_by_organization_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_endpoints_id_organization_id_key" ON "webhook_endpoints"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_endpoints_client_name" ON "webhook_endpoints"("integration_client_id", "name");

-- CreateIndex
CREATE INDEX "webhook_subscriptions_organization_id_event_type_status_idx" ON "webhook_subscriptions"("organization_id", "event_type", "status");

-- CreateIndex
CREATE INDEX "webhook_subscriptions_organization_id_webhook_endpoint_id_s_idx" ON "webhook_subscriptions"("organization_id", "webhook_endpoint_id", "status");

-- CreateIndex
CREATE INDEX "webhook_subscriptions_created_by_organization_user_id_idx" ON "webhook_subscriptions"("created_by_organization_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_subscriptions_id_organization_id_key" ON "webhook_subscriptions"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_subscriptions_endpoint_event" ON "webhook_subscriptions"("webhook_endpoint_id", "event_type");

-- CreateIndex
CREATE INDEX "integration_events_organization_id_created_at_id_idx" ON "integration_events"("organization_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "integration_events_organization_id_event_type_occurred_at_idx" ON "integration_events"("organization_id", "event_type", "occurred_at");

-- CreateIndex
CREATE INDEX "integration_events_organization_id_entity_type_entity_id_idx" ON "integration_events"("organization_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "integration_events_organization_id_correlation_id_idx" ON "integration_events"("organization_id", "correlation_id");

-- CreateIndex
CREATE INDEX "integration_events_created_by_organization_user_id_idx" ON "integration_events"("created_by_organization_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_events_id_organization_id_key" ON "integration_events"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_events_org_type_idempotency" ON "integration_events"("organization_id", "event_type", "idempotency_key");

-- CreateIndex
CREATE INDEX "webhook_deliveries_organization_id_status_next_attempt_at_idx" ON "webhook_deliveries"("organization_id", "status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_next_attempt_at_lease_expires_at_idx" ON "webhook_deliveries"("status", "next_attempt_at", "lease_expires_at");

-- CreateIndex
CREATE INDEX "webhook_deliveries_organization_id_webhook_endpoint_id_crea_idx" ON "webhook_deliveries"("organization_id", "webhook_endpoint_id", "created_at");

-- CreateIndex
CREATE INDEX "webhook_deliveries_organization_id_integration_event_id_idx" ON "webhook_deliveries"("organization_id", "integration_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_deliveries_id_organization_id_key" ON "webhook_deliveries"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_deliveries_event_endpoint" ON "webhook_deliveries"("integration_event_id", "webhook_endpoint_id");

-- CreateIndex
CREATE INDEX "webhook_delivery_attempts_organization_id_webhook_delivery__idx" ON "webhook_delivery_attempts"("organization_id", "webhook_delivery_id", "created_at");

-- CreateIndex
CREATE INDEX "webhook_delivery_attempts_organization_id_result_created_at_idx" ON "webhook_delivery_attempts"("organization_id", "result", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_delivery_attempts_id_organization_id_key" ON "webhook_delivery_attempts"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_delivery_attempts_delivery_number" ON "webhook_delivery_attempts"("webhook_delivery_id", "attempt_number");

-- AddForeignKey
ALTER TABLE "integration_clients" ADD CONSTRAINT "integration_clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_clients" ADD CONSTRAINT "integration_clients_created_by_organization_user_id_organi_fkey" FOREIGN KEY ("created_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_integration_client_id_organization_fkey" FOREIGN KEY ("integration_client_id", "organization_id") REFERENCES "integration_clients"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_credentials" ADD CONSTRAINT "integration_credentials_created_by_organization_user_id_or_fkey" FOREIGN KEY ("created_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_client_permissions" ADD CONSTRAINT "integration_client_permissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_client_permissions" ADD CONSTRAINT "integration_client_permissions_integration_client_id_organ_fkey" FOREIGN KEY ("integration_client_id", "organization_id") REFERENCES "integration_clients"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_client_permissions" ADD CONSTRAINT "integration_client_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_client_permissions" ADD CONSTRAINT "integration_client_permissions_assigned_by_organization_us_fkey" FOREIGN KEY ("assigned_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_integration_client_id_organization_id_fkey" FOREIGN KEY ("integration_client_id", "organization_id") REFERENCES "integration_clients"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_created_by_organization_user_id_organiza_fkey" FOREIGN KEY ("created_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_webhook_endpoint_id_organization_id_fkey" FOREIGN KEY ("webhook_endpoint_id", "organization_id") REFERENCES "webhook_endpoints"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_created_by_organization_user_id_orga_fkey" FOREIGN KEY ("created_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_created_by_organization_user_id_organiz_fkey" FOREIGN KEY ("created_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_integration_event_id_organization_id_fkey" FOREIGN KEY ("integration_event_id", "organization_id") REFERENCES "integration_events"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_endpoint_id_organization_id_fkey" FOREIGN KEY ("webhook_endpoint_id", "organization_id") REFERENCES "webhook_endpoints"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_delivery_attempts" ADD CONSTRAINT "webhook_delivery_attempts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_delivery_attempts" ADD CONSTRAINT "webhook_delivery_attempts_webhook_delivery_id_organization_fkey" FOREIGN KEY ("webhook_delivery_id", "organization_id") REFERENCES "webhook_deliveries"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sprint 024 integration invariants
ALTER TABLE "integration_clients"
ADD CONSTRAINT "integration_clients_code_not_blank"
CHECK (btrim("code") <> '');

ALTER TABLE "integration_clients"
ADD CONSTRAINT "integration_clients_name_not_blank"
CHECK (btrim("name") <> '');

ALTER TABLE "integration_clients"
ADD CONSTRAINT "integration_clients_code_format"
CHECK (
  "code" ~ '^[A-Z0-9][A-Z0-9_-]{0,127}$'
);

ALTER TABLE "integration_clients"
ADD CONSTRAINT "integration_clients_lifecycle_valid"
CHECK (
  (
    "status" = 'ACTIVE' AND
    "suspended_at" IS NULL AND
    "revoked_at" IS NULL
  ) OR
  (
    "status" = 'SUSPENDED' AND
    "suspended_at" IS NOT NULL AND
    "revoked_at" IS NULL
  ) OR
  (
    "status" = 'REVOKED' AND
    "revoked_at" IS NOT NULL
  )
);

ALTER TABLE "integration_credentials"
ADD CONSTRAINT "integration_credentials_prefix_not_blank"
CHECK (btrim("prefix") <> '');

ALTER TABLE "integration_credentials"
ADD CONSTRAINT "integration_credentials_name_not_blank"
CHECK (btrim("name") <> '');

ALTER TABLE "integration_credentials"
ADD CONSTRAINT "integration_credentials_hash_valid"
CHECK (
  "credential_hash" ~ '^[0-9a-f]{64}$'
);

ALTER TABLE "integration_credentials"
ADD CONSTRAINT "integration_credentials_expiry_valid"
CHECK (
  "expires_at" IS NULL OR
  "expires_at" > "created_at"
);

ALTER TABLE "integration_credentials"
ADD CONSTRAINT "integration_credentials_lifecycle_valid"
CHECK (
  (
    "status" = 'ACTIVE' AND
    "revoked_at" IS NULL
  ) OR
  (
    "status" = 'REVOKED' AND
    "revoked_at" IS NOT NULL
  ) OR
  "status" = 'EXPIRED'
);

ALTER TABLE "webhook_endpoints"
ADD CONSTRAINT "webhook_endpoints_name_not_blank"
CHECK (btrim("name") <> '');

ALTER TABLE "webhook_endpoints"
ADD CONSTRAINT "webhook_endpoints_https_url"
CHECK (
  btrim("url") ~* '^https://'
);

ALTER TABLE "webhook_endpoints"
ADD CONSTRAINT "webhook_endpoints_secret_not_blank"
CHECK (
  btrim("encrypted_secret") <> '' AND
  btrim("secret_iv") <> '' AND
  btrim("secret_auth_tag") <> '' AND
  btrim("secret_key_version") <> ''
);

ALTER TABLE "webhook_endpoints"
ADD CONSTRAINT "webhook_endpoints_lifecycle_valid"
CHECK (
  (
    "status" = 'ACTIVE' AND
    "disabled_at" IS NULL
  ) OR
  (
    "status" = 'DISABLED' AND
    "disabled_at" IS NOT NULL
  )
);

ALTER TABLE "webhook_subscriptions"
ADD CONSTRAINT "webhook_subscriptions_event_type_valid"
CHECK (
  "event_type" ~
  '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'
);

ALTER TABLE "webhook_subscriptions"
ADD CONSTRAINT "webhook_subscriptions_payload_version_not_blank"
CHECK (btrim("payload_version") <> '');

ALTER TABLE "integration_events"
ADD CONSTRAINT "integration_events_event_type_valid"
CHECK (
  "event_type" ~
  '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'
);

ALTER TABLE "integration_events"
ADD CONSTRAINT "integration_events_payload_version_not_blank"
CHECK (btrim("payload_version") <> '');

ALTER TABLE "integration_events"
ADD CONSTRAINT "integration_events_entity_type_not_blank"
CHECK (btrim("entity_type") <> '');

ALTER TABLE "integration_events"
ADD CONSTRAINT "integration_events_payload_hash_valid"
CHECK (
  "payload_hash" ~ '^[0-9a-f]{64}$'
);

ALTER TABLE "integration_events"
ADD CONSTRAINT "integration_events_idempotency_key_not_blank"
CHECK (
  "idempotency_key" IS NULL OR
  btrim("idempotency_key") <> ''
);

ALTER TABLE "webhook_deliveries"
ADD CONSTRAINT "webhook_deliveries_attempt_count_valid"
CHECK ("attempt_count" >= 0);

ALTER TABLE "webhook_deliveries"
ADD CONSTRAINT "webhook_deliveries_http_status_valid"
CHECK (
  "last_http_status" IS NULL OR
  "last_http_status" BETWEEN 100 AND 599
);

ALTER TABLE "webhook_deliveries"
ADD CONSTRAINT "webhook_deliveries_lease_pair_valid"
CHECK (
  (
    "lease_owner" IS NULL AND
    "lease_expires_at" IS NULL
  ) OR
  (
    "lease_owner" IS NOT NULL AND
    "lease_expires_at" IS NOT NULL
  )
);

ALTER TABLE "webhook_deliveries"
ADD CONSTRAINT "webhook_deliveries_outcome_valid"
CHECK (
  (
    "status" = 'DELIVERED' AND
    "delivered_at" IS NOT NULL AND
    "terminal_at" IS NOT NULL
  ) OR
  (
    "status" IN ('DEAD_LETTER', 'CANCELLED') AND
    "terminal_at" IS NOT NULL
  ) OR
  "status" IN ('PENDING', 'PROCESSING', 'FAILED')
);

ALTER TABLE "webhook_delivery_attempts"
ADD CONSTRAINT "webhook_delivery_attempts_number_valid"
CHECK ("attempt_number" > 0);

ALTER TABLE "webhook_delivery_attempts"
ADD CONSTRAINT "webhook_delivery_attempts_duration_valid"
CHECK ("duration_ms" >= 0);

ALTER TABLE "webhook_delivery_attempts"
ADD CONSTRAINT "webhook_delivery_attempts_time_valid"
CHECK ("completed_at" >= "started_at");

ALTER TABLE "webhook_delivery_attempts"
ADD CONSTRAINT "webhook_delivery_attempts_http_status_valid"
CHECK (
  "http_status" IS NULL OR
  "http_status" BETWEEN 100 AND 599
);

ALTER TABLE "webhook_delivery_attempts"
ADD CONSTRAINT "webhook_delivery_attempts_request_timestamp_not_blank"
CHECK (btrim("request_timestamp") <> '');
