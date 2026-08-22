# ORNEXIS ONE

# Sprint 011 — Work Management, Collaboration & Accountability Foundation

**Sprint:** 011
**Status:** COMPLETE
**Product:** ORNEXIS ONE
**Company:** ORNEXIS Technology Ltd.
**Roadmap Phase:** Phase 1 — Operational Core
**Architecture:** System Architecture v2.0
**Implementation Plan:** Master Implementation Plan v2.0

---

## 1. Sprint Objective

Sprint 011 introduces the first reusable operational work-management capability
into ORNEXIS ONE.

The objective is to transform the existing platform foundation into an
environment where authorized organization users can create, assign, manage,
track and complete structured work.

The sprint establishes reusable foundations for:

- Work items and tasks
- Ownership
- Assignment
- Priorities
- Status lifecycle
- Due dates
- Branch and department scope
- Contact-linked work
- Comments
- Activity history
- Generic entity attachments
- Accountability
- Permission enforcement
- Tenant isolation
- Auditability

This capability must remain industry-neutral and reusable by future ORNEXIS ONE
modules.

---

## 2. Architectural Position

Work Management is a shared platform capability.

It must not be implemented as a feature belonging exclusively to:

- CRM
- HR
- Service Desk
- Projects
- Finance
- Governance
- Asset Management
- Any individual industry pack

Future platform capabilities may create or interact with work items while
reusing the same Work Management engine.

Examples include:

- A customer follow-up creating a work item
- An approval creating follow-up work
- A ticket generating remediation work
- An asset inspection generating maintenance work
- An obligation generating compliance work
- A decision generating assigned actions
- A workflow generating automated work
- An Attention Centre item linking to unresolved work

The Work Management capability therefore belongs to the reusable ORNEXIS ONE
platform core.

---

## 3. Sprint Scope

Sprint 011 includes:

### Work Items

- Create work item
- View work item
- List work items
- Update work item
- Assign work
- Change ownership
- Set priority
- Set due date
- Change status
- Complete work
- Cancel work
- Branch scope
- Department scope
- Optional contact relationship

### Collaboration

- Work-item comments
- Comment authorship
- Work-item activity history

### Attachments

- Generic entity-to-document attachment foundation
- Work-item attachments
- Contact attachments through the reusable attachment foundation
- Tenant-safe attachment validation

### Accountability

- Creator identity
- Owner identity
- Assignee identity
- Due-date visibility
- Completion identity
- Completion timestamp
- Activity history
- Audit events

### Security

- Authentication
- Organization membership
- Permission enforcement
- Tenant isolation
- Branch and department ownership validation
- Cross-tenant reference prevention
- Audit logging

---

## 4. Explicitly Out of Scope

Sprint 011 does not implement:

- Request Centre
- Approval workflows
- Workflow designer
- Notification delivery
- Email notifications
- Service Desk tickets
- SLA timers
- Asset management
- CRM pipelines
- HR workflows
- Finance
- KPI engine
- Attention Centre
- Organization Health
- Command Centre
- Industry packs

These capabilities remain roadmap items and will build upon the foundations
introduced by this sprint.

---

## 5. Core Domain Model

Sprint 011 introduces the following principal domain concepts:

### WorkItem

Represents a unit of organizational work.

A work item belongs to exactly one organization.

A work item may optionally belong to:

- A branch
- A department
- A contact

A work item records:

- Creator
- Owner
- Assignee
- Title
- Description
- Priority
- Status
- Due date
- Completion information
- Organizational scope
- Creation and modification timestamps

### WorkItemComment

Represents collaboration or discussion associated with a work item.

Every comment belongs to:

- One organization through its work item
- One work item
- One author

### WorkItemActivity

Represents domain-level work history.

Examples include:

- Work created
- Assignment changed
- Owner changed
- Priority changed
- Due date changed
- Status changed
- Comment added
- Attachment added
- Work completed
- Work cancelled

Work-item activity complements the platform Audit Log.

Audit Log records security and system accountability.

WorkItemActivity provides operational history suitable for business users.

### EntityAttachment

Provides a reusable relationship between a stored Document and another
authorized domain entity.

The attachment layer must allow future capabilities to reuse documents without
modifying the Document storage model for every new business domain.

---


## 6. Data Model Design

Sprint 011 introduces reusable work-management models while preserving the
existing organization, user, structure, contact, document and audit models.

The principal new models are:

- WorkItem
- WorkItemComment
- WorkItemActivity
- EntityAttachment

The sprint should avoid unnecessary duplication of existing platform identity
or storage concepts.

---

## 7. Work Item Status Model

Sprint 011 introduces the following work-item lifecycle states:

- DRAFT
- OPEN
- IN_PROGRESS
- BLOCKED
- COMPLETED
- CANCELLED

The intended lifecycle is:

    DRAFT
      |
      v
    OPEN
      |
      +------> IN_PROGRESS
      |             |
      |             +------> BLOCKED
      |                         |
      |                         v
      |                    IN_PROGRESS
      |                         |
      |                         v
      +--------------------> COMPLETED

    OPEN / IN_PROGRESS / BLOCKED
                 |
                 v
             CANCELLED

DRAFT represents work that has been created but is not yet considered active.

OPEN represents accepted or active work that has not yet started.

IN_PROGRESS represents actively progressing work.

BLOCKED represents work that cannot currently proceed.

COMPLETED represents successfully completed work.

CANCELLED represents work that should no longer be completed.

Status transitions must be enforced by backend business rules.

