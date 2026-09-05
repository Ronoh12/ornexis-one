# Sprint 020 — Configurable KPI Framework Foundation

Specification: LOCKED

Implementation status: ACCEPTANCE PASSED — 2026-09-05

## 1. Purpose

Sprint 020 establishes the first reusable, deterministic, explainable,
tenant-isolated and hierarchy-aware KPI framework for ORNEXIS ONE.

The framework provides consistent KPI definition, evaluation, historical
measurement and presentation without hard-coding each KPI into consuming
modules.

The initial framework answers:

- What is being measured?
- Which organizational scope owns the measurement?
- What period does the measurement cover?
- What is the current value?
- What target and thresholds apply?
- Is higher or lower performance desirable?
- What status results from the measurement?
- How was the result calculated?
- What evidence supports the result?
- How did it change from the previous comparable period?

## 2. Architectural Position

The KPI framework sits between authoritative operational records and
organizational intelligence.

The intended flow is:

1. authoritative operational records
2. deterministic KPI measurement
3. immutable KPI history
4. authorized KPI presentation
5. later consumption by Health, Attention, Command Centre, Daily Brief,
   dashboards and reporting

The KPI framework does not replace authoritative operational records.

A KPI measurement is a derived interpretation of source evidence for a
defined period and scope.

## 3. Relationship to Organization Health

KPI definitions and Health Indicator definitions are separate concepts.

A KPI:

- measures operational performance
- has a target, thresholds, unit and direction
- retains historical measurements
- may be manually supplied or deterministically calculated

A Health Indicator:

- contributes a weighted score to Organization Health
- uses operational evidence under Health-specific rules
- produces a normalized score and confidence value

Sprint 020 must not silently convert every KPI into a Health contribution.

Future sprints may explicitly map selected KPI definitions into Health
Indicators through a governed integration.

## 4. Initial Scope

Sprint 020 supports KPI definitions and measurements for:

- Organization
- Branch
- Department

The initial framework does not support:

- Region
- Team
- Role
- Individual employee
- Process
- Service
- Asset category
- Customer operation
- Financial operation

These scopes remain future extensions because authoritative universal scope
models are not yet available.

## 5. KPI Definition Sources

A KPI definition has one of these origins:

- PLATFORM
- INDUSTRY_PACK
- ORGANIZATION

Sprint 020 creates organization-owned definitions through the tenant API.

Platform and industry-pack origins are represented in the data model so they
can be introduced later without redesigning the framework.

Organization users must not impersonate platform or industry-pack ownership.

## 6. KPI Data Sources

A KPI uses one of these data-source types:

- MANUAL
- SYSTEM
- INTEGRATION
- DERIVED

Sprint 020 supports:

- MANUAL measurements submitted through an authorized API
- SYSTEM measurements calculated by registered deterministic platform
  adapters

INTEGRATION and DERIVED definitions may be represented but cannot be evaluated
until authoritative source adapters exist.

Unsupported evaluation must fail explicitly rather than inventing a value.

## 7. Initial System KPI Adapters

The initial deterministic system adapters are:

- WORK_ON_TIME_RATE
- REQUEST_ASSIGNMENT_RATE
- SLA_COMPLIANCE_RATE
- ATTENTION_RESOLUTION_RATE

Each adapter:

- reads authoritative tenant-scoped records
- applies the requested organizational scope
- applies an explicit reporting period
- produces a reproducible value
- records its sample size
- records calculation metadata
- provides an explanation
- never modifies its source records

Adapter identifiers are stable calculation-rule codes, not executable code
stored in the database.

## 8. KPI Direction

A KPI definition declares one direction:

- HIGHER_IS_BETTER
- LOWER_IS_BETTER
- TARGET_RANGE

The direction determines how the current value is compared with its target,
warning threshold and critical threshold.

Sprint 020 does not permit arbitrary executable formulas supplied by tenants.

## 9. KPI Status

Every successful measurement receives one status:

- HEALTHY
- WATCH
- AT_RISK
- CRITICAL

Status is calculated deterministically using the definition direction,
target and thresholds.

A missing or unsupported measurement is not assigned a fabricated status.

Absence of evidence is represented explicitly as no measurement or an
evaluation result with no persisted value.

## 10. Units

The initial unit types are:

- PERCENTAGE
- COUNT
- MINUTES
- HOURS
- DAYS
- CURRENCY
- NUMBER

A definition may include a display symbol or currency code in validated
configuration metadata.

Units describe presentation and validation. They do not authorize unrelated
data access.

## 11. Measurement Periods

The initial period types are:

- DAILY
- WEEKLY
- MONTHLY
- QUARTERLY
- YEARLY
- CUSTOM

