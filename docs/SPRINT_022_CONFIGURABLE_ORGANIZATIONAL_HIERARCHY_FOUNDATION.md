# Sprint 022 — Configurable Organizational Hierarchy Foundation

Specification: LOCKED

Implementation status: ACCEPTANCE PASSED — 2026-09-11

## 1. Purpose

Sprint 022 establishes a reusable, configurable, tenant-isolated,
permission-aware and auditable organizational hierarchy foundation.

Organizations must not be permanently restricted to:

Organization
    |
Branch
    |
Department

The framework must support structures such as:

Organization
    |
Region
    |
Branch
    |
Department
    |
Team

or:

Organization
    |
Campus
    |
Faculty
    |
Department

or:

Organization
    |
County
    |
Sub-County
    |
Office

The existing Branch and Department implementation remains valid and must
continue operating without breaking existing APIs, authorization rules,
health evaluation, KPIs, workflows, documents, requests or work management.

## 2. Sprint Boundary

Sprint 022 provides:

- configurable organizational unit types
- configurable organizational units
- arbitrary-depth parent-child hierarchy
- cycle prevention
- deterministic hierarchy traversal
- multiple user-to-unit assignments
- manager and responsibility assignments
- one optional primary assignment per organization membership
- legacy Branch and Department compatibility links
- tenant-safe hierarchy APIs
- permission-aware hierarchy access
- hierarchy mutation auditing
- deletion and deactivation safeguards
- runtime acceptance coverage

Sprint 022 does not replace:

- `Branch`
- `Department`
- `OrganizationUser.branchId`
- `OrganizationUser.departmentId`
- `HealthScopeType`
- existing Branch or Department APIs
- existing module-specific structural foreign keys
- existing Branch/Department authorization behavior

Migration of operational modules to generic hierarchy scope is reserved for
later sprints.

## 3. Design Principles

The hierarchy foundation must be:

- tenant-isolated
- deterministic
- auditable
- extensible
- bounded
- cycle-free
- permission-aware
- backward-compatible
- safe under concurrent mutation
- independent of industry-specific terminology

Client-provided organization ownership must never be trusted.

## 4. Organizational Unit Types

Each organization may define unit types such as:

- Region
- Division
- Business Unit
- Branch
- Department
- Team
- Site
- Campus
- Faculty
- County
- Sub-County
- Office
- Cost Centre

A unit type contains:

- ID
- organization ID
- normalized code
- name
- optional description
- display order
- active state
- system-managed state
- creation time
- update time

Codes are unique within an organization and are normalized before
persistence.

Names are unique within an organization.

System-managed compatibility types cannot be deleted or converted into
ordinary custom types.

Initial system-managed types are:

- `BRANCH`
- `DEPARTMENT`

Organizations may create additional custom unit types.

## 5. Organizational Units

An organizational unit contains:

- ID
- organization ID
- unit type ID
- optional parent unit ID
- normalized code
- name
- optional description
- active state
- optional legacy Branch link
- optional legacy Department link
- creation time
- update time

Unit codes are unique within an organizational unit type inside an
organization. Different unit types may reuse a business code where legacy or
industry structures require it.

Unit names may repeat in different parts of the hierarchy, but sibling units
under the same parent and type must not have duplicate normalized names.

Every parent and child must belong to the same organization.

A unit cannot be its own parent.

A unit cannot become a descendant of itself.

A parent must be active when a new active child is created or moved beneath it.

## 6. Root Units

An organization may contain multiple root units.

A root unit has no parent unit.

Multiple roots allow organizations to represent independent structures while
remaining inside the same tenant.

The Organization itself is not duplicated as an organizational-unit record.

Organization remains the tenant boundary above all hierarchy roots.

## 7. Hierarchy Depth

The initial maximum hierarchy depth is 32 unit levels.

All traversal and mutation operations must enforce this bound.

Requests that would exceed the maximum depth fail explicitly.

The limit prevents unbounded recursive processing and malformed structures.