---

## 8. Work Item Priority Model

Sprint 011 introduces the following work-item priorities:

- LOW
- NORMAL
- HIGH
- URGENT
- CRITICAL

NORMAL should be the default priority.

Priority represents business urgency.

Priority must not automatically grant additional permissions.

---

## 9. WorkItem Model Requirements

The WorkItem model should include fields conceptually equivalent to:

- id
- organizationId
- branchId
- departmentId
- contactId
- createdByOrganizationUserId
- ownerOrganizationUserId
- assigneeOrganizationUserId
- title
- description
- priority
- status
- dueAt
- startedAt
- completedAt
- completedByOrganizationUserId
- cancelledAt
- createdAt
- updatedAt

Not every optional relationship is required for every work item.

A work item must always belong to exactly one organization.

---

## 10. OrganizationUser Assignment Principle

Operational responsibility should reference OrganizationUser rather than only
the global User identity.

This distinction is important.

User represents a person or identity across the ORNEXIS ONE platform.

OrganizationUser represents that identity within a specific organization.

Therefore:

- Creator should reference OrganizationUser
- Owner should reference OrganizationUser
- Assignee should reference OrganizationUser
- Completion identity should reference OrganizationUser

This allows work responsibility to remain tenant-aware and compatible with
future organizational scope rules.

A work item must never reference an OrganizationUser belonging to another
organization.

---

## 11. Creator, Owner and Assignee Semantics

Creator identifies who created the work item.

Owner identifies the person accountable for ensuring the work reaches an
appropriate outcome.

Assignee identifies the person currently expected to perform or coordinate the
work.

Owner and assignee may be the same person.

Owner may exist without an assignee.

An unassigned work item may therefore still have an accountable owner.

Future capabilities may extend ownership beyond individuals to teams,
departments or other organizational units, but Sprint 011 begins with
OrganizationUser-based responsibility.

---

## 12. Branch and Department Scope

A work item may optionally belong to a branch and/or department.

Branch and department references must belong to the same organization as the
work item.

If both branch and department are supplied and the department belongs to a
specific branch, the supplied branch must match that department relationship.

Sprint 011 must reject:

- Cross-tenant branch references
- Cross-tenant department references
- Structurally inconsistent branch/department combinations

Work-item scope is distinct from user authorization.

A work item belonging to a department does not automatically become visible to
every organization user.

Permission and future scope rules remain authoritative.

---

## 13. Contact Relationship

A work item may optionally reference an existing Contact.

The contact must belong to the same organization as the work item.

This allows reusable operational scenarios such as:

- Customer follow-up
- Supplier action
- Member action
- Donor action
- Employee-related follow-up
- Partner action

Sprint 011 does not turn Work Management into CRM.

The contact relationship is a reusable contextual link.

---

## 14. WorkItemComment Model

WorkItemComment should include fields conceptually equivalent to:

- id
- workItemId
- authorOrganizationUserId
- body
- createdAt
- updatedAt

Comments belong to their organization indirectly through the WorkItem.

The service layer must always resolve comments through the organization-owned
work item.

Comments must not be independently accessible across tenant boundaries.

Comment editing or deletion policy must be explicitly controlled by
permissions and business rules.

---

## 15. WorkItemActivity Model

WorkItemActivity should preserve operational history suitable for end users.

Conceptual fields may include:

- id
- workItemId
- actorOrganizationUserId
- activityType
- oldValues
- newValues
- metadata
- createdAt

Activity records should normally be append-only.

They should not be used as the authoritative current state of a work item.

WorkItem remains the authoritative current state.

Activity provides historical context.

---

## 16. Work Item Activity Types

Initial activity types may include:

- CREATED
- UPDATED
- OWNER_CHANGED
- ASSIGNEE_CHANGED
- PRIORITY_CHANGED
- DUE_DATE_CHANGED
- STATUS_CHANGED
- COMMENT_ADDED
- ATTACHMENT_ADDED
- ATTACHMENT_REMOVED
- COMPLETED
- CANCELLED

Additional activity types may be added in future capability sprints.

---

## 17. EntityAttachment Model

EntityAttachment should provide a reusable link between a Document and a domain
entity.

Conceptual fields may include:

- id
- organizationId
- documentId
- entityType
- entityId
- attachedByOrganizationUserId
- createdAt

EntityAttachment must not duplicate physical file data.

The Document model remains authoritative for:

- File metadata
- Storage provider
- Storage key
- File size
- MIME type
- Extension
- Checksum
- Document status

EntityAttachment only establishes an authorized business relationship between
the Document and another domain entity.

---

## 18. Initial Attachment Entity Types

Sprint 011 must support attachment relationships for at least:

- WORK_ITEM
- CONTACT

The architecture must allow future entity types such as:

- REQUEST
- TICKET
- ASSET
- EMPLOYEE
- DECISION
- RISK
- OBLIGATION
- WORKFLOW
- APPROVAL

without requiring changes to the Document storage model.

---

## 19. Attachment Tenant Rules

Every EntityAttachment must belong to exactly one organization.

The referenced Document must belong to the same organization.

The referenced entity must belong to the same organization.

The user creating the attachment must be an active OrganizationUser in the same
organization.

Cross-tenant attachment relationships are prohibited.

Deleting an attachment relationship must not automatically delete the physical
Document unless an explicit document-lifecycle rule authorizes it.

---

## 20. Required Database Indexes

The WorkItem model should support efficient filtering by:

