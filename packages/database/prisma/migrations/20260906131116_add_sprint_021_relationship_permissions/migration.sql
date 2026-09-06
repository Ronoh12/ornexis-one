-- Sprint 021
-- Generic Entity Relationship permissions.

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
  'relationships.view',
  'View Entity Relationships',
  'Allows viewing authorized relationships between supported entities',
  'relationships',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'relationships.manage',
  'Manage Entity Relationships',
  'Allows creating and removing authorized relationships between supported entities',
  'relationships',
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
    'relationships.view',
    'relationships.manage'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
