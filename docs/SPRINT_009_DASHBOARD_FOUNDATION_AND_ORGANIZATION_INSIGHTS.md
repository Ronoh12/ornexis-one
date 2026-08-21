# SPRINT 009 — DASHBOARD FOUNDATION AND ORGANIZATION INSIGHTS

## Status

IN PROGRESS

---

## Objective

Establish the first secure, tenant-aware, permission-aware dashboard
foundation for ORNEXIS ONE.

The dashboard must transform existing platform data into useful organization
insights without duplicating domain logic or weakening tenant isolation.

Sprint 009 introduces the backend dashboard architecture that future ORNEXIS
ONE dashboards, widgets, KPIs, reports, executive views, role dashboards,
Organization Command Centre, Organization Health Score, Daily Brief, and
industry-specific dashboards can build upon.

---

## Existing Foundation

The platform currently provides:

- Multi-tenant Organizations
- Users
- Organization Users
- Roles
- Permissions
- Role-Permission assignments
- Branches
- Departments
- Contacts
- Contact lifecycle statuses
- Contact types
- Contact branch assignment
- Contact department assignment
- Organization-user branch assignment
- Organization-user department assignment
- Authentication
- Organization context middleware
- Permission middleware
- Audit logging
- Tenant isolation

Sprint 009 will consume these existing capabilities rather than duplicate them.

---

## Architectural Principles

Dashboard functionality must follow these principles:

1. Every dashboard query must be scoped by organizationId.

2. Organization context must come from authenticated middleware.

3. Clients must never be allowed to select an arbitrary organization through
   dashboard request payloads.

4. Dashboard access must require explicit permission.

5. Dashboard statistics must be derived from authoritative domain tables.

6. Dashboard services must remain read-only.

7. Dashboard aggregation must not modify domain records.

8. Future dashboard widgets must be able to evolve independently.

9. Domain-specific dashboard metrics must not be introduced before their
   underlying modules exist.

10. Dashboard responses must not expose data from another tenant.

---

## Scope

Sprint 009 includes:

- Dashboard permission
- Dashboard route
- Dashboard controller
- Dashboard service
- Organization overview endpoint
- Contact KPIs
- Organization-user KPIs
- Branch KPIs
- Department KPIs
- Contact type distribution
- Contact status distribution
- Contact branch distribution
- Organization structure statistics
- Permission enforcement
- Tenant isolation
- Dashboard response contract
- Security testing
- Documentation

---

## Out of Scope

Sprint 009 does not implement:

- Frontend dashboard UI
- Custom widget builder
- User-configurable dashboards
- Dashboard layout persistence
- Financial KPIs
- CRM KPIs
- HR KPIs
- Service Desk KPIs
- Procurement KPIs
- Document KPIs
- Notification KPIs
- Industry-pack KPIs
- Organization Health Score
- Daily Brief
- AI-generated insights
- Cross-organization analytics
- Historical analytics warehouse
- Scheduled reports
- PDF dashboard exports
- Excel dashboard exports

These belong to later platform milestones and modules.

---

# Dashboard Permission

Introduce:

dashboard.view

Purpose:

Allows an authorized organization user to view organization dashboard
statistics.

The permission must follow the existing ORNEXIS ONE permission model.

The default organization administrative role must receive dashboard.view.

Restricted roles must not automatically receive the permission.

---

# Dashboard API

Base route:

/dashboard

Initial endpoint:

GET /dashboard/overview

Middleware order:

authenticate

organizationContext

requirePermission("dashboard.view")

dashboard controller

---

# Dashboard Overview Contract

The endpoint should return a stable structure similar to:

{
  "success": true,
  "data": {
    "contacts": {},
    "organizationUsers": {},
    "structure": {},
    "contactsByType": [],
    "contactsByStatus": [],
    "contactsByBranch": []
  }
}

The exact internal values are defined below.

---

# Contact KPIs

The dashboard must provide:

- total contacts
- active contacts
- inactive contacts
- archived contacts
- assigned contacts
- unassigned contacts

Assigned means the Contact has either:

- branchId
- departmentId

Unassigned means both are null.

All counts must be organization-scoped.

---

# Contact Type Distribution

Provide counts grouped by ContactType.

Supported values currently include:

- MEMBER
- CUSTOMER
- EMPLOYEE
- SUPPLIER
- VOLUNTEER
- DONOR
- PARTNER
- OTHER

Only records belonging to the active organization may contribute.

The service may return zero-count categories or omit them.

The chosen response behavior must remain deterministic.

---

# Contact Status Distribution

Provide counts grouped by ContactStatus.

Current statuses:

- ACTIVE
- INACTIVE
- ARCHIVED

All counts must be organization-scoped.

---

# Organization User KPIs

Provide:

- total organization users
- invited organization users
- active organization users
- suspended organization users

Counts must use OrganizationUser records belonging to the active organization.

The implementation must use the actual OrganizationUserStatus values defined
in the Prisma schema.

No global User count may be used as a substitute.

---

# Organization Structure KPIs

Provide:

- total branches
- active branches
- inactive branches
- total departments
- active departments
- inactive departments

All values must be organization-scoped.

---

# Contact Branch Distribution

