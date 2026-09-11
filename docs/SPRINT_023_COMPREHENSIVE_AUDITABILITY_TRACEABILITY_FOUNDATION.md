# Sprint 023 — Comprehensive Auditability and Traceability Foundation

Specification: LOCKED

Implementation status: ACCEPTANCE PASSED — 2026-09-11

## 1. Purpose

Sprint 023 establishes a comprehensive, reusable, tenant-isolated,
permission-aware and append-oriented auditability and traceability foundation
for ORNEXIS ONE.

The platform already records important actions through `AuditLog` and
`createAuditLog`.

Sprint 023 strengthens that foundation without breaking existing audit
callers or existing platform modules.

Auditability remains a cross-cutting platform capability rather than an
independent implementation inside each business module.

## 2. Sprint Boundary

Sprint 023 provides:

- an enhanced audit-event data model
- backward-compatible audit creation
- organization-membership actor context
- event category, source and result context
- request and correlation identifiers
- HTTP request context where available
- normalized audit action and entity identity
- bounded and deterministic audit listing
- tenant-safe filtering and search
- single-event retrieval
- controlled audit export
- sensitive-value redaction
- append-oriented API behavior
- audit-event integrity metadata
- independent audit view and export permissions
- audit API validation
- audit access auditing
- runtime acceptance coverage

Sprint 023 does not provide:

- a full SIEM
- anomaly detection
- automated threat detection
- external SIEM forwarding
- long-term archival infrastructure
- configurable retention execution
- destructive audit administration
- cross-tenant audit search
- arbitrary business-user audit deletion
- arbitrary business-user audit modification

Those capabilities remain reserved for later security, integration and
governance sprints.

## 3. Design Principles

The audit foundation must be:

- tenant-isolated
- append-oriented
- deterministic
- bounded
- permission-aware
- backward-compatible
- data-minimized
- correlation-ready
- investigation-friendly
- resistant to ordinary modification
- safe for security-sensitive information
- reusable across all modules

Client-provided organization ownership must never be trusted.

Audit access must not reveal the existence of foreign-tenant events.

## 4. Existing Compatibility

The existing function remains supported:

`createAuditLog(data)`

Existing callers may continue providing:

- organization ID
- user ID
- action
- entity type
- entity ID
- previous values
- new values
- IP address
- user agent

New audit fields must have safe defaults or remain optional so current modules
continue compiling and operating.

The existing endpoint remains available:

`GET /audit-logs`

Its response becomes bounded and filterable while preserving the established
success envelope.

## 5. Audit Event Identity

Every audit event contains:

- immutable event ID
- optional organization ID
- optional user ID
- optional organization-user ID
- normalized action
- normalized entity type
- optional entity ID
- category
- source
- result
- optional previous values
- optional new values
- optional metadata
- optional IP address
- optional user agent
- optional request ID
- optional correlation ID
- optional HTTP method
- optional request path
- optional HTTP status code
- integrity hash
- creation timestamp

The database-generated event ID and creation timestamp are authoritative.

## 6. Organization Ownership

Organization-owned audit events always store the authenticated organization
context supplied by trusted backend code.

Organization ownership is never accepted from audit query parameters.

All organization audit queries are constrained by the authenticated
organization ID.

Platform events without an organization may exist for authentication or
platform operations, but organization-scoped APIs never expose them.

## 7. Actor Context

An audit actor may include:

- user ID
- organization-user ID
- actor summary at query time
- membership summary at query time

When an authenticated organization membership is available, both user ID and
organization-user ID should be recorded.

Legacy events containing only user ID remain valid.

Actor deletion must not destroy the audit event.

Missing or deleted actors are represented safely without causing query
failure.

## 8. Audit Categories

Initial audit categories are:

- `AUTHENTICATION`
- `AUTHORIZATION`
- `ADMINISTRATION`
- `CONFIGURATION`
- `SECURITY`
- `DATA`
- `WORKFLOW`
- `INTEGRATION`
- `SYSTEM`
- `BUSINESS`

Existing callers default to `BUSINESS` unless a more specific category is
supplied.

Categories support consistent filtering without replacing module-specific
actions.

## 9. Audit Sources

Initial audit sources are:

- `API`
- `AUTHENTICATION`
- `APPLICATION`
- `SYSTEM`
- `JOB`
- `INTEGRATION`
- `MIGRATION`

