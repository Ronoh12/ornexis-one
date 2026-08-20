-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "branch_id" UUID,
ADD COLUMN     "department_id" UUID;

-- CreateIndex
CREATE INDEX "contacts_branch_id_idx" ON "contacts"("branch_id");

-- CreateIndex
CREATE INDEX "contacts_department_id_idx" ON "contacts"("department_id");

-- CreateIndex
CREATE INDEX "contacts_organization_id_branch_id_idx" ON "contacts"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "contacts_organization_id_department_id_idx" ON "contacts"("organization_id", "department_id");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_department_id_organization_id_fkey" FOREIGN KEY ("department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