Provide Contact counts grouped by branch.

Each result should expose sufficient branch identity for a dashboard client,
for example:

{
  "branchId": "...",
  "name": "...",
  "code": "...",
  "contactCount": 10
}

Contacts with no branch must not be silently attributed to another branch.

Unassigned Contact totals are already represented in the Contact KPI section.

Foreign-tenant branches must never appear.

---

# Service Architecture

Create:

apps/api/src/services/dashboardService.ts

The service is responsible for dashboard aggregation.

It must:

- accept organizationId explicitly
- scope every database query by organizationId
- remain read-only
- return normalized dashboard data
- avoid exposing raw Prisma internals
- avoid trusting client-provided tenant identifiers

Where practical, independent aggregate queries may execute concurrently.

Correctness and tenant isolation take priority over optimization.

---

# Controller Architecture

Create:

apps/api/src/controllers/dashboardController.ts

The controller must:

- obtain organizationId from authenticated organization context
- reject missing organization context
- call the dashboard service
- return the standardized API response

The controller must not calculate business statistics itself.

---

# Route Architecture

Create:

apps/api/src/routes/dashboard.ts

Route:

GET /overview

Required middleware:

authenticate

organizationContext

requirePermission("dashboard.view")

---

# Application Registration

Register the dashboard router with the Express application.

Expected public API:

GET /dashboard/overview

The route must use the same registration conventions as existing ORNEXIS ONE
routes.

---

# Database Changes

No new dashboard tables are required for Sprint 009.

Dashboard data must be calculated from existing authoritative records.

A migration may still be required to introduce dashboard.view permission.

The Prisma schema should not be modified unless implementation reveals a
genuine structural requirement.

---

# Performance Principles

Dashboard endpoints may execute several aggregate queries.

The implementation should:

- prefer count and groupBy operations over loading unnecessary full records
- execute independent queries concurrently where appropriate
- rely on existing organization indexes
- avoid N+1 database queries
- keep the response compact

Premature caching is out of scope.

---

# Security Requirements

Sprint 009 must verify:

- authentication required
- organization context required
- dashboard.view permission required
- tenant isolation
- foreign tenant Contacts excluded
- foreign tenant OrganizationUsers excluded
- foreign tenant Branches excluded
- foreign tenant Departments excluded
- no organizationId accepted from request body as authority
- dashboard service is read-only

---

# Required Tests

At minimum verify:

1. Authorized user can access dashboard overview.

2. Missing authentication is rejected.

3. Missing organization context is rejected.

4. User without dashboard.view is rejected.

5. Contact totals are correct.

6. Contact status totals are correct.

7. Contact type distribution is correct.

8. Organization-user totals are correct.

9. Branch totals are correct.

10. Department totals are correct.

11. Contact branch distribution is correct.

12. Unassigned Contacts are counted correctly.

13. Foreign-tenant Contact is excluded.

14. Foreign-tenant OrganizationUser is excluded.

15. Foreign-tenant Branch is excluded.

16. Foreign-tenant Department is excluded.

17. Cross-tenant dashboard access is impossible.

18. Existing Contact operations still work.

19. Existing Organization Structure operations still work.

20. TypeScript compilation passes.

21. Prisma schema remains valid.

22. git diff --check passes.

---

# Expected Files

Sprint 009 is expected to introduce:

apps/api/src/routes/dashboard.ts

apps/api/src/controllers/dashboardController.ts

apps/api/src/services/dashboardService.ts

docs/SPRINT_009_DASHBOARD_FOUNDATION_AND_ORGANIZATION_INSIGHTS.md

A Prisma migration for dashboard.view permission may also be introduced.

Existing application registration files will be modified as required.

---

# Definition of Done

Sprint 009 is complete when:

☑ Sprint documentation created

☑ Dashboard architecture defined

☑ dashboard.view permission introduced

☑ Dashboard service implemented

☑ Dashboard controller implemented

☑ Dashboard route implemented

☑ GET /dashboard/overview implemented

☑ Contact KPIs implemented

☑ Contact type distribution implemented

☑ Contact status distribution implemented

☑ Organization-user KPIs implemented

☑ Organization structure KPIs implemented

☑ Contact branch distribution implemented

☑ Permission enforcement verified

☑ Tenant isolation verified

☑ Cross-tenant security tests passed

☑ Dashboard queries verified read-only

☑ Existing Contact operations regression-tested

☑ Existing Organization Structure operations regression-tested

☑ Prisma schema valid

☑ TypeScript compilation passes

☑ git diff --check passes

☑ Test data cleaned

☑ Documentation finalized

☑ Git staged review

☐ Git commit

☐ Git push

---

# Future Extensions

This dashboard foundation will later support:

- role-specific dashboards
- executive dashboards
- configurable widgets
- dashboard preferences
- CRM insights
- HR insights
- Service Desk insights
- finance insights
- procurement insights
- document insights
- workflow insights
- security insights
- reporting dashboards
- industry-pack dashboards
- Organization Command Centre
- Organization Health Score
- Daily Brief
- permission-aware ORNEXIS AI insights

These capabilities must build upon the tenant-safe aggregation architecture
introduced by this sprint.

---

## Status

IN PROGRESS
