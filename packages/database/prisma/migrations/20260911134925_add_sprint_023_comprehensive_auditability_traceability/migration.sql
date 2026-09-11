-- CreateEnum
CREATE TYPE "AuditEventCategory" AS ENUM ('AUTHENTICATION', 'AUTHORIZATION', 'ADMINISTRATION', 'CONFIGURATION', 'SECURITY', 'DATA', 'WORKFLOW', 'INTEGRATION', 'SYSTEM', 'BUSINESS');

-- CreateEnum
CREATE TYPE "AuditEventSource" AS ENUM ('API', 'AUTHENTICATION', 'APPLICATION', 'SYSTEM', 'JOB', 'INTEGRATION', 'MIGRATION');

-- CreateEnum
CREATE TYPE "AuditEventResult" AS ENUM ('SUCCESS', 'FAILURE', 'DENIED');

-- DropIndex
DROP INDEX "audit_logs_action_idx";

-- DropIndex
DROP INDEX "audit_logs_entity_type_entity_id_idx";

-- DropIndex
DROP INDEX "audit_logs_organization_id_created_at_idx";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "category" "AuditEventCategory" NOT NULL DEFAULT 'BUSINESS',
ADD COLUMN     "correlation_id" VARCHAR(128),
ADD COLUMN     "http_method" VARCHAR(16),
ADD COLUMN     "http_status_code" INTEGER,
ADD COLUMN     "integrity_hash" VARCHAR(64),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "organization_user_id" UUID,
ADD COLUMN     "request_id" VARCHAR(128),
ADD COLUMN     "request_path" VARCHAR(512),
ADD COLUMN     "result" "AuditEventResult" NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN     "source" "AuditEventSource" NOT NULL DEFAULT 'APPLICATION';

-- CreateIndex
CREATE INDEX "audit_logs_organization_user_id_idx" ON "audit_logs"("organization_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_id_idx" ON "audit_logs"("organization_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_action_created_at_idx" ON "audit_logs"("organization_id", "action", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_entity_type_entity_id_created_at_idx" ON "audit_logs"("organization_id", "entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_user_id_created_at_idx" ON "audit_logs"("organization_id", "user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_organization_user_id_created_at_idx" ON "audit_logs"("organization_id", "organization_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_category_created_at_idx" ON "audit_logs"("organization_id", "category", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_source_created_at_idx" ON "audit_logs"("organization_id", "source", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_result_created_at_idx" ON "audit_logs"("organization_id", "result", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_request_id_idx" ON "audit_logs"("organization_id", "request_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_correlation_id_idx" ON "audit_logs"("organization_id", "correlation_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_user_id_fkey" FOREIGN KEY ("organization_user_id") REFERENCES "organization_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Sprint 023 audit-event invariants
ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_action_not_blank"
CHECK (btrim("action") <> '');

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_entity_type_not_blank"
CHECK (btrim("entity_type") <> '');

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_http_method_not_blank"
CHECK (
  "http_method" IS NULL OR
  btrim("http_method") <> ''
);

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_http_status_code_valid"
CHECK (
  "http_status_code" IS NULL OR
  "http_status_code" BETWEEN 100 AND 599
);

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_integrity_hash_valid"
CHECK (
  "integrity_hash" IS NULL OR
  "integrity_hash" ~ '^[0-9a-f]{64}$'
);
