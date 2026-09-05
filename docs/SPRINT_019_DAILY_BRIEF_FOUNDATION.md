# Sprint 019 — Daily Brief Foundation

Specification: LOCKED

Implementation status: ACCEPTANCE PASSED — 2026-09-05

## 1. Purpose

Sprint 019 establishes the first deterministic, explainable, role-aware and
permission-aware Daily Brief backend for ORNEXIS ONE.

The Daily Brief answers:

- What do I need to know today?
- What requires action?
- What changed?
- Why does it matter?
- What should happen next?

The Daily Brief summarizes authorized platform intelligence. It does not
replace authoritative operational records or introduce independent business
logic.

## 2. Architectural Position

The mandatory processing chain is:

1. authoritative operational records
2. deterministic module services
3. Attention Centre and Organization Health
4. Hierarchical Command Centre
5. Daily Brief composition
6. permission-aware presentation

The Daily Brief must reuse the Sprint 018 Command Centre service.

It must not independently recalculate Work, Request, SLA, Attention or Health
business rules.

## 3. Initial Delivery Model

Sprint 019 uses live composition.

A Daily Brief is calculated when an authorized user requests it.

Sprint 019 does not introduce Daily Brief database tables.

This prevents duplicated operational state while the brief format and delivery
requirements are still developing.

Future sprints may persist generated or delivered brief editions when scheduled
delivery, acknowledgement, retention or compliance requirements exist.

## 4. Supported Scopes

Initial supported scopes:

- Organization
- Branch
- Department

Default scope follows Sprint 018 rules:

- system Administrator: Organization
- Department member: assigned Department
- Branch member: assigned Branch
- unsupported unassigned member: rejected

Explicit scope requests use the same authorization rules as the Command Centre.

Sprint 019 does not introduce Region, Team or personal Employee scope.

## 5. Tenant Isolation

Every brief is resolved within one authenticated organization context.

Required protections:

- foreign membership is rejected
- foreign Organization scope is not found
- foreign Branch scope is not found
- foreign Department scope is not found
- one tenant's operational summaries never contribute to another tenant
- response messages must not disclose foreign scope existence

## 6. Permission Model

Sprint 019 introduces:

- brief.view

`brief.view` permits access to the Daily Brief shell.

Underlying capability content remains controlled by existing permissions:

- health.view
- attention.view
- work_items.view
- requests.view
- sla.view
- workflow.view

Possession of `brief.view` must not grant access to an underlying module.

Existing Administrator system roles receive `brief.view` through an idempotent
migration.

## 7. Source-Authorization Rule

The Daily Brief inherits capability visibility from the Command Centre.

For each capability:

- AVAILABLE content may be summarized
- NO_DATA must be represented honestly where relevant
- UNAVAILABLE must be described without invented information
- FORBIDDEN must expose no restricted counts, titles, identifiers or reasons
  derived from protected source records

A Daily Brief may show that a capability is unavailable or restricted, but it
must not leak the protected content.

## 8. Read-Only Requirement

Daily Brief generation is read-only.

Repeated reads must not create or modify:

- Work Items
- Requests
- SLA records
- Attention Items
- Health snapshots
- Workflow records
- notifications
- audit logs
- Daily Brief records

No evaluator may run implicitly during a Daily Brief read.

## 9. Reporting Time

Every brief has an explicit reporting time named `asOf`.

If omitted, the service uses the current time.

For deterministic testing and controlled integrations, callers may provide an
authorized reporting time through the API query.

The brief also uses a reporting period start, defaulting to 30 days before
`asOf`.

The reporting period must not begin after `asOf`.

## 10. Daily Brief Response

The initial response includes:

- generatedAt
- reportingPeriod
- scope
- audience
- headline
- overview
- changes
- focusToday
- capability summaries
- recommendations
- provenance
- limits

Every brief must be understandable without implying access to restricted source
records.

## 11. Audience Profiles

Initial audience profiles:

- EXECUTIVE
- BRANCH
- DEPARTMENT

The audience is derived from the authorized resolved scope.

The profile controls wording and emphasis, not authorization.

Authorization is always determined before presentation.

## 12. Headline

The headline is deterministic.

It summarizes the most important authorized condition using this precedence:

1. breached or critical condition
2. overdue condition
3. blocked condition
4. declining Health
5. high-severity condition
6. active operational workload
7. no urgent authorized action

The headline must not include restricted source details.

## 13. Overview

The overview provides a short deterministic description of the authorized
scope's current operational position.

It may summarize:

- current Health status and score
- number of active Attention Items
- active and overdue Work
- active and unassigned Requests
- SLA breaches
- available priority items
- restricted or unavailable capabilities

The overview must distinguish absence of evidence from healthy performance.

## 14. Changes

The changes section initially uses comparable Organization Health evidence.

It may report:

- improving Health
- stable Health
- declining Health
- unavailable comparison
- missing Health evidence
- restricted Health visibility

