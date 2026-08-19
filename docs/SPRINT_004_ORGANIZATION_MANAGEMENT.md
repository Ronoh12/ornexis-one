# ORNEXIS ONE

# Sprint 004

## ORGANIZATION MANAGEMENT

---

## Sprint Goal

Build a secure and tenant-aware organization management layer that allows organizations to manage their profile, settings, branding and users while preserving auditability, permission enforcement and multi-tenant isolation.

---

## Objectives

- Extend organization profile management
- Add organization update capability
- Introduce organization settings
- Introduce organization branding
- Extend organization-user management
- Preserve strict tenant isolation
- Enforce permission-based access
- Add organization management audit events
- Add required database models and migration
- Verify organization management behavior end-to-end

---

## Existing Foundation

☑ Organization model exists

☑ Organization users exist

☑ Roles and permissions exist

☑ Organization context middleware exists

☑ Permission middleware exists

☑ Tenant-scoped organization reads exist

☑ Tenant-scoped organization-user reads exist

☑ Organization creation exists

☑ Organization deletion exists

☑ Organization-user creation exists

☑ Organization audit logging foundation exists

---

## Organization Profile

Existing organization profile fields:

- name
- slug
- organizationType
- registrationNumber
- email
- phone
- website
- country
- currency
- timezone
- status
- plan

Sprint 004 profile management supports safe tenant updates to:

- name
- registrationNumber
- email
- phone
- website
- country
- currency
- timezone

The following fields are intentionally excluded from ordinary tenant profile updates:

- slug
- organizationType
- status
- plan

These represent identity, lifecycle or commercial state.

### Targets

☑ Implement `PATCH /organizations/:id`

☑ Add organization update service

☑ Add organization update validation

☑ Require `organizations.update`

☑ Enforce tenant ID match

☑ Prevent unauthorized lifecycle field changes

☑ Create `ORGANIZATION_UPDATED` audit record

☑ Test organization profile update

### Verified Behavior

A valid profile update successfully changed an allowed field.

An attempted update of:

```text
status
```

was rejected with:

```text
Field "status" cannot be updated
```

A request targeting an organization ID different from the active organization context was rejected.

`ORGANIZATION_UPDATED` audit logging was verified with old and new values.

---

## Organization Settings

One settings record is supported per organization.

Settings include:

- locale
- dateFormat
- timeFormat
- weekStartsOn
- defaultLanguage
- defaultCountry
- defaultCurrency
- defaultTimezone

### Targets

☑ Add `OrganizationSetting` Prisma model

☑ Enforce one settings record per organization

☑ Add organization relation

☑ Add settings service

☑ Add settings controller

☑ Add settings routes

☑ Implement `GET /organizations/:id/settings`

☑ Implement `PATCH /organizations/:id/settings`

☑ Require `organization_settings.view`

☑ Require `organization_settings.manage`

☑ Enforce tenant ID match in controller

☑ Add validation

☑ Create `ORGANIZATION_SETTINGS_UPDATED` audit record

☑ Test settings lifecycle

☑ Explicitly test cross-tenant settings route access

☑ Explicitly test settings permission denial with restricted role

### Verified Behavior

Initial settings retrieval returned:

```text
data: null
```

when no settings record existed.

The first PATCH created the organization settings record through an upsert.

A subsequent GET returned the persisted values.

Invalid:

```text
weekStartsOn = 9
```

was rejected because valid values are `0` through `6`.

`ORGANIZATION_SETTINGS_UPDATED` audit logging was verified.

---

## Organization Branding

One branding record is supported per organization.

Branding fields:

- displayName
- shortName
- logoUrl
- faviconUrl
- primaryColor
- secondaryColor
- accentColor

### Targets

☑ Add `OrganizationBranding` Prisma model

☑ Enforce one branding record per organization

☑ Add organization relation

☑ Add branding service

☑ Add branding controller

☑ Add branding routes

☑ Implement `GET /organizations/:id/branding`

☑ Implement `PATCH /organizations/:id/branding`

☑ Require `organization_branding.view`

☑ Require `organization_branding.manage`

☑ Enforce tenant ID match in controller

☑ Validate branding fields

☑ Create `ORGANIZATION_BRANDING_UPDATED` audit record

☑ Test branding lifecycle

☑ Explicitly test cross-tenant branding route access

