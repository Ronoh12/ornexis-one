-- Branch permissions

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
    'branches.view',
    'View Branches',
    'Allows viewing organization branches',
    'branches',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'branches.manage',
    'Manage Branches',
    'Allows creating, updating and deleting organization branches',
    'branches',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'departments.view',
    'View Departments',
    'Allows viewing organization departments',
    'departments',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'departments.manage',
    'Manage Departments',
    'Allows creating, updating and deleting organization departments',
    'departments',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;

-- Grant organization-structure permissions
-- to existing Administrator system roles.

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
    'branches.view',
    'branches.manage',
    'departments.view',
    'departments.manage'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;