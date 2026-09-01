# Sprint 015 — SLA, Deadlines & Escalation Foundation

Specification: LOCKED

Implementation status: ACCEPTANCE PASSED — 2026-09-01

## 1. Purpose

Sprint 015 establishes the reusable ORNEXIS ONE foundation for:

- SLA policies
- SLA timing targets
- runtime SLA instances
- deterministic deadline evaluation
- warning events
- breach events
- escalation events
- SLA lifecycle history
- notification integration
- future scheduled evaluation

The implementation must remain industry-neutral and reusable by future
Service Desk, Work Management, Request Centre, workflows, onboarding,
offboarding, obligations, compliance processes and industry packs.

Sprint 015 is a foundation.

It does not attempt to implement mature Service Desk SLA intelligence.

---

## 2. Architectural Position

The intended dependency chain is:

Workflow
→ Notifications
→ SLA / Deadlines / Escalation
→ Attention Centre
→ Organization Health
→ Command Centre

Notifications communicate events.

SLA evaluation determines timing state and produces durable timing,
warning, breach and escalation signals.

Attention Centre is a later consumer of those signals and is not part
of Sprint 015.

---

## 3. Existing Capabilities Reused

Sprint 015 must reuse rather than replace existing capabilities.

### Work Items

Work Items already provide:

- dueAt
- priority
- assignment
- status lifecycle
- completion state
- cancellation state
- due-date change activity
- audit integration
- notification integration

### Requests

Requests already provide:

- dueAt
- status lifecycle
- completedAt
- cancelledAt
- branch
- department
- contact context

### Notifications

Sprint 014 provides the shared createNotification service.

SLA and escalation code must call that shared service rather than create
parallel notification persistence.

A notification does not grant access to its source entity.

### Authorization

Existing authentication, organization context and requirePermission
middleware remain authoritative.

### Audit

Administrative SLA changes and explicit manual lifecycle actions must
use the existing audit service.

Routine evaluator reads must not create audit noise.

---

## 4. Core Persistent Model

Sprint 015 uses four primary persistent concepts:

1. SlaPolicy
2. SlaTarget
3. SlaInstance
4. SlaEvent

Separate EscalationRule and EscalationEvent models are deliberately
deferred until richer Service Desk escalation requirements exist.

---

## 5. SlaPolicy

SlaPolicy represents a reusable SLA definition owned by one organization.

Minimum conceptual fields:

- id
- organizationId
- name
- code
- description
- isActive
- createdAt
- updatedAt

Policy names/codes must be tenant-scoped.

Policies must never be shared across tenants.

---

## 6. SlaTarget

SlaTarget defines one timing objective belonging to an SlaPolicy.

Initial target types:

- RESPONSE
- RESOLUTION
- COMPLETION

A target contains sufficient configuration to calculate an absolute
target timestamp from an SLA instance start time.

Minimum conceptual fields:

- id
- organizationId
- slaPolicyId
- name
- targetType
- durationMinutes
- warningMinutesBefore
- escalationMinutesAfter
- notification configuration
- isActive
- createdAt
- updatedAt

Sprint 015 uses elapsed clock time.

Business-hour calendars, holidays and regional working schedules are
deferred.

---

## 7. SlaInstance

SlaInstance represents a runtime application of one SLA policy/target
to one supported business entity.

Initial supported source types:

- WORK_ITEM
- REQUEST

Minimum conceptual fields:

- id
- organizationId
- slaPolicyId
- slaTargetId
- sourceType
- sourceId
- startedAt
- targetAt
- satisfiedAt
- breachedAt
- cancelledAt
- status
- createdAt
- updatedAt

The runtime target timestamp must be persisted.

This preserves explainability and prevents historical SLA results from
changing merely because a policy is later edited.

---

## 8. Source Reference Safety

sourceType/sourceId is an application-level generic reference.

Sprint 015 must not accept arbitrary source types.

The service must explicitly support and resolve each source type.

Initially:

WORK_ITEM
REQUEST

Before an SLA instance is created, the referenced source must be proven
to belong to the same organization.

Cross-tenant source attachment must fail.

Future modules must be explicitly registered before becoming valid SLA
sources.

---

## 9. Deadline Versus SLA

Existing WorkItem.dueAt and Request.dueAt remain authoritative business
deadlines.

Sprint 015 must not replace, duplicate or silently rewrite those fields.

Operational overdue state and SLA breach state are different concepts.

An entity may:

- be overdue without an SLA
- breach an SLA before its ordinary due date
- satisfy an SLA while still retaining another business deadline

This distinction must remain explicit.

---

## 10. SLA Instance Status

Initial lifecycle:

ACTIVE
SATISFIED
BREACHED
CANCELLED

ACTIVE:
The SLA clock is running.

SATISFIED:
The relevant target was achieved before or after targetAt and the
instance has been closed as satisfied.

