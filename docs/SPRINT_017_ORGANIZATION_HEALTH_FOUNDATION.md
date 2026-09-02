# Sprint 017 — Hierarchical Organization Health Foundation

Specification: LOCKED

Implementation status: ACCEPTANCE PASSED — 2026-09-02

## 1. Purpose

Sprint 017 establishes a deterministic, explainable, hierarchical and
permission-aware Organization Health foundation.

The system summarizes trusted operational conditions without replacing or
bypassing access controls on underlying records.

Initial supported scopes:

- Organization
- Branch
- Department

## 2. Architectural Separation

The mandatory processing chain is:

Operational Indicators
→ Health Contributions
→ Health Snapshot
→ Permission-Aware Explanation

Indicator evaluation, contribution calculation, aggregated health and
drill-down authorization must remain separate.

## 3. Initial Inputs

Sprint 017 initially evaluates data already available in ORNEXIS:

- overdue Work Items
- SLA compliance and active breaches
- active unassigned Requests
- open or acknowledged HIGH and CRITICAL Attention Centre items

Future indicators must be added explicitly.

## 4. Scope Types

Initial health scope types:

- ORGANIZATION
- BRANCH
- DEPARTMENT

Region, team and individual health scores are deferred until their structural
and authorization foundations exist.

Employees may later receive a personal work overview rather than an
organizational health score.

## 5. Health Status

Initial health statuses:

- HEALTHY
- WATCH
- AT_RISK
- CRITICAL

Initial deterministic thresholds:

- 85–100: HEALTHY
- 70–84: WATCH
- 50–69: AT_RISK
- 0–49: CRITICAL

Thresholds are foundation defaults, not permanent industry rules.

## 6. Score Rules

Scores range from 0 to 100.

The system begins from available indicator performance and calculates a
weighted result. Missing or unavailable indicators must not silently count as
healthy.

Each evaluated indicator must record:

- indicator code
- measured value
- available sample size
- score
- weight
- weighted contribution
- confidence
- explanation
- recommended action where applicable

A higher-level score must not be a simple unexplained average of child scores.

## 7. Initial Indicators

Initial deterministic indicator codes:

- WORK_EXECUTION
- SLA_RELIABILITY
- REQUEST_OWNERSHIP
- ATTENTION_PRESSURE

Suggested initial weights:

- WORK_EXECUTION: 30
- SLA_RELIABILITY: 30
- REQUEST_OWNERSHIP: 20
- ATTENTION_PRESSURE: 20

Weights apply only when the indicator has sufficient available data.

## 8. Work Execution

Work execution considers active Work Items and the proportion currently
overdue.

Severity and priority should influence the explanation and future weighting,
but the foundation must keep the formula deterministic.

No active Work Items means unavailable evidence, not automatic perfect health.

## 9. SLA Reliability

SLA reliability considers runtime SLA instances and whether targets are:

- active and within target
- satisfied on time
- satisfied late
- breached
- cancelled

Cancelled instances must not count as successful or failed performance.

## 10. Request Ownership

Request ownership considers active non-draft Requests and the proportion that
have an active assignee.

Completed, cancelled and rejected Requests are excluded.

## 11. Attention Pressure

Attention pressure considers unresolved Attention Centre items.

CRITICAL items have greater impact than HIGH items.

LOW and MEDIUM items may be reported but do not initially reduce the health
score unless future configuration enables them.

The implementation must document that some Attention Centre signals may
correlate with other indicators and must cap their contribution to avoid
uncontrolled double-penalization.

## 12. Health Indicator Definition

HealthIndicatorDefinition stores organization-owned scoring configuration.

Minimum fields:

- id
- organizationId
- code
- name
- description
- weight
- isActive
- configuration
- createdAt
- updatedAt

Definitions must be unique by organization and code.

Sprint 017 seeds deterministic defaults. Mature KPI and industry-pack
configuration is deferred.

## 13. Health Snapshot

HealthSnapshot stores one historical health result.

Minimum fields:

- id
- organizationId
- scopeType
- scopeId
- score
- status
- confidence
- evaluatedAt
- periodStart
- periodEnd
- fingerprint
- summary
- createdAt

Snapshots are immutable historical evaluations. A later evaluation creates a
new snapshot rather than rewriting historical health.

## 14. Health Contribution

HealthContribution explains how one indicator affected one snapshot.

Minimum fields:

- id
- organizationId
- healthSnapshotId
- indicatorDefinitionId
- indicatorCode
- measuredValue
- sampleSize
- indicatorScore
- weight
- weightedContribution
- confidence
- explanation
- recommendedAction
- metadata
- createdAt

Contribution records must remain tenant-safe.

## 15. Idempotency

A deterministic fingerprint must identify:

organization + scope type + scope ID + evaluation period + rules version

Repeated evaluation for the same scope, period and rules version must not
create duplicate snapshots.

## 16. Confidence

Confidence records how much usable operational evidence supported a result.

Initial confidence range:

- 0 to 100

A score with low confidence must be clearly identified. Missing evidence must
not be presented as strong organizational health.

## 17. Explainability

Every snapshot must explain:

- why it received its score
- which indicators contributed
- which indicators lacked evidence
- which conditions reduced health
- which recommended actions may improve health

The evaluator must not create unexplained numeric scores.

## 18. Privacy and Authorization

Health visibility must remain separate from source-record visibility.

A user may be authorized to see an aggregate health score while being denied
access to confidential contributing records.

The health API must never grant source access.

Initial conservative visibility:

- authorized system administrators: organization-wide
- authorized branch members: their branch scope
- authorized department members: their department scope
- foreign-tenant users: no access