Existing callers default to `APPLICATION`.

The source identifies where the event originated, not who performed it.

## 10. Audit Results

Initial audit results are:

- `SUCCESS`
- `FAILURE`
- `DENIED`

Existing successful business-action callers default to `SUCCESS`.

Failed or denied operations may be recorded where security or business
significance justifies them.

Recording a failure must not expose secrets or foreign-resource existence.

## 11. Action and Entity Normalization

Audit actions are normalized to uppercase underscore-separated identifiers.

Examples:

- `USER_LOGIN`
- `DOCUMENT_DOWNLOADED`
- `HIERARCHY_UNIT_CREATED`
- `AUDIT_EXPORT_COMPLETED`

Entity types are normalized consistently.

Existing stored action and entity-type values remain readable.

Blank action or entity-type values are rejected.

Action and entity-type lengths are bounded.

## 12. Request Context

Audit events may record:

- request ID
- correlation ID
- HTTP method
- request path
- HTTP status code
- IP address
- user agent

Request IDs support tracing one API request.

Correlation IDs support tracing related work across multiple operations.

Request and correlation identifiers are bounded strings and never treated as
organization ownership.

Raw authorization headers, cookies, tokens and request bodies must not be
stored automatically.

## 13. Correlation

A caller may supply an approved correlation ID.

If no correlation ID exists, events remain independently valid.

Filtering by request ID or correlation ID is exact and tenant-scoped.

Correlation does not grant access to events outside the authenticated
organization.

## 14. Previous and New Values

Previous and new values are optional JSON snapshots.

They should contain only fields appropriate for audit investigation.

They must not automatically contain:

- passwords
- password hashes
- access tokens
- refresh tokens
- authorization headers
- cookies
- private keys
- secret keys
- API credentials
- session secrets
- reset tokens
- activation tokens

## 15. Sensitive-Value Redaction

The shared audit service recursively redacts sensitive keys before
persistence.

Redaction is:

- case-insensitive
- recursive
- applied to arrays and objects
- deterministic
- bounded by maximum nesting depth
- applied to previous values, new values and metadata

Sensitive values are replaced with a fixed redaction marker.

The service must not mutate caller-owned objects.

## 16. Integrity Metadata

New audit events receive a deterministic integrity hash derived from
security-relevant persisted event content.

The integrity hash supports later verification that event content has not
changed unexpectedly.

Integrity verification is not a digital signature and does not claim to
protect against a fully privileged database administrator.

Legacy events without integrity metadata remain readable.

## 17. Append-Oriented Behavior

The public audit API provides no update endpoint.

The public audit API provides no delete endpoint.

Ordinary business users cannot modify or remove audit events.

Retention and archival deletion remain controlled future administrative
capabilities.

Audit reads and exports never mutate existing audit events.

## 18. Database Constraints

The database enforces where practical:

- nonblank action
- nonblank entity type
- valid HTTP status-code range
- bounded indexed identifiers through application validation
- organization-safe organization-user references
- deterministic indexes for common investigation filters

Database constraints complement service validation and do not replace it.

## 19. Audit Permissions

Sprint 023 provides:

- `audit_logs.view`
- `audit_logs.export`

`audit_logs.view` allows authorized organization audit discovery and
single-event retrieval.

`audit_logs.export` independently controls audit export.

Export permission does not replace view permission.

System Administrator roles receive both permissions through migration.

Audit permissions never bypass tenant isolation.

## 20. Audit Listing

The existing endpoint remains:

`GET /audit-logs`

Supported filters include:

- action
- entity type
- entity ID
- user ID
- organization-user ID
- category
- source
- result
- request ID
- correlation ID
- creation time from
- creation time to
- bounded free-text search
- cursor
- limit

Filters may be combined.

Every filter remains constrained to the authenticated organization.

## 21. Deterministic Ordering

Audit events are ordered by:

1. creation timestamp descending
2. event ID descending

This ordering provides a deterministic result when multiple records share the
same timestamp.

Clients cannot supply arbitrary database ordering.

## 22. Cursor Pagination

Audit listing uses opaque cursor pagination.

The cursor represents the last creation timestamp and event ID from the
previous page.

The default page size is 50.

The maximum page size is 200.

Invalid, malformed or foreign cursors fail safely.

Responses contain:

- items
- next cursor when more results exist
- page limit
- has-more indicator