Every evaluation requires an explicit `periodStart` and `periodEnd`.

The period must satisfy:

- start is before end
- end is not after the evaluation time
- both values use valid timestamps
- repeated evaluation of identical evidence and inputs is idempotent

The period type describes expected reporting behavior but does not silently
rewrite caller-supplied boundaries.

## 12. KPI Categories

Organizations may create categories used to group KPI definitions.

A category includes:

- tenant
- code
- name
- description
- display order
- active state
- creation and update timestamps

Category codes are unique within an organization.

A category belonging to one tenant cannot be attached to another tenant's
definition.

## 13. KPI Ownership

A definition may identify one responsible Organization User.

Ownership is optional in the initial foundation.

An owner:

- must belong to the same tenant
- does not automatically gain visibility
- does not bypass KPI permissions
- provides operational responsibility and accountability context

Cross-tenant ownership relationships must fail.

## 14. Definition Governance

A KPI definition includes:

- tenant
- category
- code
- name
- description
- module
- origin
- data-source type
- calculation-rule code
- scope type
- Branch or Department scope reference where applicable
- owner
- unit
- direction
- target
- warning threshold
- critical threshold
- weight
- period type
- effective start
- effective end
- active state
- configuration metadata
- creation and update timestamps

Definition creation and updates must be authorized and audited.

Codes are unique within each organization.

Historical measurements must retain copied calculation context so later
definition changes do not rewrite history.

## 15. Scope Integrity

Definition scope follows these rules:

- ORGANIZATION uses the Organization ID as its scope
- BRANCH requires a same-tenant Branch
- DEPARTMENT requires a same-tenant Department
- ORGANIZATION cannot carry Branch or Department references
- BRANCH cannot carry a Department reference
- DEPARTMENT may reference its authoritative parent Branch through the
  Department record
- foreign-tenant scope references fail
- inactive scope records cannot receive new definitions

Database constraints and service validation should enforce these invariants
where practical.

## 16. Persistence Model

Sprint 020 introduces:

- KpiCategory
- KpiDefinition
- KpiMeasurement

No separate mutable current-value record is required.

The latest measurement is resolved from immutable historical measurements
using deterministic ordering.

## 17. KPI Measurement

A persisted KPI measurement includes:

- tenant
- KPI definition
- scope type
- Branch or Department reference where applicable
- measured value
- target
- warning threshold
- critical threshold
- unit
- direction
- status
- sample size
- confidence
- period start
- period end
- evaluation time
- data-source type
- calculation-rule code
- rules version
- fingerprint
- explanation
- recommended action where applicable
- calculation metadata
- creator for manual measurements where applicable
- creation timestamp

A measurement copies the relevant definition values used during evaluation.

Later changes to a definition must not mutate or reinterpret previous
measurements.

## 18. Immutable History

KPI measurements are immutable after creation.

The initial API does not support:

- measurement update
- measurement deletion
- historical recalculation in place
- silent replacement of values

Corrections require a new measurement with distinct authorized inputs and
traceable metadata.

Acceptance fixtures may delete their own temporary measurements during
cleanup.

## 19. Measurement Idempotency

Every measurement has a deterministic fingerprint.

The fingerprint includes sufficient normalized information to distinguish:

- tenant
- definition
- scope
- reporting period
- data-source type
- calculation rule
- rules version
- measured value
- sample size
- relevant calculation metadata

The database enforces tenant-scoped fingerprint uniqueness.

Repeated identical evaluation returns the existing measurement.

Concurrent identical evaluation must produce one durable measurement rather
than duplicates.

## 20. Manual Measurements

Manual measurement submission requires:

- an active MANUAL KPI definition
- an authorized actor
- an explicit value
- an explicit reporting period
- optional sample size
- optional evidence metadata
- optional explanation
- optional recommended action

The service calculates status from the definition thresholds.

The actor cannot submit the final status directly.

The service must reject manual submission for SYSTEM, INTEGRATION or DERIVED
definitions.

Manual measurement creation is audited.

## 21. System Measurements

System evaluation requires:

- an active SYSTEM KPI definition
- a registered calculation-rule adapter
- an explicit reporting period
- an authorized evaluation actor or trusted evaluator process

The adapter returns:

- measured value when evidence exists
- sample size
- calculation metadata
- explanation
- optional recommended action

The KPI service calculates the status and fingerprint before persistence.

An adapter with no qualifying evidence must return an explicit no-evidence
result.

Missing evidence must not be converted to zero performance unless zero is an
authoritative measured value.

## 22. Initial Calculation Semantics