## 8. Cycle Prevention

Hierarchy mutations must prevent:

- self-parenting
- direct cycles
- indirect cycles
- movement beneath a descendant
- cross-tenant parent assignment

Cycle validation must occur inside the mutation transaction.

Concurrent conflicting hierarchy mutations must produce a deterministic safe
outcome and must not persist a cycle.

## 9. Deterministic Traversal

The hierarchy service must support:

- loading one authorized unit
- listing root units
- listing direct children
- loading ancestors
- loading descendants
- loading a bounded subtree
- resolving whether one unit contains another
- resolving units assigned to an organization user

Sibling ordering is:

1. unit type display order ascending
2. unit name ascending
3. unit code ascending
4. unit ID ascending

Ancestor ordering is root to immediate parent.

Descendant traversal is depth-first using deterministic sibling ordering.

Every response includes explicit depth where relevant.

## 10. User Assignments

An active OrganizationUser may be assigned to multiple organizational units.

An assignment contains:

- ID
- organization ID
- organizational unit ID
- organization user ID
- assignment role
- primary state
- active state
- optional responsibility label
- optional effective start
- optional effective end
- assigned-by organization user ID
- creation time
- update time

Supported initial assignment roles are:

- `MEMBER`
- `MANAGER`
- `OWNER`
- `RESPONSIBLE`

Assignment roles describe structural responsibility and do not grant RBAC
permissions by themselves.

Access still requires the relevant platform permission.

## 11. Primary Assignment

An OrganizationUser may have at most one active primary generic unit
assignment.

A primary assignment identifies the user's default generic structural scope.

It does not replace the legacy `branchId` or `departmentId` fields during
Sprint 022.

Administrators may exist without a primary unit assignment.

A primary assignment must also be active.

## 12. Assignment Validity

Assignments require:

- same-organization membership
- same-organization unit
- active organization membership
- active unit for a new active assignment
- valid effective date ordering
- unique active semantic assignment

An organization user cannot receive duplicate active assignments for the same
unit and assignment role.

Removing or suspending an OrganizationUser must prevent their assignments from
being treated as active.

Expired assignments are not treated as active.

## 13. Manager and Responsibility Semantics

A unit may have multiple managers or responsible users.

The initial framework does not assume one universal manager.

`MANAGER`, `OWNER` and `RESPONSIBLE` assignments support future:

- reporting
- escalation
- workflow routing
- approval routing
- dashboard scope
- health ownership
- accountability
- notification routing

Manager assignment alone does not bypass module authorization.

## 14. Legacy Branch Compatibility

Existing Branch records remain authoritative for existing Branch APIs and
module foreign keys.

Each Branch may have at most one linked generic organizational unit.

A linked Branch unit:

- belongs to the same organization
- uses the system-managed `BRANCH` unit type
- cannot simultaneously link to a Department
- cannot link to another organization's Branch

Initial compatibility synchronization preserves:

- Branch name
- Branch code
- Branch active state

Branch create, update and delete behavior must remain compatible.

Legacy compatibility creation must be idempotent.

## 15. Legacy Department Compatibility

Existing Department records remain authoritative for existing Department APIs
and module foreign keys.

Each Department may have at most one linked generic organizational unit.

A linked Department unit:

- belongs to the same organization
- uses the system-managed `DEPARTMENT` unit type
- cannot simultaneously link to a Branch
- cannot link to another organization's Department

Where a Department has a linked Branch, its generic Department unit is placed
beneath the linked Branch unit.

A Department without a Branch may be represented as a root unit.

Initial compatibility synchronization preserves:

- Department name
- Department code
- Department active state
- Department-to-Branch placement

Legacy compatibility creation must be idempotent.

## 16. Compatibility Reconciliation

The hierarchy foundation provides an idempotent reconciliation operation that:

- ensures system-managed Branch and Department unit types exist
- creates missing linked Branch units
- creates missing linked Department units
- corrects safe name, code and active-state drift
- corrects Department placement from the legacy Branch association
- does not create duplicate compatibility units
- reports created, updated, existing, skipped and failed counts

