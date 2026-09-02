-- CreateEnum
CREATE TYPE "HealthScopeType" AS ENUM ('ORGANIZATION', 'BRANCH', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'WATCH', 'AT_RISK', 'CRITICAL');

-- CreateTable
CREATE TABLE "health_indicator_definitions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_indicator_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_snapshots" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "scope_type" "HealthScopeType" NOT NULL,
    "branch_id" UUID,
    "department_id" UUID,
    "score" INTEGER NOT NULL,
    "status" "HealthStatus" NOT NULL,
    "confidence" INTEGER NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "rules_version" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_contributions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "health_snapshot_id" UUID NOT NULL,
    "health_indicator_definition_id" UUID NOT NULL,
    "indicator_code" TEXT NOT NULL,
    "measured_value" DECIMAL(12,4),
    "sample_size" INTEGER NOT NULL,
    "indicator_score" INTEGER NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "weighted_contribution" DECIMAL(8,4) NOT NULL,
    "confidence" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "recommended_action" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_indicator_definitions_organization_id_idx" ON "health_indicator_definitions"("organization_id");

-- CreateIndex
CREATE INDEX "health_indicator_definitions_organization_id_is_active_idx" ON "health_indicator_definitions"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "health_indicator_definitions_id_organization_id_key" ON "health_indicator_definitions"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "health_indicator_definitions_organization_id_code_key" ON "health_indicator_definitions"("organization_id", "code");

-- CreateIndex
CREATE INDEX "health_snapshots_organization_id_idx" ON "health_snapshots"("organization_id");

-- CreateIndex
CREATE INDEX "health_snapshots_organization_id_scope_type_idx" ON "health_snapshots"("organization_id", "scope_type");

-- CreateIndex
CREATE INDEX "health_snapshots_organization_id_branch_id_idx" ON "health_snapshots"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "health_snapshots_organization_id_department_id_idx" ON "health_snapshots"("organization_id", "department_id");

-- CreateIndex
CREATE INDEX "health_snapshots_organization_id_status_idx" ON "health_snapshots"("organization_id", "status");

-- CreateIndex
CREATE INDEX "health_snapshots_organization_id_evaluated_at_idx" ON "health_snapshots"("organization_id", "evaluated_at");

-- CreateIndex
CREATE INDEX "health_snapshots_organization_id_scope_type_evaluated_at_idx" ON "health_snapshots"("organization_id", "scope_type", "evaluated_at");

-- CreateIndex
CREATE UNIQUE INDEX "health_snapshots_id_organization_id_key" ON "health_snapshots"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "health_snapshots_org_fingerprint_key" ON "health_snapshots"("organization_id", "fingerprint");

-- CreateIndex
CREATE INDEX "health_contributions_organization_id_idx" ON "health_contributions"("organization_id");

-- CreateIndex
CREATE INDEX "health_contributions_organization_id_health_snapshot_id_idx" ON "health_contributions"("organization_id", "health_snapshot_id");

-- CreateIndex
CREATE INDEX "health_contributions_organization_id_health_indicator_defin_idx" ON "health_contributions"("organization_id", "health_indicator_definition_id");

-- CreateIndex
CREATE INDEX "health_contributions_organization_id_indicator_code_idx" ON "health_contributions"("organization_id", "indicator_code");

-- CreateIndex
CREATE UNIQUE INDEX "health_contributions_id_organization_id_key" ON "health_contributions"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "health_contributions_health_snapshot_id_health_indicator_de_key" ON "health_contributions"("health_snapshot_id", "health_indicator_definition_id");

-- AddForeignKey
ALTER TABLE "health_indicator_definitions" ADD CONSTRAINT "health_indicator_definitions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_snapshots" ADD CONSTRAINT "health_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_snapshots" ADD CONSTRAINT "health_snapshots_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_snapshots" ADD CONSTRAINT "health_snapshots_department_id_organization_id_fkey" FOREIGN KEY ("department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_contributions" ADD CONSTRAINT "health_contributions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_contributions" ADD CONSTRAINT "health_contributions_health_snapshot_id_organization_id_fkey" FOREIGN KEY ("health_snapshot_id", "organization_id") REFERENCES "health_snapshots"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_contributions" ADD CONSTRAINT "health_contributions_health_indicator_definition_id_organi_fkey" FOREIGN KEY ("health_indicator_definition_id", "organization_id") REFERENCES "health_indicator_definitions"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sprint 017 database safety constraints.

ALTER TABLE "health_indicator_definitions"
ADD CONSTRAINT "health_indicator_definitions_weight_range"
CHECK ("weight" >= 0 AND "weight" <= 100);

ALTER TABLE "health_snapshots"
ADD CONSTRAINT "health_snapshots_score_range"
CHECK ("score" >= 0 AND "score" <= 100);

ALTER TABLE "health_snapshots"
ADD CONSTRAINT "health_snapshots_confidence_range"
CHECK ("confidence" >= 0 AND "confidence" <= 100);

ALTER TABLE "health_snapshots"
ADD CONSTRAINT "health_snapshots_period_order"
CHECK ("period_start" <= "period_end");

ALTER TABLE "health_snapshots"
ADD CONSTRAINT "health_snapshots_scope_shape"
CHECK (
  (
    "scope_type" = 'ORGANIZATION'
    AND "branch_id" IS NULL
    AND "department_id" IS NULL
  )
  OR
  (
    "scope_type" = 'BRANCH'
    AND "branch_id" IS NOT NULL
    AND "department_id" IS NULL
  )
  OR
  (
    "scope_type" = 'DEPARTMENT'
    AND "branch_id" IS NULL
    AND "department_id" IS NOT NULL
  )
);

ALTER TABLE "health_contributions"
ADD CONSTRAINT "health_contributions_sample_size_nonnegative"
CHECK ("sample_size" >= 0);

ALTER TABLE "health_contributions"
ADD CONSTRAINT "health_contributions_score_range"
CHECK ("indicator_score" >= 0 AND "indicator_score" <= 100);

ALTER TABLE "health_contributions"
ADD CONSTRAINT "health_contributions_weight_range"
CHECK ("weight" >= 0 AND "weight" <= 100);

ALTER TABLE "health_contributions"
ADD CONSTRAINT "health_contributions_weighted_range"
CHECK (
  "weighted_contribution" >= 0
  AND "weighted_contribution" <= 100
);

ALTER TABLE "health_contributions"
ADD CONSTRAINT "health_contributions_confidence_range"
CHECK ("confidence" >= 0 AND "confidence" <= 100);