Sprint 019 does not invent historical changes for modules that do not yet
provide comparable snapshots.

## 15. Focus Today

`focusToday` is a bounded ordered list derived from authorized Command Centre
priority items.

Each focus item includes:

- source capability
- source type
- source ID where disclosure is authorized
- title
- summary
- severity
- reason
- due date where available
- recommended action
- drillDownAvailable

Focus ordering must preserve the deterministic Sprint 018 priority ordering.

## 16. Capability Summaries

The Daily Brief may summarize these Sprint 018 capabilities:

- Health
- Attention
- Work
- Requests
- SLA
- Approvals

Each capability summary includes:

- capability name
- availability status
- deterministic summary text
- selected authorized metrics
- source permission state
- explanation where applicable

Restricted capabilities must not expose protected metrics.

## 17. Health Summary

When Health is available, the brief may include:

- current score
- current status
- confidence
- movement direction
- score change
- evaluation time
- major authorized contributing indicators

When no Health snapshot exists, the brief states that Health evidence is not
available.

When Health is forbidden, no score, status, contribution or movement detail is
included.

## 18. Attention Summary

When Attention is available, the brief may include:

- active Attention count
- critical count
- high count
- overdue count
- selected authorized priority items

Resolved and dismissed Attention Items are excluded from active summaries.

## 19. Work Summary

When Work is available, the brief may include:

- active Work count
- Work due today
- overdue Work
- blocked Work
- unassigned Work
- high- and critical-priority Work
- selected authorized focus items

Draft, completed and cancelled Work Items are excluded from active Daily Brief
counts.

## 20. Request Summary

When Requests are available, the brief may include:

- active Request count
- unassigned Requests
- overdue Requests
- Requests due within seven days
- high- and critical-priority Requests
- selected authorized focus items

Draft, rejected, completed and cancelled Requests are excluded from active
Daily Brief counts.

## 21. SLA Summary

When SLA is available, the brief may include:

- active SLA instances
- warning instances
- breached instances
- escalated instances
- satisfied instances during the reporting period
- cancelled instances during the reporting period
- selected authorized SLA focus items

SLA scope must remain derived from its authoritative Work Item or Request
source.

## 22. Approval Summary

Sprint 019 inherits the conservative Sprint 018 Approval capability.

If reliable scoped pending approval instances remain unavailable, the brief
must report the capability as unavailable.

It must not invent:

- pending approval counts
- approval responsibility
- approval deadlines
- Branch or Department approval scope

## 23. Recommendations

The recommendations section reuses authorized deterministic Command Centre
recommendations.

Recommendations must:

- identify their contributing capability and source
- remain bounded
- avoid duplicates
- preserve deterministic output
- omit forbidden source details
- distinguish recommendation text from authoritative facts

Sprint 019 does not introduce AI-generated recommendations.

## 24. Provenance

Every Daily Brief response includes provenance sufficient to explain its
composition.

Initial provenance includes:

- composition version
- reporting time
- reporting period
- resolved scope type
- resolved scope ID
- audience
- source capability statuses
- Command Centre generation time

Provenance must not contain restricted source-record details.

## 25. Determinism

For identical:

- tenant
- authenticated membership
- permissions
- scope
- reporting time
- reporting period
- operational data

the Daily Brief must return identical:

- headline
- overview
- changes
- focus ordering
- capability summaries
- recommendations
- provenance source statuses

Volatile server timing must not affect deterministic content.

## 26. API Foundation

Sprint 019 introduces:

- GET /daily-brief

Supported query parameters:

- scopeType
- scopeId
- asOf
- periodStart
- focusLimit
- recommendationLimit

`scopeType` and `scopeId` must be supplied together for explicit scope access.

Limits must be integers from 1 to 25.

The endpoint requires:

- authentication
- organization context
- active organization membership
- brief.view permission

## 27. Validation

Validation must reject:

- unsupported scope types
- malformed UUIDs
- invalid dates
- reporting periods beginning after `asOf`
- limits outside the supported range
- repeated query values where one value is expected
- incomplete explicit scope input

Validation failures return a safe client error without exposing internal
implementation details.

## 28. Error Semantics

Expected responses:

- 200: authorized Daily Brief returned
- 400: invalid query or unsupported request
- 401: authentication required
- 403: membership, permission or scope access denied
- 404: foreign or nonexistent explicit scope

Foreign-scope responses must not confirm that the foreign record exists.

## 29. Audit and Side Effects

Routine Daily Brief reads are not audited because they would create excessive
read noise.

Sprint 019 does not implement:

- brief acknowledgement
- delivery tracking
- read receipts
- scheduled generation
- notification delivery

Those future actions may require audit records.

## 30. Performance and Bounds

Daily Brief composition must remain bounded.

Initial maximums:

- focus items: 25
- recommendations: 25

