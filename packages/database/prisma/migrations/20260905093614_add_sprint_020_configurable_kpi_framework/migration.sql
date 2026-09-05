-- CreateEnum
CREATE TYPE "KpiDefinitionOrigin" AS ENUM ('PLATFORM', 'INDUSTRY_PACK', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "KpiDataSourceType" AS ENUM ('MANUAL', 'SYSTEM', 'INTEGRATION', 'DERIVED');

-- CreateEnum
CREATE TYPE "KpiDirection" AS ENUM ('HIGHER_IS_BETTER', 'LOWER_IS_BETTER', 'TARGET_RANGE');

-- CreateEnum
CREATE TYPE "KpiUnit" AS ENUM ('PERCENTAGE', 'COUNT', 'MINUTES', 'HOURS', 'DAYS', 'CURRENCY', 'NUMBER');

-- CreateEnum
CREATE TYPE "KpiPeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "kpi_categories" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_definitions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "category_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT,
    "origin" "KpiDefinitionOrigin" NOT NULL DEFAULT 'ORGANIZATION',
    "data_source_type" "KpiDataSourceType" NOT NULL,
    "calculation_rule_code" TEXT,
    "scope_type" "HealthScopeType" NOT NULL,
    "branch_id" UUID,
    "department_id" UUID,
    "owner_organization_user_id" UUID,
    "unit" "KpiUnit" NOT NULL,
    "direction" "KpiDirection" NOT NULL,
    "target" DECIMAL(18,4) NOT NULL,
    "warning_threshold" DECIMAL(18,4) NOT NULL,
    "critical_threshold" DECIMAL(18,4) NOT NULL,
    "weight" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "period_type" "KpiPeriodType" NOT NULL,
    "effective_start" TIMESTAMP(3),
    "effective_end" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_measurements" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "kpi_definition_id" UUID NOT NULL,
    "scope_type" "HealthScopeType" NOT NULL,
    "branch_id" UUID,
    "department_id" UUID,
    "measured_value" DECIMAL(18,4) NOT NULL,
    "target" DECIMAL(18,4) NOT NULL,
    "warning_threshold" DECIMAL(18,4) NOT NULL,
    "critical_threshold" DECIMAL(18,4) NOT NULL,
    "unit" "KpiUnit" NOT NULL,
    "direction" "KpiDirection" NOT NULL,
    "status" "HealthStatus" NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "evaluated_at" TIMESTAMP(3) NOT NULL,
    "data_source_type" "KpiDataSourceType" NOT NULL,
    "calculation_rule_code" TEXT,
    "rules_version" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "recommended_action" TEXT,
    "metadata" JSONB,
    "created_by_organization_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kpi_categories_organization_id_idx" ON "kpi_categories"("organization_id");

-- CreateIndex
CREATE INDEX "kpi_categories_organization_id_is_active_idx" ON "kpi_categories"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "kpi_categories_organization_id_display_order_idx" ON "kpi_categories"("organization_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_categories_id_organization_id_key" ON "kpi_categories"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_categories_organization_id_code_key" ON "kpi_categories"("organization_id", "code");

-- CreateIndex
CREATE INDEX "kpi_definitions_organization_id_idx" ON "kpi_definitions"("organization_id");

-- CreateIndex
CREATE INDEX "kpi_definitions_organization_id_category_id_idx" ON "kpi_definitions"("organization_id", "category_id");

-- CreateIndex
CREATE INDEX "kpi_definitions_organization_id_scope_type_idx" ON "kpi_definitions"("organization_id", "scope_type");

-- CreateIndex
CREATE INDEX "kpi_definitions_organization_id_branch_id_idx" ON "kpi_definitions"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "kpi_definitions_organization_id_department_id_idx" ON "kpi_definitions"("organization_id", "department_id");

-- CreateIndex
CREATE INDEX "kpi_definitions_organization_id_owner_organization_user_id_idx" ON "kpi_definitions"("organization_id", "owner_organization_user_id");

-- CreateIndex
CREATE INDEX "kpi_definitions_organization_id_data_source_type_idx" ON "kpi_definitions"("organization_id", "data_source_type");

-- CreateIndex
CREATE INDEX "kpi_definitions_organization_id_is_active_idx" ON "kpi_definitions"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_definitions_id_organization_id_key" ON "kpi_definitions"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_definitions_organization_id_code_key" ON "kpi_definitions"("organization_id", "code");

-- CreateIndex
CREATE INDEX "kpi_measurements_organization_id_idx" ON "kpi_measurements"("organization_id");

-- CreateIndex
CREATE INDEX "kpi_measurements_organization_id_kpi_definition_id_idx" ON "kpi_measurements"("organization_id", "kpi_definition_id");

-- CreateIndex
CREATE INDEX "kpi_measurements_organization_id_scope_type_idx" ON "kpi_measurements"("organization_id", "scope_type");

-- CreateIndex
CREATE INDEX "kpi_measurements_organization_id_branch_id_idx" ON "kpi_measurements"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "kpi_measurements_organization_id_department_id_idx" ON "kpi_measurements"("organization_id", "department_id");

-- CreateIndex
CREATE INDEX "kpi_measurements_organization_id_status_idx" ON "kpi_measurements"("organization_id", "status");

-- CreateIndex
CREATE INDEX "kpi_measurements_organization_id_period_end_idx" ON "kpi_measurements"("organization_id", "period_end");

-- CreateIndex
CREATE INDEX "kpi_measurements_organization_id_kpi_definition_id_period_e_idx" ON "kpi_measurements"("organization_id", "kpi_definition_id", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_measurements_id_organization_id_key" ON "kpi_measurements"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_measurements_org_fingerprint_key" ON "kpi_measurements"("organization_id", "fingerprint");

-- AddForeignKey
ALTER TABLE "kpi_categories" ADD CONSTRAINT "kpi_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_definitions" ADD CONSTRAINT "kpi_definitions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_definitions" ADD CONSTRAINT "kpi_definitions_category_id_organization_id_fkey" FOREIGN KEY ("category_id", "organization_id") REFERENCES "kpi_categories"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_definitions" ADD CONSTRAINT "kpi_definitions_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_definitions" ADD CONSTRAINT "kpi_definitions_department_id_organization_id_fkey" FOREIGN KEY ("department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_definitions" ADD CONSTRAINT "kpi_definitions_owner_organization_user_id_organization_id_fkey" FOREIGN KEY ("owner_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_measurements" ADD CONSTRAINT "kpi_measurements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_measurements" ADD CONSTRAINT "kpi_measurements_kpi_definition_id_organization_id_fkey" FOREIGN KEY ("kpi_definition_id", "organization_id") REFERENCES "kpi_definitions"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_measurements" ADD CONSTRAINT "kpi_measurements_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_measurements" ADD CONSTRAINT "kpi_measurements_department_id_organization_id_fkey" FOREIGN KEY ("department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_measurements" ADD CONSTRAINT "kpi_measurements_created_by_organization_user_id_organizat_fkey" FOREIGN KEY ("created_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sprint 020 database-level integrity constraints.

ALTER TABLE "kpi_definitions"
ADD CONSTRAINT "kpi_definitions_scope_integrity_check"
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

ALTER TABLE "kpi_measurements"
ADD CONSTRAINT "kpi_measurements_scope_integrity_check"
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

ALTER TABLE "kpi_definitions"
ADD CONSTRAINT "kpi_definitions_threshold_order_check"
CHECK (
  (
    "direction" = 'HIGHER_IS_BETTER'
    AND "target" >= "warning_threshold"
    AND "warning_threshold" >= "critical_threshold"
  )
  OR
  (
    "direction" = 'LOWER_IS_BETTER'
    AND "target" <= "warning_threshold"
    AND "warning_threshold" <= "critical_threshold"
  )
  OR
  "direction" = 'TARGET_RANGE'
);

ALTER TABLE "kpi_definitions"
ADD CONSTRAINT "kpi_definitions_effective_period_check"
CHECK (
  "effective_end" IS NULL
  OR "effective_start" IS NULL
  OR "effective_start" < "effective_end"
);

ALTER TABLE "kpi_definitions"
ADD CONSTRAINT "kpi_definitions_weight_check"
CHECK ("weight" >= 0);

ALTER TABLE "kpi_definitions"
ADD CONSTRAINT "kpi_definitions_system_rule_check"
CHECK (
  "data_source_type" <> 'SYSTEM'
  OR (
    "calculation_rule_code" IS NOT NULL
    AND length(trim("calculation_rule_code")) > 0
  )
);

ALTER TABLE "kpi_definitions"
ADD CONSTRAINT "kpi_definitions_percentage_bounds_check"
CHECK (
  "unit" <> 'PERCENTAGE'
  OR (
    "target" BETWEEN 0 AND 100
    AND "warning_threshold" BETWEEN 0 AND 100
    AND "critical_threshold" BETWEEN 0 AND 100
  )
);

ALTER TABLE "kpi_measurements"
ADD CONSTRAINT "kpi_measurements_period_check"
CHECK (
  "period_start" < "period_end"
  AND "period_end" <= "evaluated_at"
);

ALTER TABLE "kpi_measurements"
ADD CONSTRAINT "kpi_measurements_sample_size_check"
CHECK ("sample_size" >= 0);

ALTER TABLE "kpi_measurements"
ADD CONSTRAINT "kpi_measurements_confidence_check"
CHECK ("confidence" BETWEEN 0 AND 100);

ALTER TABLE "kpi_measurements"
ADD CONSTRAINT "kpi_measurements_percentage_bounds_check"
CHECK (
  "unit" <> 'PERCENTAGE'
  OR (
    "measured_value" BETWEEN 0 AND 100
    AND "target" BETWEEN 0 AND 100
    AND "warning_threshold" BETWEEN 0 AND 100
    AND "critical_threshold" BETWEEN 0 AND 100
  )
);

ALTER TABLE "kpi_measurements"
ADD CONSTRAINT "kpi_measurements_rules_version_check"
CHECK (length(trim("rules_version")) > 0);

ALTER TABLE "kpi_measurements"
ADD CONSTRAINT "kpi_measurements_fingerprint_check"
CHECK (length(trim("fingerprint")) > 0);

ALTER TABLE "kpi_measurements"
ADD CONSTRAINT "kpi_measurements_explanation_check"
CHECK (length(trim("explanation")) > 0);

ALTER TABLE "kpi_measurements"
ADD CONSTRAINT "kpi_measurements_system_rule_check"
CHECK (
  "data_source_type" <> 'SYSTEM'
  OR (
    "calculation_rule_code" IS NOT NULL
    AND length(trim("calculation_rule_code")) > 0
  )
);
