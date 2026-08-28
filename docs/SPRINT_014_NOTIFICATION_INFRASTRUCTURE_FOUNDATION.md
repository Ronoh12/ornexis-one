# ORNEXIS ONE
# Sprint 014 — Notification Infrastructure Foundation

**Status:** COMPLETE

---

## 1. Sprint Objective

Build the reusable, tenant-safe notification infrastructure that ORNEXIS ONE
modules can use to inform organization users about meaningful business events.

Sprint 014 establishes the notification foundation required before widespread
automated reminders, escalations, SLA notifications and the future
Attention Centre.

The notification capability must be shared infrastructure.

Individual modules must not implement independent notification persistence or
delivery logic when the shared notification capability can be used.

---

## 2. Architectural Position

Sprint 014 builds upon:

- Organization and tenant foundation
- Authentication
- RBAC and permissions
- Organization structure
- Contacts
- Dashboard foundation
- Document Management
- Work Management and Accountability
- Request Centre
- Workflow and Approval Engine
- Audit infrastructure

The notification capability will later be consumed by:

- Work Management
- Request Centre
- Workflow and Approvals
- Service Desk
- SLA management
- Document lifecycle
- Asset management
- HR
- Finance
- CRM
- Security operations
- Expiry and obligation management
- Accountability Engine
- Attention Centre
- Organization Health
- Command Centre
- Industry packs

---

## 3. Sprint Scope

Sprint 014 will implement:

1. Notification persistence
2. Tenant-safe notification recipients
3. In-app notification inbox
4. Read/unread lifecycle
5. Notification priority
6. Business-event/source references
7. Shared notification service
8. Notification query APIs
9. Unread notification count
10. Mark notification as read
11. Mark all accessible notifications as read
12. Notification preferences foundation
13. RBAC protection
14. Audit integration where appropriate
15. Tenant-isolation validation
16. Runtime acceptance testing

---

## 4. Notification Model

A Notification should support, at minimum:

- id
- organizationId
- recipientOrganizationUserId
- type
- title
- message
- priority
- sourceType
- sourceId
- actionUrl or action reference where appropriate
- metadata
- readAt
- createdAt
- updatedAt

The final Prisma design may refine these fields where repository conventions,
integrity constraints or future extensibility require it.

---

## 5. Notification Priority

The foundation should support meaningful priority classification.

Expected initial priorities:

- LOW
- NORMAL
- HIGH
- CRITICAL

Priority must not itself bypass permissions.

---

## 6. Notification Source

Notifications should be able to reference the business object or event that
caused them.

Examples:

- WORK_ITEM
- REQUEST
- WORKFLOW_INSTANCE
- APPROVAL
- DOCUMENT
- SYSTEM

The architecture must remain extensible for future modules.

Source references must not create a cross-tenant information leak.

---

## 7. Recipient Integrity

A notification recipient must belong to the same organization as the
notification.

The API must not allow one organization to create, read, update or infer
notifications belonging to another organization.

Recipient relationships should use database integrity constraints where
practical rather than relying only on application validation.

---

## 8. In-App Notification Inbox

Sprint 014 will establish the first notification delivery channel:

IN_APP

A user should be able to retrieve their notifications within the active
organization context.

The inbox should support useful filtering and pagination where consistent with
existing ORNEXIS API conventions.

Potential filters include:

- read/unread
- type
- priority
- sourceType

---

## 9. Read Lifecycle

Users must be able to:

- list their notifications
- retrieve an individual accessible notification
- obtain unread count
- mark an individual notification as read
- mark their notifications as read in bulk

A user must not be able to modify another user's notification state unless a
future explicitly authorized administrative capability is introduced.

---

## 10. Shared Notification Service

Modules should not directly duplicate notification creation logic.

Sprint 014 should provide a reusable service capable of creating notifications
for organization users.

The service should validate:

- organization
- recipient
- tenant consistency
- required notification data

Future modules should be able to call this service when meaningful business
events occur.

---

## 11. Notification Preferences Foundation

The architecture should establish a foundation for user notification
preferences.

Sprint 014 does not need to implement every future preference or delivery
channel.

The design should remain extensible for:

- in-app
- email
- SMS
- push
- event-specific preferences
- quiet hours
- localization
- escalation rules

No external SMS, email or push provider is required in Sprint 014.

---

## 12. Delivery Architecture Boundary

Sprint 014 establishes IN_APP notification delivery.

The following are future extensions unless required by implementation
dependencies:

- email delivery
- SMS delivery
- mobile push
- delivery retry workers
- delivery queues
- provider integrations
- localization
- advanced templates
- scheduled notification jobs

The data model must not make these future capabilities unnecessarily difficult.

---

## 13. Permissions

