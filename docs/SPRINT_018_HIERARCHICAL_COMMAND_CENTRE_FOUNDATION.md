# Sprint 018 — Hierarchical Command Centre Foundation

Specification: LOCKED

Implementation status: ACCEPTANCE PASSED — 2026-09-02

## 1. Purpose

Sprint 018 establishes the first role-aware and hierarchy-aware Command Centre
backend for ORNEXIS ONE.

The Command Centre answers:

- What requires attention?
- Why does it matter?
- What is the current operational impact?
- What changed?
- What action should happen next?

The Command Centre is an intelligence and presentation layer.

It must reuse authoritative platform records rather than duplicating
operational data.

## 2. Dependency Foundation

Sprint 018 builds upon:

- Sprint 005 Permission Engine
- Sprint 006 Organization Structure
- Sprint 007 Organization User Structure Assignment
- Sprint 009 Dashboard Foundation
- Sprint 011 Work Management and Accountability
- Sprint 012 Request Centre
- Sprint 013 Workflow and Approval Engine
- Sprint 014 Notification Infrastructure
- Sprint 015 SLA, Deadlines and Escalation
- Sprint 016 Attention Centre
- Sprint 017 Hierarchical Organization Health

These capabilities provide the trusted operational evidence consumed by the
Command Centre.

## 3. Architectural Boundary

The mandatory separation is:

Operational Records
→ Deterministic Platform Engines
→ Authorized Summaries
→ Command Centre Composition
→ API Presentation

The Command Centre must not:

- become a second operational database
- copy Work Items, Requests, SLAs or Attention Items
- grant access to underlying restricted records
- calculate unrelated health scores
- bypass module permissions
- invent operational facts
- expose foreign-tenant information

## 4. Initial Supported Scopes

Sprint 018 supports:

- Organization
- Branch
- Department

Organization scope is available only to authorized system administrators.

Branch scope is available to:

- authorized system administrators
- authorized active members assigned to that branch

Department scope is available to:

- authorized system administrators
- authorized active members assigned to that department

Region, team and personal work scopes are deferred.

## 5. Scope Selection

The Command Centre must support:

- an automatically resolved default scope
- an explicitly requested authorized scope

Default scope resolution:

1. system Administrator → Organization
2. department-assigned member → Department
3. branch-assigned member → Branch
4. member without supported structural assignment → access denied

A user must not choose a broader scope than their authorized responsibility.

## 6. Permission Foundation

Sprint 018 introduces:

- command.view

The permission allows access to authorized Command Centre summaries.

Existing Administrator system roles receive command.view through an
idempotent migration.

The permission does not itself grant organization-wide scope.

Organizational scope must still be independently enforced.

## 7. Initial Command Centre Sources

Sprint 018 combines authorized summaries from:

- latest Organization Health snapshot
- previous comparable Organization Health snapshot
- active Attention Centre items
- overdue and due-soon Work Items
- active and unassigned Requests
- active and breached SLA instances
- pending Workflow approval steps where supported

Unsupported modules must not be represented by invented zero values.

## 8. Response Contract

A Command Centre response contains:

- generatedAt
- organizationId
- scopeType
- scopeId
- scopeName
- audience type
- current health
- health movement
- attention summary
- work summary
- request summary
- SLA summary
- approval summary
- priority items
- recommended actions
- capability availability
- explanation metadata

The response is calculated on demand in Sprint 018.

No Command Centre snapshot table is introduced.

## 9. Current Health

When an authorized Health snapshot exists, the response includes:

- snapshot ID
- score
- status
- confidence
- evaluated time
- period
- rules version
- summary
- indicator contributions
- recommended actions

When no Health snapshot exists, the response must explicitly state that
health evidence is unavailable.

It must not assume a healthy score.

## 10. Health Movement

Where two comparable snapshots exist for the same scope, the response includes:

- previous score
- current score
- score change
- direction: IMPROVING, STABLE or DECLINING
- previous status
- current status
- previous evaluation time
- current evaluation time

Movement is comparable only when scope type and scope ID match.

If no previous snapshot exists, movement is unavailable.

## 11. Attention Summary

The initial Attention summary includes authorized counts for:

- total active
- open
- acknowledged
- critical
- high
- medium
- low
- overdue

The response may include a bounded list of the highest-priority authorized
Attention items.

Priority ordering is deterministic:

1. severity
2. overdue state
3. due date
4. detected time
5. ID

Dismissed and resolved items are excluded from active summaries.

## 12. Work Summary

The initial Work summary includes authorized counts for:

- active
- overdue
- due today
- due within seven days
- blocked
- unassigned
- high priority
- critical priority

Terminal Work Items are excluded from active counts.

A bounded list of urgent authorized Work Items may be returned.

The summary must not grant Work Item drill-down permission.

## 13. Request Summary

The initial Request summary includes authorized counts for:

- active
- unassigned
- overdue
- due today
- due within seven days
- in review
- in fulfilment
- high priority
- critical priority

Draft, rejected, completed and cancelled Requests are excluded from active
counts where appropriate.