BREACHED:
The target timestamp passed before satisfaction.

CANCELLED:
The source/process no longer requires the SLA clock.

Terminal lifecycle handling must be deterministic.

---

## 11. SLA Events

SlaEvent is an immutable operational history/event record.

Initial event types:

STARTED
WARNING
BREACHED
ESCALATED
SATISFIED
CANCELLED

Events contain:

- organizationId
- slaInstanceId
- eventType
- occurredAt
- threshold/reference information where applicable
- metadata where useful
- deterministic idempotency key

Events must not be rewritten as current-state records.

---

## 12. Idempotency

Repeated evaluation of the same SLA instance must not create duplicate
warning, breach or escalation events.

Every evaluator-produced event must have a deterministic idempotency
identity.

Database uniqueness must protect idempotency where practical.

Example conceptual identity:

organization
+ SLA instance
+ event type
+ threshold identity

The evaluator must be safe to execute repeatedly.

---

## 13. Warning Semantics

A target may define warningMinutesBefore.

Example:

targetAt = 17:00
warningMinutesBefore = 60

Warning threshold = 16:00.

Once evaluation reaches or passes the threshold while the SLA remains
active, one WARNING event may be produced.

Repeated evaluation must not duplicate it.

---

## 14. Breach Semantics

An ACTIVE SLA instance becomes breached when:

current time >= targetAt

and the target has not already been satisfied or cancelled.

The transition must:

- persist breachedAt
- update lifecycle state
- create exactly one BREACHED event
- trigger configured notification behavior

The operation must be idempotent.

---

## 15. Escalation Semantics

A target may define escalationMinutesAfter.

Example:

targetAt = 17:00
escalationMinutesAfter = 30

Escalation threshold = 17:30.

If the SLA remains unresolved at that threshold, the evaluator may
produce one ESCALATED event and configured notification.

Sprint 015 supports a simple first escalation threshold.

Multi-level escalation chains, delegation trees and sophisticated
Service Desk escalation policies are deferred.

---

## 16. Satisfaction Semantics

Satisfaction must be explicit and deterministic.

For supported source types, terminal successful lifecycle may satisfy
the relevant SLA target.

Initial source interpretation:

WORK_ITEM:
COMPLETED may satisfy a COMPLETION or RESOLUTION-style target.

REQUEST:
COMPLETED may satisfy a COMPLETION or RESOLUTION-style target.

Cancellation must not be reported as successful SLA satisfaction.

Future RESPONSE semantics may be connected to domain-specific response
events when those modules provide authoritative response timestamps.

Sprint 015 must not invent response timestamps.

---

## 17. Cancellation Semantics

Source cancellation may cancel an ACTIVE SLA instance.

Cancellation must:

- persist cancelledAt
- set status CANCELLED
- produce one CANCELLED event

A cancelled SLA must not subsequently breach or escalate.

---

## 18. Notification Integration

Sprint 015 must reuse Sprint 014 createNotification.

Potential notification types include:

- SLA_WARNING
- SLA_BREACHED
- SLA_ESCALATED

Notification recipients must be active OrganizationUsers in the same
organization.

Notification source metadata never grants source authorization.

Sprint 015 must not implement a second messaging system.

---

## 19. Recipient Strategy

The foundation should initially support deterministic recipient
resolution from available source ownership/assignment.

For Work Items, the current active assignee may be notified where one
exists.

More advanced routing such as:

- manager hierarchy
- department heads
- branch managers
- role groups
- escalation teams
- on-call schedules

is deferred until the relevant organizational and Service Desk
requirements are implemented.

The data model must remain extensible for those strategies.

---

## 20. Evaluation Architecture

There is currently no ORNEXIS-owned background worker or scheduler.

Sprint 015 must not embed uncontrolled setInterval processing inside the
HTTP API process.

The SLA evaluator must therefore be implemented as a reusable service.

It must be callable from an explicit application entry point.

Target operational shape:

npm run sla:evaluate

This creates a clean seam for future:

- cron
- container scheduled jobs
- Kubernetes CronJobs
- queue workers
- managed cloud schedulers

without coupling SLA business logic to a particular scheduler.

---

## 21. Evaluator Requirements

The evaluator must:

- process only eligible active SLA instances
- evaluate deterministic timestamps
- remain tenant-safe
- be idempotent
- tolerate repeated execution
- avoid duplicate notifications
- avoid duplicate SLA events
- avoid processing terminal instances
- record failures clearly
- support bounded/batched processing
- return useful execution counts

Conceptual result:

{
  scanned,
  warned,
  breached,
  escalated,
  satisfied,
  cancelled,
  failed
}

---

## 22. Transaction Boundary

State transition, event persistence and notification generation should
avoid inconsistent partial outcomes.