Reconciliation must be tenant-bounded.

No global unbounded reconciliation occurs through an ordinary HTTP request.

## 17. Source of Truth During Sprint 022

For compatibility-linked records:

- Branch remains authoritative for Branch data
- Department remains authoritative for Department data
- generic units provide hierarchy representation
- legacy structural fields remain authoritative for existing module access

Custom units are managed directly through the hierarchy APIs.

Direct hierarchy updates must not rename, move or deactivate compatibility
units in conflict with their legacy source.

Such changes must occur through the existing Branch or Department APIs.

## 18. Authorization

Initial permissions are:

- `hierarchy.view`
- `hierarchy.manage`
- `hierarchy.assign`
- `hierarchy.reconcile`

`hierarchy.view` permits viewing authorized hierarchy information.

`hierarchy.manage` permits creating and changing custom unit types and custom
units.

`hierarchy.assign` permits managing user-to-unit assignments.

`hierarchy.reconcile` permits running tenant-bounded compatibility
reconciliation.

Permissions are independent.

Possession of `hierarchy.view` alone does not grant access to every unit.

## 19. Initial Scope Rules

Administrators with the required permission may access the organization's
complete hierarchy.

Non-administrator users may view:

- their active assigned units
- ancestors required to provide structural context
- descendants of units they actively manage, own or are responsible for

Ordinary `MEMBER` assignment does not automatically grant access to all
descendants.

Responses must not expose unauthorized membership or responsibility details.

The initial hierarchy authorization layer does not replace legacy
Branch/Department authorization.

## 20. Tenant Isolation

Every hierarchy query and mutation is constrained by organization ID.

The implementation must reject:

- foreign unit types
- foreign units
- foreign parents
- foreign OrganizationUsers
- foreign legacy Branch links
- foreign legacy Department links
- foreign assignment actors

Cross-tenant records must be treated as unavailable without exposing protected
details.

Database relations should reinforce tenant ownership using composite keys
where practical.

## 21. Unit Type Lifecycle

A unit type cannot be deleted while units reference it.

A system-managed unit type cannot be deleted.

An inactive type cannot be used for a new active unit.

Deactivation preserves historical records.

Reactivation is explicit and audited.

## 22. Unit Lifecycle

A unit cannot be physically deleted while it has:

- child units
- active or historical assignments
- a legacy Branch link
- a legacy Department link
- future registered dependencies

Initial removal is allowed only for unused custom units.

Deactivation is preferred when historical structural meaning exists.

A parent cannot be deactivated while active children remain unless those
children are first moved or deactivated.

## 23. Assignment Lifecycle

Assignment creation, update, activation, deactivation and removal are explicit.

Historical assignments are preserved through inactive state where they carry
meaningful responsibility history.

Physical deletion is allowed only where the assignment has no protected
historical dependency.

The initial API uses deactivation for ordinary assignment removal.

## 24. APIs

Initial hierarchy routes are mounted under `/hierarchy`.

Required endpoints:

- `GET /hierarchy/unit-types`
- `POST /hierarchy/unit-types`
- `PATCH /hierarchy/unit-types/:id`
- `DELETE /hierarchy/unit-types/:id`
- `GET /hierarchy/units`
- `POST /hierarchy/units`
- `GET /hierarchy/units/:id`
- `PATCH /hierarchy/units/:id`
- `DELETE /hierarchy/units/:id`
- `GET /hierarchy/units/:id/ancestors`
- `GET /hierarchy/units/:id/descendants`
- `GET /hierarchy/units/:id/members`
- `POST /hierarchy/assignments`
- `PATCH /hierarchy/assignments/:id`
- `DELETE /hierarchy/assignments/:id`
- `GET /hierarchy/memberships/:organizationUserId`
- `POST /hierarchy/reconcile`

All routes require authentication, organization context and their applicable
permission.

## 25. List Boundaries

