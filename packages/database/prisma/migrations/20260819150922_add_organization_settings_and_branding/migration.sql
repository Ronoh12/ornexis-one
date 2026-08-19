-- CreateTable
CREATE TABLE "organization_settings" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "date_format" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "time_format" TEXT NOT NULL DEFAULT '24h',
    "week_starts_on" INTEGER NOT NULL DEFAULT 1,
    "default_language" TEXT NOT NULL DEFAULT 'en',
    "default_country" TEXT,
    "default_currency" TEXT,
    "default_timezone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_branding" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "display_name" TEXT,
    "short_name" TEXT,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "accent_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_branding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_organization_id_key" ON "organization_settings"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_branding_organization_id_key" ON "organization_branding"("organization_id");

-- AddForeignKey
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_branding" ADD CONSTRAINT "organization_branding_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add Sprint 004 organization management permissions
INSERT INTO "permissions" (
  "id",
  "code",
  "name",
  "description",
  "module",
  "created_at",
  "updated_at"
)
VALUES
  (
    gen_random_uuid(),
    'organizations.update',
    'Update Organizations',
    'Allows updating organization profile information',
    'organizations',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'organization_settings.view',
    'View Organization Settings',
    'Allows viewing organization settings',
    'organization_settings',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'organization_settings.manage',
    'Manage Organization Settings',
    'Allows managing organization settings',
    'organization_settings',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'organization_branding.view',
    'View Organization Branding',
    'Allows viewing organization branding',
    'organization_branding',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'organization_branding.manage',
    'Manage Organization Branding',
    'Allows managing organization branding',
    'organization_branding',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;

-- Grant Sprint 004 permissions to existing Administrator system roles
INSERT INTO "role_permissions" (
  "id",
  "role_id",
  "permission_id",
  "created_at"
)
SELECT
  gen_random_uuid(),
  r."id",
  p."id",
  CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."name" = 'Administrator'
  AND r."is_system_role" = true
  AND p."code" IN (
    'organizations.update',
    'organization_settings.view',
    'organization_settings.manage',
    'organization_branding.view',
    'organization_branding.manage'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;