Audit listing never returns an unbounded organization history.

## 23. Search

Free-text search is bounded and case-insensitive.

Initial search targets:

- action
- entity type
- entity ID
- request ID
- correlation ID
- actor email
- actor first name
- actor last name

Search does not inspect arbitrary JSON values during the initial foundation.

Search strings are trimmed and length-limited.

Empty search values are ignored or rejected consistently by validation.

## 24. Date Filtering

Date filters use ISO 8601 date-time values.

Supported boundaries are:

- `createdFrom`
- `createdTo`

The lower boundary is inclusive.

The upper boundary is inclusive.

The start must not occur after the end.

Invalid date values fail with a validation error.

## 25. Single-Event Retrieval

Sprint 023 adds:

`GET /audit-logs/:id`

The event ID must be a valid UUID.

The event must belong to the authenticated organization.

Foreign and missing events return the same not-found response.

Retrieval returns only the approved audit response shape.

## 26. Audit Response Shape

Audit responses may contain:

- ID
- organization ID
- actor summary
- organization-membership summary
- action
- entity type
- entity ID
- category
- source
- result
- previous values
- new values
- metadata
- IP address
- user agent
- request ID
- correlation ID
- HTTP method
- request path
- HTTP status code
- integrity hash
- creation timestamp

Responses must never include authentication secrets or internal database
credentials.

Actor summaries use explicit field selection.

## 27. Audit Export

Sprint 023 adds:

`GET /audit-logs/export`

Export supports the same tenant-safe filters as listing.

Initial export format is CSV.

Export is bounded to a maximum of 10,000 events per request.

Export ordering is deterministic.

CSV output includes approved scalar fields.

Structured JSON fields are serialized safely into individual CSV cells.

CSV cells are protected against spreadsheet-formula injection.

The response uses an attachment filename that contains no client-controlled
path content.

## 28. Export Auditing

Every successful audit export creates:

`AUDIT_LOG_EXPORTED`

The export audit records:

- actor
- organization membership
- source
- result
- applied filter summary
- exported record count
- request context where available

The export event itself is created after the export selection and is not
included in that same export.

Failed or denied export attempts may be audited when safe and practical.

## 29. Audit Read Auditing

Ordinary audit listing does not create an audit event.

Single-event retrieval does not create an audit event.

This prevents read amplification and preserves deterministic read behavior.

Export is audited because it creates a portable copy of sensitive audit data.

## 30. Request Context Helper

Sprint 023 provides a shared helper that derives safe audit request context
from an Express request.

The helper may provide:

- authenticated user ID
- authenticated organization ID
- authenticated organization-user ID
- IP address
- user agent
- request ID
- correlation ID
- HTTP method
- request path

The helper never copies authorization headers, cookies or request bodies.

Existing controllers are not required to migrate all audit calls during this
sprint.

New and updated audit endpoints use the shared helper.

## 31. Audit Creation Service

The shared creation service:

- validates required identity fields
- normalizes action and entity type
- applies safe defaults
- validates bounded request fields
- recursively redacts sensitive values
- creates integrity metadata
- supports Prisma transaction clients
- returns the created event
- remains backward-compatible with existing callers

Audit creation should participate in the caller's transaction where atomic
business action and audit persistence are required.

Migration of every historical caller into a single transaction remains
progressive work.

## 32. Failure Isolation

Audit failures must be handled deliberately.

For security-significant or business-critical mutations, the audit write may
be part of the same transaction and fail atomically.

For existing compatibility callers outside a transaction, existing behavior
is preserved unless explicitly migrated.

Audit query or export failure must not leak database internals to API clients.

## 33. Validation

The validator rejects:

- unknown query fields
- invalid UUID values
- invalid category values
- invalid source values
- invalid result values
- invalid ISO date-time values
- reversed date ranges
- malformed cursors
- limits below 1
- limits above the configured maximum
- overlong action values
- overlong entity values
- overlong search strings
- unsupported export formats

Query values must be singular strings unless explicitly documented otherwise.

## 34. Error Contract

Stable service error codes include:

- `AUDIT_MEMBERSHIP_REQUIRED`
- `AUDIT_FORBIDDEN`
- `AUDIT_EVENT_NOT_FOUND`
- `AUDIT_QUERY_INVALID`
- `AUDIT_CURSOR_INVALID`
- `AUDIT_DATE_RANGE_INVALID`
- `AUDIT_EXPORT_FORBIDDEN`
- `AUDIT_EXPORT_LIMIT_EXCEEDED`
- `AUDIT_EVENT_INVALID`
- `AUDIT_INTEGRITY_INVALID`

