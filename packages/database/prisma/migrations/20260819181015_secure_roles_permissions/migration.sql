-- Add role-management permissions
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
    'roles.view',
    'View Roles',
    'Allows viewing organization roles',
    'roles',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'roles.manage',
    'Manage Roles',
    'Allows managing organization roles',
    'roles',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;

-- Grant role-management permissions to existing Administrator system roles
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
    'roles.view',
    'roles.manage'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;