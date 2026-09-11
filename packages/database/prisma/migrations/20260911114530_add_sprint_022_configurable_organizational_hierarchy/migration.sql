-- CreateEnum
CREATE TYPE "OrganizationalUnitAssignmentRole" AS ENUM ('MEMBER', 'MANAGER', 'OWNER', 'RESPONSIBLE');

-- CreateTable
CREATE TABLE "organizational_unit_types" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system_managed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizational_unit_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizational_units" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "unit_type_id" UUID NOT NULL,
    "parent_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "legacy_branch_id" UUID,
    "legacy_department_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizational_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizational_unit_assignments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "organizational_unit_id" UUID NOT NULL,
    "organization_user_id" UUID NOT NULL,
    "assignment_role" "OrganizationalUnitAssignmentRole" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "responsibility_label" TEXT,
    "effective_start" TIMESTAMP(3),
    "effective_end" TIMESTAMP(3),
    "assigned_by_organization_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizational_unit_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizational_unit_types_organization_id_idx" ON "organizational_unit_types"("organization_id");

-- CreateIndex
CREATE INDEX "organizational_unit_types_organization_id_is_active_idx" ON "organizational_unit_types"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "organizational_unit_types_organization_id_display_order_idx" ON "organizational_unit_types"("organization_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_unit_types_id_organization_id_key" ON "organizational_unit_types"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_unit_types_org_code" ON "organizational_unit_types"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_unit_types_org_name" ON "organizational_unit_types"("organization_id", "name");

-- CreateIndex
CREATE INDEX "organizational_units_organization_id_idx" ON "organizational_units"("organization_id");

-- CreateIndex
CREATE INDEX "organizational_units_organization_id_unit_type_id_idx" ON "organizational_units"("organization_id", "unit_type_id");

-- CreateIndex
CREATE INDEX "organizational_units_organization_id_parent_id_idx" ON "organizational_units"("organization_id", "parent_id");

-- CreateIndex
CREATE INDEX "organizational_units_organization_id_is_active_idx" ON "organizational_units"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "organizational_units_legacy_branch_id_idx" ON "organizational_units"("legacy_branch_id");

-- CreateIndex
CREATE INDEX "organizational_units_legacy_department_id_idx" ON "organizational_units"("legacy_department_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_units_id_organization_id_key" ON "organizational_units"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_units_org_code" ON "organizational_units"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_units_legacy_branch_org" ON "organizational_units"("legacy_branch_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_units_legacy_department_org" ON "organizational_units"("legacy_department_id", "organization_id");

-- CreateIndex
CREATE INDEX "organizational_unit_assignments_organization_id_idx" ON "organizational_unit_assignments"("organization_id");

-- CreateIndex
CREATE INDEX "org_unit_assignments_org_unit_idx" ON "organizational_unit_assignments"("organization_id", "organizational_unit_id");

-- CreateIndex
CREATE INDEX "org_unit_assignments_org_user_idx" ON "organizational_unit_assignments"("organization_id", "organization_user_id");

-- CreateIndex
CREATE INDEX "organizational_unit_assignments_organization_id_assignment__idx" ON "organizational_unit_assignments"("organization_id", "assignment_role");

-- CreateIndex
CREATE INDEX "organizational_unit_assignments_organization_id_is_active_idx" ON "organizational_unit_assignments"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "organizational_unit_assignments_assigned_by_organization_us_idx" ON "organizational_unit_assignments"("assigned_by_organization_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_unit_assignments_id_organization_id_key" ON "organizational_unit_assignments"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "organizational_unit_types" ADD CONSTRAINT "organizational_unit_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_unit_type_id_organization_id_fkey" FOREIGN KEY ("unit_type_id", "organization_id") REFERENCES "organizational_unit_types"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_parent_id_organization_id_fkey" FOREIGN KEY ("parent_id", "organization_id") REFERENCES "organizational_units"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_legacy_branch_id_organization_id_fkey" FOREIGN KEY ("legacy_branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_legacy_department_id_organization_id_fkey" FOREIGN KEY ("legacy_department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_unit_assignments" ADD CONSTRAINT "organizational_unit_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_unit_assignments" ADD CONSTRAINT "organizational_unit_assignments_organizational_unit_id_org_fkey" FOREIGN KEY ("organizational_unit_id", "organization_id") REFERENCES "organizational_units"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_unit_assignments" ADD CONSTRAINT "organizational_unit_assignments_organization_user_id_organ_fkey" FOREIGN KEY ("organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_unit_assignments" ADD CONSTRAINT "organizational_unit_assignments_assigned_by_organization_u_fkey" FOREIGN KEY ("assigned_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sprint 022 database invariants
ALTER TABLE "organizational_unit_types"
ADD CONSTRAINT "organizational_unit_types_code_not_blank"
CHECK (btrim("code") <> '');

ALTER TABLE "organizational_unit_types"
ADD CONSTRAINT "organizational_unit_types_name_not_blank"
CHECK (btrim("name") <> '');

ALTER TABLE "organizational_units"
ADD CONSTRAINT "organizational_units_code_not_blank"
CHECK (btrim("code") <> '');

ALTER TABLE "organizational_units"
ADD CONSTRAINT "organizational_units_name_not_blank"
CHECK (btrim("name") <> '');

ALTER TABLE "organizational_units"
ADD CONSTRAINT "organizational_units_normalized_name_not_blank"
CHECK (btrim("normalized_name") <> '');

ALTER TABLE "organizational_units"
ADD CONSTRAINT "organizational_units_not_self_parent"
CHECK (
  "parent_id" IS NULL OR
  "parent_id" <> "id"
);

ALTER TABLE "organizational_units"
ADD CONSTRAINT "organizational_units_one_legacy_source"
CHECK (
  NOT (
    "legacy_branch_id" IS NOT NULL AND
    "legacy_department_id" IS NOT NULL
  )
);

ALTER TABLE "organizational_unit_assignments"
ADD CONSTRAINT "organizational_unit_assignments_effective_period"
CHECK (
  "effective_start" IS NULL OR
  "effective_end" IS NULL OR
  "effective_end" >= "effective_start"
);

ALTER TABLE "organizational_unit_assignments"
ADD CONSTRAINT "organizational_unit_assignments_primary_active"
CHECK (
  NOT "is_primary" OR
  "is_active"
);

CREATE UNIQUE INDEX "organizational_units_root_sibling_name"
ON "organizational_units" (
  "organization_id",
  "unit_type_id",
  "normalized_name"
)
WHERE "parent_id" IS NULL;

CREATE UNIQUE INDEX "organizational_units_child_sibling_name"
ON "organizational_units" (
  "organization_id",
  "parent_id",
  "unit_type_id",
  "normalized_name"
)
WHERE "parent_id" IS NOT NULL;

CREATE UNIQUE INDEX "organizational_unit_assignments_active_semantic"
ON "organizational_unit_assignments" (
  "organization_id",
  "organizational_unit_id",
  "organization_user_id",
  "assignment_role"
)
WHERE "is_active" = true;

CREATE UNIQUE INDEX "organizational_unit_assignments_active_primary"
ON "organizational_unit_assignments" (
  "organization_id",
  "organization_user_id"
)
WHERE
  "is_active" = true AND
  "is_primary" = true;
