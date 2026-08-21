-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'S3', 'AZURE_BLOB');

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "branch_id" UUID,
    "department_id" UUID,
    "uploaded_by_user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "original_file_name" TEXT NOT NULL,
    "stored_file_name" TEXT NOT NULL,
    "storage_provider" "StorageProvider" NOT NULL DEFAULT 'LOCAL',
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_extension" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "checksum_sha256" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_organization_id_idx" ON "documents"("organization_id");

-- CreateIndex
CREATE INDEX "documents_organization_id_status_idx" ON "documents"("organization_id", "status");

-- CreateIndex
CREATE INDEX "documents_organization_id_branch_id_idx" ON "documents"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "documents_organization_id_department_id_idx" ON "documents"("organization_id", "department_id");

-- CreateIndex
CREATE INDEX "documents_organization_id_mime_type_idx" ON "documents"("organization_id", "mime_type");

-- CreateIndex
CREATE INDEX "documents_uploaded_by_user_id_idx" ON "documents"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "documents_checksum_sha256_idx" ON "documents"("checksum_sha256");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_department_id_organization_id_fkey" FOREIGN KEY ("department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
