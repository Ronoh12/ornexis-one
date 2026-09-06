# Sprint 021 — Generic Entity Relationship and Attachment Framework Foundation

Specification: LOCKED

Implementation status: ACCEPTANCE PASSED — 2026-09-06

## 1. Purpose

Sprint 021 establishes a reusable, deterministic, tenant-isolated,
permission-aware and auditable framework for relationships and document
attachments between supported ORNEXIS ONE entities.

The framework prevents every business module from implementing a separate
relationship or attachment architecture.

It also closes authorization gaps in the existing attachment implementation.

The foundation answers:

- Which two entities are related?
- What type of relationship connects them?
- Which organization owns the relationship?
- Is the relationship valid for the registered entity types?
- Is the caller authorized to see both sides?
- Is the caller authorized to create or remove the relationship?
- Which document is attached to an entity?
- Is the caller authorized to see both the parent entity and document?
- Who created or removed the relationship?
- Can the result be reproduced and audited?

## 2. Architectural Position

Sprint 021 implements the foundation described by:

- `SR-027 — Generic Entity Relationship and Attachment Framework`
- `System Architecture §20 — Generic Entity Relationship and Attachment Architecture`

It builds upon:

- Sprint 002 tenant and authorization foundations
- Sprint 004 organization structure
- Sprint 006 Contacts
- Sprint 010 Document Management
- Sprint 011 Work Management and the initial EntityAttachment model
- Sprint 012 Request Centre
- Sprint 013 Workflow and Approval Engine
- the existing Audit service

The framework is shared infrastructure.

Business modules remain authoritative for their own records and permissions.

## 3. Existing Foundation

ORNEXIS ONE already provides:

- tenant-scoped Documents
- Work Items
- Contacts
- Requests
- Workflow definitions and instances
- Branches and Departments
- Organization Users
- role and permission enforcement
- audit logging
- `EntityAttachment`
- attachment support for Work Items
- attachment support for Requests
- an `EntityAttachmentType` enum containing:
  - `WORK_ITEM`
  - `CONTACT`
  - `REQUEST`

Sprint 021 extends and consolidates this foundation.

It must not create a competing document-storage system.

## 4. Core Security Principle

A relationship is not authorization.

Access to a relationship never grants access to either related entity.

Access to an attachment never grants access to:

- the parent entity
- document metadata
- document contents
- document download

Every operation must independently authorize all resources whose information
would be disclosed or changed.

A caller who can view one side but not the other must not receive protected
details from the restricted side.

## 5. Initial Scope

Sprint 021 includes:

- a generic EntityRelationship persistence model
- a controlled entity-type registry
- registered entity authorization adapters
- tenant validation for both relationship endpoints
- deterministic relationship normalization
- relationship creation
- relationship listing
- relationship retrieval
- relationship removal
- duplicate prevention
- self-relationship controls
- inverse relationship presentation
- auditing of relationship mutations
- consolidation of existing EntityAttachment logic
- secure Work Item attachments
- secure Request attachments
- Contact attachment endpoints
- document-side attachment listing
- independent parent-entity and document authorization
- deterministic attachment listing
- attachment duplicate prevention
- attachment mutation auditing
- backward compatibility
- runtime acceptance

## 6. Initial Entity Types

The initial registered entity types are:

- `ORGANIZATION`
- `BRANCH`
- `DEPARTMENT`
- `ORGANIZATION_USER`
- `CONTACT`
- `DOCUMENT`
- `WORK_ITEM`
- `REQUEST`
- `WORKFLOW_DEFINITION`
- `WORKFLOW_INSTANCE`

Only registered entity types may participate.

Arbitrary caller-supplied strings are rejected.

Each registered type must define:

- canonical type code
- tenant-aware existence validation
- view permission
- mutation permission where supported
- safe summary projection
- structural scope information where applicable
- whether self-relationships are allowed
- whether document attachment is supported

## 7. Entity Authorization Registry

Sprint 021 introduces a server-controlled registry of entity adapters.