Sprint 014 should introduce notification permissions consistent with the
existing permission architecture.

Expected permissions may include:

- notifications.view
- notifications.manage

The final permission names must follow the repository's established naming
conventions.

Ordinary users should only retrieve notifications addressed to themselves
within the active organization.

Administrative notification creation or management must require explicit
authorization.

---

## 14. API Foundation

Expected API capabilities:

GET /notifications

GET /notifications/unread-count

GET /notifications/:id

PATCH /notifications/:id/read

PATCH /notifications/read-all

Administrative or internal notification creation endpoints should only be
introduced if justified by the architecture.

The preferred creation path for application modules is the shared notification
service rather than exposing unrestricted notification creation to clients.

---

## 15. Audit Requirements

Security-sensitive or administratively meaningful notification operations
should integrate with the existing audit infrastructure where appropriate.

Routine user reads should not create excessive audit noise unless required by
security or compliance policy.

---

## 16. Security Requirements

Sprint 014 must protect against:

- cross-tenant notification access
- cross-tenant recipient assignment
- reading another user's notification
- modifying another user's read state
- source-reference information leakage
- unauthorized notification administration
- sensitive information exposure through future channels

Notification payloads must not become an authorization bypass.

A notification referencing an entity does not automatically grant permission
to access that entity.

---

## 17. Multi-Tenant Requirements

Every notification must be scoped to an organization.

All notification queries must use the active organization context.

Organization membership and recipient identity must be validated.

Database-level tenant integrity should be used where practical.

---

## 18. Integration Targets

Sprint 014 should make it straightforward for existing modules to become
notification producers.

Initial integration candidates after the foundation is stable include:

- work-item assignment
- work-item due date/reminder
- request assignment/status changes
- workflow transitions
- approval required
- approval decision
- document lifecycle events

Not every producer must be integrated during Sprint 014 unless required for
acceptance testing.

At least one real existing module should be used to prove the shared
notification service integration if technically practical.

---

## 19. Attention Centre Boundary

The Attention Centre is NOT the same as the Notification Inbox.

Notifications communicate meaningful events to recipients.

The future Attention Centre will aggregate permission-aware signals requiring
action or awareness, including:

- overdue work
- approvals awaiting action
- SLA risks
- expiring documents
- expiring licenses
- security concerns
- workflow bottlenecks
- organizational risks

Sprint 014 must avoid prematurely embedding Attention Centre logic directly
inside the notification model.

---

## 20. Future Escalation Boundary

Notification infrastructure must exist before widespread automated escalation.

Future escalation capabilities may consume:

- deadlines
- workflow state
- SLA state
- ownership
- notification infrastructure
- organizational hierarchy
- roles and permissions

Sprint 014 establishes the notification dependency but does not implement the
complete escalation engine.

---

## 21. Acceptance Tests

Sprint 014 is not complete until runtime testing demonstrates at minimum:

1. Notification can be created through the shared service.
2. Intended recipient can list the notification.
3. Recipient can retrieve the notification.
4. Unread count reflects unread notifications.
5. Recipient can mark the notification as read.
6. Unread count decreases correctly.
7. Bulk mark-as-read works correctly.
8. Another organization cannot access the notification.
9. Another organization cannot use a foreign recipient.
10. Another user cannot alter the recipient's read state.
11. Missing required permission is rejected where applicable.
12. Tenant-scoped source metadata does not bypass authorization.
13. Audit behavior matches the defined policy.

---

## 22. Quality Gates

Before Sprint 014 is marked COMPLETE:

- TypeScript compilation must pass.
- Prisma schema validation must pass.
- Database migration must apply successfully.
- Migration status must report database up to date.
- Runtime API acceptance tests must pass.
- Tenant-isolation tests must pass.
- Permission tests must pass.
- git diff --check must pass.
- Sprint documentation must reflect the actual implementation.
- Repository must be clean after commit.

---

## 23. Deferred Capabilities

The following remain future work unless required by implementation:

- email provider integration
- SMS provider integration
- push notifications
- advanced notification templates
- notification scheduling
- background delivery workers
- retry queues
- delivery analytics
- advanced notification preferences
- localization
- escalation engine
- Service Desk SLA notifications
- full Attention Centre
- Organization Health notification intelligence
- AI-generated notification summaries

---

## 24. Definition of Done

Sprint 014 is complete when ORNEXIS ONE has a reusable, secure, tenant-aware
notification foundation that existing and future modules can use without
building separate notification systems.

The implementation must provide a working in-app notification inbox,
recipient integrity, read lifecycle, unread counts, shared notification
creation, RBAC protection and verified tenant isolation.

The implementation must remain extensible for future channels, escalation,
Attention Centre and Organization Health capabilities.

