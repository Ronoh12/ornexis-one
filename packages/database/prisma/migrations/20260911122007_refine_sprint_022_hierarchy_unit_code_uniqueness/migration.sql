/*
  Warnings:

  - A unique constraint covering the columns `[organization_id,unit_type_id,code]` on the table `organizational_units` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "organizational_units_org_code";

-- CreateIndex
CREATE UNIQUE INDEX "organizational_units_org_type_code" ON "organizational_units"("organization_id", "unit_type_id", "code");
