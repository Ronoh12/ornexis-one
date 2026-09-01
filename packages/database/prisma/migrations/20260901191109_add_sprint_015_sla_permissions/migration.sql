-- Sprint 015
-- SLA, Deadlines & Escalation Foundation permissions.

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
    'sla.view',
    'View SLA',
    'Allows viewing SLA policies, targets, runtime instances and SLA event history',
    'sla',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'sla.manage',
    'Manage SLA',
    'Allows managing SLA policies and timing targets',
    'sla',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'sla.evaluate',
    'Evaluate SLA',
    'Allows invoking SLA deadline, warning, breach and escalation evaluation',
    'sla',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;

-- Grant Sprint 015 SLA permissions to existing
-- Administrator system roles.

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
    'sla.view',
    'sla.manage',
    'sla.evaluate'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