Where practical, SLA state and SLA event persistence should share a
database transaction.

Sprint 014 notification creation currently uses the shared Prisma
service independently.

If fully atomic notification delivery would require redesigning the
shared notification service, Sprint 015 must document that limitation
rather than introduce a hidden parallel implementation.

A future transactional outbox may harden cross-module event delivery.

---

## 23. Permissions

Sprint 015 introduces:

- sla.view
- sla.manage
- sla.evaluate

sla.view:
Read SLA policies, targets, instances and events where permitted.

sla.manage:
Create/update/deactivate SLA policies and targets and perform allowed
administrative lifecycle actions.

sla.evaluate:
Invoke protected administrative/manual SLA evaluation capability where
such an API is exposed.

Existing Administrator system roles receive these permissions through
an idempotent migration.

---

## 24. Tenant Isolation

Every SLA persistent model must contain organizationId.

Tenant boundaries must be enforced at service and database level where
relational structure permits.

Required security cases include:

- policy from organization A cannot be read by organization B
- target from organization A cannot attach to policy in organization B
- SLA instance cannot reference a foreign tenant source
- SLA event cannot attach across tenants
- notifications cannot target foreign tenant OrganizationUsers
- evaluator cannot cross-associate tenants

Cross-tenant requests should normally appear as not found rather than
revealing foreign entity existence.

---

## 25. Audit Requirements

Audit administrative changes such as:

- SLA policy created
- SLA policy updated
- SLA target created
- SLA target updated
- SLA policy activation/deactivation
- explicit manual SLA cancellation where exposed

Routine evaluator scans must not create audit logs merely for reading.

Operational SLA lifecycle history belongs primarily in SlaEvent.

---

## 26. API Foundation

Expected administrative/read API family:

GET    /sla/policies
POST   /sla/policies
GET    /sla/policies/:id
PATCH  /sla/policies/:id

POST   /sla/policies/:id/targets
PATCH  /sla/targets/:id

GET    /sla/instances
GET    /sla/instances/:id
GET    /sla/instances/:id/events

An explicitly protected evaluation endpoint may be added if useful:

POST /sla/evaluate

The CLI/service evaluator remains the primary scheduler seam.

Exact endpoint details may be refined during implementation without
weakening the security or lifecycle requirements in this specification.

---

## 27. Out of Scope

Sprint 015 does not implement:

- Attention Centre
- Organization Health
- Command Centre
- full Service Desk
- business-hour calendars
- public-holiday calendars
- regional work schedules
- SLA pause calendars
- sophisticated multi-stage escalation chains
- on-call scheduling
- Redis
- BullMQ
- Kafka
- generalized distributed job infrastructure
- email/SMS delivery workers
- AI SLA prediction
- SLA analytics dashboards
- arbitrary source types

These remain future capabilities.

---

## 28. Implementation Order

Implementation should proceed in this order:

1. Prisma enums/models/relations/indexes
2. migration
3. SLA permissions migration
4. Prisma client generation
5. validators
6. SLA policy/target service
7. SLA instance service
8. deterministic evaluator
9. notification integration
10. controllers/routes
11. CLI evaluation entry point
12. application registration
13. runtime acceptance testing
14. tenant/RBAC/idempotency/security testing
15. documentation reconciliation
16. commit and push

---

## 29. Acceptance Requirements

Sprint 015 is complete only when evidence demonstrates:

- policies are tenant isolated
- targets are tenant isolated
- invalid cross-tenant policy/target relationships fail
- supported source ownership is verified
- cross-tenant source attachment fails
- SLA instance targetAt is deterministic
- warning occurs once
- breach occurs once
- escalation occurs once
- repeated evaluation is idempotent
- completed source can satisfy eligible SLA
- cancelled source cannot later breach
- terminal SLA instances are not reprocessed
- notifications use Sprint 014 infrastructure
- foreign notification recipients are rejected
- permission checks are enforced
- evaluator can run from the command line
- Prisma validation passes
- TypeScript passes
- migration status is current
- git diff --check passes

---

## 30. Deferred Hardening

Future sprints may add:

- business calendars
- pause/resume
- multiple SLA clocks per service process
- response-event integration
- dedicated escalation policies
- multi-tier escalation
- hierarchy-aware routing
- transactional outbox
- queue-backed evaluation
- retry/dead-letter handling
- distributed evaluator locking
- Service Desk-specific SLA policy assignment
- SLA reporting
- Attention Centre consumption
- Organization Health aggregation
- AI-assisted SLA risk prediction

---

## 31. Definition of Done

Sprint 015 is complete when the implemented system provides a secure,
tenant-aware, deterministic and idempotent SLA/deadline/escalation
foundation that can be reused by future ORNEXIS modules without
requiring mature Service Desk functionality or scheduler infrastructure.

Implementation evidence, not this specification alone, determines
completion status.
