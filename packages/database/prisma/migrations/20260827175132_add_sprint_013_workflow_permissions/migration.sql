-- Sprint 013
-- Workflow & Approval Engine permissions.

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
    'workflow.view',
    'View Workflows',
    'Allows viewing workflow definitions, states, transitions and instances',
    'workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'workflow.manage_definitions',
    'Manage Workflow Definitions',
    'Allows creating and updating workflow definitions, states, transitions and approval steps',
    'workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'workflow.start',
    'Start Workflows',
    'Allows starting workflow instances',
    'workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'workflow.transition',
    'Transition Workflows',
    'Allows moving workflow instances through valid transitions',
    'workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'workflow.approve',
    'Approve Workflow Actions',
    'Allows authorized users to approve or reject workflow approval steps',
    'workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'workflow.cancel',
    'Cancel Workflows',
    'Allows cancelling active workflow instances',
    'workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'workflow.history.view',
    'View Workflow History',
    'Allows viewing workflow instance history and approval history',
    'workflow',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;


-- Grant Sprint 013 workflow permissions
-- to existing Administrator system roles.

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
    'workflow.view',
    'workflow.manage_definitions',
    'workflow.start',
    'workflow.transition',
    'workflow.approve',
    'workflow.cancel',
    'workflow.history.view'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
