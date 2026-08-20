# SPRINT 008 — CONTACT MANAGEMENT AND ORGANIZATION STRUCTURE

## Status

COMPLETE

---

## Objective

Strengthen the ORNEXIS ONE Contact domain into a secure, tenant-aware,
organization-structure-aware directory foundation.

Contacts must support controlled assignment to branches and departments,
structured lifecycle management, secure updates, search and filtering,
permission enforcement, auditability, and strict multi-tenant isolation.

This sprint establishes the reusable Contact foundation for future modules
including CRM, HR, membership, suppliers, donors, partners, service desk,
workflows, documents, procurement, reporting, and industry packs.

---

## Existing Foundation

The platform currently provides:

- Organization-scoped Contacts
- Contact types:
  - MEMBER
  - CUSTOMER
  - EMPLOYEE
  - SUPPLIER
  - VOLUNTEER
  - DONOR
  - PARTNER
  - OTHER
- Contact statuses:
  - ACTIVE
  - INACTIVE
  - ARCHIVED
- Contact creation
- Contact listing
- Individual contact retrieval
- Contact deletion
- CONTACT_CREATED audit logging
- CONTACT_DELETED audit logging
- Tenant-scoped contact service operations
- contacts.view permission
- contacts.create permission
- contacts.delete permission
- Branch and Department organization structure
- OrganizationUser branch/department assignment
- Multi-tenant organization context
- Role-based permission enforcement

---

## Sprint Scope

### 1. Contact Structure Assignment

Add optional:

- branchId
- departmentId

to Contact.

Contacts may remain organization-wide without either assignment.

A department assignment must belong to the same organization as the Contact.

If both branch and department are supplied, the department must belong to
the selected branch.

Cross-organization structure assignment must be rejected.

---

## 2. Contact Update Capability

Add:

PATCH /contacts/:id

Supported controlled updates include:

- contactType
- firstName
- lastName
- organizationName
- email
- phone
- secondaryPhone
- nationalId
- dateOfBirth
- address
- city
- countyState
- country
- status
- branchId
- departmentId

Protected fields must not be caller-controlled.

Examples include:

- id
- organizationId
- createdAt
- updatedAt

---

## 3. Contact Update Permission

Introduce:

contacts.update

Purpose:

Allow roles to update Contacts independently from create, delete, and view
permissions.

The existing granular permission model remains:

- contacts.view
- contacts.create
- contacts.update
- contacts.delete

---

## 4. Dedicated Contact Validation

Introduce:

apps/api/src/validators/contactValidator.ts

Validation responsibilities include:

- UUID validation
- Contact type validation
- Contact status validation
- dateOfBirth validation
- controlled update fields
- protected field rejection
- person/organization naming requirements
- branch ID validation
- department ID validation
- query/filter validation where required

Controllers should coordinate HTTP behavior rather than contain large
validation blocks.

---

## 5. Organization Structure Integrity

Contact structure assignments must enforce:

- branch belongs to current organization
- department belongs to current organization
- department belongs to selected branch when both are assigned
- foreign branch assignment rejected
- foreign department assignment rejected

Tenant ownership must always come from authenticated organization context.

---

## 6. Contact Search and Filtering

GET /contacts should support controlled filtering.

Planned filters:

- contactType
- status
- branchId
- departmentId
- search

Search should support useful contact identity fields such as:

- firstName
- lastName
- organizationName
- email
- phone

All queries remain organization-scoped.

---

## 7. Contact Response Enrichment

Where appropriate, Contact responses should include useful organization
structure context such as:

- branch
- department

The API must not expose data belonging to another organization.

---

## 8. Contact Audit Logging

Preserve:

- CONTACT_CREATED
- CONTACT_DELETED

Add:

- CONTACT_UPDATED

Update audit records should capture meaningful old and new values,
including structure assignment changes.

Audit records must remain tenant-aware and actor-aware.

---

## 9. Multi-Tenant Security

Every Contact read/write operation must remain scoped by organizationId
derived from authenticated organization context.

The caller must never be allowed to choose Contact tenant ownership.

Cross-tenant:

- reads
- updates
- deletes
- branch assignments
- department assignments

must fail safely.

---

## 10. Lifecycle

Existing Contact lifecycle remains:

ACTIVE
INACTIVE
ARCHIVED

Sprint 008 does not introduce additional lifecycle states.

---

## Out of Scope

Sprint 008 does not implement:

- CRM pipelines
- sales opportunities
- SACCO contributions
- welfare
- merry-go-round
- employee HR records
- payroll
- supplier procurement records
- donor management workflows
- service desk tickets
- document management
- workflow engine
- industry-specific Contact extensions

These systems may build on the Contact foundation later.

---

## Security Test Requirements

The sprint must verify at minimum:

1. Valid Contact creation
2. Valid Contact update
3. Valid branch assignment
4. Valid department assignment
5. Valid branch + department assignment
6. Contact unassignment
7. Malformed Contact ID rejection
8. Malformed branch ID rejection
9. Malformed department ID rejection
10. Invalid Contact type rejection
11. Invalid Contact status rejection
12. Invalid date of birth rejection
13. Protected field rejection
14. Foreign branch assignment rejection
15. Foreign department assignment rejection
16. Branch/department mismatch rejection
17. Restricted user update denied
18. Cross-tenant Contact read isolation
19. Cross-tenant Contact update isolation
20. Cross-tenant Contact delete isolation
21. Contact search remains tenant-scoped
22. Contact filtering remains tenant-scoped
23. CONTACT_UPDATED audit record created
24. Audit record captures structure changes
25. Existing create/delete behavior remains functional

---

## Database Changes

Expected Contact additions:

- branchId String?
- departmentId String?

Expected relations:

Contact -> Branch
Contact -> Department

Expected indexes:

- branchId
- departmentId
- organizationId + branchId
- organizationId + departmentId

A Prisma migration will be created after schema validation.

---

## API Changes

Expected endpoints:

GET    /contacts
GET    /contacts/:id
POST   /contacts
PATCH  /contacts/:id
DELETE /contacts/:id

Expected permissions:

GET    -> contacts.view
POST   -> contacts.create
PATCH  -> contacts.update
DELETE -> contacts.delete

---

## Definition of Done

Sprint 008 is complete when:

☑ Sprint documentation created

☑ Contact schema updated

☑ Prisma migration created and applied

☑ Prisma Client regenerated

☑ contacts.update permission introduced

☑ Contact validator implemented

☑ Contact service hardened

☑ Contact controller hardened

☑ PATCH /contacts/:id implemented

☑ Contact structure assignment implemented

☑ Search implemented

☑ Filtering implemented

☑ CONTACT_UPDATED auditing implemented

☑ Tenant isolation verified

☑ Permission enforcement verified

☑ Structure integrity verified

☑ Security tests passed

☑ Existing Contact operations regression-tested

☑ Prisma schema valid

☑ TypeScript compilation passes

☑ git diff --check passes

☑ Test data cleaned

☑ Documentation finalized

☑ Git staged review

☑ Git commit

☑ Git push

---

## Architectural Outcome

After Sprint 008, ORNEXIS ONE will have a tenant-safe Contact directory
capable of representing people and organizations within the operational
structure of an organization.

Contacts will be able to participate in branch and department context
without coupling the core Contact model to future business modules.

This creates a reusable foundation for CRM, HR, membership, suppliers,
service desk, workflows, documents, reporting, and industry-specific
extensions.

---

## Status

COMPLETE