### WORK_ON_TIME_RATE

Measures the percentage of qualifying active or completed Work Items that are
not overdue for the requested scope and period.

Terminal cancelled and draft Work Items are excluded.

The adapter records qualifying, on-time and overdue counts.

### REQUEST_ASSIGNMENT_RATE

Measures the percentage of qualifying active Requests that have an assigned
Organization User.

Draft, rejected, completed and cancelled Requests are excluded.

The adapter records active, assigned and unassigned counts.

### SLA_COMPLIANCE_RATE

Measures the percentage of qualifying SLA instances that have not breached.

Cancelled SLA instances are excluded.

The adapter records qualifying, compliant and breached counts.

### ATTENTION_RESOLUTION_RATE

Measures the percentage of qualifying Attention Items resolved during the
reporting period.

Dismissed items are not treated as resolved performance.

The adapter records qualifying, resolved, active and dismissed counts.

Precise source inclusion rules must be deterministic and covered by runtime
acceptance.

## 23. Threshold Semantics

For HIGHER_IS_BETTER:

- value at or above target is HEALTHY
- value below target but at or above warning threshold is WATCH
- value below warning but at or above critical threshold is AT_RISK
- value below critical threshold is CRITICAL

Required ordering:

`target >= warningThreshold >= criticalThreshold`

For LOWER_IS_BETTER:

- value at or below target is HEALTHY
- value above target but at or below warning threshold is WATCH
- value above warning but at or below critical threshold is AT_RISK
- value above critical threshold is CRITICAL

Required ordering:

`target <= warningThreshold <= criticalThreshold`

TARGET_RANGE is reserved in the schema but unsupported for evaluation in the
initial implementation unless lower and upper bounds can be represented and
validated without ambiguity.

Unsupported direction must fail explicitly.

## 24. Confidence

Measurement confidence is an integer from 0 through 100.

For deterministic system measurements with evidence, confidence is derived
from the sample size using a documented stable rule.

For no evidence, confidence is zero and no measurement value is invented.

Manual measurement confidence defaults conservatively and may not claim
system-verification certainty.

Confidence describes evidence strength, not KPI performance.

## 25. Trend and Comparison

The KPI API may expose movement by comparing a measurement with the immediately
previous comparable measurement.

Measurements are comparable only when they share:

- tenant
- definition
- scope
- unit
- direction
- calculation-rule code
- rules version

Movement includes:

- previous value
- absolute change
- percentage change where mathematically valid
- direction of movement
- whether the movement improved, worsened or remained stable

No previous measurement is represented explicitly.

The service must not compare incompatible measurements.

## 26. Visibility and Scope Authorization

KPI access requires tenant membership and KPI permission.

Within a tenant:

- Administrators may access authorized Organization, Branch and Department
  KPI data
- Branch members may access only their assigned Branch
- Department members may access only their assigned Department
- a Department member cannot request another Department
- a Branch member cannot request another Branch
- Organization scope is Administrator-only in the initial foundation
- unassigned non-Administrator members have no default KPI scope

Definition ownership does not override structural scope authorization.

Foreign-tenant requests must reveal no protected information.

## 27. Permissions

Sprint 020 introduces:

- `kpi.view`
- `kpi.manage`
- `kpi.evaluate`

`kpi.view` permits authorized definition and measurement reads.

`kpi.manage` permits category and definition creation or update.

`kpi.evaluate` permits manual measurement submission and system evaluation.

The initial permission migration assigns all three permissions to system
Administrator roles.

Permissions do not replace structural scope authorization.

## 28. Auditing

The following operations are audited:

- category creation
- category update
- definition creation
- definition update
- manual measurement submission
- protected system evaluation request

Audit records identify:

- tenant
- actor where applicable
- action
- entity type
- entity ID
- relevant before and after metadata where appropriate
- timestamp

Read operations do not create audit records.

## 29. API Foundation

The initial authenticated tenant API is mounted under:

`/kpis`

Initial routes include:

- `GET /kpis/categories`
- `POST /kpis/categories`
- `PATCH /kpis/categories/:id`
- `GET /kpis/definitions`
- `POST /kpis/definitions`
- `GET /kpis/definitions/:id`
- `PATCH /kpis/definitions/:id`
- `GET /kpis/measurements`
- `GET /kpis/measurements/:id`
- `GET /kpis/definitions/:id/latest`
- `POST /kpis/definitions/:id/measurements`
- `POST /kpis/evaluate`

All routes require authentication and organization context.

Each route applies its corresponding KPI permission and structural scope
authorization.

## 30. Query and Input Validation

Validation covers:

- UUID syntax
- enum values
- timestamps
- period ordering
- numeric values
- decimal precision
- threshold ordering
- weights
- sample size
- confidence bounds
- scope-reference consistency
- active effective dates
- allowed calculation-rule codes
- bounded page size
- repeated single-value query parameters
- unknown mutable fields

Invalid input returns a controlled client error without exposing internal
details.

## 31. Read Behavior

Definition and measurement lists are:

- tenant-isolated
- scope-authorized
- deterministically ordered
- bounded
- filterable only through validated fields

Latest-measurement selection orders by:

1. period end descending
2. evaluation time descending
3. creation time descending
4. ID ascending as a stable final tie-breaker

Reads create no KPI, audit, notification, Health, Attention or operational
records.

## 32. Explainability

Every persisted measurement provides enough context to explain:

- what was measured
- which scope was measured
- which period was used
- which calculation rule ran
- what value resulted
- which thresholds applied
- why the status resulted
- how much evidence was available
- what action may improve performance

Calculation metadata must remain data-minimized.

It must not copy entire source records or reveal protected fields.

## 33. Data Classification

The initial foundation uses permission and organizational scope as its
enforced visibility boundaries.

A future data-classification layer may add finer restrictions.

Sprint 020 must not claim field-level or classification-level controls that
are not yet implemented.

## 34. Downstream Integration Boundary

Sprint 020 establishes a reusable KPI service but does not yet modify:

- Organization Health scoring
- Attention signal generation
- Command Centre composition
- Daily Brief composition
- existing dashboard responses

Those integrations require explicit later work and acceptance coverage.

Existing Health, Attention, Command Centre, Daily Brief and dashboard
endpoints must remain compatible.

## 35. Security Requirements

Sprint 020 must preserve:

- authenticated access
- required organization context
- active tenant membership
- tenant-isolated database queries
- same-tenant relational integrity
- KPI permission enforcement
- hierarchy-aware scope authorization
- controlled validation failures
- data-minimized explanations
- immutable measurement history
- audited mutation and evaluation operations

A supplied record ID must never be trusted without verifying its tenant and
authorized scope.

## 36. Determinism Requirements

Given identical:

- definition
- scope
- source evidence
- reporting period
- evaluation time
- calculation rules
- rules version

the evaluator must produce identical:

- measured value
- sample size
- confidence
- status
- explanation
- calculation metadata
- fingerprint

Stable ordering and normalized serialization are required wherever values
contribute to fingerprints or API results.

## 37. Concurrency Safety

Application-level lookup alone is insufficient for idempotency.

The database must protect measurement fingerprint uniqueness.

When concurrent identical evaluations race:

- one measurement may be created
- competing evaluations must resolve the durable existing measurement
- no duplicate history may remain
- the API must return a successful deterministic result

Unexpected database failures must not be misreported as idempotency success.

## 38. Initial Exclusions

Sprint 020 does not implement:

- arbitrary tenant-authored executable formulas
- uploaded scripts
- dynamic SQL calculation rules
- external integration ingestion
- derived KPI dependency graphs
- Region, Team, Role or Employee scopes
- target-range evaluation
- scheduled background evaluation
- queue processing
- notifications or alerts
- KPI-to-Health mappings
- KPI-generated Attention Items
- dashboard widgets
- Command Centre KPI presentation
- Daily Brief KPI presentation
- report generation
- data-classification policy enforcement
- bulk imports
- retroactive mutation of measurements
- deletion APIs
- artificial intelligence predictions

These remain future integrations or hardening work.

## 39. Deferred Hardening

Future sprints may add:

- additional organizational and operational scopes
- platform-defined KPI catalogs
- industry-pack KPI catalogs
- integration-sourced measurements
- derived KPI formulas
- safe expression evaluation
- target ranges
- scheduled evaluation
- background queues
- retry and dead-letter handling
- KPI alerts
- Attention Centre integration
- Organization Health integration
- Command Centre integration
- Daily Brief integration
- dashboard and reporting surfaces
- data classification
- field-level visibility
- approval workflows for definition changes
- measurement correction workflows
- KPI versioning
- currency normalization
- business calendars
- advanced trend analytics
- forecasting and anomaly detection

## 40. Implementation Order

1. reconcile the locked specification with the current Prisma schema
2. add KPI enums, models, tenant relations, indexes and constraints
3. create the KPI persistence migration
4. create `kpi.view`, `kpi.manage` and `kpi.evaluate`
5. apply migrations and generate Prisma Client
6. implement KPI validation
7. implement structural scope authorization
8. implement category governance
9. implement definition governance
10. implement deterministic threshold evaluation
11. implement immutable measurement persistence
12. implement manual measurement submission
13. implement registered system adapters
14. implement comparison and trend presentation
15. implement audited KPI operations
16. implement controllers and routes
17. register routes before not-found and error handling
18. implement evaluator CLI
19. implement runtime acceptance harness
20. verify tenant isolation, RBAC, scope isolation and idempotency
21. verify existing endpoint compatibility
22. reconcile implementation evidence
23. commit and push

