-- AlterTable
ALTER TABLE "organization_users" ADD COLUMN     "branch_id" UUID,
ADD COLUMN     "department_id" UUID;

-- CreateIndex
CREATE INDEX "organization_users_branch_id_idx" ON "organization_users"("branch_id");

-- CreateIndex
CREATE INDEX "organization_users_department_id_idx" ON "organization_users"("department_id");

-- CreateIndex
CREATE INDEX "organization_users_organization_id_branch_id_idx" ON "organization_users"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "organization_users_organization_id_department_id_idx" ON "organization_users"("organization_id", "department_id");

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_department_id_organization_id_fkey" FOREIGN KEY ("department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
