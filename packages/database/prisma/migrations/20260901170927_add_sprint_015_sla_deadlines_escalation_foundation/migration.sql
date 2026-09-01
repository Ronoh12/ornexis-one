-- CreateEnum
CREATE TYPE "SlaTargetType" AS ENUM ('RESPONSE', 'RESOLUTION', 'COMPLETION');

-- CreateEnum
CREATE TYPE "SlaSourceType" AS ENUM ('WORK_ITEM', 'REQUEST');

-- CreateEnum
CREATE TYPE "SlaInstanceStatus" AS ENUM ('ACTIVE', 'SATISFIED', 'BREACHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SlaEventType" AS ENUM ('STARTED', 'WARNING', 'BREACHED', 'ESCALATED', 'SATISFIED', 'CANCELLED');

-- CreateTable
CREATE TABLE "sla_policies" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_targets" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "sla_policy_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "target_type" "SlaTargetType" NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "warning_minutes_before" INTEGER,
    "escalation_minutes_after" INTEGER,
    "notify_on_warning" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_breach" BOOLEAN NOT NULL DEFAULT true,
    "notify_on_escalation" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_instances" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "sla_policy_id" UUID NOT NULL,
    "sla_target_id" UUID NOT NULL,
    "source_type" "SlaSourceType" NOT NULL,
    "source_id" UUID NOT NULL,
    "status" "SlaInstanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL,
    "target_at" TIMESTAMP(3) NOT NULL,
    "satisfied_at" TIMESTAMP(3),
    "breached_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sla_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "sla_instance_id" UUID NOT NULL,
    "event_type" "SlaEventType" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sla_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sla_policies_organization_id_idx" ON "sla_policies"("organization_id");

-- CreateIndex
CREATE INDEX "sla_policies_organization_id_is_active_idx" ON "sla_policies"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "sla_policies_id_organization_id_key" ON "sla_policies"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "sla_policies_organization_id_code_key" ON "sla_policies"("organization_id", "code");

-- CreateIndex
CREATE INDEX "sla_targets_organization_id_idx" ON "sla_targets"("organization_id");

-- CreateIndex
CREATE INDEX "sla_targets_organization_id_sla_policy_id_idx" ON "sla_targets"("organization_id", "sla_policy_id");

-- CreateIndex
CREATE INDEX "sla_targets_organization_id_target_type_idx" ON "sla_targets"("organization_id", "target_type");

-- CreateIndex
CREATE INDEX "sla_targets_organization_id_is_active_idx" ON "sla_targets"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "sla_targets_id_organization_id_key" ON "sla_targets"("id", "organization_id");

-- CreateIndex
CREATE INDEX "sla_instances_organization_id_idx" ON "sla_instances"("organization_id");

-- CreateIndex
CREATE INDEX "sla_instances_organization_id_status_idx" ON "sla_instances"("organization_id", "status");

-- CreateIndex
CREATE INDEX "sla_instances_organization_id_source_type_source_id_idx" ON "sla_instances"("organization_id", "source_type", "source_id");

-- CreateIndex
CREATE INDEX "sla_instances_organization_id_target_at_idx" ON "sla_instances"("organization_id", "target_at");

-- CreateIndex
CREATE INDEX "sla_instances_organization_id_status_target_at_idx" ON "sla_instances"("organization_id", "status", "target_at");

-- CreateIndex
CREATE INDEX "sla_instances_organization_id_sla_policy_id_idx" ON "sla_instances"("organization_id", "sla_policy_id");

-- CreateIndex
CREATE INDEX "sla_instances_organization_id_sla_target_id_idx" ON "sla_instances"("organization_id", "sla_target_id");

-- CreateIndex
CREATE UNIQUE INDEX "sla_instances_id_organization_id_key" ON "sla_instances"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "sla_instances_org_target_source_key" ON "sla_instances"("organization_id", "sla_target_id", "source_type", "source_id");

-- CreateIndex
CREATE INDEX "sla_events_organization_id_idx" ON "sla_events"("organization_id");

-- CreateIndex
CREATE INDEX "sla_events_organization_id_sla_instance_id_idx" ON "sla_events"("organization_id", "sla_instance_id");

-- CreateIndex
CREATE INDEX "sla_events_organization_id_event_type_idx" ON "sla_events"("organization_id", "event_type");

-- CreateIndex
CREATE INDEX "sla_events_organization_id_occurred_at_idx" ON "sla_events"("organization_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "sla_events_org_idempotency_key" ON "sla_events"("organization_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "sla_policies" ADD CONSTRAINT "sla_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_targets" ADD CONSTRAINT "sla_targets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_targets" ADD CONSTRAINT "sla_targets_sla_policy_id_organization_id_fkey" FOREIGN KEY ("sla_policy_id", "organization_id") REFERENCES "sla_policies"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_instances" ADD CONSTRAINT "sla_instances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_instances" ADD CONSTRAINT "sla_instances_sla_policy_id_organization_id_fkey" FOREIGN KEY ("sla_policy_id", "organization_id") REFERENCES "sla_policies"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_instances" ADD CONSTRAINT "sla_instances_sla_target_id_organization_id_fkey" FOREIGN KEY ("sla_target_id", "organization_id") REFERENCES "sla_targets"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_events" ADD CONSTRAINT "sla_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sla_events" ADD CONSTRAINT "sla_events_sla_instance_id_organization_id_fkey" FOREIGN KEY ("sla_instance_id", "organization_id") REFERENCES "sla_instances"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
