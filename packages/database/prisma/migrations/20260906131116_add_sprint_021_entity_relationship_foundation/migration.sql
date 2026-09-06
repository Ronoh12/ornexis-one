-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('ORGANIZATION', 'BRANCH', 'DEPARTMENT', 'ORGANIZATION_USER', 'CONTACT', 'DOCUMENT', 'WORK_ITEM', 'REQUEST', 'WORKFLOW_DEFINITION', 'WORKFLOW_INSTANCE');

-- CreateEnum
CREATE TYPE "EntityRelationshipType" AS ENUM ('RELATED_TO', 'DEPENDS_ON', 'BLOCKS', 'SUPPORTS', 'REFERENCES', 'ASSOCIATED_WITH', 'ORIGINATED_FROM', 'FULFILLS');

-- CreateTable
CREATE TABLE "entity_relationships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "source_type" "EntityType" NOT NULL,
    "source_id" UUID NOT NULL,
    "target_type" "EntityType" NOT NULL,
    "target_id" UUID NOT NULL,
    "relationship_type" "EntityRelationshipType" NOT NULL,
    "canonical_key" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_by_organization_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entity_relationships_organization_id_idx" ON "entity_relationships"("organization_id");

-- CreateIndex
CREATE INDEX "entity_relationships_organization_id_source_type_source_id_idx" ON "entity_relationships"("organization_id", "source_type", "source_id");

-- CreateIndex
CREATE INDEX "entity_relationships_organization_id_target_type_target_id_idx" ON "entity_relationships"("organization_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "entity_relationships_organization_id_relationship_type_idx" ON "entity_relationships"("organization_id", "relationship_type");

-- CreateIndex
CREATE INDEX "entity_relationships_organization_id_created_at_idx" ON "entity_relationships"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "entity_relationships_created_by_organization_user_id_idx" ON "entity_relationships"("created_by_organization_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_relationships_id_organization_id_key" ON "entity_relationships"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_relationships_org_canonical_key" ON "entity_relationships"("organization_id", "canonical_key");

-- AddForeignKey
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_relationships" ADD CONSTRAINT "entity_relationships_created_by_organization_user_id_organ_fkey" FOREIGN KEY ("created_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sprint 021 database-level relationship integrity.

ALTER TABLE "entity_relationships"
ADD CONSTRAINT "entity_relationships_no_self_relationship_check"
CHECK (
  "source_type" <> "target_type"
  OR "source_id" <> "target_id"
);

ALTER TABLE "entity_relationships"
ADD CONSTRAINT "entity_relationships_canonical_key_check"
CHECK (
  "canonical_key" ~ '^[0-9a-f]{64}$'
);

ALTER TABLE "entity_relationships"
ADD CONSTRAINT "entity_relationships_description_length_check"
CHECK (
  "description" IS NULL
  OR char_length("description") BETWEEN 1 AND 1000
);

ALTER TABLE "entity_relationships"
ADD CONSTRAINT "entity_relationships_metadata_size_check"
CHECK (
  "metadata" IS NULL
  OR octet_length("metadata"::text) <= 8192
);