---

**Status:** COMPLETE

---

# Sprint 014 Completion Reconciliation

**Status:** COMPLETE

Sprint 014 established the reusable Notification Infrastructure Foundation for ORNEXIS ONE.

## Implemented

The sprint delivered:

- tenant-scoped notification persistence
- tenant-safe notification recipients
- in-app notification channel foundation
- notification priority support
- source/business-event references
- notification metadata
- unread/read lifecycle
- recipient inbox queries
- unread count
- mark-one-read
- mark-all-read
- shared internal notification service
- notification preference persistence foundation
- notification RBAC
- notification API routes
- Administrator permission seeding
- Work Item assignment as the first real notification producer

## Notification Permissions

Implemented permissions:

- `notifications.view`
- `notifications.manage`

`notifications.view` applies to the authenticated organization user's own notification inbox.

`notifications.manage` protects the administrative/API notification creation route.

Normal ORNEXIS product modules should use the shared notification service directly rather than depend on the administrative HTTP creation endpoint.

## Notification APIs

Implemented routes:

- `GET /notifications`
- `GET /notifications/unread-count`
- `GET /notifications/:id`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `POST /notifications`

Inbox and read-state operations are scoped by both organization and current organization-user membership.

## Tenant and Authorization Boundaries

The implementation enforces:

- recipient membership must be ACTIVE
- recipient must belong to the same organization
- inbox access is recipient scoped
- individual notification access is recipient scoped
- read-state changes are recipient scoped
- cross-tenant notification access is blocked
- cross-tenant recipient creation is blocked
- source references do not grant authorization to source entities

A notification may reference another ORNEXIS entity, but possession of that notification does not grant permission to access the referenced entity.

## Audit Policy

Routine notification reads, unread-count queries, and read-state changes do not create audit-log noise.

Security-sensitive source actions remain audited by their originating modules where appropriate.

## First Real Producer Integration

Work Item assignment is the first real module integrated with the shared notification infrastructure.

Implemented behavior:

- creating a Work Item with an assignee generates a `WORK_ITEM_ASSIGNED` notification
- changing a Work Item assignee generates a notification for the new assignee
- assigning the same user again does not create a duplicate assignment notification
- unassigning a Work Item does not generate a false assignment notification
- Work Item activity and audit behavior remain intact
- Work Item notification recipients remain tenant and membership scoped

Notification source metadata uses:

- source type: `WORK_ITEM`
- source ID: Work Item ID
- action reference: `/work-items/{id}`

## Priority Mapping

The initial Work Item producer maps Work Item priority into notification priority.

Current behavior includes:

- urgent Work Items -> critical notifications
- high-priority Work Items -> high-priority notifications
- other Work Item priorities -> normal notifications

This mapping is intentionally simple for the foundation sprint and can later evolve into configurable notification policy.

## Persistence Foundation

Sprint 014 introduced:

- `Notification`
- `NotificationPreference`
- `NotificationPriority`
- `NotificationChannel`

The persistence model is future-ready for additional delivery channels and preference handling without implementing those delivery engines prematurely.

## Deferred Capabilities

The following remain future roadmap capabilities and are not claimed as Sprint 014 implementation:

- production email delivery
- production SMS delivery
- production push delivery
- notification templates
- delivery retries
- delivery-provider tracking
- quiet hours
- localization
- advanced event subscriptions
- escalation engine
- SLA-driven notification policy
- Attention Centre
- Organization Health
- Command Centre intelligence

The Attention Centre remains architecturally distinct from notifications:

Notifications communicate events.

The Attention Centre will identify conditions that require user attention across modules.

## Acceptance Evidence

Sprint 014 acceptance covered the notification infrastructure and the Work Item producer integration, including:

- notification creation
- recipient inbox access
- individual notification retrieval
- unread count
- mark-one-read
- mark-all-read
- tenant isolation
- recipient isolation
- permission enforcement
- foreign-recipient rejection
- source-reference authorization boundaries
- notification preference persistence foundation
- Work Item create-with-assignee notification
- Work Item reassignment notification
- duplicate prevention for unchanged assignee
- correct unassignment behavior
- preservation of Work Item activity/audit behavior
- recipient isolation for Work Item notifications

## Quality Gates

Verified during Sprint 014:

- TypeScript compilation
- Prisma schema validation
- Prisma Client generation
- database migrations
- migration status
- notification permission seeding
- runtime notification API acceptance
- tenant isolation
- recipient isolation
- permission enforcement
- real producer integration acceptance
- temporary test-data cleanup
- `git diff --check`

Sprint 014 therefore establishes the shared notification infrastructure required before widespread automated escalation, SLA intelligence, and later Attention Centre capabilities.

**Status:** COMPLETE