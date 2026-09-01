-- Sprint 016
-- Attention Centre Foundation permissions.

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
    'attention.view',
    'View Attention Centre',
    'Allows viewing authorized Attention Centre items',
    'attention',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'attention.manage',
    'Manage Attention Centre',
    'Allows acknowledging and dismissing authorized attention items',
    'attention',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'attention.evaluate',
    'Evaluate Attention Centre',
    'Allows invoking deterministic Attention Centre evaluation',
    'attention',
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
    'attention.view',
    'attention.manage',
    'attention.evaluate'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
