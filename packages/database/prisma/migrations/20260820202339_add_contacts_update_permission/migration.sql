-- Sprint 008
-- Add granular Contact update permission.

INSERT INTO "permissions" (
  "id",
  "code",
  "name",
  "description",
  "module",
  "created_at",
  "updated_at"
)
VALUES (
  gen_random_uuid(),
  'contacts.update',
  'Update Contacts',
  'Allows updating organization contacts',
  'contacts',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;

-- Grant the new permission to existing Administrator system roles.

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
  AND p."code" = 'contacts.update'
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;