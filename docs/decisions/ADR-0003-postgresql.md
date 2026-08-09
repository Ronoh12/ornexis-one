# ADR-0003 — PostgreSQL

Status: Accepted

Date: 2026-08-09

---

## Decision

PostgreSQL is the official database for ORNEXIS ONE.

---

## Reasons

- Mature
- Reliable
- Excellent performance
- Strong relational support
- Prisma integration
- ACID compliance
- JSON support
- Scalable

---

## Consequences

All production environments will use PostgreSQL.

SQLite may be used only for local experiments where appropriate.

---

End of ADR-0003