- organizationId
- organizationId + status
- organizationId + priority
- organizationId + assigneeOrganizationUserId
- organizationId + ownerOrganizationUserId
- organizationId + branchId
- organizationId + departmentId
- organizationId + contactId
- organizationId + dueAt
- organizationId + createdAt

WorkItemComment should index:

- workItemId
- authorOrganizationUserId
- createdAt

WorkItemActivity should index:

- workItemId
- actorOrganizationUserId
- activityType
- createdAt

EntityAttachment should index:

- organizationId
- documentId
- entityType + entityId
- organizationId + entityType + entityId

The final Prisma schema may refine these indexes according to supported query
patterns.

---

## 21. Delete and Historical Integrity Rules

Work history should not disappear accidentally.

Sprint 011 should prefer lifecycle transitions over destructive deletion.

Work items should not normally be hard-deleted through ordinary business
operations.

COMPLETED and CANCELLED states preserve historical context.

Comments and activity should remain associated with historical work records.

Attachment relationships may be removed when authorized, while the underlying
Document lifecycle remains governed separately.

Future retention and records-management capabilities may introduce additional
retention policies.

---


## 22. Permission Model

Sprint 011 introduces the following Work Management permissions:

- work_items.view
- work_items.create
- work_items.update
- work_items.assign
- work_items.complete
- work_items.cancel
- work_items.comment
- work_items.attach
- work_items.manage

The permission engine introduced in Sprint 005 remains authoritative.

Permissions must be introduced through the existing permission architecture.

Administrator or equivalent system roles should receive the appropriate
permissions through the existing role-permission mechanism.

---

## 23. Permission Semantics

### work_items.view

Allows authorized users to view and list work items available within their
organization and permitted scope.

### work_items.create

Allows creation of work items.

### work_items.update

Allows modification of editable work-item information.

### work_items.assign

Allows ownership or assignment changes.

### work_items.complete

Allows an authorized user to transition eligible work into COMPLETED state.

### work_items.cancel

Allows an authorized user to cancel eligible work.

### work_items.comment

Allows comments to be added to accessible work items.

### work_items.attach

Allows documents to be linked to accessible work items.

### work_items.manage

Represents elevated Work Management administration capability.

The presence of work_items.manage must not bypass tenant isolation.

---

## 24. API Architecture

Sprint 011 introduces REST endpoints under:

    /work-items

The API must follow existing ORNEXIS ONE standards:

Request
    |
    v
Authentication
    |
    v
Organization Context
    |
    v
Organization Membership
    |
    v
Permission
    |
    v
Validation
    |
    v
Tenant-Safe Service Logic
    |
    v
Audit / Activity
    |
    v
Standardized Response

---

## 25. Work Item Endpoints

Sprint 011 should implement:

    POST /work-items

Create a work item.

Required permission:

    work_items.create

---

    GET /work-items

List accessible work items.

Required permission:

    work_items.view

Supported filters should include where practical:

- status
- priority
- assigneeOrganizationUserId
- ownerOrganizationUserId
- branchId
- departmentId
- contactId
- dueBefore
- dueAfter
- overdue
- createdBefore
- createdAfter

---

    GET /work-items/:id

Retrieve one work item.

Required permission:

    work_items.view

---

    PATCH /work-items/:id

Update editable work-item properties.

Required permission:

    work_items.update

Assignment changes additionally require:

    work_items.assign

Completion transitions require:

    work_items.complete

Cancellation transitions require:

    work_items.cancel

---

## 26. Assignment Endpoints

Sprint 011 may expose explicit assignment operations where this improves
business-rule clarity.

Preferred endpoint:

    PATCH /work-items/:id/assignment

Potential request fields:

- ownerOrganizationUserId
- assigneeOrganizationUserId

Required permission:

    work_items.assign

Assignment changes must:

- Remain inside the organization
- Reference active OrganizationUsers
- Create WorkItemActivity
- Create audit records where required

---

## 27. Status Endpoints

Status may be changed through PATCH /work-items/:id.

A dedicated endpoint may also be introduced if service architecture benefits:

    PATCH /work-items/:id/status

Potential payload:

    {
      "status": "IN_PROGRESS"
    }

The service layer must enforce valid transitions regardless of endpoint design.

---

## 28. Comment Endpoints

Sprint 011 should implement:

    POST /work-items/:id/comments

Required permission:

    work_items.comment

---

    GET /work-items/:id/comments

Required permission:

    work_items.view

Comment responses should include appropriate author identity information without
exposing sensitive User or OrganizationUser fields.

Sprint 011 does not require comment threading.

---

## 29. Activity Endpoint

Sprint 011 should implement:

    GET /work-items/:id/activity

Required permission:

    work_items.view

Activity should be ordered chronologically or reverse chronologically according
to the API contract.

Activity responses must remain tenant-safe.

---

## 30. Work Item Attachment Endpoints

Sprint 011 should implement reusable attachment relationships.

Work-item attachment operations may include:

    POST /work-items/:id/attachments

Required permission:

    work_items.attach

Potential payload:

    {
      "documentId": "<DOCUMENT_ID>"
    }

---

    GET /work-items/:id/attachments

Required permission:

    work_items.view

---

    DELETE /work-items/:id/attachments/:attachmentId

Required permission:

    work_items.attach

Removing the EntityAttachment relationship must not automatically delete the
underlying Document.

---

## 31. Contact Attachment Endpoints

Sprint 011 should introduce generic attachment support for Contacts.

