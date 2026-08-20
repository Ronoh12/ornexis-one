# ORNEXIS ONE — Sprint 006 Organization Structure

## Sprint

Sprint 006

## Title

Organization Structure — Branches & Departments

## Status

COMPLETE

---

## Objective

Build the first formal organization-structure layer for ORNEXIS ONE.

Sprint 006 introduces tenant-scoped branches and departments so that future modules can organize people, contacts, assets, tickets, workflows, documents, inventory, reporting and operational ownership by real organizational structure.

The hierarchy introduced in this sprint is:

Organization
→ Branch
→ Department

Departments may also exist without a branch when they operate organization-wide.

---

## Scope

### Database

☑ Add Branch model

☑ Add Department model

☑ Add Organization → Branch relationship

☑ Add Organization → Department relationship

☑ Add Branch → Department relationship

☑ Preserve tenant ownership in all structural records

☑ Use composite tenant-safe Branch relation for Department

☑ Add branch name uniqueness within organization

☑ Add branch code uniqueness within organization

☑ Add department name uniqueness within organization

☑ Add department code uniqueness within organization

☑ Add useful organization/status indexes

☑ Create organization-structure migration

☑ Generate updated Prisma Client

---

## Permissions

☑ Add `branches.view`

☑ Add `branches.manage`

☑ Add `departments.view`

☑ Add `departments.manage`

☑ Grant organization-structure permissions to existing Administrator system roles

☑ Preserve global permission catalogue

☑ Protect routes using Permission Engine middleware

---

## Branch Management

☑ Create branch

☑ List tenant branches

☑ Get branch by ID

☑ Update branch

☑ Delete branch

☑ Support branch code

☑ Support branch description

☑ Support email and phone

☑ Support address

☑ Support city

☑ Support county/state

☑ Support country

☑ Support active/inactive state

☑ Return department count in branch listing

☑ Return departments when retrieving branch details

---

## Department Management

☑ Create department

☑ List tenant departments

☑ Get department by ID

☑ Update department

☑ Delete department

☑ Support department code

☑ Support department description

☑ Support optional branch assignment

☑ Support organization-wide department with null branch

☑ Support active/inactive state

☑ Return linked branch information

---

## Tenant Isolation

☑ Scope branch listing by active organization

☑ Scope branch retrieval by active organization

☑ Scope branch update by active organization

☑ Scope branch deletion by active organization

☑ Scope department listing by active organization

☑ Scope department retrieval by active organization

☑ Scope department update by active organization

☑ Scope department deletion by active organization

☑ Prevent department assignment to branch from another organization

☑ Prevent cross-tenant branch read

☑ Prevent cross-tenant branch update

☑ Prevent cross-tenant branch deletion

☑ Verify foreign tenant branch exists during isolation testing

---

## Validation

☑ Add branch validator

☑ Add department validator

☑ Reject malformed branch IDs

☑ Reject malformed department IDs

☑ Reject empty branch updates

☑ Reject empty department updates

☑ Reject unexpected branch fields

☑ Reject unexpected department fields

☑ Prevent organizationId mass assignment

☑ Require valid branch name

☑ Require valid department name

☑ Validate branchId where supplied

☑ Validate boolean active state

☑ Normalize optional string fields

---

## Duplicate Protection

☑ Prevent duplicate branch name within organization

☑ Prevent duplicate branch code within organization

☑ Prevent duplicate department name within organization

☑ Prevent duplicate department code within organization

☑ Verify duplicate branch code rejection

☑ Verify duplicate department code rejection

---

## Referential Safety

☑ Prevent branch deletion while departments belong to it

☑ Allow department deletion

☑ Allow branch deletion after dependent departments are removed

☑ Preserve database Restrict behavior

---

## Authorization

☑ Require authentication

☑ Require active organization context

☑ Require `branches.view` for branch reads

☑ Require `branches.manage` for branch writes

☑ Require `departments.view` for department reads

☑ Require `departments.manage` for department writes

☑ Verify restricted role cannot list branches

☑ Verify restricted role cannot create departments

---

## Audit Logging

☑ Audit `BRANCH_CREATED`

☑ Audit `BRANCH_UPDATED`

☑ Audit `BRANCH_DELETED`

☑ Audit `DEPARTMENT_CREATED`

☑ Audit `DEPARTMENT_UPDATED`

☑ Audit `DEPARTMENT_DELETED`

☑ Preserve old values where appropriate

☑ Preserve new values where appropriate

☑ Verify audit records manually

---

## API Routes

### Branches

☑ `GET /branches`

☑ `GET /branches/:id`

☑ `POST /branches`

☑ `PATCH /branches/:id`

☑ `DELETE /branches/:id`

### Departments

☑ `GET /departments`

☑ `GET /departments/:id`

☑ `POST /departments`

☑ `PATCH /departments/:id`

☑ `DELETE /departments/:id`

---

## Manual Testing

☑ Create branch

☑ Create department under branch

☑ List branches

☑ List departments

☑ Update branch

☑ Update department

☑ Reject branch deletion while department exists

☑ Delete department

☑ Delete branch

☑ Reject duplicate branch code

☑ Reject duplicate department code

☑ Reject malformed branch ID

☑ Reject malformed department ID

☑ Reject unexpected branch field

☑ Reject unexpected department field

☑ Reject empty branch update

☑ Reject empty department update

☑ Reject cross-tenant department-to-branch assignment

☑ Reject cross-tenant branch read

☑ Reject cross-tenant branch update

☑ Reject cross-tenant branch deletion

☑ Reject restricted-user branch listing

☑ Reject restricted-user department creation

☑ Verify audit events

☑ Clean Sprint 006 test records

---

## Migrations

☑ `20260820165540_add_organization_structure`

☑ `20260820165654_add_organization_structure_permissions`

☑ Database migration status verified

☑ Database schema up to date

---

## Final Technical Gate

☑ `npx prisma format`

☑ `npx prisma validate`

☑ `npx prisma migrate status`

☑ `npx prisma generate`

☑ `npx tsc --noEmit`

☑ `git diff --check`

☑ API manual testing

☑ Tenant-isolation testing

☑ Permission testing

☑ Validation testing

☑ Referential-safety testing

☑ Audit verification

☑ Documentation finalized

☑ Git staged review

☑ Git commit

☑ Git push

---

## Sprint 006 Result

Sprint 006 establishes the organization-structure foundation for ORNEXIS ONE.

Organizations can now securely manage branches and departments with tenant isolation, role-based authorization, validation, audit logging and safe relational behavior.

This structure is intentionally reusable by future modules including:

- employees and organization users
- contacts
- assets and devices
- service desk
- workflows and approvals
- document management
- procurement and inventory
- tasks and calendars
- reporting
- organization graph
- ORNEXIS AI
- industry-specific packs

---

## Status

COMPLETE