An adapter is responsible for determining:

- whether the entity exists in the active organization
- whether it belongs to the active tenant
- whether the actor may view it
- whether the actor may relate it
- which safe identity fields may be disclosed
- which structural scope applies
- which source-module permissions are required

The registry must not accept executable adapter definitions from API callers
or organization configuration.

Unsupported entity types fail with a controlled client error.

## 8. Initial Relationship Types

The initial controlled relationship types are:

- `RELATED_TO`
- `DEPENDS_ON`
- `BLOCKS`
- `SUPPORTS`
- `REFERENCES`
- `ASSOCIATED_WITH`
- `ORIGINATED_FROM`
- `FULFILLS`

Relationship types are directional unless explicitly defined as symmetric.

`RELATED_TO` and `ASSOCIATED_WITH` are symmetric.

Directional meaning must be preserved for:

- `DEPENDS_ON`
- `BLOCKS`
- `SUPPORTS`
- `REFERENCES`
- `ORIGINATED_FROM`
- `FULFILLS`

Arbitrary relationship-type strings are rejected.

## 9. EntityRelationship Model

A persisted EntityRelationship includes:

- ID
- organization ID
- source entity type
- source entity ID
- target entity type
- target entity ID
- relationship type
- optional data-minimized description
- optional data-minimized metadata
- creator OrganizationUser ID
- creation timestamp

Relationship records do not copy authoritative entity data.

Related entity names and summaries are resolved through authorized adapters
during reads.

## 10. Canonical Relationship Identity

The platform calculates a canonical identity for every relationship.

For directional types, identity preserves:

- source type
- source ID
- target type
- target ID
- relationship type

For symmetric types, endpoints are normalized into deterministic lexical
order before persistence.

This prevents these equivalent symmetric inputs from creating duplicates:

- Contact A `RELATED_TO` Contact B
- Contact B `RELATED_TO` Contact A

The database must enforce canonical duplicate prevention.

## 11. Relationship Integrity

Relationship creation must verify:

- active organization context
- active organization membership
- supported source type
- supported target type
- valid UUID identifiers
- same-tenant source entity
- same-tenant target entity
- source view authorization
- target view authorization
- source relationship-mutation authorization
- target relationship-mutation authorization where required
- allowed relationship type
- allowed entity-type pairing
- self-relationship policy
- metadata limits

Foreign-tenant records must be indistinguishable from missing records.

## 12. Self-Relationships

A relationship whose source and target identify the same entity is rejected by
default.

A registered adapter or relationship rule may explicitly permit a
self-relationship in a future extension.

Sprint 021 does not enable self-relationships.

## 13. Relationship Pair Rules

Sprint 021 uses an allow-list for supported entity-type pairs.

Initial useful pairs include:

- Contact to Work Item
- Contact to Request
- Work Item to Request
- Request to Workflow Instance
- Work Item to Workflow Instance
- OrganizationUser to Work Item
- OrganizationUser to Request
- Branch to Department

The registry may represent additional safe pairs where both adapters and
authorization rules exist.

Unsupported pairs fail explicitly.

Document attachment remains the authoritative mechanism for
entity-to-document links.

Sprint 021 rejects generic `EntityRelationship` creation when either endpoint
is a Document.

A generic `EntityRelationship` must not be used to bypass attachment-specific
document controls.

## 14. Relationship Lifecycle

Relationships are immutable after creation.

Sprint 021 supports:

- create
- read
- list
- remove

Changing endpoints or relationship type requires removing the old
relationship and creating a new one.

This preserves clear audit history.

Removal deletes only the relationship record.

It must never delete either authoritative endpoint record.

## 15. Relationship Permissions

Sprint 021 introduces:

- `relationships.view`
- `relationships.manage`

`relationships.view` permits access to the generic relationship shell.

It does not replace source-module view permissions.

`relationships.manage` permits relationship creation and removal.

It does not replace source-module mutation or relationship permissions.

Both generic and module-specific authorization must succeed.

System Administrator roles receive both permissions through migration.