☑ Explicitly test branding permission denial with restricted role

### Verified Behavior

Initial branding retrieval returned:

```text
data: null
```

when no branding record existed.

The first PATCH created the branding record.

A subsequent GET returned the persisted branding configuration.

Brand colors require six-digit hexadecimal values.

For example:

```text
#0B1120
#1E293B
#3B82F6
```

An invalid value:

```text
blue
```

was rejected.

`ORGANIZATION_BRANDING_UPDATED` audit logging was verified.

---

## Organization Users

Existing routes:

```text
GET  /organization-users
GET  /organization-users/:id
POST /organization-users
```

Sprint 004 extends the lifecycle with:

```text
PATCH  /organization-users/:id
DELETE /organization-users/:id
```

### Targets

☑ Implement `PATCH /organization-users/:id`

☑ Support role changes in service and validation

☑ Support membership status changes

☑ Validate target role belongs to active organization

☑ Protect against tenant-scoped membership modification

☑ Implement membership removal

☑ Use soft removal through `REMOVED` status

☑ Preserve membership history

☑ Create `ORGANIZATION_USER_UPDATED` audit record

☑ Create `ORGANIZATION_USER_REMOVED` audit record

☑ Verify suspended users lose tenant access

☑ Verify removed users lose tenant access

☑ Test membership update lifecycle

☑ Explicitly test successful change to a second valid organization role

### Organization User Update Design

Only these fields may be changed:

```text
roleId
status
```

Allowed membership statuses:

```text
INVITED
ACTIVE
SUSPENDED
REMOVED
```

Role changes verify that the destination role belongs to the active organization.

A fake or foreign role is rejected with:

```text
Role does not belong to this organization
```

Membership lookup is tenant-scoped.

Unknown membership IDs return:

```text
Organization membership not found
```

---

## Membership State

Supported states:

- INVITED
- ACTIVE
- SUSPENDED
- REMOVED

Expected behavior:

```text
INVITED
→ waiting for activation

ACTIVE
→ normal organization access

SUSPENDED
→ membership temporarily blocked

REMOVED
→ membership no longer usable
```

### Targets

☑ Confirm organization context accepts only ACTIVE memberships

☑ Confirm suspended memberships lose organization access

☑ Confirm removed memberships lose organization access

☑ Use soft removal instead of physical deletion

☑ Preserve membership history

☑ Preserve audit history

### Verified Access Rule

Organization context requires:

```text
status = ACTIVE
```

A user account may remain globally:

```text
ACTIVE
```

while its organization membership is:

```text
SUSPENDED
```

or:

```text
REMOVED
```

In either case, tenant access is denied.

This preserves the separation between:

```text
global User identity
```

and:

```text
organization-specific membership
```

---

## Last Active Administrator Protection

Sprint 004 introduced tenant-lockout protection.

The system counts memberships that are all of the following:

```text
same organization
+
status = ACTIVE
+
role = Administrator
+
isSystemRole = true
```

### Protected Operations

The final active Administrator cannot:

- Be suspended
- Be removed
- Be moved to another role
- Be changed to any non-ACTIVE membership state

### Targets

☑ Count active Administrator memberships

☑ Protect Administrator role reassignment

☑ Protect Administrator suspension

☑ Protect Administrator removal

☑ Return clear conflict response

☑ Test real last-Administrator boundary

### Verified Behavior

A controlled test reduced the organization to one active Administrator.

An attempt to suspend that final Administrator was rejected with:

```text
The last active Administrator cannot be suspended, removed, or reassigned
```

The main administrative membership was restored to ACTIVE after the security test.

---

## Permissions

Existing relevant permissions:

```text
organizations.view
organizations.create
organizations.delete

organization_users.view
organization_users.manage
```

Sprint 004 added:

```text
organizations.update

organization_settings.view
organization_settings.manage

organization_branding.view
organization_branding.manage
```

### Targets

☑ Add new permission rows through migration

☑ Avoid duplicate permission codes

☑ Assign new permissions to existing Administrator system roles

☑ Preserve role-permission uniqueness

☑ Verify Administrator receives all five new permissions

☑ Routes use permission middleware

☑ Explicitly test permission denial using a restricted non-Administrator role

### Migration Behavior

Permission inserts use:

```text
ON CONFLICT ("code") DO NOTHING
```