Controllers translate errors consistently without exposing foreign-resource
existence or database internals.

## 35. Tenant Isolation

Tenant isolation applies to:

- listing
- filtering
- searching
- pagination
- retrieval
- export
- actor joins
- organization-membership joins
- correlation lookup

A foreign organization event is never returned merely because its ID,
correlation ID, actor or entity identity is known.

## 36. Data Minimization

Audit events should preserve enough information for accountability without
becoming unrestricted copies of business records.

Callers should prefer:

- changed fields
- identifiers
- state transitions
- approved summaries

Callers should avoid:

- entire request bodies
- full document content
- credentials
- unnecessary personal data
- unrelated record fields

## 37. Retention Boundary

Sprint 023 does not execute retention deletion.

The schema and service design must allow future retention policy support.

No ordinary API route may delete audit history.

Organization deletion behavior remains compatible with the existing platform
until a dedicated retention and legal-hold design is implemented.

## 38. Performance and Indexing

Indexes support common tenant-scoped investigations, including:

- organization and creation time
- organization and action
- organization and entity identity
- organization and actor
- organization and category
- organization and source
- organization and result
- organization and request ID
- organization and correlation ID

Every public query remains bounded.

Query design avoids per-record actor lookups.

## 39. Backward Compatibility

Sprint 023 must preserve compatibility with:

- authentication
- organizations
- organization users
- roles and permissions
- organization settings and branding
- Branch and Department management
- Contacts
- Documents
- Work Items
- Request Centre
- Workflow and approvals
- SLA
- Attention Centre
- Organization Health
- Command Centre
- Daily Brief
- KPI framework
- entity relationships
- entity attachments
- configurable organizational hierarchy
- dashboard

Existing audit creation calls must continue compiling.

Existing audit records must remain queryable after migration.

## 40. API Routes

Sprint 023 provides:

- `GET /audit-logs`
- `GET /audit-logs/export`
- `GET /audit-logs/:id`

The export route is registered before the parameterized event route.

All routes require:

- authentication
- active organization context
- the relevant audit permission

No audit update or delete routes are introduced.

## 41. API Response Behavior

JSON endpoints use the established response envelope:

- `success`
- `data`
- `message` where appropriate

Validation failures return HTTP 400.

Authentication failures return HTTP 401.

Permission failures return HTTP 403.

Missing or foreign audit events return HTTP 404.

Unexpected failures are handled without exposing stack traces or database
details.

Successful CSV export returns HTTP 200 with appropriate content type and
content-disposition headers.

## 42. Audit Integrity Verification

The shared audit service exposes internal integrity verification for events
that contain integrity metadata.

Verification recomputes the expected hash from canonical persisted fields.

Verification returns a deterministic valid or invalid result.

Integrity verification does not mutate the event.

Public bulk-integrity scanning is outside the initial API boundary.

Runtime acceptance verifies valid events and detects deliberately altered
in-memory event content.

## 43. Security Requirements

Sprint 023 must ensure:

- organization ownership comes from authenticated context
- foreign events remain undiscoverable
- permission checks occur before audit data is returned
- export has an independent permission
- filters cannot bypass tenant predicates
- cursors cannot bypass tenant predicates
- actor joins cannot cross tenant boundaries
- sensitive keys are redacted
- CSV formula injection is neutralized
- output filenames contain no path traversal
- query limits are enforced
- unknown fields are rejected
- no audit mutation endpoints exist
- raw authorization data is never persisted automatically

## 44. Runtime Acceptance

Sprint 023 runtime acceptance must verify:

- unauthenticated audit access is rejected
- organization context is required
- foreign organization membership is rejected
- `audit_logs.view` is enforced
- `audit_logs.export` is independently enforced
- legacy audit creation remains compatible
- new audit context fields persist correctly
- organization-user actor context persists correctly
- default category, source and result values work
- explicit category, source and result values work
- action normalization is deterministic
- entity-type normalization is deterministic
- blank actions are rejected
- blank entity types are rejected
- request context is safely extracted
- authorization headers and cookies are not captured
- recursive sensitive-key redaction works
- redaction does not mutate caller objects
- integrity hashes are deterministic
- integrity verification accepts valid events
- integrity verification detects changed content
- organization-scoped listing is tenant-isolated
- action filtering works
- entity filtering works
- actor filtering works
- category filtering works
- source filtering works
- result filtering works
- request-ID filtering works
- correlation-ID filtering works
- date-range filtering works
- combined filters work
- free-text search works
- unknown query fields are rejected
- invalid UUID filters are rejected
- invalid enum filters are rejected
- invalid date ranges are rejected
- bounded default listing works
- maximum list limit is enforced
- deterministic ordering works
- cursor pagination has no duplicates
- cursor pagination has no omissions
- malformed cursors are rejected
- foreign cursors reveal no foreign records
- single-event retrieval works
- foreign event retrieval returns not found
- missing event retrieval returns not found
- CSV export requires both permissions
- CSV export respects tenant isolation
- CSV export respects filters
- CSV export ordering is deterministic
- CSV export limit is enforced
- CSV formula injection is neutralized
- successful export is audited exactly once
- export does not include its own audit event
- listing and retrieval remain read-only
- no update or delete audit routes exist
- existing audit events remain readable
- authentication audit creation remains compatible
- existing Organization endpoint remains compatible
- existing Contact endpoint remains compatible
- existing Document endpoint remains compatible
- existing Work Item endpoint remains compatible
- existing Request endpoint remains compatible
- existing Workflow endpoint remains compatible
- existing Organization Health endpoint remains compatible
- existing Command Centre endpoint remains compatible
- existing Daily Brief endpoint remains compatible
- existing KPI endpoint remains compatible
- existing relationship endpoint remains compatible
- existing hierarchy endpoint remains compatible
- temporary acceptance fixtures are cleaned
- Prisma validation passes
- Prisma Client generation passes
- TypeScript compilation passes
- migration status is current
- diff validation passes

## 45. Implementation Sequence

Implementation proceeds in this order:

1. extend the Prisma audit model
2. create and review the audit schema migration
3. create audit permissions
4. implement audit types and normalization
5. implement sensitive-value redaction
6. enhance backward-compatible audit creation
7. implement integrity metadata and verification
8. implement bounded audit querying
9. implement cursor pagination
10. implement CSV export
11. implement request-context extraction
12. implement audit validation
13. update the audit controller and routes
14. create runtime acceptance
15. run compatibility and regression checks
16. record implementation evidence
17. commit and push

## 46. Completion Criteria

Sprint 023 is complete only when:

- the Prisma schema is valid
- migrations apply cleanly
- Prisma Client generation succeeds
- TypeScript compilation succeeds
- diff validation succeeds
- audit permissions exist
- enhanced audit creation remains backward-compatible
- audit APIs are registered
- audit listing is bounded and deterministic
- tenant-safe filters and search work
- controlled export works
- sensitive-value redaction works
- integrity verification works
- runtime acceptance passes
- existing API smoke tests remain green
- implementation evidence is recorded
- the work is committed and pushed

Implementation evidence, not this specification alone, determines completion.

---

## 47. Implementation Evidence

Sprint 023 runtime acceptance passed on 2026-09-11.

Verified capabilities:

- `audit_logs.view` and `audit_logs.export` RBAC
- authenticated, organization-scoped audit access
- tenant-isolated audit persistence and querying
- backward-compatible audit creation
- normalized action and entity identity
- legacy case-insensitive identity filtering
- category, source and result context
- organization-membership actor context
- request and correlation identifiers
- recursive sensitive-value redaction
- caller-object preservation during redaction
- deterministic SHA-256 integrity metadata
- changed-content integrity detection
- bounded deterministic audit listing
- combined audit filters and search
- date-range validation
- opaque cursor pagination without duplicates or omissions
- strict query and UUID validation
- tenant-safe single-event retrieval
- foreign-event non-disclosure
- read-only listing and retrieval
- independently authorized filtered CSV export
- spreadsheet-formula injection protection
- export self-exclusion
- exactly-once export auditing
- append-oriented API with no update or delete routes
- existing platform endpoint compatibility
- temporary acceptance fixture cleanup
- Prisma validation and Client generation
- TypeScript and migration validation
- diff validation

Acceptance command:

`npm run audit:acceptance`

Acceptance result:

`SPRINT 023 RUNTIME ACCEPTANCE: PASS`