## 16. Relationship API Foundation

The initial API is mounted under:

`/relationships`

Supported operations:

- `POST /relationships`
- `GET /relationships`
- `GET /relationships/:id`
- `DELETE /relationships/:id`

Relationship listing supports validated filters for:

- entity type
- entity ID
- relationship type
- direction
- bounded limit

A list request must identify an authorized anchor entity.

The API does not provide an unrestricted organization-wide relationship dump.

## 17. Relationship Listing

Relationship lists are:

- tenant-isolated
- anchored to one authorized entity
- permission-aware on both endpoints
- bounded
- deterministically ordered
- data-minimized

Ordering is:

1. creation time descending
2. relationship type ascending
3. canonical source type ascending
4. canonical source ID ascending
5. canonical target type ascending
6. canonical target ID ascending
7. relationship ID ascending

If the caller loses access to either endpoint, the relationship is omitted or
treated as unavailable without exposing protected details.

## 18. Safe Entity Summary

Relationship responses may include only an adapter-defined safe summary:

- entity type
- entity ID
- display label
- status where non-sensitive
- structural scope where authorized
- `drillDownAvailable`

Responses must not copy complete business records.

No adapter may expose:

- document storage keys
- authentication data
- confidential workflow data
- request contents beyond authorized summary fields
- personal data beyond existing module authorization
- unrestricted metadata

## 19. EntityAttachment Preservation

The existing `EntityAttachment` model remains the authoritative persisted link
between a Document and a supported business entity.

Sprint 021 must not migrate existing attachment records into
`EntityRelationship`.

This avoids:

- duplicated attachment records
- broken Work Item attachment IDs
- broken Request attachment IDs
- loss of historical attachment timestamps
- unnecessary migration risk

`EntityRelationship` and `EntityAttachment` have distinct purposes:

- `EntityRelationship` connects two supported business entities.
- `EntityAttachment` connects one Document to one supported parent entity.

Both use the same entity authorization registry.

## 20. Shared Attachment Service

Sprint 021 introduces a shared EntityAttachment service.

It replaces duplicated persistence and authorization logic currently located
inside:

- Work Item service
- Request service

The shared service is responsible for:

- target entity validation
- document validation
- tenant validation
- parent-entity authorization
- document authorization
- deterministic creation
- duplicate handling
- listing
- removal
- safe serialization
- audit context
- module activity hooks

Business-module services may retain thin wrappers for compatibility.

They must not retain independent attachment persistence rules.

## 21. Attachment Entity Types

Sprint 021 preserves:

- `WORK_ITEM`
- `CONTACT`
- `REQUEST`

Workflow attachment types are deferred in Sprint 021.

An attachment type is enabled only when:

- a registered entity adapter exists
- parent view authorization exists
- parent attachment-mutation authorization exists
- safe summary projection exists
- tenant validation exists
- acceptance coverage exists

Merely adding an enum value does not make an entity attachment-capable.

## 22. Attachment Authorization

Listing attachment metadata requires:

- active authenticated membership
- authorization to view the parent entity
- `documents.view`
- document visibility under the current organization and structural scope

Creating an attachment requires:

- authorization to view the parent entity
- authorization to modify attachments for the parent entity
- `documents.view`
- an active same-tenant Document
- visibility of the Document under its structural scope

Removing an attachment requires:

- authorization to view the parent entity
- authorization to modify attachments for the parent entity
- authorization to identify the attached Document
- same-tenant attachment ownership

Downloading an attached document still requires:

- `documents.download`
- the existing Document download endpoint
- existing Document authorization

An attachment response must never include a storage key or physical path.

## 23. Parent Module Permission Mapping

The initial attachment permission mapping is:

- Work Item view:
  - `work_items.view`
- Work Item attach and detach:
  - `work_items.attach`
- Contact view:
  - `contacts.view`
- Contact attach and detach:
  - `contacts.update`
- Request view:
  - `requests.view`
- Request attach and detach:
  - `requests.update`