Potential endpoints:

    POST /contacts/:id/attachments

    GET /contacts/:id/attachments

    DELETE /contacts/:id/attachments/:attachmentId

The existing Contacts authorization model must remain authoritative.

The generic EntityAttachment service should be reused rather than implementing
a second attachment system for Contacts.

---

## 32. Work Item Creation Validation

Creating a WorkItem must validate:

- title is present
- title length is within allowed limits
- description length is within allowed limits
- priority is valid
- status is valid where client-selectable
- dueAt is a valid timestamp where supplied
- branch belongs to organization
- department belongs to organization
- branch and department are structurally compatible
- contact belongs to organization
- owner OrganizationUser belongs to organization
- assignee OrganizationUser belongs to organization
- referenced OrganizationUsers are in an appropriate active state

The service must not trust organizationId supplied by the request body.

Organization ownership must come from the authenticated organization context.

---

## 33. Work Item Update Validation

Updates must distinguish between:

- Ordinary field changes
- Assignment changes
- Ownership changes
- Priority changes
- Due-date changes
- Structural scope changes
- Status transitions

Every changed relationship must be revalidated.

Cross-tenant identifiers must produce a safe authorization or not-found
response according to ORNEXIS ONE security conventions.

---

## 34. Status Transition Rules

Sprint 011 should enforce controlled status transitions.

Initial allowed transitions:

    DRAFT -> OPEN
    DRAFT -> CANCELLED

    OPEN -> IN_PROGRESS
    OPEN -> COMPLETED
    OPEN -> CANCELLED

    IN_PROGRESS -> BLOCKED
    IN_PROGRESS -> COMPLETED
    IN_PROGRESS -> CANCELLED

    BLOCKED -> IN_PROGRESS
    BLOCKED -> COMPLETED
    BLOCKED -> CANCELLED

COMPLETED and CANCELLED are terminal states during Sprint 011.

Future capabilities may introduce reopening through an explicitly designed
business rule.

Invalid transitions must be rejected by backend services.

---

## 35. Automatic Lifecycle Fields

Status transitions should control lifecycle timestamps.

When work first enters IN_PROGRESS:

    startedAt = current timestamp

When work enters COMPLETED:

    completedAt = current timestamp
    completedByOrganizationUserId = acting OrganizationUser

When work enters CANCELLED:

    cancelledAt = current timestamp

Lifecycle fields must not be freely manipulated through ordinary client input.

They are authoritative backend-managed values.

---

## 36. Due Date and Overdue Semantics

A work item is conceptually overdue when:

- dueAt is not null
- dueAt is earlier than the current time
- status is not COMPLETED
- status is not CANCELLED

Sprint 011 does not require persistent overdue flags.

Overdue state may be computed from authoritative fields.

This avoids stale derived data.

---

## 37. Accountability Foundation

Sprint 011 introduces the first implementation layer of the ORNEXIS ONE
Accountability Engine.

The initial accountability model is embedded through Work Management concepts:

- Creator
- Owner
- Assignee
- Due date
- Status
- Completion identity
- Completion timestamp
- Comments
- Activity
- Attachments
- Audit history

The sprint should allow the system to answer:

- Who created this work?
- Who owns the outcome?
- Who is assigned?
- When is it due?
- Is it overdue?
- What changed?
- Who changed it?
- Has it been completed?
- Who completed it?
- What evidence is attached?

Future Accountability Engine sprints may generalize these concepts across
Requests, Approvals, Decisions, Risks, Obligations, Assets and other modules.

---

## 38. Work Item Activity Rules

WorkItemActivity should be generated automatically for significant business
changes.

Activity generation belongs in the service layer.

Clients must not be trusted to create authoritative activity records directly.

Activity should preserve enough context for business users to understand the
change.

Examples:

ASSIGNEE_CHANGED

oldValues:

    {
      "assigneeOrganizationUserId": "old-id"
    }

newValues:

    {
      "assigneeOrganizationUserId": "new-id"
    }

The exact representation may be refined during implementation.

---

## 39. Activity vs Audit

WorkItemActivity and AuditLog serve different purposes.

WorkItemActivity:

- Business-facing history
- Work-management timeline
- Operational collaboration context

AuditLog:

- Security accountability
- Administrative traceability
- System accountability
- Sensitive business action history

Some actions should create both.

Examples:

- Work item created
- Ownership changed
- Assignment changed
- Status changed
- Work completed
- Work cancelled
- Attachment added or removed

Comments may generate WorkItemActivity and audit events according to final
implementation requirements.

---

## 40. Audit Events

Sprint 011 should introduce audit actions including:

- WORK_ITEM_CREATED
- WORK_ITEM_UPDATED
- WORK_ITEM_OWNER_CHANGED
- WORK_ITEM_ASSIGNEE_CHANGED
- WORK_ITEM_STATUS_CHANGED
- WORK_ITEM_COMPLETED
- WORK_ITEM_CANCELLED
- WORK_ITEM_COMMENT_ADDED
- WORK_ITEM_ATTACHMENT_ADDED
- WORK_ITEM_ATTACHMENT_REMOVED
- CONTACT_ATTACHMENT_ADDED
- CONTACT_ATTACHMENT_REMOVED

Audit events should preserve relevant old and new values without recording
unnecessary sensitive data.

---

## 41. Tenant Isolation Rules

Every WorkItem query must be organization-scoped.

A request must never retrieve a WorkItem by id alone without validating its
organization ownership.

The same principle applies to:

- WorkItemComment
- WorkItemActivity
- EntityAttachment
- Contact
- Document
- Branch
- Department
- OrganizationUser

