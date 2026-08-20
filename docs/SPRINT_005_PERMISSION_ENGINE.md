# ORNEXIS ONE

# Sprint 005

## PERMISSION ENGINE & ROLE ADMINISTRATION

---

## Sprint Goal

Build a secure, tenant-aware permission engine and role-administration layer that allows organizations to safely manage role permissions without exposing cross-tenant data, weakening system-role protections, or allowing uncontrolled privilege escalation.

---

## Architectural Principle

ORNEXIS ONE uses a global permission catalogue with tenant-specific role assignments.

```text
Permission
= global ORNEXIS capability definition

Role
= organization-specific authorization profile

RolePermission
= assignment of a global capability to an organization role

OrganizationUser
= organization membership assigned to a role
```

Permissions themselves do not belong to an organization.

Roles do belong to an organization.

Role-permission assignments must therefore always validate that the target role belongs to the authenticated organization.

---

## Existing Foundation

☑ Global `Permission` model exists

☑ Organization-owned `Role` model exists

☑ `RolePermission` model exists

☑ Role-permission uniqueness exists

☑ Permission middleware exists

☑ Organization context middleware exists

☑ Authentication middleware exists

☑ Role routes are tenant-scoped

☑ `roles.view` exists

☑ `roles.manage` exists

☑ `role_permissions.view` exists

☑ `role_permissions.manage` exists

☑ Administrator role protection exists

☑ Last-active-Administrator protection exists

---

## Permission Catalogue

Permissions represent global ORNEXIS platform capabilities.

Examples:

```text
organizations.view
organizations.update

organization_settings.view
organization_settings.manage

organization_branding.view
organization_branding.manage

organization_users.view
organization_users.manage

roles.view
roles.manage

role_permissions.view
role_permissions.manage
```

### Architectural Rule

Ordinary organization administrators must not be able to create arbitrary global ORNEXIS permission definitions.

Permission definitions are platform-level configuration.

Organization administrators manage:

```text
Role
        ↓
RolePermission
        ↓
existing Permission
```

rather than creating new global permission codes.

### Targets

☑ Preserve global permission catalogue

☑ Review `GET /permissions`

☑ Review `GET /permissions/:id`

☑ Restrict ordinary tenant creation of global permissions

☑ Preserve global permission administration as a deferred platform-admin responsibility

☑ Ensure permission catalogue reads remain protected

---

## Role-Permission Listing

Current behavior:

```text
GET /role-permissions
```

The existing service currently lists role-permission assignments without tenant filtering.

Sprint 005 must correct this.

### Targets

☑ Tenant-scope role-permission listing

☑ Filter assignments through role ownership

☑ Return role information

☑ Return permission information

☑ Prevent one tenant from viewing another tenant's assignments

☑ Preserve deterministic ordering

☑ Test tenant-scoped listing

---

## Role-Permission Assignment

Current behavior:

```text
POST /role-permissions
```

The existing service currently accepts:

```text
roleId
permissionId
```

without validating that the role belongs to the active organization.

### Required Flow

```text
authenticate
        ↓
organizationContext
        ↓
requirePermission("role_permissions.manage")
        ↓
validate request
        ↓
verify role belongs to organization
        ↓
verify permission exists
        ↓
check assignment does not already exist
        ↓
create assignment
        ↓
audit
```

### Targets

☑ Validate request body

☑ Require valid `roleId`

☑ Require valid `permissionId`

☑ Verify target role belongs to active organization

☑ Verify permission exists

☑ Reject duplicate assignment

☑ Prevent cross-tenant assignment

☑ Create `ROLE_PERMISSION_GRANTED` audit record

☑ Return assigned role and permission

☑ Test valid permission grant

---

## Role-Permission Revocation

Sprint 005 introduces safe permission revocation.

Target endpoint:

```text
DELETE /role-permissions/:id
```

or equivalent tenant-safe removal path.

### Required Flow

```text
authenticate
        ↓
organizationContext
        ↓
requirePermission("role_permissions.manage")
        ↓
tenant-scoped assignment lookup
        ↓
system-role safety validation
        ↓
delete assignment
        ↓
audit
```