- Workflow Instance view:
  - `workflow.view`

Workflow Instance attachment mutation is deferred until a dedicated,
semantically correct module permission is introduced.

Workflow definitions and instances may still participate in authorized generic
relationships through `relationships.manage` and `workflow.view`.

Document permissions remain independently required.

Generic `relationships.view` and `relationships.manage` do not replace these
attachment permissions.

## 24. Structural Scope Authorization

Entity adapters must preserve existing hierarchy rules.

An actor may operate only within an authorized:

- Organization
- Branch
- Department

An Organization Administrator may access authorized Organization-wide
relationships.

A Branch-scoped actor may access relationships only when all applicable
endpoints fall within the assigned Branch.

A Department-scoped actor may access relationships only when all applicable
endpoints fall within the assigned Department.

An unassigned non-Administrator must not receive an implicit Organization
scope.

Records with no safe structural relationship to the actor must remain hidden.

## 25. Attachment Creation Semantics

Attachment creation is idempotent.

Submitting the same:

- organization
- document
- entity type
- entity ID

returns the existing attachment instead of creating a duplicate.

A duplicate request must not create duplicate:

- EntityAttachment records
- module activities
- audit events

The response must identify whether the attachment was created or already
existed.

## 26. Attachment Listing

Attachment lists are:

- tenant-isolated
- parent-authorized
- document-authorized
- bounded
- deterministically ordered
- data-minimized

Ordering is:

1. creation time descending
2. document ID ascending
3. attachment ID ascending

Each visible attachment may include:

- attachment ID
- parent entity type
- parent entity ID
- creation timestamp
- safe creator identity
- safe Document metadata
- `downloadAvailable`

Safe Document metadata may include:

- Document ID
- title
- description
- original filename
- MIME type
- extension
- size
- lifecycle status
- creation and update timestamps

It must not include:

- stored filename
- storage provider internals
- storage key
- absolute path
- file buffer
- unrestricted checksum data

## 27. Document-Side Attachment Listing

Sprint 021 introduces a Document-side relationship view:

`GET /documents/:id/attachments`

It requires:

- `documents.view`
- authorization to view the Document
- authorization to view each returned parent entity

The response includes only attachments whose parent entities the actor may
view.

A hidden parent must not be represented through:

- its ID
- its type
- its name
- its attachment count
- a placeholder that confirms existence

Document-side listing is read-only.

Attachment mutations remain on the authorized parent-module endpoint.

## 28. Contact Attachment Endpoints

Sprint 021 completes the previously specified Contact attachment capability:

- `GET /contacts/:id/attachments`
- `POST /contacts/:id/attachments`
- `DELETE /contacts/:id/attachments/:attachmentId`

These endpoints must use the shared EntityAttachment service.

They must enforce:

- Contact tenant ownership
- Contact visibility
- Contact update authorization for mutation
- Document visibility
- Document permission requirements
- audit logging
- duplicate prevention

## 29. Existing Endpoint Compatibility

Sprint 021 preserves:

- `GET /work-items/:id/attachments`
- `POST /work-items/:id/attachments`
- `DELETE /work-items/:id/attachments/:attachmentId`
- `GET /requests/:id/attachments`
- `POST /requests/:id/attachments`
- `DELETE /requests/:id/attachments/:attachmentId`

Existing successful response envelopes remain compatible where practical.

Security corrections may cause a request that previously exposed document
metadata without `documents.view` to return a controlled authorization error.

This is an intentional security correction, not a compatibility regression.

Existing Work Item and Request activity records remain supported.

## 30. Module Activity Hooks

The shared attachment service supports registered post-mutation hooks.

Initial hooks preserve:

- Work Item `ATTACHMENT_ADDED`
- Work Item `ATTACHMENT_REMOVED`
- Request `ATTACHMENT_ADDED`
- Request `ATTACHMENT_REMOVED`

A hook runs only when the attachment relationship is actually created or
removed.

Idempotent retries do not create duplicate activities.

Failure behavior must avoid leaving an attachment without its required
business activity where transactional composition is available.

