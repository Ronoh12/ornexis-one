# Sprint 016 — Attention Centre Foundation

Specification: LOCKED

Implementation status: ACCEPTANCE PASSED — 2026-09-01

## 1. Purpose

Sprint 016 establishes the reusable, tenant-aware Attention Centre foundation.

The Attention Centre surfaces operational conditions that require human action
without forcing users to inspect every ORNEXIS module separately.

It is not a second notification inbox. Notifications communicate events; an
attention item represents an actionable condition that remains open until the
condition is resolved, dismissed, or otherwise closed.

## 2. Initial Inputs

Sprint 016 initially supports deterministic signals from capabilities already
implemented:

- overdue Work Items
- SLA warnings
- SLA breaches
- SLA escalations
- unassigned active Requests
- pending approval bottlenecks where an actionable approver can be resolved

Each source adapter must be explicit. Arbitrary source types are forbidden.

## 3. Core Persistent Model

Sprint 016 introduces AttentionItem as a durable operational projection.

Minimum fields:

- id
- organizationId
- signalType
- sourceType
- sourceId
- title
- summary
- severity
- status
- responsibleOrganizationUserId where available
- branchId where available
- departmentId where available
- recommendedAction where available
- dueAt where applicable
- detectedAt
- acknowledgedAt
- resolvedAt
- dismissedAt
- fingerprint
- metadata where useful
- createdAt
- updatedAt

Every item must contain organizationId. Cross-tenant relations are forbidden.

## 4. Signal Types

Initial signal types:

- WORK_ITEM_OVERDUE
- SLA_WARNING
- SLA_BREACHED
- SLA_ESCALATED
- REQUEST_UNASSIGNED
- APPROVAL_PENDING

Only signals backed by completed source adapters may be enabled.

## 5. Source Types

Initial source types:

- WORK_ITEM
- SLA_INSTANCE
- REQUEST
- APPROVAL_STEP

The service must verify that every referenced source belongs to the same
organization as the attention item.

## 6. Severity

Initial severity levels:

- LOW
- MEDIUM
- HIGH
- CRITICAL

Severity is assigned deterministically by the source adapter. AI-based severity
or prioritization is out of scope.

Suggested initial mapping:

- overdue Work Item: map from Work Item priority
- SLA warning: HIGH
- SLA breach: CRITICAL
- SLA escalation: CRITICAL
- unassigned active Request: MEDIUM, or HIGH when overdue
- pending approval: MEDIUM, or HIGH when overdue

## 7. Lifecycle

Initial statuses:

- OPEN
- ACKNOWLEDGED
- RESOLVED
- DISMISSED

Allowed manual transitions:

- OPEN to ACKNOWLEDGED
- OPEN to DISMISSED
- ACKNOWLEDGED to DISMISSED

Evaluator-driven resolution:

- OPEN to RESOLVED
- ACKNOWLEDGED to RESOLVED

Dismissal is an explicit human decision and must be audited. A dismissed item
must not silently reopen unless a new deterministic fingerprint represents a
new occurrence.

## 8. Fingerprint and Idempotency

Every attention item must have a deterministic tenant-scoped fingerprint.

Conceptual identity:

organization + signal type + source type + source ID + occurrence identity

Database uniqueness must protect against duplicate active representations of
the same condition. Repeated evaluation must not create duplicate items.

## 9. Reconciliation

The Attention Centre evaluator reconciles source conditions into durable items.

For each supported signal it must:

1. identify eligible source conditions
2. create a missing attention item
3. leave an existing matching item unchanged where appropriate
4. update safe derived context where required
5. resolve the item when the source condition is no longer active

The evaluator must be safe to run repeatedly and in bounded batches.

## 10. Work Item Adapter

An overdue Work Item is eligible when:

- dueAt is not null
- current time is at or after dueAt
- status is not COMPLETED
- status is not CANCELLED

Responsibility should prefer the active assignee and otherwise use the owner
where available. Branch and department should be copied as scoped references.

The attention item resolves when the Work Item is completed, cancelled, or is
no longer overdue because its due date changed.

## 11. SLA Adapter

SLA attention signals are derived from durable SlaEvent records rather than
recalculating SLA timing rules inside the Attention Centre.

- WARNING creates or maintains SLA_WARNING
- BREACHED creates or maintains SLA_BREACHED
- ESCALATED creates or maintains SLA_ESCALATED

The SLA instance and its source must belong to the same organization. An SLA
attention item resolves when its SLA instance becomes SATISFIED or CANCELLED.

Notifications remain separate and are not treated as authoritative SLA state.

## 12. Request Adapter

An unassigned Request is eligible when:

- assignedToOrganizationUserId is null
- status represents active submitted or processing work
- status is not DRAFT
- status is not COMPLETED
- status is not CANCELLED
- status is not REJECTED

The item resolves when a valid assignee is added or the Request becomes
terminal.

## 13. Approval Adapter

APPROVAL_PENDING may be enabled only where the current approval model provides
an unambiguous actionable pending approval and responsible approver.

If current workflow data cannot prove these conditions safely, the adapter must
remain deferred rather than invent responsibility or deadlines.

## 14. Permissions

Sprint 016 introduces:

- attention.view
- attention.manage
- attention.evaluate

attention.view permits authorized listing and reading.

attention.manage permits acknowledgement and dismissal where source visibility
also exists.

attention.evaluate permits explicit protected evaluation.

Existing Administrator system roles receive these permissions through an
idempotent migration.

