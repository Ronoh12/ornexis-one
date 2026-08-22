/*
  Warnings:

  - A unique constraint covering the columns `[id,organization_id]` on the table `contacts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,organization_id]` on the table `documents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,organization_id]` on the table `organization_users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkItemPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "WorkItemActivityType" AS ENUM ('CREATED', 'UPDATED', 'OWNER_CHANGED', 'ASSIGNEE_CHANGED', 'PRIORITY_CHANGED', 'DUE_DATE_CHANGED', 'STATUS_CHANGED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntityAttachmentType" AS ENUM ('WORK_ITEM', 'CONTACT');

-- CreateTable
CREATE TABLE "work_items" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "branch_id" UUID,
    "department_id" UUID,
    "contact_id" UUID,
    "created_by_organization_user_id" UUID NOT NULL,
    "owner_organization_user_id" UUID,
    "assignee_organization_user_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "WorkItemPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "WorkItemStatus" NOT NULL DEFAULT 'OPEN',
    "due_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "completed_by_organization_user_id" UUID,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_item_comments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "work_item_id" UUID NOT NULL,
    "author_organization_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_item_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_item_activities" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "work_item_id" UUID NOT NULL,
    "actor_organization_user_id" UUID,
    "activity_type" "WorkItemActivityType" NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_item_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_attachments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "entity_type" "EntityAttachmentType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "attached_by_organization_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_items_organization_id_idx" ON "work_items"("organization_id");

-- CreateIndex
CREATE INDEX "work_items_organization_id_status_idx" ON "work_items"("organization_id", "status");

-- CreateIndex
CREATE INDEX "work_items_organization_id_priority_idx" ON "work_items"("organization_id", "priority");

-- CreateIndex
CREATE INDEX "work_items_organization_id_owner_organization_user_id_idx" ON "work_items"("organization_id", "owner_organization_user_id");

-- CreateIndex
CREATE INDEX "work_items_organization_id_assignee_organization_user_id_idx" ON "work_items"("organization_id", "assignee_organization_user_id");

-- CreateIndex
CREATE INDEX "work_items_organization_id_branch_id_idx" ON "work_items"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "work_items_organization_id_department_id_idx" ON "work_items"("organization_id", "department_id");

-- CreateIndex
CREATE INDEX "work_items_organization_id_contact_id_idx" ON "work_items"("organization_id", "contact_id");

-- CreateIndex
CREATE INDEX "work_items_organization_id_due_at_idx" ON "work_items"("organization_id", "due_at");

-- CreateIndex
CREATE INDEX "work_items_organization_id_created_at_idx" ON "work_items"("organization_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "work_items_id_organization_id_key" ON "work_items"("id", "organization_id");

-- CreateIndex
CREATE INDEX "work_item_comments_work_item_id_idx" ON "work_item_comments"("work_item_id");

-- CreateIndex
CREATE INDEX "work_item_comments_author_organization_user_id_idx" ON "work_item_comments"("author_organization_user_id");

-- CreateIndex
CREATE INDEX "work_item_comments_created_at_idx" ON "work_item_comments"("created_at");

-- CreateIndex
CREATE INDEX "work_item_comments_organization_id_work_item_id_idx" ON "work_item_comments"("organization_id", "work_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_item_comments_id_organization_id_key" ON "work_item_comments"("id", "organization_id");

-- CreateIndex
CREATE INDEX "work_item_activities_work_item_id_idx" ON "work_item_activities"("work_item_id");

-- CreateIndex
CREATE INDEX "work_item_activities_actor_organization_user_id_idx" ON "work_item_activities"("actor_organization_user_id");

-- CreateIndex
CREATE INDEX "work_item_activities_activity_type_idx" ON "work_item_activities"("activity_type");

-- CreateIndex
CREATE INDEX "work_item_activities_created_at_idx" ON "work_item_activities"("created_at");

-- CreateIndex
CREATE INDEX "work_item_activities_organization_id_work_item_id_idx" ON "work_item_activities"("organization_id", "work_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_item_activities_id_organization_id_key" ON "work_item_activities"("id", "organization_id");

-- CreateIndex
CREATE INDEX "entity_attachments_organization_id_idx" ON "entity_attachments"("organization_id");

-- CreateIndex
CREATE INDEX "entity_attachments_document_id_idx" ON "entity_attachments"("document_id");

-- CreateIndex
CREATE INDEX "entity_attachments_entity_type_entity_id_idx" ON "entity_attachments"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "entity_attachments_organization_id_entity_type_entity_id_idx" ON "entity_attachments"("organization_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_attachments_organization_id_document_id_entity_type__key" ON "entity_attachments"("organization_id", "document_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_id_organization_id_key" ON "contacts"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_id_organization_id_key" ON "documents"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_users_id_organization_id_key" ON "organization_users"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_department_id_organization_id_fkey" FOREIGN KEY ("department_id", "organization_id") REFERENCES "departments"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_contact_id_organization_id_fkey" FOREIGN KEY ("contact_id", "organization_id") REFERENCES "contacts"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_created_by_organization_user_id_organization_id_fkey" FOREIGN KEY ("created_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_owner_organization_user_id_organization_id_fkey" FOREIGN KEY ("owner_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_assignee_organization_user_id_organization_id_fkey" FOREIGN KEY ("assignee_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_completed_by_organization_user_id_organization__fkey" FOREIGN KEY ("completed_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_comments" ADD CONSTRAINT "work_item_comments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_comments" ADD CONSTRAINT "work_item_comments_work_item_id_organization_id_fkey" FOREIGN KEY ("work_item_id", "organization_id") REFERENCES "work_items"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_comments" ADD CONSTRAINT "work_item_comments_author_organization_user_id_organizatio_fkey" FOREIGN KEY ("author_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_activities" ADD CONSTRAINT "work_item_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_activities" ADD CONSTRAINT "work_item_activities_work_item_id_organization_id_fkey" FOREIGN KEY ("work_item_id", "organization_id") REFERENCES "work_items"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_activities" ADD CONSTRAINT "work_item_activities_actor_organization_user_id_organizati_fkey" FOREIGN KEY ("actor_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_attachments" ADD CONSTRAINT "entity_attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_attachments" ADD CONSTRAINT "entity_attachments_document_id_organization_id_fkey" FOREIGN KEY ("document_id", "organization_id") REFERENCES "documents"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_attachments" ADD CONSTRAINT "entity_attachments_attached_by_organization_user_id_organi_fkey" FOREIGN KEY ("attached_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