Tenant isolation must be enforced at the service/database query layer and not
only through frontend filtering.

---

## 42. Cross-Tenant Attack Cases

Sprint 011 security testing must explicitly attempt:

- Foreign workItemId
- Foreign assigneeOrganizationUserId
- Foreign ownerOrganizationUserId
- Foreign branchId
- Foreign departmentId
- Foreign contactId
- Foreign documentId
- Foreign EntityAttachment id
- Foreign comment id where applicable

Every cross-tenant attempt must fail safely.

No foreign organization data should be disclosed through:

- Error messages
- Response bodies
- Relationship includes
- Activity history
- Attachment metadata

---

## 43. OrganizationUser State Rules

Assignment should normally require an OrganizationUser with ACTIVE membership.

Sprint 011 should not assign new work to:

- INVITED users
- SUSPENDED users
- REMOVED users

where those states exist in the current OrganizationUserStatus model.

Historical work associated with subsequently suspended or removed users must
remain readable according to authorization policy.

Removing or suspending a user must not destroy historical accountability.

---

## 44. Structure Validation

If branchId is supplied:

- Branch must exist
- Branch must belong to organization

If departmentId is supplied:

- Department must exist
- Department must belong to organization

If department belongs to a branch and branchId is also supplied:

- They must correspond

Existing Branch and Department validation patterns should be reused where
possible.

---

## 45. Contact Validation

A linked Contact must:

- Exist
- Belong to the current organization

Contact status may remain independent from WorkItem lifecycle.

Archiving a Contact must not automatically delete historical linked work.

---

## 46. Attachment Validation

EntityAttachment creation must validate:

- Entity exists
- Entity belongs to organization
- Document exists
- Document belongs to organization
- Document status permits attachment
- Acting OrganizationUser is active
- Acting user has required permissions

Duplicate attachment relationships should be prevented where practical.

A uniqueness constraint may be introduced for:

    organizationId + documentId + entityType + entityId

where compatible with expected business behavior.

---

## 47. Document Authorization Boundary

EntityAttachment does not grant document permissions by itself.

A user accessing attachment metadata or downloading the linked Document must
still satisfy the Document Management authorization model.

WorkItem access must not automatically bypass:

    documents.view

or:

    documents.download

where those permissions are required by existing document routes.

Attachment visibility and physical document access remain separate security
decisions.

---

## 48. Standard Response Model

Sprint 011 endpoints must follow the existing ORNEXIS ONE response convention.

Success:

    {
      "success": true,
      "data": {}
    }

Failure:

    {
      "success": false,
      "message": "...",
      "errors": []
    }

Existing error-handling architecture should be reused.

---

## 49. Service Architecture

Sprint 011 should introduce reusable services including:

- workItemService
- workItemCommentService
- workItemActivityService
- entityAttachmentService

The implementation may consolidate services where appropriate, but business
logic must not be placed directly inside controllers.

Controllers:

- Parse HTTP request context
- Call services
- Return responses

Services:

- Apply business rules
- Validate relationships
- Enforce lifecycle logic
- Coordinate database operations
- Generate activity
- Generate audits

---

## 50. Transaction Boundaries

Operations that modify WorkItem state and create Activity/Audit records should
use database transactions where consistency requires it.

Examples:

- Create work item + CREATED activity
- Change assignment + ASSIGNEE_CHANGED activity
- Complete work + completion fields + activity
- Attach document + EntityAttachment + activity

A partial business operation should not leave the platform in an inconsistent
state.

---

## 51. Concurrency Considerations

Sprint 011 should avoid silent overwriting of important work-management state.

The existing updatedAt timestamp may support future optimistic concurrency.

Full optimistic-lock enforcement is not mandatory unless implementation
analysis demonstrates it is required in Sprint 011.

The architecture must not prevent future introduction of version-based
concurrency control.

---

## 52. Query and Filtering Requirements

Work item listing should support organization-scoped filtering.

Initial useful filters include:

- status
- priority
- owner
- assignee
- branch
- department
- contact
- overdue
- due-date range

Filtering must always preserve organization scope.

Sorting may initially support:

- createdAt
- updatedAt
- dueAt
- priority

Pagination may reuse existing platform patterns or introduce a reusable pattern
where necessary.

---

## 53. Work Item Response Shape

Work-item responses may include safe relational summaries for:

- Creator
- Owner
- Assignee
- Branch
- Department
- Contact

Responses must not expose:

- Password hashes
- Authentication secrets
- Refresh tokens
- Invitation tokens
- Unnecessary private user data

Relational includes should be intentionally selected rather than returning
entire Prisma objects blindly.

---

## 54. Comment Security

A user may comment only on a WorkItem they are authorized to access.

The author must be derived from the authenticated OrganizationUser context.

The API must not accept arbitrary authorOrganizationUserId values from the
client.

Sprint 011 may initially treat comments as immutable after creation.

If editing is implemented, authorship and elevated permissions must be
validated.

---

## 55. Activity Security

Activity records must not be directly writable by ordinary API clients.

Activity retrieval requires access to the parent WorkItem.

Old and new value payloads must avoid exposing information the viewer would
not otherwise be authorized to access.

---

## 56. Generic Attachment Architecture

Sprint 011 establishes EntityAttachment as a shared platform foundation.

It must remain independent of WorkItem-specific storage logic.

The target flow is:

Document
   |
   v
