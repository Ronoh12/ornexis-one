# ADR-0004 — UUID Primary Keys

Status: Accepted

Date: 2026-08-09

---

## Decision

Every major business table shall use UUID primary keys.

---

## Reasons

- Better API security
- Distributed systems
- Easier synchronization
- Future microservices support
- Better multi-tenant architecture

---

## Consequences

Auto-increment integer IDs will not be used for primary business entities.

---

End of ADR-0004