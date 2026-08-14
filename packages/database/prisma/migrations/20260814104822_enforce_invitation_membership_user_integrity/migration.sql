/*
  Warnings:

  - A unique constraint covering the columns `[id,user_id]` on the table `organization_users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "invitation_tokens" DROP CONSTRAINT "invitation_tokens_organization_user_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "organization_users_id_user_id_key" ON "organization_users"("id", "user_id");

-- AddForeignKey
ALTER TABLE "invitation_tokens" ADD CONSTRAINT "invitation_tokens_organization_user_id_user_id_fkey" FOREIGN KEY ("organization_user_id", "user_id") REFERENCES "organization_users"("id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;