## 15. Visibility and Responsibility

Tenant membership alone must not expose every attention item.

The foundation must enforce permission checks and prepare for structural scope.
Where a mature generalized branch/department visibility policy is not yet
available, the initial implementation must use conservative rules:

- responsible users may see items assigned to their active membership
- authorized administrators may see organization-wide items
- foreign-tenant users see nothing

The implementation must not claim mature hierarchy-aware access before that
policy infrastructure exists.

## 16. Tenant Isolation

Required cases:

- Organization A cannot read Organization B attention items
- Organization A cannot create an item for Organization B source data
- responsibility cannot point to a foreign OrganizationUser
- branch and department references cannot cross tenants
- evaluation cannot cross-associate source records
- cross-tenant reads should normally appear as not found

## 17. Audit

Audit explicit human lifecycle actions:

- ATTENTION_ITEM_ACKNOWLEDGED
- ATTENTION_ITEM_DISMISSED

Routine evaluator reads must not create audit noise. Automated creation and
resolution remain explainable through the attention record and its timestamps.

## 18. Notifications

Sprint 016 must not duplicate the Notification system.

The initial evaluator does not need to generate a second notification for an
event that already produced one, especially SLA warning, breach and escalation.
Future rules may notify users when a distinct attention-specific action is
required.

## 19. Evaluation Architecture

The evaluator is a reusable service with an explicit CLI entry point:

```bash
npm run attention:evaluate
```

No uncontrolled setInterval may run inside the API process. Future cron,
container schedules, Kubernetes CronJobs, queues, or managed schedulers may use
the same service boundary.

## 20. Evaluator Result

The evaluator should return useful counts:

```json
{
  "organizations": 0,
  "scanned": 0,
  "created": 0,
  "updated": 0,
  "resolved": 0,
  "unchanged": 0,
  "failed": 0
}
```

## 21. API Foundation

Expected API family:

- GET /attention-items
- GET /attention-items/:id
- POST /attention-items/:id/acknowledge
- POST /attention-items/:id/dismiss
- POST /attention-items/evaluate

List filters may include status, severity, signalType, sourceType,
responsibleOrganizationUserId, branchId, departmentId and overdue state.

## 22. Transaction and Concurrency

Creation and reconciliation must tolerate concurrent evaluation. Database
uniqueness must defend idempotency. Where a create races, the service should
retrieve and reconcile the winning record rather than create a duplicate.

## 23. Out of Scope

Sprint 016 does not implement:

- Organization Health
- Command Centre
- Daily Brief
- AI prioritization or prediction
- full Service Desk
- security or SIEM ingestion
- asset compliance
- expiring licenses, documents, contracts, or obligations
- KPI scoring
- regional hierarchy infrastructure
- email or SMS delivery
- Redis, BullMQ, Kafka, or distributed job infrastructure
- arbitrary source types

## 24. Implementation Order

1. reconcile specification with current schema and services
2. add Prisma enums, model, relations, indexes and constraints
3. create the Attention Centre migration
4. create the permissions migration
5. generate Prisma Client
6. implement validators
7. implement source adapters and reconciliation service
8. implement lifecycle service
9. implement evaluator CLI
10. implement controllers and routes
11. register routes before notFound/error handling
12. create runtime acceptance harness
13. verify RBAC, tenant isolation and idempotency
14. reconcile documentation
15. commit and push

## 25. Acceptance Requirements

Sprint 016 is complete only when evidence demonstrates:

- attention permissions exist and are enforced
- tenant isolation passes
- foreign source and responsible-member relationships fail
- overdue Work Items create one attention item
- resolved or rescheduled Work Items resolve their attention item
- SLA warning, breach and escalation produce deterministic attention items
- satisfied or cancelled SLA instances resolve related attention items
- eligible unassigned Requests create one attention item
- assignment or terminal Request state resolves the item
- unsupported source types fail
- repeated evaluation is idempotent
- concurrent uniqueness is database-protected
- acknowledgement is authorized and audited
- dismissal is authorized and audited
- terminal items are not incorrectly reopened
- evaluator CLI works
- evaluator API permission is protected
- temporary acceptance fixtures are cleaned
- Prisma validation passes
- Prisma Client generation passes
- TypeScript passes
- migration status is current
- git diff --check passes

## 26. Definition of Done

Sprint 016 is complete when ORNEXIS provides a secure, deterministic,
permission-aware and tenant-isolated Attention Centre foundation that turns
supported operational conditions into durable, actionable and idempotent
attention items without becoming another notification inbox.

Implementation evidence, not this specification alone, determines completion.

---

## 27. Implementation Evidence

Sprint 016 runtime acceptance passed on 2026-09-01.

Verified capabilities:

- tenant-isolated Attention Item persistence
- deterministic fingerprint idempotency
- overdue Work Item detection and resolution
- SLA warning, breach and escalation consumption
- unassigned Request detection and resolution
- administrator organization-wide visibility
- responsible-user scoped visibility
- Attention Centre RBAC enforcement
- acknowledgement lifecycle processing
- dismissal lifecycle processing
- acknowledgement and dismissal auditing
- automatic resolution when source conditions clear
- dismissed items remain terminal
- resolved items are not incorrectly reopened
- protected evaluator API
- reusable evaluator CLI
- concurrent database-protected uniqueness
- temporary acceptance fixtures are cleaned successfully

Acceptance command:

`npm run attention:acceptance`

Acceptance result:

`SPRINT 016 RUNTIME ACCEPTANCE: PASS`