Role-permission assignment uses:

```text
ON CONFLICT ("role_id", "permission_id") DO NOTHING
```

This protects against duplicate permission records and duplicate assignments.

---

## Audit

Existing organization-related audit events:

- ORGANIZATION_VIEWED
- ORGANIZATION_CREATED
- ORGANIZATION_DELETED

Sprint 004 adds:

- ORGANIZATION_UPDATED
- ORGANIZATION_SETTINGS_UPDATED
- ORGANIZATION_BRANDING_UPDATED
- ORGANIZATION_USER_UPDATED
- ORGANIZATION_USER_REMOVED

### Targets

☑ Record organization profile updates

☑ Record settings updates

☑ Record branding updates

☑ Record organization-user role/status changes

☑ Record membership removals

☑ Include user ID

☑ Include organization ID

☑ Include entity ID

☑ Capture old and new values where appropriate

☑ Capture IP address where available

☑ Capture user agent where available

☑ Verify audit records manually

---

## Tenant Isolation

Organization-management operations follow:

```text
authenticate
        ↓
organizationContext
        ↓
requirePermission(...)
        ↓
tenant-scoped controller/service
```

### Requirements

- A user must never update another tenant's organization profile
- A user must never read another tenant's settings
- A user must never modify another tenant's branding
- A user must never modify another tenant's memberships
- Role assignment must remain within the active organization
- Organization IDs in route parameters must match active organization context

### Targets

☑ Test cross-tenant organization profile access

☑ Verify role ownership during membership update

☑ Verify membership lookup is tenant-scoped

☑ Explicitly test cross-tenant settings route

☑ Explicitly test cross-tenant branding route

---

## Organization Creation

Current organization creation requires:

```text
authenticate
organizationContext
organizations.create
```

This means organization creation currently assumes the caller already belongs to an organization.

Sprint 004 preserves this existing behavior.

### Deferred Decision

The platform will later decide between:

- Platform-admin-created organizations
- Self-service tenant registration
- Hybrid onboarding

This belongs to a later onboarding/commercial milestone.

---

## Organization Lifecycle

Normal tenant profile management cannot modify:

- status
- plan
- slug
- organizationType

### Deferred Decisions

- Organization suspension
- Organization archival
- Organization restoration
- SaaS plan transitions
- Tenant self-deletion policy
- Platform administrator organization management

---

## Database

Sprint 004 database work includes:

```text
OrganizationSetting
OrganizationBranding
new Permission rows
new RolePermission assignments
```

### Targets

☑ Update Prisma schema

☑ Add organization relations

☑ Add foreign keys

☑ Add unique organization constraints

☑ Create Sprint 004 migration

☑ Add new permissions

☑ Assign permissions to Administrator system roles

☑ Generate Prisma Client

☑ Run Prisma format

☑ Run Prisma validate

☑ Apply migration

☑ Verify migration status

### Migration

Sprint 004 introduced:

```text
20260819150922_add_organization_settings_and_branding
```

The repository currently contains:

```text
6 migrations
```

and the development database is synchronized with the schema.

---

## API Targets

### Organizations

```text
GET    /organizations
GET    /organizations/:id
POST   /organizations
PATCH  /organizations/:id
DELETE /organizations/:id
```

### Settings

```text
GET   /organizations/:id/settings
PATCH /organizations/:id/settings
```

### Branding

```text
GET   /organizations/:id/branding
PATCH /organizations/:id/branding
```

### Organization Users

```text
GET    /organization-users
GET    /organization-users/:id
POST   /organization-users
PATCH  /organization-users/:id
DELETE /organization-users/:id
```

---

## Validation

Sprint 004 validates:

- Organization names
- Registration numbers where appropriate
- Email format
- Website URLs
- Currency codes
- Branding names
- Branding URLs
- Branding color format
- Settings fields
- Week start
- Time format
- Membership status
- Role IDs
- Unexpected fields

### Targets

☑ Add organization profile validator

☑ Add settings validator

☑ Add branding validator

☑ Add organization-user update validator

☑ Reject unexpected organization lifecycle fields

☑ Reject invalid branding colors

☑ Reject invalid organization-user statuses

☑ Reject invalid/foreign roles

---

## Testing

☑ Organization profile update succeeds

☑ Unauthorized lifecycle field update rejected