Unit, membership and assignment lists are bounded.

Default limit: 50.

Maximum limit: 200.

Hierarchy subtree traversal additionally enforces:

- maximum depth: 32
- deterministic ordering
- organization ownership
- authorization filtering

Pagination must use deterministic ordering.

## 26. Validation

Validation rejects:

- malformed UUIDs
- unknown fields
- empty names
- invalid codes
- invalid assignment roles
- invalid effective periods
- self-parenting
- cross-tenant references
- duplicate sibling identity
- duplicate active assignments
- multiple active primary assignments
- unsupported modification of compatibility units
- hierarchy depth overflow

Codes are normalized to uppercase machine-safe values.

Human names are trimmed before persistence.

## 27. Safe Responses

Unit responses may contain:

- ID
- unit type summary
- parent ID
- name
- code
- description
- active state
- compatibility source type
- compatibility source ID where authorized
- depth
- child count
- assignment count where authorized
- creation and update timestamps

Assignment responses may contain:

- assignment ID
- safe unit summary
- safe organization-user summary
- assignment role
- primary state
- active state
- responsibility label
- effective period
- timestamps

Responses must not expose unrestricted user records, authentication data,
permission internals or unrelated tenant information.

## 28. Auditability

Successful hierarchy mutations create audit records.

Required audit actions include:

- `HIERARCHY_UNIT_TYPE_CREATED`
- `HIERARCHY_UNIT_TYPE_UPDATED`
- `HIERARCHY_UNIT_TYPE_DELETED`
- `HIERARCHY_UNIT_CREATED`
- `HIERARCHY_UNIT_UPDATED`
- `HIERARCHY_UNIT_DELETED`
- `HIERARCHY_ASSIGNMENT_CREATED`
- `HIERARCHY_ASSIGNMENT_UPDATED`
- `HIERARCHY_ASSIGNMENT_DEACTIVATED`
- `HIERARCHY_COMPATIBILITY_RECONCILED`

Audit entries include safe old and new values where applicable.

Idempotent retries must not create duplicate mutation audits.

## 29. Concurrency and Idempotency

Database constraints and transactional checks must protect:

- unique unit-type codes
- unique unit codes
- unique Branch compatibility links
- unique Department compatibility links
- unique semantic assignments
- one active primary assignment per OrganizationUser
- parent-child integrity

Concurrent identical compatibility reconciliation must not create duplicates.

Concurrent conflicting parent changes must not persist a cycle.

Expected uniqueness conflicts are translated into stable service errors.

## 30. Error Semantics

The hierarchy layer uses stable error codes including:

- `HIERARCHY_MEMBERSHIP_REQUIRED`
- `HIERARCHY_FORBIDDEN`
- `HIERARCHY_UNIT_TYPE_NOT_FOUND`
- `HIERARCHY_UNIT_TYPE_DUPLICATE`
- `HIERARCHY_UNIT_TYPE_IN_USE`
- `HIERARCHY_UNIT_NOT_FOUND`
- `HIERARCHY_UNIT_DUPLICATE`
- `HIERARCHY_PARENT_INVALID`
- `HIERARCHY_CYCLE_DETECTED`
- `HIERARCHY_DEPTH_EXCEEDED`
- `HIERARCHY_COMPATIBILITY_PROTECTED`
- `HIERARCHY_UNIT_IN_USE`
- `HIERARCHY_ASSIGNMENT_NOT_FOUND`
- `HIERARCHY_ASSIGNMENT_DUPLICATE`
- `HIERARCHY_PRIMARY_ASSIGNMENT_CONFLICT`
- `HIERARCHY_EFFECTIVE_PERIOD_INVALID`

Controllers translate errors consistently without leaking foreign resource
existence.

## 31. Existing API Compatibility

The following foundations must remain compatible:

- authentication
- organization context
- organization-user management
- Branch management
- Department management
- Contacts
- Documents
- Work Items
- Request Centre
- Workflow
- SLA
- Attention Centre
- Organization Health
- Command Centre
- Daily Brief
- KPI framework
- entity relationships
- entity attachments
- dashboard