### Targets

☑ Implement tenant-scoped role-permission lookup

☑ Implement permission revocation

☑ Prevent cross-tenant revocation

☑ Reject unknown assignment ID

☑ Create `ROLE_PERMISSION_REVOKED` audit record

☑ Test successful revocation

☑ Test duplicate/second revocation behavior

---

## Role Administration

Sprint 004 secured:

```text
GET  /roles
GET  /roles/:id
POST /roles
```

Sprint 005 extends safe role lifecycle management.

Target routes:

```text
PATCH  /roles/:id
DELETE /roles/:id
```

### Role Update Targets

☑ Update role name

☑ Update role description

☑ Tenant-scope role update

☑ Validate role name

☑ Prevent duplicate role names within organization

☑ Prevent ordinary callers from changing `isSystemRole`

☑ Create `ROLE_UPDATED` audit record

---

## Role Deletion

Role deletion requires stronger safety rules.

### Requirements

A role must not be deleted if:

```text
it belongs to another organization
```

or:

```text
it is a protected system role
```

or:

```text
active organization memberships still depend on it
```

### Targets

☑ Implement tenant-scoped role deletion

☑ Protect system roles

☑ Protect Administrator role

☑ Prevent deletion of role used by organization memberships

☑ Preserve role-permission cleanup behavior

☑ Create `ROLE_DELETED` audit record

☑ Test safe custom-role deletion

---

## System Role Protection

System roles represent trusted ORNEXIS authorization structures.

Examples may include:

```text
Administrator
```

and future platform-defined roles.

### Rules

Ordinary organization administrators must not be able to:

- convert normal roles into system roles
- convert system roles into normal roles
- delete protected system roles
- rename protected Administrator semantics into unsafe states
- remove critical permissions from the final usable Administrator role

### Targets

☑ Protect `isSystemRole`

☑ Protect Administrator role deletion

☑ Review Administrator role update behavior

☑ Protect critical Administrator authorization

☑ Test system-role safeguards

---

## Privilege Escalation Protection

Role administration must not create authorization escalation paths.

Examples to prevent:

```text
Tenant A admin
→ assign permission to Tenant B role
```

```text
Restricted user
→ grant own role role_permissions.manage
```

```text
Organization administrator
→ create arbitrary global platform permission
```

```text
Administrator
→ accidentally remove every critical management permission
```

### Targets

☑ Prevent cross-tenant role assignment

☑ Prevent cross-tenant permission revocation

☑ Protect global permission catalogue

☑ Review self-escalation scenarios

☑ Protect administrative continuity

---

## Permission Resolution

Existing middleware checks permissions dynamically.

Sprint 005 should verify the full resolution path:

```text
Authenticated User
        ↓
Organization Membership
        ↓
Role
        ↓
RolePermissions
        ↓
Permission.code
        ↓
requirePermission(...)
```

### Targets

☑ Verify permission lookup uses active membership

☑ Verify suspended membership cannot authorize

☑ Verify removed membership cannot authorize

☑ Verify missing permission returns 403

☑ Verify assigned permission allows access

☑ Verify revoked permission immediately removes access

---

## Audit Events

Sprint 005 introduces:

```text
ROLE_PERMISSION_GRANTED
ROLE_PERMISSION_REVOKED
ROLE_UPDATED
ROLE_DELETED
```

Audit records should include where appropriate:

- organization ID
- acting user ID
- role ID
- role-permission ID
- permission ID/code
- old values
- new values
- IP address
- user agent
- timestamp

### Targets

☑ Audit permission grant

☑ Audit permission revocation

☑ Audit role update

☑ Audit role deletion

☑ Verify audit records manually

---

## Tenant Isolation

Every permission-engine operation must preserve:

```text
authenticate
        ↓
organizationContext
        ↓
requirePermission(...)
        ↓
tenant-scoped controller
        ↓
tenant-scoped service
```

### Requirements

A tenant must never:

- list another tenant's role assignments
- assign permissions to another tenant's role
- revoke permissions from another tenant's role
- modify another tenant's role
- delete another tenant's role

