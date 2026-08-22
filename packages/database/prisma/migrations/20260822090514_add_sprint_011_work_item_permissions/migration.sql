-- Sprint 011
-- Add Work Management permissions.

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
    'work_items.view',
    'View Work Items',
    'Allows viewing organization work items',
    'work_items',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'work_items.create',
    'Create Work Items',
    'Allows creating organization work items',
    'work_items',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'work_items.update',
    'Update Work Items',
    'Allows updating organization work items',
    'work_items',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'work_items.assign',
    'Assign Work Items',
    'Allows assigning owners and assignees to organization work items',
    'work_items',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'work_items.complete',
    'Complete Work Items',
    'Allows completing organization work items',
    'work_items',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'work_items.cancel',
    'Cancel Work Items',
    'Allows cancelling organization work items',
    'work_items',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'work_items.comment',
    'Comment on Work Items',
    'Allows adding comments to organization work items',
    'work_items',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'work_items.attach',
    'Attach Work Item Documents',
    'Allows linking documents to organization work items',
    'work_items',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'work_items.manage',
    'Manage Work Items',
    'Allows administering organization work-management capabilities',
    'work_items',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;

-- Grant Sprint 011 Work Management permissions
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
    'work_items.view',
    'work_items.create',
    'work_items.update',
    'work_items.assign',
    'work_items.complete',
    'work_items.cancel',
    'work_items.comment',
    'work_items.attach',
    'work_items.manage'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;