A bounded list of urgent authorized Requests may be returned.

## 14. SLA Summary

The initial SLA summary includes authorized counts for:

- active
- warning
- breached
- escalated
- satisfied during the reporting period
- cancelled during the reporting period

SLA scope is derived from the scope of its Work Item or Request source.

A bounded list of breached authorized SLA instances may be returned.

## 15. Approval Summary

Where current Workflow data supports deterministic scope and responsibility,
the initial approval summary may include:

- pending approval steps
- overdue approval steps
- approval steps assigned to the current member

Sprint 018 must not invent approval scope or responsibility that is not
represented by existing authoritative records.

If reliable approval aggregation is unavailable, the capability must be
reported as unavailable.

## 16. Priority Items

The Command Centre may return a bounded list of priority items derived from
authorized Attention Items, Work Items, Requests and SLA instances.

Each priority item includes:

- source capability
- source type
- source ID where disclosure is authorized
- title
- summary
- severity
- due date where available
- responsible context where available
- recommended action
- reason for prioritization
- drillDownAvailable

Priority items are summaries, not copied operational records.

Initial deterministic priority ordering considers:

1. critical severity
2. breached SLA state
3. overdue state
4. high severity
5. blocked state
6. due date
7. source timestamp
8. source ID

The API returns no more than the configured bounded limit.

## 17. Recommended Actions

Recommended actions are derived from:

- Health contribution recommendations
- Attention Item recommended actions
- overdue Work Item conditions
- unassigned Request conditions
- breached SLA conditions

Recommendations must identify their deterministic source.

Sprint 018 does not generate AI recommendations.

Duplicate recommendation text should be consolidated while retaining source
references where authorized.

## 18. Capability Availability

The response explicitly reports whether each capability is:

- AVAILABLE
- NO_DATA
- UNAVAILABLE
- FORBIDDEN

Initial capabilities:

- health
- attention
- work
- requests
- SLA
- approvals

NO_DATA means the capability is supported and authorized but has no relevant
records.

UNAVAILABLE means the platform cannot yet calculate the capability reliably.

FORBIDDEN means the user lacks the required module permission for its detailed
summary.

The Command Centre must not silently represent unavailable data as zero.

## 19. Layered Authorization

Command Centre access requires command.view.

Detailed source summaries also respect source-module permissions:

- health.view
- attention.view
- work-items.view
- requests.view
- sla.view
- workflows.view where applicable

A user lacking a source-module permission may still receive a permitted
high-level Command Centre capability status, but must not receive restricted
record details.

Drill-down availability must be calculated independently for each source.

The Command Centre must never grant source access.

## 20. Conservative Scope Authorization

System Administrator:

- may request Organization scope
- may request any Branch in the organization
- may request any Department in the organization

Branch-assigned member:

- may request only their assigned Branch

Department-assigned member:

- may request only their assigned Department

Foreign-tenant scopes must be rejected without disclosing foreign data.

Membership must be active.

Scope relationships must be verified against the organization.

## 21. API Foundation

Initial endpoints:

- GET /command-centre/overview
- GET /command-centre/scopes/:scopeType/:scopeId
- GET /command-centre/capabilities

GET /command-centre/overview resolves the authenticated member's default scope.

For explicit scope requests:

- ORGANIZATION uses the current organization ID as scopeId
- BRANCH uses an authorized Branch ID
- DEPARTMENT uses an authorized Department ID

Supported query parameters:

- asOf
- periodStart
- periodEnd
- priorityLimit

Defaults:

- asOf: current time
- periodEnd: asOf
- periodStart: 30 days before periodEnd
- priorityLimit: 10

Maximum priorityLimit: 50.

## 22. Response Freshness

Sprint 018 calculates the Command Centre response on demand.

The response includes:

- generatedAt
- asOf
- periodStart
- periodEnd

No distributed cache is introduced.

Future caching must include organization, scope, permission and intelligence
version in its cache key.

## 23. Explainability

Every aggregate section should explain:

- what was counted
- which scope was applied
- which reporting period was applied
- which records were excluded
- why the capability is unavailable or forbidden
- how priority ordering was determined

The Command Centre must distinguish:

- observed facts
- calculated summaries
- stored Health intelligence
- deterministic recommendations

## 24. Existing Dashboard Compatibility

Sprint 018 preserves:

- GET /dashboard/overview
- dashboard.view
- the existing dashboard response contract

The Command Centre does not silently change Sprint 009 behavior.

Future work may progressively replace or redirect older dashboard experiences,
but that is outside Sprint 018.

## 25. Audit

Routine Command Centre reads must not create audit noise.

Rejected cross-tenant access remains protected by normal authorization and
application logging.

No Command Centre configuration mutation exists in Sprint 018.

## 26. Tenant Isolation

Required protections:

- every source query includes organizationId
- Branch scope belongs to the current organization
- Department scope belongs to the current organization
- SLA source IDs are resolved only inside the current organization
- foreign Health snapshots are inaccessible
- foreign Attention Items are inaccessible
- foreign Work Items are inaccessible
- foreign Requests are inaccessible
- foreign SLA instances are inaccessible
- foreign scope requests return no foreign information

## 27. Determinism and Idempotency

The same source state, scope, period and asOf value must produce the same
summary values and priority ordering.

Because Sprint 018 does not persist Command Centre snapshots, repeated reads
must not create database records.

The API must be free from read-side mutation except deterministic creation of
pre-existing required defaults where explicitly documented.

## 28. Performance Boundaries

The implementation must:

- use bounded source queries
- avoid loading entire operational tables
- use count queries for summaries
- use existing indexed tenant and scope fields
- avoid per-record database loops where practical
- return bounded priority lists
- avoid uncontrolled timers
- avoid background work inside the HTTP request

## 29. Out of Scope

Sprint 018 does not implement:

- frontend Command Centre pages
- Daily Brief generation
- scheduled brief delivery
- email or SMS summaries
- configurable Command Centre layouts
- widgets or drag-and-drop dashboards
- Regional scope
- Team scope
- Personal scope
- KPI framework
- AI-generated insights
- predictive intelligence
- financial intelligence
- workforce intelligence
- security intelligence
- asset intelligence
- risk-management intelligence
- Command Centre snapshot persistence
- PDF or Excel export
- distributed caching
- Redis, BullMQ or Kafka
- automatic source-record authorization

## 30. Implementation Order

1. lock and validate the specification
2. inspect source permission codes and Workflow approval scope
3. add command.view permission migration
4. implement scope resolution and authorization
5. implement capability-permission resolution
6. implement Health summary adapter
7. implement Attention summary adapter
8. implement Work summary adapter
9. implement Request summary adapter
10. implement SLA summary adapter
11. implement conservative Approval summary adapter or mark unavailable
12. implement deterministic priority composition
13. implement recommendation composition
14. implement Command Centre service
15. implement validators, controller and routes
16. register routes before error handling
17. implement runtime acceptance harness
18. verify RBAC, scope isolation, tenant isolation and determinism
19. reconcile documentation
20. commit and push

## 31. Acceptance Requirements

Sprint 018 is complete only when evidence demonstrates:

- command.view exists and is enforced
- unauthenticated access is rejected
- organization context is required
- foreign membership is rejected
- default Administrator scope resolves to Organization
- default Branch member scope resolves to Branch
- default Department member scope resolves to Department
- unsupported unassigned member scope is rejected
- explicit Organization scope is Administrator-only
- Branch members cannot request another Branch
- Department members cannot request another Department
- foreign-tenant scope requests expose no information
- latest authorized Health snapshot is represented
- comparable Health movement is calculated correctly
- missing Health evidence is explicit
- active Attention counts are correct
- terminal Attention Items are excluded
- active Work counts are correct
- overdue and due-soon Work counts are correct
- terminal Work Items are excluded
- active Request counts are correct
- unassigned Request counts are correct
- terminal Requests are excluded
- scoped SLA counts are correct
- deterministic priority ordering passes
- priority results are bounded
- recommendations identify deterministic sources
- missing module permission hides restricted details
- drillDownAvailable reflects source permissions
- repeated reads create no Command Centre records
- existing dashboard endpoint remains compatible
- temporary acceptance fixtures are cleaned
- Prisma validation passes
- Prisma Client generation passes
- TypeScript passes
- migration status is current
- git diff check passes

## 32. Definition of Done

Sprint 018 is complete when ORNEXIS provides a secure, deterministic,
permission-aware and tenant-isolated Command Centre backend that composes
authorized operational intelligence for Organization, Branch and Department
responsibilities without duplicating operational records or bypassing
source-module authorization.

Implementation evidence, not this specification alone, determines completion.

---

## 33. Implementation Evidence

Sprint 018 runtime acceptance passed on 2026-09-02.

Verified capabilities:

- protected hierarchical Command Centre API
- command.view RBAC enforcement
- default Administrator Organization scope
- default Branch-member Branch scope
- default Department-member Department scope
- explicit scope authorization
- unassigned-member scope rejection
- foreign-tenant scope isolation
- latest authorized Health snapshot composition
- comparable Health movement calculation
- explicit missing Health evidence
- active Attention summary composition
- terminal Attention exclusion
- active Work summary composition
- overdue and due-soon Work calculation
- terminal Work exclusion
- active Request summary composition
- unassigned Request calculation
- terminal Request exclusion
- source-scoped SLA aggregation
- conservative unavailable Approval capability
- deterministic cross-capability priority ordering
- bounded priority results
- deterministic sourced recommendations
- source-module permission filtering
- permission-aware drill-down availability
- no restricted-detail leakage
- read-only Command Centre composition
- deterministic repeated reads
- preservation of the existing dashboard endpoint
- temporary acceptance fixtures cleaned successfully

Acceptance command:

`npm run command:acceptance`

Acceptance result:

`SPRINT 018 RUNTIME ACCEPTANCE: PASS`