## 31. Relationship Auditing

Relationship creation records:

- action `ENTITY_RELATIONSHIP_CREATED`
- relationship ID
- canonical source identity
- canonical target identity
- relationship type
- actor
- timestamp

Relationship removal records:

- action `ENTITY_RELATIONSHIP_REMOVED`
- removed relationship ID
- canonical endpoints
- relationship type
- actor
- timestamp

Audit metadata must be data-minimized.

It must not duplicate complete related records.

## 32. Attachment Auditing

Attachment creation and removal are audited.

Generic audit actions are:

- `ENTITY_ATTACHMENT_CREATED`
- `ENTITY_ATTACHMENT_REMOVED`

Existing module-specific audit behavior may be retained for compatibility:

- `WORK_ITEM_ATTACHMENT_ADDED`
- `WORK_ITEM_ATTACHMENT_REMOVED`
- `CONTACT_ATTACHMENT_ADDED`
- `CONTACT_ATTACHMENT_REMOVED`
- `REQUEST_ATTACHMENT_ADDED`
- `REQUEST_ATTACHMENT_REMOVED`

The implementation must avoid duplicate audit events for idempotent retries.

## 33. Relationship Removal

Removing a relationship requires:

- `relationships.manage`
- active membership
- authorization to view both endpoints
- authorization to manage the relationship from both applicable endpoints
- same-tenant relationship ownership

Removal must not:

- delete either endpoint
- delete a Document
- remove an EntityAttachment
- create operational records beyond required audit evidence

A missing, foreign or unauthorized relationship must reveal no protected
details.

## 34. Attachment Removal

Removing an EntityAttachment deletes only the linking record.

It must not:

- delete the Document
- archive the Document
- delete the physical file
- delete the parent entity
- alter unrelated attachments
- remove a generic EntityRelationship

Document lifecycle remains governed by Document Management.

## 35. Validation

Sprint 021 validates:

- UUID identifiers
- registered entity types
- allowed relationship types
- allowed entity-type pairs
- relationship direction
- self-relationships
- description length
- metadata shape and size
- list limits
- direction filters
- repeated single-value query parameters
- unknown body fields
- empty update-like payloads
- attachment Document IDs
- relationship and attachment route IDs

Invalid input returns a controlled client error.

Internal table names, query details and stack traces must not be exposed.

## 36. Metadata Rules

Relationship metadata is optional and data-minimized.

It may contain simple JSON values required to explain the relationship.

It must be:

- bounded in serialized size
- free of executable behavior
- free of storage paths
- free of authentication secrets
- free of copied complete source records

Metadata is not a substitute for a dedicated domain model.

## 37. Referential Integrity

Normal relational foreign keys must protect:

- organization ownership
- relationship creator
- attachment Document
- attachment creator

Because generic endpoint IDs are polymorphic, their integrity is enforced
through:

- the controlled entity registry
- same-tenant adapter queries
- database transactions
- immutable type and identifier fields
- acceptance tests
- cleanup behavior for supported entity deletion

Sprint 021 must document that PostgreSQL cannot provide ordinary foreign keys
from one polymorphic column to multiple target tables.

## 38. Deletion Policy

Sprint 021 uses restrictive deletion behavior.

A supported entity with active generic relationships should not be deleted
without an explicit relationship cleanup policy.

For existing modules whose deletion semantics already exist, the framework
must either:

- remove related links transactionally and audit the effect; or
- reject deletion until relationships are removed

Silent orphan creation is prohibited.

Sprint 021 must test deletion behavior for its initial entity adapters.

## 39. Read Side Effects

Relationship and attachment reads create no:

- EntityRelationship
- EntityAttachment
- Document
- audit
- notification
- Health snapshot
- Attention Item
- KPI measurement
- Work Item
- Request
- Workflow
- operational activity records

Only explicit mutations produce audit or module activity evidence.

## 40. Determinism

Given identical:

- tenant
- actor permissions
- structural scope
- source entity
- target entity
- relationship type
- attachment state
- Document state