EntityAttachment
   |
   +------ WORK_ITEM
   |
   +------ CONTACT
   |
   +------ future domain entities

This architecture prevents future modules from modifying the Document schema
for every attachment relationship.

---

## 57. Current Document Model Preservation

Sprint 011 should preserve the Sprint 010 Document Management architecture.

Sprint 011 must not redesign:

- Physical storage
- File checksums
- MIME validation
- File-size validation
- Stored filename generation
- Storage provider abstraction
- Document download controls

Work Management consumes the Document capability.

It does not replace it.

---

## 58. Dashboard Extension

Sprint 011 may extend Dashboard Foundation where appropriate with basic
work-management insights.

Potential metrics include:

- Total open work
- My assigned work
- Overdue work
- Work by status
- Work by priority

Dashboard extension should occur only after Work Management APIs are stable.

Advanced KPI or Organization Health scoring remains out of scope.

---

## 59. Performance Expectations

Sprint 011 should avoid full-table scans for common organization work queries.

Required indexes defined earlier should support common filters.

Relationship includes should be intentional.

Unbounded comment or activity loading should be avoided for large histories.

Future pagination may be introduced where necessary.

---

## 60. Logging Requirements

Application logs should support troubleshooting without exposing sensitive
business data unnecessarily.

Logs may include:

- Route
- Request identifier where available
- User identifier
- Organization identifier
- Entity identifier
- Error category

Logs must not contain:

- Passwords
- Tokens
- Document contents
- Confidential comment bodies unless explicitly required
- Sensitive personal data unnecessarily

---

## 61. Security Testing Requirements

Sprint 011 must test:

- Missing authentication
- Invalid authentication
- Missing organization context
- Invalid organization membership
- Missing permission
- Foreign organization WorkItem
- Foreign assignee
- Foreign owner
- Foreign branch
- Foreign department
- Foreign contact
- Foreign document
- Foreign attachment
- Invalid status transition
- Unauthorized assignment
- Unauthorized completion
- Unauthorized cancellation
- Unauthorized comment
- Unauthorized attachment

---

## 62. Functional Testing Requirements

Sprint 011 must verify:

- Work item creation
- Work item retrieval
- Work item listing
- Work item update
- Assignment
- Ownership
- Priority change
- Due-date change
- Status transitions
- Completion fields
- Cancellation fields
- Comments
- Activity history
- Work-item attachments
- Contact attachments
- Filtering
- Audit creation

---

## 63. Lifecycle Testing Requirements

Explicit lifecycle tests must verify:

- DRAFT -> OPEN
- DRAFT -> CANCELLED
- OPEN -> IN_PROGRESS
- OPEN -> COMPLETED
- OPEN -> CANCELLED
- IN_PROGRESS -> BLOCKED
- IN_PROGRESS -> COMPLETED
- IN_PROGRESS -> CANCELLED
- BLOCKED -> IN_PROGRESS
- BLOCKED -> COMPLETED
- BLOCKED -> CANCELLED

Tests must also reject unsupported transitions.

Examples:

- COMPLETED -> IN_PROGRESS
- CANCELLED -> OPEN
- DRAFT -> BLOCKED

unless the implementation contract is deliberately changed before coding.

---

## 64. Regression Testing

Existing functionality must continue working after Sprint 011.

Regression verification must include at minimum:

- GET /health
- GET /auth/me
- Contacts
- Branches
- Departments
- Dashboard
- Documents

Existing permissions must remain functional.

Existing Prisma migrations must remain valid.

---

## 65. Database Migration Requirements

Sprint 011 database changes should be introduced through Prisma migrations.

Migration design should include:

- New enums
- WorkItem
- WorkItemComment
- WorkItemActivity
- EntityAttachment
- Permission records

Existing production-like data must not require destructive reset.

The migration should preserve all Sprint 001–010 data.

---

## 66. Proposed New Enums

Expected enums include:

    WorkItemStatus

Values:

- DRAFT
- OPEN
- IN_PROGRESS
- BLOCKED
- COMPLETED
- CANCELLED

Expected enum:

    WorkItemPriority

Values:

- LOW
- NORMAL
- HIGH
- URGENT
- CRITICAL

Expected enum:

    WorkItemActivityType

Values:

- CREATED
- UPDATED
- OWNER_CHANGED
- ASSIGNEE_CHANGED
- PRIORITY_CHANGED
- DUE_DATE_CHANGED
- STATUS_CHANGED
- COMMENT_ADDED
- ATTACHMENT_ADDED
- ATTACHMENT_REMOVED
- COMPLETED
- CANCELLED

Expected enum:

    EntityAttachmentType

Initial values:

- WORK_ITEM
- CONTACT

The final enum names may be refined if Prisma or architectural conventions
justify changes.

---

## 67. Proposed Schema Relationships

Organization should gain relations for:

- workItems
- entityAttachments

OrganizationUser should gain relations for:

- createdWorkItems
- ownedWorkItems
- assignedWorkItems
- completedWorkItems
- workItemComments
- workItemActivities
- createdEntityAttachments

Branch should gain:

- workItems

Department should gain:

- workItems

Contact should gain:

- workItems

Document should gain:

- entityAttachments

These relations must preserve tenant-aware references where technically
appropriate.

---

## 68. Implementation File Structure

Sprint 011 is expected to introduce or modify files including:

Database:

    packages/database/prisma/schema.prisma
    packages/database/prisma/migrations/...

Services:

    apps/api/src/services/workItemService.ts
    apps/api/src/services/workItemCommentService.ts
    apps/api/src/services/workItemActivityService.ts
    apps/api/src/services/entityAttachmentService.ts