☑ Cross-tenant organization update rejected

☑ Settings retrieval succeeds

☑ Settings creation/update succeeds

☑ Settings persistence verified

☑ Invalid settings data rejected

☑ Branding retrieval succeeds

☑ Branding creation/update succeeds

☑ Branding persistence verified

☑ Invalid branding data rejected

☑ Organization-user status update succeeds

☑ Invalid role assignment rejected

☑ Tenant-scoped membership lookup verified

☑ Membership suspension works

☑ Suspended membership loses organization access

☑ Membership removal works

☑ Removed membership loses organization access

☑ Last active Administrator protection works

☑ Organization profile audit verified

☑ Settings audit verified

☑ Branding audit verified

☑ Organization-user update audit verified

☑ Organization-user removal audit verified

☑ New Administrator permissions verified

☑ Successful valid role-change test

☑ Cross-tenant settings route test

☑ Cross-tenant branding route test

☑ Restricted-role permission-denial test

---

## Roles Security Hardening

Sprint 004 also hardened organization role management after testing exposed that the existing Roles module was not tenant-scoped or permission-protected.

### Previous Risk

The original Roles module allowed:

```text
GET  /roles
GET  /roles/:id
POST /roles
```

without:

- authentication
- organization context
- role permissions
- tenant-scoped service queries

This created a cross-tenant exposure risk because roles could be listed or retrieved without restricting them to the active organization.

### Changes

☑ Tenant-scope role listing

☑ Tenant-scope role retrieval

☑ Derive organization ID from authenticated organization context

☑ Stop accepting organization ID from ordinary role-creation request bodies

☑ Prevent ordinary callers from setting `isSystemRole`

☑ Protect role routes with authentication

☑ Protect role routes with organization context

☑ Add `roles.view`

☑ Add `roles.manage`

☑ Assign both permissions to Administrator system roles

☑ Verify Administrator role access

☑ Create and test non-system `Member` role

☑ Verify valid organization-user role reassignment to `Member`

### Role Routes

```text
GET  /roles
GET  /roles/:id
POST /roles
```

now follow:

```text
authenticate
        ↓
organizationContext
        ↓
requirePermission(...)
        ↓
tenant-scoped controller/service
```

### Permissions

```text
roles.view
roles.manage
```

`roles.view` protects role reads.

`roles.manage` protects role creation and future role-management operations.

### Migration

Sprint 004 also introduced:

```text
20260819181015_secure_roles_permissions
```

This migration:

- creates `roles.view`
- creates `roles.manage`
- assigns both permissions to existing Administrator system roles
- uses conflict-safe inserts to avoid duplicate permission or role-permission records

### Verified Behavior

Administrator access to `/roles` continued working after hardening.

A new non-system role was successfully created:

```text
Member
```

A valid organization-user role change from:

```text
Administrator
```

to:

```text
Member
```

completed successfully.

Role lookups and listings are now tenant-scoped.

## Quality Gates

Before Sprint 004 is closed:

☑ `git diff --check`

☑ `npx prisma format`

☑ `npx prisma validate`

☑ `npx prisma migrate status`

☑ `npx tsc --noEmit`

☑ API manual testing

☑ Membership-state testing

☑ Last-Administrator lockout testing

☑ Audit verification

☑ Remaining explicit security tests

☑ Documentation finalized

☑ Git staged review

☑ Git commit

☑ Git push

---

## Remaining Sprint 004 Work

Before Sprint 004 is closed:

1. Test a successful organization-user role change using another valid role.
2. Explicitly test cross-tenant access for organization settings.
3. Explicitly test cross-tenant access for organization branding.
4. Test the new permissions using a restricted role that does not have them.
5. Run the final technical gate after those tests.
6. Finalize this document.
7. Stage and review the Sprint 004 diff.
8. Commit and push Sprint 004.

---

## Definition of Success

Sprint 004 is complete when an organization can securely manage its operational profile, settings, branding and users without compromising tenant isolation, membership safety or authorization boundaries.

Organization management must remain:

- Tenant-aware
- Permission-aware
- Auditable
- Role-aware
- Membership-state-aware
- Protected against administrative lockout

The resulting organization layer must be safe for future dashboard, finance, HR, service-desk, security, mobile and industry-module development.

---

## Status

IN PROGRESS
