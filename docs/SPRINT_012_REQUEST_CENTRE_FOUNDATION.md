# ORNEXIS ONE — Sprint 012
# Request Centre Foundation

**Status:** COMPLETE

---

## 1. Sprint Objective

Build the first reusable Request Centre foundation for ORNEXIS ONE.

Sprint 012 introduces organization-configurable request types and operational
request records without hard-coding request behaviour to a specific industry.

The Request Centre must integrate with the existing:

- multi-tenant organization architecture
- organization structure
- permission engine
- contacts
- document management
- work management foundation
- audit infrastructure

This sprint establishes the request domain upon which workflow, approvals,
escalations, fulfilment automation, notifications and service-management
capabilities can later operate.

---

## 2. Architectural Principles

☑ Request types are organization-scoped.

☑ Requests are organization-scoped.

☑ No organization may access another organization's request data.

☑ Request categories are configurable through Request Types.

☑ Request forms may carry configurable structured data.

☑ Request lifecycle state is explicit.

☑ Request ownership and assignment use OrganizationUser identities.

☑ Requests may optionally belong to a branch.

☑ Requests may optionally belong to a department.

☑ Requests may optionally reference a Contact.

☑ Requests may carry attachments using the existing EntityAttachment system.

☑ Existing WorkItem infrastructure must be reused where appropriate.

☑ Workflow and approval engines must remain separate reusable capabilities.

☑ Request Centre must remain industry-neutral.

---

## 3. Request Type Foundation

An organization administrator must be able to define reusable request types.

Examples include:

- IT Support Request
- Access Request
- Procurement Request
- Leave Request
- HR Request
- Finance Request
- Asset Request
- Administrative Request

These are examples only and must not be hard-coded.

### RequestType minimum fields

☑ id

☑ organizationId

☑ name

☑ code

☑ description

☑ formSchema

☑ defaultPriority

☑ defaultAssigneeOrganizationUserId

☑ defaultDepartmentId

☑ isActive

☑ createdAt

☑ updatedAt

Request type codes must be unique within an organization.

---

## 4. Request Lifecycle

Sprint 012 introduces the following lifecycle:

DRAFT

SUBMITTED

IN_REVIEW

APPROVED

REJECTED

IN_FULFILMENT

COMPLETED

CANCELLED

The lifecycle is intentionally explicit so that future workflow engines can
control transitions without replacing the Request domain.

---

## 5. Request Priority

Requests support:

LOW

NORMAL

HIGH

URGENT

CRITICAL

The semantics align with the existing WorkItem priority model.

---

## 6. Request Record

Each Request must contain sufficient operational context to become actionable.

### Minimum fields

☑ id

☑ organizationId

☑ requestTypeId

☑ requestNumber

☑ requesterOrganizationUserId

☑ assignedToOrganizationUserId

☑ branchId

☑ departmentId

☑ contactId

☑ title

☑ description

☑ formData

☑ priority

☑ status

☑ dueAt

☑ submittedAt

☑ completedAt

☑ cancelledAt

☑ createdAt

☑ updatedAt

---

## 7. Request Numbering

Every submitted request must have a human-readable organization-scoped number.

Example:

REQ-000001

REQ-000002

The database UUID remains the canonical technical identifier.

The request number exists for:

- communication
- search
- support
- reporting
- future notification messages
- human-readable references

---

## 8. Configurable Form Foundation

RequestType.formSchema stores configurable request-field definitions.

Request.formData stores submitted values.

Sprint 012 does not build a visual form designer.

The backend must nevertheless establish a safe JSON foundation so a future
frontend form builder can consume the schema.

---

## 9. Assignment

Requests may be assigned to an OrganizationUser.

Request Types may define a default assignee.

When a request is submitted:

1. explicit assignment takes precedence;
2. otherwise RequestType default assignment may be used;
3. otherwise the request remains unassigned.

Assignment must never cross organization boundaries.

---

## 10. Organization Structure

Requests may optionally reference:

- Branch
- Department

Request Types may optionally define a default Department.

All referenced organizational entities must belong to the active organization.

---

## 11. Contact Integration

A request may optionally reference a Contact.

This supports future scenarios such as:

- customer request
- member request
- supplier request
- employee-related request
- donor request
- partner request

The Contact must belong to the active organization.

---

## 12. Attachment Integration

Extend EntityAttachmentType with:

REQUEST

Requests use the existing Document and EntityAttachment infrastructure.

The Request Centre must not create a duplicate file-storage system.

Required operations:

☑ list request attachments

☑ attach an existing document

☑ detach a document

Documents must belong to the active organization.

---

## 13. Request Activity

Introduce RequestActivity to preserve important request history.

Activity types should include:

CREATED

UPDATED

SUBMITTED

ASSIGNED

STATUS_CHANGED

