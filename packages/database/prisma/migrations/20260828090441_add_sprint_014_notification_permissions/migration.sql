-- Sprint 014
-- Notification Infrastructure permissions.

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
    'notifications.view',
    'View Notifications',
    'Allows viewing the authenticated organization user notification inbox',
    'notifications',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'notifications.manage',
    'Manage Notifications',
    'Allows administering organization notification capabilities',
    'notifications',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;

-- Grant Sprint 014 Notification Infrastructure permissions
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
    'notifications.view',
    'notifications.manage'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
