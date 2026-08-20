# ORNEXIS ONE — Sprint 007 Organization User Structure Assignment

## Sprint

Sprint 007

## Title

Organization User Structure Assignment

## Status

COMPLETE

---

## Objective

Connect organization memberships to the organization structure introduced in Sprint 006.

Sprint 007 enables an OrganizationUser membership to be assigned to an optional Branch and Department while preserving tenant isolation, authorization, structural consistency, auditability and administrator continuity.

The resulting structure is:

Organization
→ Branch
→ Department
→ OrganizationUser Membership

Memberships may also remain organization-wide with no branch or department assignment.

---

## Scope

### Database

☑ Add optional `branchId` to OrganizationUser

☑ Add optional `departmentId` to OrganizationUser

☑ Add OrganizationUser → Branch relationship

☑ Add OrganizationUser → Department relationship

☑ Add Branch → OrganizationUser reverse relationship

☑ Add Department → OrganizationUser reverse relationship

☑ Use tenant-safe composite foreign keys

☑ Preserve nullable organization-wide membership support

☑ Add branch indexes

☑ Add department indexes

☑ Add organization/branch composite index

☑ Add organization/department composite index

☑ Create Sprint 007 migration

☑ Regenerate Prisma Client

---

## Migration

☑ `20260820181255_add_organization_user_structure_assignment`

☑ Migration applied successfully

☑ Database schema verified up to date

☑ 10 migrations confirmed

---

## Membership Structure Assignment

☑ Assign membership to branch

☑ Assign membership to department

☑ Assign membership to matching branch and department

☑ Allow branch assignment to be null

☑ Allow department assignment to be null

☑ Allow both structure assignments to be removed

☑ Preserve organization-wide memberships

☑ Return branch information in membership response

☑ Return department information in membership response

☑ Return department-linked branch information

---

## Structural Consistency

☑ Validate selected branch belongs to active organization

☑ Validate selected department belongs to active organization

☑ Reject department from another organization

☑ Reject branch from another organization

☑ Reject department that belongs to another selected branch

☑ Reject branch change when existing department would become inconsistent

☑ Preserve valid existing structure assignment during partial update

☑ Validate final target structure before update

---

## Tenant Isolation

☑ Prevent cross-tenant branch assignment

☑ Prevent cross-tenant department assignment

☑ Verify foreign branch physically existed during test

☑ Verify foreign department physically existed during test

☑ Verify foreign department belonged to foreign branch

☑ Confirm API rejected foreign branch assignment

☑ Confirm API rejected foreign department assignment

☑ Remove foreign test fixtures after verification

---

## Validation

☑ Add branchId validation to OrganizationUser update

☑ Add departmentId validation to OrganizationUser update

☑ Support nullable UUID values

☑ Reject malformed branch UUID

☑ Reject malformed department UUID

☑ Reject unexpected fields

☑ Prevent organizationId update through request body

☑ Preserve role validation

☑ Preserve status validation

☑ Reject empty organization-user update

---

## Authorization

☑ Preserve `organization_users.view`

☑ Preserve `organization_users.manage`

☑ Require authentication

☑ Require active organization context

☑ Restrict structure assignment to authorized callers

☑ Verify Standard Member cannot modify organization membership structure

☑ Restricted caller returns `Permission denied`

---

## Administrator Continuity

☑ Preserve last active Administrator protection

☑ Prevent last active Administrator from losing Administrator role

☑ Prevent last active Administrator from becoming inactive

☑ Prevent last active Administrator removal

☑ Preserve existing Administrator safety logic during structure assignment work

---

## Organization User Service

☑ Extend organization-user include with branch

☑ Extend organization-user include with department

☑ Include department branch

☑ Validate structure during membership creation

☑ Validate structure during membership update

☑ Preserve existing role checks

☑ Preserve membership tenant scoping

☑ Preserve invitation behavior

☑ Preserve soft removal behavior

---

## Organization User Controller

☑ Accept optional branchId

☑ Accept optional departmentId

☑ Accept null branch assignment

☑ Accept null department assignment

☑ Return useful structure validation errors

☑ Preserve invitation token behavior

☑ Preserve existing role errors

☑ Preserve duplicate membership protection

☑ Preserve organization context enforcement

---

## Audit Logging

☑ Audit structure assignment through `ORGANIZATION_USER_UPDATED`

☑ Record old branchId

☑ Record new branchId

☑ Record old departmentId

☑ Record new departmentId

☑ Audit structure removal

☑ Verify audit records manually

☑ Confirm `NULL → branch/department` assignment history

☑ Confirm `branch/department → NULL` unassignment history

---

## Manual Testing

☑ Valid branch + department assignment succeeds

☑ Membership response contains branch

☑ Membership response contains department

☑ Department response contains linked branch

☑ Branch/department mismatch rejected

☑ Branch-only change causing mismatch rejected

☑ Structure unassignment succeeds

☑ Read after unassignment returns null structure

☑ Malformed branch ID rejected

☑ Malformed department ID rejected

☑ organizationId request-field update rejected

☑ Restricted member assignment rejected

☑ Real foreign branch assignment rejected

☑ Real foreign department assignment rejected

☑ Audit structure assignment verified

☑ Audit structure removal verified

☑ Membership left ACTIVE after testing

☑ Membership left with null branch and department after testing

☑ Sprint 007 local test branches removed

☑ Sprint 007 local test departments removed

☑ Foreign tenant fixtures removed

---

## Final Technical Gate

☑ `npx prisma format`

☑ `npx prisma validate`

☑ `npx prisma migrate status`

☑ `npx prisma generate`

☑ `npx tsc --noEmit`

☑ `git diff --check`

☑ Database cleanup verification

☑ Tenant-isolation testing

☑ Validation testing

☑ Permission testing

☑ Audit verification

☑ Documentation finalized

☑ Git staged review

☑ Git commit

☑ Git push

---

## Sprint 007 Result

Sprint 007 makes the organization structure operational at the membership level.

Organization users can now be assigned to branches and departments while ORNEXIS ONE enforces tenant ownership and branch/department consistency.

This provides reusable organizational context for future functionality including:

- employee profiles
- HR
- service desk ownership
- asset assignment
- procurement
- inventory
- document access
- workflow routing
- approvals
- reporting
- dashboards
- organizational graph
- ORNEXIS AI context
- industry packs

---

## Status

COMPLETE
