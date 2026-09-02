-- Sprint 017
-- Hierarchical Organization Health permissions.

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
    'health.view',
    'View Organization Health',
    'Allows viewing authorized Organization Health snapshots and explanations',
    'health',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'health.manage',
    'Manage Organization Health',
    'Allows configuring Organization Health indicator definitions',
    'health',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'health.evaluate',
    'Evaluate Organization Health',
    'Allows invoking deterministic Organization Health evaluation',
    'health',
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
    'health.view',
    'health.manage',
    'health.evaluate'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
