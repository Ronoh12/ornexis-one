-- Sprint 022
-- Configurable Organizational Hierarchy permissions.

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
  'hierarchy.view',
  'View Organizational Hierarchy',
  'Allows viewing authorized organizational units, structure and assignments',
  'hierarchy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'hierarchy.manage',
  'Manage Organizational Hierarchy',
  'Allows managing authorized organizational unit types and units',
  'hierarchy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'hierarchy.assign',
  'Assign Organizational Units',
  'Allows managing authorized organization-user unit assignments',
  'hierarchy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'hierarchy.reconcile',
  'Reconcile Organizational Hierarchy',
  'Allows reconciling legacy Branch and Department hierarchy compatibility',
  'hierarchy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;

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
    'hierarchy.view',
    'hierarchy.manage',
    'hierarchy.assign',
    'hierarchy.reconcile'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
