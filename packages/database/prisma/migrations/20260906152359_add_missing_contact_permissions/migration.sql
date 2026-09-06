-- Sprint 021
-- Restore Contact permissions already required by the existing API routes.

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
  'contacts.view',
  'View Contacts',
  'Allows viewing authorized Contacts',
  'contacts',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'contacts.create',
  'Create Contacts',
  'Allows creating authorized Contacts',
  'contacts',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'contacts.delete',
  'Delete Contacts',
  'Allows deleting authorized Contacts',
  'contacts',
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
    'contacts.view',
    'contacts.create',
    'contacts.delete'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
