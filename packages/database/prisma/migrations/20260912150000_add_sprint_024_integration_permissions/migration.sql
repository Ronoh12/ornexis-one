-- Sprint 024
-- Integration Gateway and Outbound Webhook permissions.

INSERT INTO "permissions" (
  "id",
  "code",
  "name",
  "description",
  "module",
  "integration_assignable",
  "created_at",
  "updated_at"
)
VALUES
(
  gen_random_uuid(),
  'integrations.view',
  'View Integrations',
  'Allows viewing authorized integration configuration',
  'integrations',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'integrations.manage',
  'Manage Integrations',
  'Allows managing integration-client lifecycle and configuration',
  'integrations',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'integrations.credentials',
  'Manage Integration Credentials',
  'Allows issuing, rotating and revoking integration credentials and secrets',
  'integrations',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'integrations.webhooks',
  'Manage Integration Webhooks',
  'Allows managing webhook endpoints and event subscriptions',
  'integrations',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'integrations.deliveries',
  'View Integration Deliveries',
  'Allows viewing integration events, deliveries and delivery attempts',
  'integrations',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  'integrations.publish',
  'Publish Integration Events',
  'Allows publishing registered tenant-owned integration events',
  'integrations',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO UPDATE
SET
  "name" =
    EXCLUDED."name",
  "description" =
    EXCLUDED."description",
  "module" =
    EXCLUDED."module",
  "integration_assignable" =
    EXCLUDED."integration_assignable",
  "updated_at" =
    CURRENT_TIMESTAMP;

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
    'integrations.view',
    'integrations.manage',
    'integrations.credentials',
    'integrations.webhooks',
    'integrations.deliveries',
    'integrations.publish'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