Organization-wide visibility for non-administrators is deferred until mature
hierarchy/responsibility policy exists.

## 19. Permissions

Sprint 017 introduces:

- health.view
- health.manage
- health.evaluate

health.view permits authorized snapshot and explanation access.

health.manage permits indicator-definition configuration.

health.evaluate permits protected manual evaluation.

Existing Administrator system roles receive these permissions through an
idempotent migration.

## 20. Evaluation Architecture

The health evaluator is a reusable service with the CLI command
`npm run health:evaluate`.

No uncontrolled timer may run inside the HTTP API.

The evaluator must:

- evaluate supported organizational scopes
- use deterministic rules
- create immutable snapshots and contributions
- remain tenant-safe and idempotent
- support bounded processing
- report failures clearly

## 21. Evaluation Period

Each evaluation has an explicit period.

Initial default:

- periodEnd: evaluation time
- periodStart: 30 days before periodEnd

Current-state indicators use conditions active at evaluation time. Historical
performance indicators use the defined period.

Every snapshot stores the period used.

## 22. Scope Evaluation

Organization evaluation uses organization-scoped operational data.

Branch evaluation uses records belonging to that branch.

Department evaluation uses records belonging to that department.

The evaluator must not mix unrelated branch or department data.

## 23. Default Definitions

Each organization receives deterministic default indicator definitions.

Default creation must be idempotent.

Future organization onboarding should create these defaults automatically.
Sprint 017 provides an ensure-defaults service for existing organizations.

## 24. API Foundation

Expected API family:

- GET /health/definitions
- PATCH /health/definitions/:id
- GET /health/snapshots
- GET /health/snapshots/:id
- GET /health/scopes/:scopeType/:scopeId/latest
- POST /health/evaluate

Filters may include scope type, scope ID, status, period, page and limit.

## 25. Audit

Audit administrative configuration changes:

- HEALTH_INDICATOR_UPDATED

Explicit manual evaluation may be audited where useful.

Routine evaluator reads must not create audit noise. Contributions and
snapshots provide the calculation history.

## 26. Tenant Isolation

Required protections:

- definitions cannot cross organizations
- snapshots cannot cross organizations
- contributions cannot cross organizations
- branch and department scopes must belong to the same organization
- evaluation cannot aggregate foreign-tenant records
- users cannot read foreign-tenant health
- cross-tenant reads should normally appear as not found

## 27. Out of Scope

Sprint 017 does not implement:

- full Command Centre
- frontend health dashboards
- region or team hierarchy
- individual employee health scoring
- AI prediction or AI-generated scoring
- financial or workforce health
- security or SIEM health
- asset-compliance health
- industry-specific weighting
- mature KPI framework
- confidential source-record authorization
- distributed worker infrastructure

## 28. Implementation Order

1. lock and validate the specification
2. add Prisma definitions, snapshots and contributions
3. create the Organization Health migration
4. create the health permissions migration
5. generate Prisma Client
6. implement deterministic default definitions
7. implement indicator evaluators
8. implement weighted aggregation and confidence
9. persist snapshots and contributions
10. implement permission-aware reads
11. implement evaluator CLI
12. implement validators, controllers and routes
13. register routes before error handling
14. implement runtime acceptance
15. verify tenant isolation, scoring and idempotency
16. reconcile documentation
17. commit and push

## 29. Acceptance Requirements

Sprint 017 is complete only when evidence demonstrates:

- health permissions exist and are enforced
- default definitions are created idempotently
- organization, branch and department scopes work
- foreign scopes are rejected
- all four initial indicators are deterministic
- missing evidence reduces confidence
- weighted scoring is explainable
- every score remains between 0 and 100
- status matches deterministic thresholds
- every score has contribution records
- repeated evaluation does not duplicate snapshots
- different periods can create different snapshots
- snapshots remain immutable
- tenant isolation passes
- conservative scope visibility passes
- definition updates are authorized and audited
- evaluator CLI works
- evaluator API is protected
- acceptance fixtures are cleaned
- Prisma validation passes
- Prisma Client generation passes
- TypeScript passes
- migration status is current
- git diff check passes

## 30. Definition of Done

Sprint 017 is complete when ORNEXIS can calculate, store and explain
deterministic health for supported organization, branch and department scopes
using trusted operational data, weighted contributions, confidence and strict
permission boundaries.

Implementation evidence, not this specification alone, determines completion.

---

## 31. Implementation Evidence

Sprint 017 runtime acceptance passed on 2026-09-02.

Verified capabilities:

- tenant-isolated Health Indicator definitions
- organization, branch and department health scopes
- deterministic Work Execution scoring
- deterministic SLA Reliability scoring
- deterministic Request Ownership scoring
- deterministic Attention Pressure scoring
- weighted health aggregation
- HEALTHY, WATCH, AT_RISK and CRITICAL classification
- evidence-weighted confidence calculation
- explainable indicator contributions
- recommended operational actions
- immutable health snapshots
- deterministic fingerprint idempotency
- concurrent database-protected idempotency
- administrator organization-wide visibility
- branch-scoped visibility
- department-scoped visibility
- RBAC enforcement
- cross-tenant isolation
- audited indicator-definition updates
- protected manual evaluation API
- reusable evaluator CLI
- preservation of the original public system-health endpoint
- missing evidence lowers confidence rather than assuming health
- temporary acceptance fixtures are cleaned successfully

Acceptance command:

`npm run health:acceptance`

Acceptance result:

`SPRINT 017 RUNTIME ACCEPTANCE: PASS`
