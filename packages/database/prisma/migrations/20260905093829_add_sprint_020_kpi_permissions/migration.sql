-- Sprint 020
-- Configurable KPI Framework permissions.

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
  'kpi.view',
  'View KPIs',
  'Allows viewing authorized KPI categories, definitions and measurements',
  'kpi',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'kpi.manage',
  'Manage KPIs',
  'Allows managing authorized KPI categories and definitions',
  'kpi',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'kpi.evaluate',
  'Evaluate KPIs',
  'Allows submitting manual KPI measurements and running authorized KPI evaluations',
  'kpi',
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
    'kpi.view',
    'kpi.manage',
    'kpi.evaluate'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