the framework returns the same authorized result and ordering.

Determinism applies to:

- endpoint normalization
- duplicate recognition
- relationship identity
- relationship ordering
- attachment ordering
- safe summaries
- filtered visibility
- audit action classification

## 41. Concurrency Safety

Concurrent identical relationship creation must produce one persisted
relationship.

Concurrent identical attachment creation must produce one persisted
attachment.

Database uniqueness constraints provide the final idempotency boundary.

Application-level prechecks alone are insufficient.

## 42. Initial Exclusions

Sprint 021 does not implement:

- arbitrary organization-configured entity types
- arbitrary organization-configured relationship types
- public relationships
- cross-tenant relationships
- relationship-based permission inheritance
- relationship-based document permission inheritance
- external sharing
- document versioning
- document preview
- OCR
- virus-scanning integration
- file conversion
- graph traversal
- transitive authorization
- recursive dependency calculation
- bulk relationship import
- full organizational knowledge graph
- AI-inferred relationships
- automatic relationship discovery
- classification rules not already available
- configurable organizational hierarchy
- records retention
- legal holds

## 43. Deferred Extensions

Future sprints may add adapters for:

- Employees
- Tickets
- Assets
- Suppliers
- Customers
- Transactions
- Decisions
- Obligations
- Risks
- Projects
- Services
- Teams
- configurable organizational units
- industry-pack entities

Future extensions may also add:

- richer relationship taxonomies
- validity periods
- relationship status
- graph queries
- bulk import
- knowledge-graph views
- classification-aware field projections
- retention-aware attachment behavior

Each extension requires explicit authorization and acceptance coverage.

## 44. Implementation Order

Sprint 021 should proceed in this order:

1. lock the specification
2. inspect existing entity deletion behavior
3. introduce relationship permissions
4. introduce EntityRelationship schema
5. add database uniqueness and integrity constraints
6. generate the Prisma Client
7. implement entity types and relationship types
8. implement entity authorization registry
9. implement registered entity adapters
10. implement relationship normalization
11. implement relationship service
12. implement relationship validation
13. implement relationship controller
14. implement relationship routes
15. implement shared EntityAttachment service
16. refactor Work Item attachments
17. refactor Request attachments
18. implement Contact attachments
19. implement Document-side attachment listing
20. preserve module activity hooks
21. implement mutation auditing
22. implement runtime acceptance
23. validate compatibility endpoints
24. validate Prisma and TypeScript
25. reconcile completion evidence
26. commit and push

## 45. Runtime Acceptance Requirements

Runtime acceptance must prove:

- `relationships.view` exists
- `relationships.manage` exists
- unauthenticated relationship access is rejected
- organization context is required
- foreign organization membership is rejected
- relationship permissions are independently enforced
- arbitrary entity types are rejected
- arbitrary relationship types are rejected
- unsupported entity pairs are rejected
- invalid UUIDs are rejected
- unknown mutable fields are rejected
- self-relationships are rejected
- same-tenant relationship creation succeeds
- relationship creation is audited
- symmetric endpoints are normalized
- reversed symmetric creation is idempotent
- directional endpoint order is preserved
- duplicate directional creation is idempotent
- concurrent identical creation is database-idempotent
- cross-tenant source entities fail without disclosure
- cross-tenant target entities fail without disclosure
- source-module permission is enforced
- target-module permission is enforced
- Branch structural scope is enforced
- Department structural scope is enforced
- unassigned-member scope is rejected
- relationship listing requires an authorized anchor
- unrestricted organization-wide relationship listing is rejected
- relationship lists are bounded
- relationship ordering is deterministic
- safe summaries are data-minimized
- restricted endpoints expose no relationship details
- relationship removal is audited
- relationship removal deletes neither endpoint
- relationship records are immutable
- Work Item attachments use the shared service
- Request attachments use the shared service
- Contact attachment endpoints work
- existing attachment IDs remain compatible
- attachment creation requires parent authorization
- attachment creation requires Document visibility
- attachment listing requires `documents.view`
- attachment download still requires `documents.download`
- attachment responses expose no storage internals
- duplicate attachment creation is idempotent
- concurrent identical attachment creation is database-idempotent
- idempotent retries create no duplicate activity or audit records
- foreign Documents cannot be attached
- archived Documents cannot be newly attached
- foreign EntityAttachments cannot be removed
- Document-side listing returns only authorized parents
- hidden parents leak no IDs, types, names or counts
- attachment removal does not delete the Document
- attachment removal is audited
- Work Item attachment activities remain compatible
- Request attachment activities remain compatible
- relationship and attachment reads create no records
- repeated identical reads are deterministic
- existing Document endpoint remains compatible
- existing Contact endpoint remains compatible
- existing Work Item endpoint remains compatible
- existing Request endpoint remains compatible
- existing Workflow endpoint remains compatible
- existing Health endpoint remains compatible
- existing Attention endpoint remains compatible
- existing Command Centre endpoint remains compatible
- existing Daily Brief endpoint remains compatible
- existing KPI endpoint remains compatible
- existing dashboard endpoint remains compatible
- temporary acceptance fixtures are cleaned
- Prisma validation passes
- Prisma Client generation passes
- TypeScript passes
- migration status is current
- git diff check passes