Controllers:

    apps/api/src/controllers/workItemController.ts

Routes:

    apps/api/src/routes/workItems.ts

Validators:

    apps/api/src/validators/workItemValidator.ts

Application registration:

    apps/api/src/app.ts

Existing contact routes/services may be extended for contact attachments.

Additional shared files may be introduced where architectural reuse requires
them.

---

## 69. Implementation Order

Sprint 011 should be implemented in this order:

1. Finalize Sprint 011 implementation contract
2. Validate current repository baseline
3. Introduce Prisma enums
4. Introduce WorkItem schema
5. Introduce WorkItemComment schema
6. Introduce WorkItemActivity schema
7. Introduce EntityAttachment schema
8. Add relations to existing models
9. Validate Prisma schema
10. Create migration
11. Introduce permissions
12. Regenerate Prisma Client
13. Implement validators
14. Implement activity service
15. Implement attachment service
16. Implement WorkItem service
17. Implement comment service
18. Implement controller
19. Implement routes
20. Register routes
21. Test CRUD
22. Test assignment and ownership
23. Test lifecycle rules
24. Test comments
25. Test activity
26. Test attachments
27. Test contact attachments
28. Test permissions
29. Test tenant isolation
30. Run regression suite
31. Update sprint documentation
32. Review Git diff
33. Commit implementation
34. Push implementation
35. Close Sprint 011 documentation
36. Commit and push sprint closure

---

## 70. Existing Patterns to Reuse

Sprint 011 must reuse existing ORNEXIS ONE patterns for:

- Authentication middleware
- Organization-context middleware
- Permission middleware
- Validation
- Service architecture
- Controllers
- Routes
- AuditService
- Error handling
- Prisma access
- Standard API responses
- Branch validation
- Department validation
- Contact tenant isolation
- Document tenant isolation

New architectural patterns should only be introduced where the existing
foundation cannot appropriately support the requirement.

---

## 71. Development Safety Rules

During Sprint 011:

- Do not reset the database unnecessarily
- Do not delete existing migrations
- Do not rewrite completed Sprint 001–010 migrations
- Do not bypass permission middleware
- Do not trust frontend organization IDs
- Do not trust arbitrary actor IDs
- Do not expose raw Prisma records without response review
- Do not hard-delete work history without an explicit requirement
- Do not couple attachments directly to one future module
- Do not implement deferred roadmap capabilities accidentally

---

## 72. Sprint 011 Deliverables

Sprint 011 is expected to deliver:

- WorkItem data model
- WorkItemComment data model
- WorkItemActivity data model
- EntityAttachment data model
- WorkItem status lifecycle
- WorkItem priority model
- Creator tracking
- Owner tracking
- Assignee tracking
- Due-date tracking
- Completion tracking
- Branch scope
- Department scope
- Contact relationship
- Work-item CRUD APIs
- Assignment APIs
- Comment APIs
- Activity APIs
- Work-item attachments
- Contact attachments
- Work Management permissions
- Audit events
- Tenant isolation
- Cross-tenant security validation
- Regression verification
- Sprint documentation

---

## 73. Definition of Done

Sprint 011 is complete only when:

☑ Prisma enums implemented

☑ WorkItem model implemented

☑ WorkItemComment model implemented

☑ WorkItemActivity model implemented

☑ EntityAttachment model implemented

☑ Existing model relationships updated

☑ Prisma schema validates

☑ Migration created

☑ Migration applies successfully

☑ Prisma Client generates successfully

☑ Work Management permissions introduced

☑ Appropriate administrator permissions assigned

☑ WorkItem validator implemented

☑ WorkItem service implemented

☑ WorkItem comment service implemented

☑ WorkItem activity service implemented

☑ EntityAttachment service implemented

☑ WorkItem controller implemented

☑ WorkItem routes implemented

☑ POST /work-items implemented

☑ GET /work-items implemented

☑ GET /work-items/:id implemented

☑ PATCH /work-items/:id implemented

☑ Work assignment implemented

☑ Work ownership implemented

☑ Priority management implemented

☑ Due-date management implemented

☑ Status transition engine implemented

☑ Completion tracking implemented

☑ Cancellation tracking implemented

☑ Comments implemented

☑ Activity history implemented

☑ Work-item attachments implemented

☑ Contact attachments implemented

☑ Branch assignment validated

☑ Department assignment validated

☑ Contact relationship validated

☑ OrganizationUser assignment validated

☑ work_items.view enforced

☑ work_items.create enforced

☑ work_items.update enforced

☑ work_items.assign enforced

☑ work_items.complete enforced

☑ work_items.cancel enforced

☑ work_items.comment enforced

☑ work_items.attach enforced

☑ Relevant audit events implemented

☑ Relevant WorkItemActivity events implemented

☑ Invalid lifecycle transitions rejected

☑ Tenant isolation verified

☑ Cross-tenant WorkItem access rejected

☑ Cross-tenant assignee rejected

☑ Cross-tenant owner rejected

☑ Cross-tenant branch rejected

☑ Cross-tenant department rejected

☑ Cross-tenant contact rejected

☑ Cross-tenant document attachment rejected

☑ Cross-tenant EntityAttachment rejected

☑ Existing Contacts regression-tested

☑ Existing Branches regression-tested

☑ Existing Departments regression-tested

☑ Existing Dashboard regression-tested

☑ Existing Documents regression-tested