## 41. Acceptance Requirements

Sprint 020 is complete only when evidence demonstrates:

- `kpi.view`, `kpi.manage` and `kpi.evaluate` exist
- unauthenticated KPI access is rejected
- organization context is required
- foreign organization membership is rejected
- KPI permissions are independently enforced
- Administrator default scope resolves to Organization
- Branch-member default scope resolves to Branch
- Department-member default scope resolves to Department
- unassigned-member default scope is rejected
- explicit Organization scope is Administrator-only
- Branch members cannot access another Branch
- Department members cannot access another Department
- foreign-tenant scope requests reveal no information
- tenant-isolated category creation succeeds
- duplicate category codes fail safely
- cross-tenant category use fails
- tenant-isolated definition creation succeeds
- duplicate definition codes fail safely
- cross-tenant owner relationships fail
- cross-tenant Branch and Department relationships fail
- scope-reference invariants are enforced
- inactive scope records reject new definitions
- threshold ordering is validated
- unsupported direction evaluation fails explicitly
- unsupported data-source evaluation fails explicitly
- manual measurements require MANUAL definitions
- callers cannot submit their own final status
- manual measurement status is calculated deterministically
- manual measurement creation is audited
- system evaluation requires SYSTEM definitions
- Work on-time calculation is deterministic
- Request assignment calculation is deterministic
- SLA compliance calculation is deterministic
- Attention resolution calculation is deterministic
- missing evidence does not become fabricated zero performance
- measurement confidence reflects evidence availability
- every measurement contains an explanation
- every measurement preserves copied definition context
- measurement history remains immutable
- changed evidence creates a new measurement
- repeated identical evaluation is idempotent
- concurrent identical evaluation is database-idempotent
- latest measurement selection is deterministic
- comparable movement is calculated correctly
- incompatible measurements are not compared
- bounded authorized measurement history is returned
- mutation and evaluation operations are audited
- read operations create no records
- restricted scopes expose no measurement details
- existing Health endpoint remains compatible
- existing Attention endpoint remains compatible
- existing Command Centre endpoint remains compatible
- existing Daily Brief endpoint remains compatible
- existing dashboard endpoint remains compatible
- evaluator CLI works
- temporary acceptance fixtures are cleaned
- Prisma validation passes
- Prisma Client generation passes
- TypeScript passes
- migration status is current
- git diff check passes

## 42. Definition of Done

Sprint 020 is complete when ORNEXIS ONE provides a secure, deterministic,
explainable, tenant-isolated and hierarchy-aware KPI framework that supports
governed definitions, manual and registered system measurements, immutable
history, status calculation and authorized trend presentation without
duplicating authoritative operational records or bypassing source-module
security.

Implementation evidence, not this specification alone, determines completion.

---

## 43. Implementation Evidence

Sprint 020 runtime acceptance passed on 2026-09-05.

Verified capabilities:

- protected KPI API
- `kpi.view`, `kpi.manage` and `kpi.evaluate` RBAC enforcement
- tenant-isolated KPI categories
- governed KPI definitions
- Organization, Branch and Department scope authorization
- cross-tenant relationship protection
- inactive-scope protection
- deterministic threshold validation
- representable future KPI definition types
- manual KPI measurement submission
- deterministic status calculation
- immutable measurement history
- copied historical calculation context
- deterministic latest-measurement selection
- comparable KPI movement
- registered system KPI evaluation
- Work on-time-rate evaluation
- Request assignment-rate evaluation
- SLA compliance-rate evaluation
- Attention resolution-rate evaluation
- explicit missing-evidence handling
- evidence-based confidence
- explainable measurement results
- deterministic fingerprints
- repeated-evaluation idempotency
- concurrent database idempotency
- source-module permission enforcement
- audited category, definition and evaluation operations
- bounded and deterministic history reads
- rejection of repeated single-value query parameters
- read-only measurement history
- reusable KPI evaluator service and CLI
- preservation of Health, Attention, Command Centre, Daily Brief and dashboard endpoints
- read operations create no records
- temporary acceptance fixtures cleaned successfully

Acceptance command:

`npm run kpi:acceptance`

Acceptance result:

`SPRINT 020 RUNTIME ACCEPTANCE: PASS`