PRIORITY_CHANGED

COMMENT_ADDED

ATTACHMENT_ADDED

ATTACHMENT_REMOVED

COMPLETED

CANCELLED

Activity history must be immutable from normal API operations.

---

## 14. Request Comments

Requests support comments using a RequestComment model.

Each comment records:

☑ organization

☑ request

☑ author OrganizationUser

☑ body

☑ createdAt

☑ updatedAt

---

## 15. Permission Model

Sprint 012 introduces:

requests.view

requests.create

requests.update

requests.assign

requests.comment

requests.attach

requests.manage_types

The permission engine remains the source of authorization.

No Request Centre route may bypass organization context or permission checks.

---

## 16. API Surface

### Request Types

GET /request-types

POST /request-types

GET /request-types/:id

PATCH /request-types/:id

### Requests

GET /requests

POST /requests

GET /requests/:id

PATCH /requests/:id

PATCH /requests/:id/status

PATCH /requests/:id/assignment

GET /requests/:id/comments

POST /requests/:id/comments

GET /requests/:id/activity

GET /requests/:id/attachments

POST /requests/:id/attachments

DELETE /requests/:id/attachments/:attachmentId

---

## 17. Request Listing Filters

GET /requests should support useful operational filtering.

Target filters:

☑ status

☑ priority

☑ requestTypeId

☑ requesterOrganizationUserId

☑ assignedToOrganizationUserId

☑ branchId

☑ departmentId

☑ contactId

☑ search

☑ overdue

---

## 18. Tenant Isolation

Every Request Centre query must include organization scope.

Foreign organization IDs must not permit:

- reading
- updating
- assigning
- commenting
- attaching
- status transitions

Cross-tenant access must fail safely.

---

## 19. Validation

Validation must cover:

☑ UUID fields

☑ request title

☑ description

☑ request type

☑ request priority

☑ request status

☑ assignment

☑ organization structure

☑ contact references

☑ configurable form data

☑ comments

☑ attachment document IDs

---

## 20. Auditability

Request mutations must produce appropriate operational history.

The existing audit infrastructure should be used for security and system-level
audit events where appropriate.

RequestActivity provides request-domain operational history.

These concerns must remain complementary rather than duplicated.

---

## 21. Workflow Boundary

Sprint 012 DOES NOT implement the full configurable Workflow Engine.

It prepares Requests to participate in workflow later.

Future workflow capabilities may control:

- allowed transitions
- multi-step routing
- conditional routing
- approvals
- rejection paths
- deadlines
- escalations
- automation

The Request model must therefore not hard-code future workflow definitions.

---

## 22. Approval Boundary

APPROVED and REJECTED lifecycle states are supported so Request Centre can
operate independently.

However, Sprint 012 does not implement the reusable Approval Engine.

Future approval records will capture:

- approver
- decision
- comments
- decision timestamp
- approval stage
- delegated approval
- approval history

---

## 23. Notification Boundary

Sprint 012 does not implement the notification engine.

Request events must nevertheless be structured so future notification
subscribers can react to:

- submission
- assignment
- status change
- comment
- approaching deadline
- overdue request
- completion

---

## 24. Acceptance Tests

Sprint 012 is COMPLETE only when the following are demonstrated.

### Platform

☑ TypeScript compilation succeeds

☑ Prisma schema validates

☑ Database migrations apply successfully

☑ Database migration status is current

### Request Types

☑ Request type can be created

☑ Request types can be listed

☑ Request type can be retrieved

☑ Request type can be updated

☑ Duplicate organization request-type code is rejected

### Requests

☑ Request can be created

☑ Request can be submitted

☑ Request receives human-readable request number

☑ Requests can be listed

☑ Request can be retrieved

☑ Request can be updated

☑ Request can be assigned

☑ Request status can change

☑ Request can be completed

☑ Request filtering works

### Collaboration

☑ Comment can be added

☑ Comments can be listed

☑ Activity history can be listed

### Documents

☑ Existing document can be attached

☑ Request attachments can be listed

☑ Attachment can be removed

### Security

☑ Authentication is required

☑ Organization context is required

☑ Permissions are enforced

☑ Cross-tenant request access is rejected

☑ Foreign organization assignment is rejected

☑ Foreign organization contact is rejected

☑ Foreign organization document attachment is rejected

### Engineering

☑ git diff --check passes

☑ working tree is clean after final commit

☑ implementation is pushed to origin/main

---

## 25. Sprint Completion Rule

Sprint 012 must not be marked COMPLETE merely because code exists.

It becomes COMPLETE only after:

1. implementation;
2. migration;
3. compilation;
4. API acceptance testing;
5. tenant-isolation verification;
6. permission verification;
7. attachment verification;
8. Git validation;
9. final documentation update.

---

# Sprint Status

**Status:** COMPLETE
