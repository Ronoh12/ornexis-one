-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "county_state" TEXT,
    "country" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "branch_id" UUID,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branches_organization_id_idx" ON "branches"("organization_id");

-- CreateIndex
CREATE INDEX "branches_organization_id_is_active_idx" ON "branches"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "branches_organization_id_name_key" ON "branches"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "branches_organization_id_code_key" ON "branches"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "branches_id_organization_id_key" ON "branches"("id", "organization_id");

-- CreateIndex
CREATE INDEX "departments_organization_id_idx" ON "departments"("organization_id");

-- CreateIndex
CREATE INDEX "departments_branch_id_idx" ON "departments"("branch_id");

-- CreateIndex
CREATE INDEX "departments_organization_id_is_active_idx" ON "departments"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "departments_organization_id_name_key" ON "departments"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_organization_id_code_key" ON "departments"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_id_organization_id_key" ON "departments"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
