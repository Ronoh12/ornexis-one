-- Sprint 010
-- Add Document Management permissions.

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
    'documents.view',
    'View Documents',
    'Allows viewing organization document metadata',
    'documents',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'documents.upload',
    'Upload Documents',
    'Allows uploading organization documents',
    'documents',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'documents.update',
    'Update Documents',
    'Allows updating organization document metadata',
    'documents',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'documents.download',
    'Download Documents',
    'Allows downloading organization document files',
    'documents',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'documents.delete',
    'Delete Documents',
    'Allows deleting organization documents and stored files',
    'documents',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;

-- Grant Document Management permissions
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
    'documents.view',
    'documents.upload',
    'documents.update',
    'documents.download',
    'documents.delete'
  )
ON CONFLICT ("role_id", "permission_id")
DO NOTHING;