☑ Existing Authentication regression-tested

☑ GET /health passes

☑ Prisma migrations up to date

☑ TypeScript compilation passes

☑ git diff --check passes

☑ Documentation finalized

☑ Git staged review

☑ Git implementation commit

☑ Git implementation push

☑ Sprint closure documentation committed

☑ Sprint closure pushed

---

## 74. Sprint Success Criteria

Sprint 011 succeeds when an authorized organization user can:

1. Create organizational work
2. Assign responsibility
3. Identify the accountable owner
4. Set priority
5. Set a due date
6. Move work through a controlled lifecycle
7. Comment on work
8. Review operational history
9. Attach supporting documents
10. Associate work with a Contact
11. Complete or cancel work
12. Identify who completed the work
13. See relevant work without exposing another tenant's data

The system must preserve accountability and historical context throughout the
work lifecycle.

---

## 75. Future Extension Points

The Sprint 011 foundation must support future introduction of:

- Team ownership
- Department ownership
- Branch ownership
- Work queues
- Recurring work
- Subtasks
- Dependencies
- Checklists
- Watchers
- Mentions
- Notifications
- Escalations
- Request-generated work
- Workflow-generated work
- Approval-generated work
- Ticket-generated work
- Asset-generated work
- CRM-generated work
- HR-generated work
- Risk-treatment work
- Obligation-generated work
- Decision actions
- SLA-driven work
- Attention Centre integration
- Daily Brief integration
- KPI integration
- Organization Health integration
- Command Centre integration
- Search
- Reporting
- Mobile workspaces

Sprint 011 must not prematurely implement these capabilities.

It must establish foundations that allow them to be introduced cleanly.

---

## 76. Architectural Outcome

After Sprint 011, ORNEXIS ONE should have its first reusable operational work
engine.

The platform evolves from:

    Identity
        +
    Organizations
        +
    Permissions
        +
    Structure
        +
    Contacts
        +
    Documents
        +
    Dashboard

into:

    Identity
        +
    Organizations
        +
    Permissions
        +
    Structure
        +
    Contacts
        +
    Documents
        +
    Work Management
        +
    Collaboration
        +
    Accountability
        +
    Dashboard

This provides the operational foundation required by later Request Centre,
Workflow, Service Desk, CRM, HR, Governance and intelligence capabilities.

---

## 77. Sprint 011 Boundary

Sprint 011 builds the Work Management capability.

Sprint 011 does not attempt to complete Phase 1 alone.

The expected Phase 1 progression is:

Sprint 011
    |
    Work Management
    Collaboration
    Generic Attachments
    Accountability Foundation
    |
    v
Sprint 012
    |
    Request Centre
    Workflow
    Approvals
    Escalation Foundation
    |
    v
Sprint 013
    |
    Notification Foundation
    In-App Notifications
    Email Foundation

Sprint boundaries may be refined where implementation dependencies require it,
but capabilities should remain grouped rather than fragmented into
unnecessarily small sprints.

---

# Sprint 011 Implementation Checklist

☑ Baseline repository clean

☑ Current database migrations verified

☑ Current API health verified

☑ Sprint implementation contract complete

☑ Architecture reviewed

☑ Existing relations reviewed

☑ Schema design finalized

☑ Prisma implementation complete

☑ Database migration complete

☑ Permissions complete

☑ Validators complete

☑ Services complete

☑ Controllers complete

☑ Routes complete

☑ CRUD testing complete

☑ Lifecycle testing complete

☑ Attachment testing complete

☑ Tenant security testing complete

☑ Regression testing complete

☑ Documentation complete

☑ Git review complete

☑ Implementation committed

☑ Implementation pushed

☑ Sprint marked COMPLETE

☑ Sprint closure committed

☑ Sprint closure pushed

---


---

## Sprint 011 Acceptance Results

Sprint 011 Work Management, Collaboration and Accountability Foundation was
validated end-to-end.

Verified capabilities include:

- Work-item creation
- Tenant-scoped work-item listing
- Work-item retrieval
- Ownership assignment
- Assignee assignment
- Priority updates
- Due-date updates
- OPEN to IN_PROGRESS transition
- Automatic started timestamp
- Work-item comments
- Operational activity history
- COMPLETED transition
- Automatic completion timestamp
- Completion accountability
- Completed-work filtering
- Invalid terminal-status transition rejection
- Organization isolation enforcement
- Authentication regression
- Contacts regression
- Branches regression
- Departments regression
- Dashboard regression
- Document upload for attachment testing
- Work-item document attachment
- Attachment listing
- Attachment removal
- Document metadata serialization
- TypeScript validation
- Prisma schema validation
- Migration-status validation

The acceptance work item completed the lifecycle:

OPEN
  |
  v
IN_PROGRESS
  |
  v
COMPLETED

Activity history successfully preserved:

- CREATED
- OWNER_CHANGED
- ASSIGNEE_CHANGED
- PRIORITY_CHANGED
- DUE_DATE_CHANGED
- UPDATED
- STATUS_CHANGED
- COMMENT_ADDED
- ATTACHMENT_ADDED
- ATTACHMENT_REMOVED
- COMPLETED

Tenant-isolation testing confirmed that an unauthorized organization context
cannot access organization-scoped work-management data.

Sprint 011 is therefore considered functionally complete.

# Sprint Status

ACTIVE DEVELOPMENT

---

# End of Document

**Sprint:** 011
**Status:** COMPLETE
**Roadmap Phase:** Phase 1 — Operational Core