### Targets

☑ Cross-tenant role-permission listing test

☑ Cross-tenant role-permission grant test

☑ Cross-tenant role-permission revoke test

☑ Cross-tenant role update test

☑ Cross-tenant role deletion test

---

## Validation

Sprint 005 should validate:

- role IDs
- permission IDs
- assignment IDs
- role names
- descriptions
- request bodies
- unexpected fields

### Targets

☑ Add role-permission validator

☑ Add role update validator

☑ Reject empty requests

☑ Reject unexpected fields

☑ Reject malformed IDs where appropriate

☑ Reject invalid role names

---

## API Targets

### Permission Catalogue

```text
GET /permissions
GET /permissions/:id
```

Ordinary tenant-level creation of global permissions should be restricted.

---

### Roles

```text
GET    /roles
GET    /roles/:id
POST   /roles
PATCH  /roles/:id
DELETE /roles/:id
```

---

### Role Permissions

```text
GET    /role-permissions
POST   /role-permissions
DELETE /role-permissions/:id
```

---

## Database

The existing schema already contains:

```text
Role
Permission
RolePermission
```

Sprint 005 should avoid unnecessary schema changes.

A migration should only be created if a real database constraint or new persisted capability is required.

### Targets

☑ Review existing constraints

☑ Preserve role-permission uniqueness

☑ Preserve role organization ownership

☑ Avoid unnecessary migration

☑ No Sprint 005 migration required; existing database constraints were sufficient

---

## Security Tests

☑ Tenant-scoped role-permission list succeeds

☑ Cross-tenant role-permission assignments hidden from listing

☑ Valid permission grant succeeds

☑ Duplicate permission grant rejected

☑ Invalid role rejected

☑ Foreign role rejected

☑ Invalid permission rejected

☑ Permission revoke succeeds

☑ Second revoke rejected/not found

☑ Revoked permission immediately removes access

☑ Restricted role cannot grant permissions

☑ Restricted role cannot modify roles

☑ System role cannot be deleted

☑ Role with active memberships cannot be deleted

☑ Custom unused role can be deleted

☑ Cross-tenant role modification rejected

☑ Global permission creation is protected

☑ Audit events are generated

---

## Quality Gates

Before Sprint 005 is closed:

☑ `git diff --check`

☑ `npx prisma format`

☑ `npx prisma validate`

☑ `npx prisma migrate status`

☑ `npx tsc --noEmit`

☑ API manual testing

☑ Tenant-isolation testing

☑ Permission testing

☑ Privilege-escalation testing

☑ System-role safety testing

☑ Audit verification

☑ Documentation finalized

☑ Git staged review

☑ Git commit

☑ Git push

---

## Deferred Platform Administration

Sprint 005 does not yet implement the full ORNEXIS platform-superadmin layer.

Future work will address:

- platform administrators
- global permission catalogue administration
- global system-role management
- tenant suspension
- platform-wide support access
- SaaS plan administration
- controlled support impersonation
- emergency access procedures

These must remain separate from ordinary tenant administration.

---

## Roadmap Compatibility

Sprint 005 protects the authorization foundation required by future ORNEXIS ONE capabilities including:

- Branches and Departments
- Service Desk
- Request Centre
- Workflow Engine
- Document Management
- Assets
- HR
- Finance
- CRM
- Integration Gateway
- Connector Framework
- Integration Centre
- External System/Data Mapping Registry
- Trusted Devices
- MFA and Conditional Access
- Security Integrations
- ORNEXIS AI
- Industry Packs

All future modules must reuse the same permission engine rather than inventing isolated authorization systems.

---

## Definition of Success

Sprint 005 is complete when organization administrators can safely manage organization roles and assign existing ORNEXIS permissions without compromising tenant isolation, system-role integrity, administrative continuity, or the global permission catalogue.

The authorization layer must be:

- tenant-aware
- least-privilege-oriented
- auditable
- resistant to privilege escalation
- safe for future enterprise modules
- reusable across every ORNEXIS ONE industry configuration

---

## Status

COMPLETE
