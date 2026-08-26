-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'IN_FULFILMENT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RequestActivityType" AS ENUM ('CREATED', 'UPDATED', 'SUBMITTED', 'ASSIGNED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "EntityAttachmentType" ADD VALUE 'REQUEST';

-- CreateTable
CREATE TABLE "request_types" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "form_schema" JSONB,
    "default_priority" "RequestPriority" NOT NULL DEFAULT 'NORMAL',
    "default_assignee_organization_user_id" UUID,
    "default_department_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "request_type_id" UUID NOT NULL,
    "request_number" TEXT,
    "requester_organization_user_id" UUID NOT NULL,
    "assigned_to_organization_user_id" UUID,
    "branch_id" UUID,
    "department_id" UUID,
    "contact_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "form_data" JSONB,
    "priority" "RequestPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "due_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_comments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "author_organization_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_activities" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "actor_organization_user_id" UUID,
    "activity_type" "RequestActivityType" NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "request_types_organization_id_idx" ON "request_types"("organization_id");

-- CreateIndex
CREATE INDEX "request_types_organization_id_is_active_idx" ON "request_types"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "request_types_organization_id_default_assignee_organization_idx" ON "request_types"("organization_id", "default_assignee_organization_user_id");

-- CreateIndex
CREATE INDEX "request_types_organization_id_default_department_id_idx" ON "request_types"("organization_id", "default_department_id");

-- CreateIndex
CREATE UNIQUE INDEX "request_types_id_organization_id_key" ON "request_types"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "request_types_organization_id_code_key" ON "request_types"("organization_id", "code");

-- CreateIndex
CREATE INDEX "requests_organization_id_idx" ON "requests"("organization_id");

-- CreateIndex
CREATE INDEX "requests_organization_id_request_type_id_idx" ON "requests"("organization_id", "request_type_id");

-- CreateIndex
CREATE INDEX "requests_organization_id_status_idx" ON "requests"("organization_id", "status");

-- CreateIndex
CREATE INDEX "requests_organization_id_priority_idx" ON "requests"("organization_id", "priority");

-- CreateIndex
CREATE INDEX "requests_organization_id_requester_organization_user_id_idx" ON "requests"("organization_id", "requester_organization_user_id");

-- CreateIndex
CREATE INDEX "requests_organization_id_assigned_to_organization_user_id_idx" ON "requests"("organization_id", "assigned_to_organization_user_id");

-- CreateIndex
CREATE INDEX "requests_organization_id_branch_id_idx" ON "requests"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "requests_organization_id_department_id_idx" ON "requests"("organization_id", "department_id");

-- CreateIndex
CREATE INDEX "requests_organization_id_contact_id_idx" ON "requests"("organization_id", "contact_id");

-- CreateIndex
CREATE INDEX "requests_organization_id_due_at_idx" ON "requests"("organization_id", "due_at");

-- CreateIndex
CREATE INDEX "requests_organization_id_created_at_idx" ON "requests"("organization_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "requests_id_organization_id_key" ON "requests"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "requests_organization_id_request_number_key" ON "requests"("organization_id", "request_number");

-- CreateIndex
CREATE INDEX "request_comments_organization_id_request_id_idx" ON "request_comments"("organization_id", "request_id");

-- CreateIndex
CREATE INDEX "request_comments_organization_id_author_organization_user_i_idx" ON "request_comments"("organization_id", "author_organization_user_id");

-- CreateIndex
CREATE INDEX "request_comments_created_at_idx" ON "request_comments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "request_comments_id_organization_id_key" ON "request_comments"("id", "organization_id");

-- CreateIndex
CREATE INDEX "request_activities_organization_id_request_id_idx" ON "request_activities"("organization_id", "request_id");

-- CreateIndex
CREATE INDEX "request_activities_organization_id_actor_organization_user__idx" ON "request_activities"("organization_id", "actor_organization_user_id");

-- CreateIndex
CREATE INDEX "request_activities_organization_id_activity_type_idx" ON "request_activities"("organization_id", "activity_type");

-- CreateIndex
CREATE INDEX "request_activities_created_at_idx" ON "request_activities"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "request_activities_id_organization_id_key" ON "request_activities"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "request_types" ADD CONSTRAINT "request_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_types" ADD CONSTRAINT "request_types_default_assignee_organization_user_id_organi_fkey" FOREIGN KEY ("default_assignee_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_types" ADD CONSTRAINT "request_types_default_department_id_organization_id_fkey" FOREIGN KEY ("default_department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_request_type_id_organization_id_fkey" FOREIGN KEY ("request_type_id", "organization_id") REFERENCES "request_types"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requester_organization_user_id_organization_id_fkey" FOREIGN KEY ("requester_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_assigned_to_organization_user_id_organization_id_fkey" FOREIGN KEY ("assigned_to_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_department_id_organization_id_fkey" FOREIGN KEY ("department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_contact_id_organization_id_fkey" FOREIGN KEY ("contact_id", "organization_id") REFERENCES "contacts"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_request_id_organization_id_fkey" FOREIGN KEY ("request_id", "organization_id") REFERENCES "requests"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_author_organization_user_id_organization__fkey" FOREIGN KEY ("author_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_activities" ADD CONSTRAINT "request_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_activities" ADD CONSTRAINT "request_activities_request_id_organization_id_fkey" FOREIGN KEY ("request_id", "organization_id") REFERENCES "requests"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_activities" ADD CONSTRAINT "request_activities_actor_organization_user_id_organization_fkey" FOREIGN KEY ("actor_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
