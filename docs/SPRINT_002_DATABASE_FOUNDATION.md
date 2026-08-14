# ORNEXIS ONE

# Sprint 002

## DATABASE FOUNDATION

---

## Sprint Goal

Harden and validate the ORNEXIS ONE database foundation so the platform can safely support future modules, onboarding workflows, integrations, documents, reporting and financial systems.

---

## Objectives

- Review existing core models
- Verify tenant ownership rules
- Review indexes and unique constraints
- Review referential integrity
- Review nullable and required fields
- Verify migration reproducibility
- Confirm clean database bootstrap
- Review future-readiness for onboarding and integrations
- Avoid adding later-milestone tables prematurely

---

## Existing Core Models

☑ Organizations

☑ Users

☑ Roles

☑ Permissions

☑ Role Permissions

☑ Organization Users

☑ Contacts

☑ Audit Logs

---

## Database Quality

☑ Review indexes and unique constraints

☑ Review foreign keys and delete behavior

☑ Review nullable vs required fields

☑ Review tenant ownership rules

☑ Review naming consistency

☑ Verify migration reproducibility

☑ Verify clean database bootstrap

☑ Migration status verified

### Database Review Conclusion

The existing core schema provides a stable relational foundation for ORNEXIS ONE.

The review confirmed:

- UUID primary keys for core entities
- Appropriate organization-scoped indexes
- Unique constraints for organization slugs, user emails, role names and permission codes
- Referential integrity through explicit foreign keys
- Controlled delete behavior using Restrict, Cascade and SetNull where appropriate
- Consistent Prisma-to-PostgreSQL naming conventions
- Reproducible Prisma migration history
- Successful clean database bootstrap from an empty PostgreSQL database

---

## Multi-Tenancy

☑ Confirm all tenant-owned models carry organization ownership

☑ Confirm organization-scoped indexes exist where required

☑ Confirm cross-organization relationships cannot be created accidentally

☑ Review role and organization membership integrity

### Multi-Tenancy Review Conclusion

Organization-owned data is scoped using `organizationId`.

Organization membership integrity is protected at both the application and database layers.

The `OrganizationUser` to `Role` relationship now uses organization-aware referential integrity so a role belonging to one organization cannot accidentally be assigned to a membership belonging to another organization.

Organization-user API operations are protected through:

1. Authentication
2. Active organization context
3. Organization membership validation
4. Role-based permissions
5. Tenant-scoped database queries

Sensitive authentication data such as password hashes is excluded from organization membership API responses.

---

## Future-Readiness

☑ Review customer/member onboarding readiness

☑ Review organization settings and branding readiness

☑ Review EDMS/document integration readiness

☑ Review CRM/integration readiness

☑ Confirm future modules can extend the current schema without duplication

### Customer and Member Onboarding

The existing `Contact` model will remain the reusable identity record for members, customers and other organization contacts.

Onboarding workflow state must remain separate from the general Contact lifecycle.

Future onboarding functionality may introduce an organization-scoped application or workflow model containing information such as:

- Application type
- Application status
- Submission state
- Review state
- Approval or rejection
- Reviewer
- Supporting documents
- Verification information
- Audit history

This prevents onboarding workflow logic from being embedded directly into the core Contact model.

### Organization Settings and Branding

The `Organization` model remains the tenant root and stores core organizational identity and operating defaults.

Future configuration should be separated into extensible organization-owned settings and branding models rather than continuously adding configuration columns to the core Organization table.

This will allow different organizations to configure branding, portal appearance, operational settings and other tenant-specific behavior independently.

### Documents and EDMS

Document storage is intentionally deferred to the document management milestone.

Future document records should be organization-scoped and capable of referencing business entities such as contacts and onboarding applications.

ORNEXIS ONE should store document metadata and storage references while allowing files to reside in cloud object storage or external EDMS platforms.

This architecture supports future EDMS integration without coupling the core database to a specific document provider.

### CRM and External Integrations

Vendor-specific external identifiers should not be added directly to core models such as `Contact`.

Future integrations should use a reusable organization-scoped external reference or integration mapping layer capable of linking ORNEXIS entities to external systems.

This can support systems such as:

- CRM platforms
- EDMS platforms
- Legacy SACCO systems
- Payment platforms
- Communication services
- Other third-party APIs

Stable UUID identifiers in the existing core models provide the foundation for these future mappings.

### Extension Principle

Core identity records and future workflow/integration records must remain separated.

The intended architecture is:

```text
Contact
    → reusable person/business identity

Onboarding Application
    → onboarding and approval workflow

Organization Settings
    → tenant operational configuration

Organization Branding
    → tenant visual configuration

Documents
    → document metadata and storage references

External References
    → CRM, EDMS and third-party system mappings
```

This separation allows future modules to extend ORNEXIS ONE without duplicating or redesigning the core identity models.

---

## SACCO Platform Requirements

The database architecture must support future SACCO requirements including:

- Customer/member onboarding workflows
- Document and EDMS integration
- CRM integration
- Cloud/web-first deployment
- Auditability
- Role-based access
- Tenant isolation

Onboarding workflow state must remain separate from the general Contact lifecycle where appropriate.

The database foundation is designed so these capabilities can be introduced incrementally without prematurely creating later-milestone tables.

---

## Migration Verification

The migration history currently contains:

1. `20260809104444_001_core_identity`
2. `20260813185654_add_audit_logs`
3. `20260814065842_enforce_organization_role_integrity`

Migration reproducibility was verified against a fresh PostgreSQL database named `ornexis_bootstrap_test`.

All three migrations applied successfully from an empty database.

The temporary bootstrap database was removed after verification, and the development environment was restored to `ornexis_dev`.

Prisma subsequently confirmed that the development database schema remained up to date.

---

## Quality

☑ Prisma schema validation

☑ Migration status verified

☑ TypeScript validation

☑ Documentation updated

☑ Git commit

☑ Final review completed

☑ Ready for Sprint 3

---

## Definition of Success

Sprint 002 is complete when the existing database foundation has been reviewed for integrity, multi-tenancy, scalability and future-readiness, with any required schema changes implemented through reproducible Prisma migrations.

The database must support the future development of onboarding, documents, integrations, reporting and financial modules without requiring redesign of the core identity models.

---

## Status

COMPLETE