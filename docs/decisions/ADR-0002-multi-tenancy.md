# ADR-0002 — Multi-Tenant Architecture

Status: Accepted

Date: 2026-08-09

---

## Context

The platform is intended to support many independent organizations from a single codebase.

Examples include:

- SACCOs
- Churches
- Schools
- Businesses
- NGOs
- Cooperatives
- Youth Groups

---

## Decision

ORNEXIS ONE shall use a multi-tenant architecture.

Every tenant-owned record will contain:

organization_id

Every request will be scoped to the active organization.

---

## Consequences

- One application
- One database
- Shared code
- Tenant isolation
- Lower operational cost
- Easier maintenance

---

End of ADR-0002