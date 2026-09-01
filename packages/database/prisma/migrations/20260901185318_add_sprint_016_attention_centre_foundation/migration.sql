-- CreateEnum
CREATE TYPE "AttentionSignalType" AS ENUM ('WORK_ITEM_OVERDUE', 'SLA_WARNING', 'SLA_BREACHED', 'SLA_ESCALATED', 'REQUEST_UNASSIGNED', 'APPROVAL_PENDING');

-- CreateEnum
CREATE TYPE "AttentionSourceType" AS ENUM ('WORK_ITEM', 'SLA_INSTANCE', 'REQUEST', 'APPROVAL_STEP');

-- CreateEnum
CREATE TYPE "AttentionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AttentionItemStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "attention_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "signal_type" "AttentionSignalType" NOT NULL,
    "source_type" "AttentionSourceType" NOT NULL,
    "source_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "recommended_action" TEXT,
    "severity" "AttentionSeverity" NOT NULL,
    "status" "AttentionItemStatus" NOT NULL DEFAULT 'OPEN',
    "responsible_organization_user_id" UUID,
    "branch_id" UUID,
    "department_id" UUID,
    "due_at" TIMESTAMP(3),
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "fingerprint" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attention_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attention_items_organization_id_idx" ON "attention_items"("organization_id");

-- CreateIndex
CREATE INDEX "attention_items_organization_id_status_idx" ON "attention_items"("organization_id", "status");

-- CreateIndex
CREATE INDEX "attention_items_organization_id_severity_idx" ON "attention_items"("organization_id", "severity");

-- CreateIndex
CREATE INDEX "attention_items_organization_id_signal_type_idx" ON "attention_items"("organization_id", "signal_type");

-- CreateIndex
CREATE INDEX "attention_items_organization_id_source_type_source_id_idx" ON "attention_items"("organization_id", "source_type", "source_id");

-- CreateIndex
CREATE INDEX "attention_items_organization_id_responsible_organization_us_idx" ON "attention_items"("organization_id", "responsible_organization_user_id");

-- CreateIndex
CREATE INDEX "attention_items_organization_id_branch_id_idx" ON "attention_items"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "attention_items_organization_id_department_id_idx" ON "attention_items"("organization_id", "department_id");

-- CreateIndex
CREATE INDEX "attention_items_organization_id_due_at_idx" ON "attention_items"("organization_id", "due_at");

-- CreateIndex
CREATE INDEX "attention_items_organization_id_status_severity_idx" ON "attention_items"("organization_id", "status", "severity");

-- CreateIndex
CREATE INDEX "attention_items_organization_id_status_due_at_idx" ON "attention_items"("organization_id", "status", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "attention_items_id_organization_id_key" ON "attention_items"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "attention_items_org_fingerprint_key" ON "attention_items"("organization_id", "fingerprint");

-- AddForeignKey
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_responsible_organization_user_id_organizat_fkey" FOREIGN KEY ("responsible_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attention_items" ADD CONSTRAINT "attention_items_department_id_organization_id_fkey" FOREIGN KEY ("department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
