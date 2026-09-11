-- Sprint 023
-- Comprehensive Auditability and Traceability permissions.

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
  'audit_logs.view',
  'View Audit Logs',
  'Allows viewing authorized organization audit events',
  'audit',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'audit_logs.export',
  'Export Audit Logs',
  'Allows exporting authorized organization audit events',
  'audit',
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
    'audit_logs.view',
    'audit_logs.export'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