## 46. Definition of Done

Sprint 021 is complete when ORNEXIS ONE provides a secure, reusable,
deterministic, auditable and tenant-isolated entity relationship and document
attachment framework that validates and authorizes both sides of every
relationship, preserves the existing Document foundation, consolidates
existing attachment logic and prevents relationships from becoming an
authorization bypass.

Implementation evidence, not this specification alone, determines completion.

---

## 47. Implementation Evidence

Sprint 021 runtime acceptance passed on 2026-09-06.

Verified capabilities:

- `relationships.view` and `relationships.manage` RBAC
- restoration of missing Contact view, create and delete permissions
- authenticated and organization-context-protected relationship access
- active membership enforcement
- tenant-isolated relationship persistence
- registered entity-type validation
- registered relationship-type validation
- supported entity-pair validation
- self-relationship rejection
- deterministic symmetric endpoint normalization
- directional endpoint preservation
- canonical relationship identity
- sequential relationship idempotency
- concurrent database idempotency
- source and target module-permission enforcement
- Branch and Department structural-scope enforcement
- unassigned-member rejection
- anchored and bounded relationship listing
- deterministic relationship ordering
- safe data-minimized entity summaries
- hidden-endpoint non-disclosure
- immutable relationship records
- audited relationship creation and removal
- endpoint preservation during relationship removal
- Contact, Branch and Department deletion dependency guards
- shared Work Item attachment service
- shared Request attachment service
- Contact attachment endpoints
- Document-side reverse attachment listing
- parent-entity authorization
- Document visibility enforcement
- independent Document download permission enforcement
- archived Document attachment rejection
- foreign Document rejection
- foreign attachment removal rejection
- safe attachment responses without storage internals
- sequential attachment idempotency
- concurrent attachment database idempotency
- duplicate retry side-effect prevention
- Work Item attachment activity compatibility
- Request attachment activity compatibility
- audited attachment creation and removal
- Document preservation during attachment removal
- permission-aware hidden-parent filtering
- deterministic read behavior
- read-only relationship and attachment operations
- existing Document endpoint compatibility
- existing Contact endpoint compatibility
- existing Work Item endpoint compatibility
- existing Request endpoint compatibility
- existing Workflow endpoint compatibility
- existing Organization Health endpoint compatibility
- existing Attention endpoint compatibility
- existing Command Centre endpoint compatibility
- existing Daily Brief endpoint compatibility
- existing KPI endpoint compatibility
- existing dashboard endpoint compatibility
- temporary acceptance fixture cleanup

Acceptance command:

`npm run relationships:acceptance`

Acceptance result:

`SPRINT 021 RUNTIME ACCEPTANCE: PASS`
