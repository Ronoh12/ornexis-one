-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "recipient_organization_user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "source_type" TEXT,
    "source_id" TEXT,
    "action_url" TEXT,
    "metadata" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "organization_user_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_organization_id_idx" ON "notifications"("organization_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_organization_user_id_idx" ON "notifications"("recipient_organization_user_id");

-- CreateIndex
CREATE INDEX "notifications_org_recipient_idx" ON "notifications"("organization_id", "recipient_organization_user_id");

-- CreateIndex
CREATE INDEX "notifications_org_recipient_read_idx" ON "notifications"("organization_id", "recipient_organization_user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_organization_id_priority_idx" ON "notifications"("organization_id", "priority");

-- CreateIndex
CREATE INDEX "notifications_organization_id_type_idx" ON "notifications"("organization_id", "type");

-- CreateIndex
CREATE INDEX "notifications_organization_id_source_type_idx" ON "notifications"("organization_id", "source_type");

-- CreateIndex
CREATE INDEX "notifications_source_type_source_id_idx" ON "notifications"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notification_preferences_organization_id_idx" ON "notification_preferences"("organization_id");

-- CreateIndex
CREATE INDEX "notification_preferences_organization_user_id_idx" ON "notification_preferences"("organization_user_id");

-- CreateIndex
CREATE INDEX "notification_preferences_organization_id_organization_user__idx" ON "notification_preferences"("organization_id", "organization_user_id");

-- CreateIndex
CREATE INDEX "notification_preferences_channel_idx" ON "notification_preferences"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_organization_id_organization_user__key" ON "notification_preferences"("organization_id", "organization_user_id", "channel");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_organization_user_id_organization__fkey" FOREIGN KEY ("recipient_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organization_user_id_organization_fkey" FOREIGN KEY ("organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