The service must reuse bounded Command Centre adapters and must not load
unbounded operational records solely for presentation.

No uncontrolled timer or background loop may run inside the HTTP API.

## 31. Security Rules

The Daily Brief must never:

- bypass tenant isolation
- elevate source-module permissions
- reveal foreign scope existence
- infer restricted record titles or identifiers
- treat management role names as universal authorization
- expose confidential data through summary wording
- execute source evaluators during a read
- represent missing evidence as healthy performance

## 32. Out of Scope

Sprint 019 does not implement:

- persisted Daily Brief editions
- email, SMS, push or notification delivery
- scheduled morning generation
- acknowledgements or read receipts
- personal Employee briefs
- Region or Team scope
- KPI summaries
- Service Desk incident summaries
- obligation expiry summaries
- CRM follow-up summaries
- HR or workforce summaries
- finance summaries
- asset summaries
- security-platform summaries
- risk summaries
- AI-generated narrative
- natural-language generation
- frontend Daily Brief screens
- distributed queues or workers

These capabilities may be added after their authoritative source modules and
authorization models exist.

## 33. Implementation Order

1. lock and validate the Sprint 019 specification
2. create the brief.view permission migration
3. define Daily Brief response types
4. implement deterministic headline composition
5. implement overview composition
6. implement Health change presentation
7. implement capability-summary presentation
8. implement focus-today composition
9. implement recommendation presentation
10. implement provenance
11. implement Daily Brief service over the Command Centre
12. implement validators
13. implement controller and protected route
14. register the route before error handling
15. preserve existing Command Centre and dashboard endpoints
16. implement runtime acceptance
17. verify permission filtering, hierarchy and determinism
18. reconcile implementation evidence
19. commit and push

## 34. Acceptance Requirements

Sprint 019 is complete only when evidence demonstrates:

- brief.view exists and is enforced
- unauthenticated access is rejected
- organization context is required
- foreign membership is rejected
- Administrator default scope resolves to Organization
- Branch-member default scope resolves to Branch
- Department-member default scope resolves to Department
- unassigned-member default scope is rejected
- explicit Organization scope is Administrator-only
- Branch members cannot request another Branch
- Department members cannot request another Department
- foreign-tenant scope requests reveal no information
- Health status and movement are summarized correctly
- missing Health evidence is explicit
- forbidden Health details are hidden
- active Attention is summarized correctly
- terminal Attention Items are excluded
- active Work, due-today, overdue and blocked counts are correct
- terminal Work Items are excluded
- active and unassigned Request counts are correct
- terminal Requests are excluded
- scoped SLA concerns are summarized correctly
- unavailable Approval information is not invented
- headline precedence is deterministic
- focus ordering matches Command Centre ordering
- focus items are bounded
- recommendations retain source provenance
- restricted capabilities leak no details
- repeated identical reads are deterministic
- Daily Brief reads create no records
- existing Command Centre endpoint remains compatible
- existing dashboard endpoint remains compatible
- temporary acceptance fixtures are cleaned
- Prisma validation passes
- Prisma Client generation passes
- TypeScript passes
- migration status is current
- git diff check passes

## 35. Definition of Done

Sprint 019 is complete when ORNEXIS ONE can provide a secure, deterministic,
explainable, role-aware and tenant-isolated Daily Brief for supported
Organization, Branch and Department scopes by presenting authorized Command
Centre intelligence without duplicating business logic, persisting unnecessary
state or bypassing source-module permissions.

Implementation evidence, not this specification alone, determines completion.

---

## 36. Implementation Evidence

Sprint 019 runtime acceptance passed on 2026-09-05.

Verified capabilities:

- protected Daily Brief API
- brief.view RBAC enforcement
- live read-only brief composition
- reuse of authoritative Command Centre intelligence
- Administrator Organization scope
- Branch-member Branch scope
- Department-member Department scope
- unassigned-member scope rejection
- explicit scope authorization
- cross-tenant scope isolation
- deterministic critical headline precedence
- audience-aware overview composition
- Health status and movement presentation
- explicit missing Health evidence
- active Attention presentation
- terminal Attention exclusion
- active, due-today, overdue and blocked Work presentation
- terminal Work exclusion
- active and unassigned Request presentation
- terminal Request exclusion
- scoped SLA presentation
- conservative unavailable Approval presentation
- bounded focus-today composition
- exact preservation of Command Centre priority ordering
- sourced deterministic recommendations
- permission-aware drill-down availability
- restricted capability data minimization
- deterministic composition provenance
- repeated-read determinism
- rejection of invalid and repeated query parameters
- no operational, snapshot, notification or audit side effects
- preservation of the existing Command Centre endpoint
- preservation of the existing dashboard endpoint
- temporary acceptance fixtures cleaned successfully

Acceptance command:

`npm run brief:acceptance`

Acceptance result:

`SPRINT 019 RUNTIME ACCEPTANCE: PASS`