Existing URLs and existing request bodies remain valid.

## 32. Runtime Acceptance

Sprint 022 acceptance must verify:

- authentication and organization context enforcement
- independent hierarchy permissions
- tenant isolation
- custom unit-type lifecycle
- custom unit lifecycle
- multiple root units
- arbitrary-depth hierarchy
- deterministic traversal
- self-parent rejection
- direct and indirect cycle rejection
- maximum-depth enforcement
- concurrent mutation safety
- multiple user assignments
- assignment roles
- one active primary assignment
- effective-period validation
- manager descendant visibility
- ordinary-member visibility boundary
- compatibility type reconciliation
- Branch compatibility reconciliation
- Department compatibility reconciliation
- Department movement after legacy Branch reassignment
- idempotent reconciliation
- protected compatibility units
- deletion safeguards
- audit creation
- deterministic list ordering
- bounded lists
- legacy Branch and Department endpoint compatibility
- existing platform endpoint compatibility
- fixture cleanup

## 33. Completion Criteria

Sprint 022 is complete only when:

- the Prisma schema is valid
- migrations apply cleanly
- Prisma Client generation succeeds
- TypeScript compilation succeeds
- diff validation succeeds
- hierarchy permissions exist
- hierarchy APIs are registered
- compatibility reconciliation succeeds
- runtime acceptance passes
- existing API smoke tests remain green
- the implementation status is updated with acceptance evidence
- the work is committed and pushed

Implementation evidence, not this specification alone, determines completion.

---

## 34. Implementation Evidence

Sprint 022 runtime acceptance passed on 2026-09-11.

Verified capabilities:

- `hierarchy.view`, `hierarchy.manage`, `hierarchy.assign` and `hierarchy.reconcile` RBAC
- authenticated and organization-context-protected hierarchy access
- active organization-membership enforcement
- tenant-isolated hierarchy persistence and reconciliation
- configurable organizational unit-type lifecycle
- reserved `BRANCH` and `DEPARTMENT` compatibility types
- configurable organizational unit lifecycle
- multiple hierarchy roots
- arbitrary-depth parent-child hierarchy
- deterministic ancestor ordering
- deterministic depth-first descendant traversal
- normalized sibling-identity enforcement
- self-parent rejection
- direct and indirect cycle prevention
- maximum hierarchy-depth enforcement
- active-parent and active-child safeguards
- tenant-scoped advisory mutation locking
- safe concurrent parent mutation
- database-backed cycle prevention
- multiple organization-user unit assignments
- assignment roles and labels
- one active primary assignment
- effective-period validation
- duplicate active-assignment rejection
- assignment-history preservation through deactivation
- manager and responsible-assignment descendant visibility
- ordinary-member visibility boundaries
- unassigned-member visibility restrictions
- organization-user self-assignment visibility
- protected assignment-history access
- authorized descendant-member listing
- system-managed compatibility-unit protection
- legacy Branch reconciliation
- legacy Department reconciliation
- Department movement after legacy Branch reassignment
- stable compatibility-unit identities
- idempotent compatibility reconciliation
- hierarchy list bounds
- deterministic hierarchy list ordering
- hierarchy mutation auditing
- compatibility reconciliation auditing
- deletion and deactivation safeguards
- existing Branch endpoint compatibility
- existing Department endpoint compatibility
- existing Organization Health endpoint compatibility
- existing Command Centre endpoint compatibility
- existing Daily Brief endpoint compatibility
- existing KPI endpoint compatibility
- existing entity-relationship endpoint compatibility
- temporary acceptance fixture cleanup
- Prisma schema validation
- Prisma Client generation
- TypeScript compilation
- migration status validation
- staged diff validation

Acceptance command:

`npm run hierarchy:acceptance`

Acceptance result:

`SPRINT 022 RUNTIME ACCEPTANCE: PASS`
