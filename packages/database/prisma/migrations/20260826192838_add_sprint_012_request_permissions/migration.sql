-- Sprint 012
-- Add Request Centre permissions.

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
    'requests.view',
    'View Requests',
    'Allows viewing organization requests',
    'requests',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'requests.create',
    'Create Requests',
    'Allows creating organization requests',
    'requests',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'requests.update',
    'Update Requests',
    'Allows updating organization requests',
    'requests',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'requests.assign',
    'Assign Requests',
    'Allows assigning organization requests',
    'requests',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'requests.comment',
    'Comment on Requests',
    'Allows commenting on organization requests',
    'requests',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'requests.attach',
    'Attach Request Documents',
    'Allows attaching documents to organization requests',
    'requests',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'requests.manage_types',
    'Manage Request Types',
    'Allows creating and updating organization request types',
    'requests',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;

-- Grant Sprint 012 Request Centre permissions
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
    'requests.view',
    'requests.create',
    'requests.update',
    'requests.assign',
    'requests.comment',
    'requests.attach',
    'requests.manage_types'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
