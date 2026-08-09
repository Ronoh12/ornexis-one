# ORNEXIS ONE
## System Architecture

**Product:** ORNEXIS ONE  
**Company:** ORNEXIS Technology Ltd.  
**Architecture Version:** 1.0  
**Status:** Active Development  

---

## 1. Platform Vision

ORNEXIS ONE is a multi-tenant, modular management platform designed to help organizations across different sectors manage people, operations, finance, documents, workflows, communications, reporting and digital services from one secure platform.

The platform is designed to serve organizations such as:

- Small businesses
- SACCOs
- Chamas
- Churches
- Cooperatives
- NGOs
- Schools
- Clinics
- Farming organizations
- Retail businesses
- Associations
- Property businesses
- Service companies
- Community organizations
- Other configurable sectors

AGE-SET Empowerment Group is the first reference implementation that inspired the development of ORNEXIS ONE.

---

## 2. Product Principle

ORNEXIS ONE follows one central principle:

> One Platform. Unlimited Possibilities.

The platform must remain configurable rather than being designed for only one organization type or sector.

Customer-specific requirements should be handled through:

- Configuration
- Modules
- Permissions
- Branding
- Custom fields
- Workflows
- Integrations

rather than customer-specific source-code changes.

---

## 3. Core Architecture Principles

ORNEXIS ONE must be:

1. Multi-tenant
2. Secure by design
3. Modular
4. Scalable
5. Cloud-ready
6. Mobile-ready
7. API-first
8. Auditable
9. Configurable
10. Maintainable

Every tenant-owned record must be associated with an organization.

Every protected operation must pass authorization checks.

Financial records must preserve historical integrity.

Important business actions must be auditable.

---

## 4. Technology Stack

### Backend

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL

### Frontend

- React
- TypeScript
- Tailwind CSS

### Database

- PostgreSQL
- UUID primary keys
- Prisma migrations
- UTC timestamps

### Infrastructure

- Docker
- Cloud deployment
- Object storage
- Environment-based configuration

### Integrations

- REST APIs
- Webhooks
- M-Pesa
- Email
- SMS
- Future external services

---

## 5. Repository Architecture

ORNEXIS ONE uses a modular repository structure.

```text
ornexis-one/
│
├── apps/
│   ├── api/
│   └── web/
│
├── packages/
│   ├── database/
│   ├── shared/
│   └── config/
│
├── infrastructure/
│   ├── docker/
│   └── deployment/
│
├── scripts/
├── docs/
├── uploads/
├── backups/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md

---

# 8. Security Standards

Security is a core design principle of ORNEXIS ONE.

Every feature must be designed assuming the platform will manage sensitive organizational and financial data.

## Authentication

Authentication is centralized.

Supported methods:

- Email & Password
- Future Google Login
- Future Microsoft Login
- Future SAML / Enterprise Login

Passwords must never be stored in plain text.

Passwords must always be hashed.

---

## Authorization

ORNEXIS ONE uses RBAC (Role-Based Access Control).

Authorization hierarchy:

Organization
↓

Role
↓

Permission
↓

Branch Access
↓

Business Rule

No protected endpoint should rely only on frontend validation.

Authorization must always be enforced on the backend.

---

## Audit

Every sensitive business action should be auditable.

Examples:

- Login
- Logout
- Password Change
- User Invitation
- Role Change
- Payment
- Approval
- Document Upload
- Record Update
- Record Archive

Audit history should not normally be deleted.

---

## Tenant Isolation

Every organization owns its own data.

Every tenant-owned database query must include:

organization_id

Cross-organization data access is prohibited unless explicitly supported by platform administration.

---

# 9. API Standards

ORNEXIS ONE follows REST principles.

Example:

GET    /organizations

GET    /contacts

POST   /contacts

PUT    /contacts/{id}

DELETE /contacts/{id}

Every endpoint must:

- Authenticate user
- Identify organization
- Verify permissions
- Validate request
- Execute business logic
- Create audit record where required
- Return standardized response

---

## Standard Response

Success

{
  "success": true,
  "message": "...",
  "data": {}
}

Failure

{
  "success": false,
  "message": "...",
  "errors": []
}

---

# 10. Coding Standards

Every module should follow the same structure.

Controller

↓

Service

↓

Repository

↓

Database

Business logic should never be placed inside controllers.

Controllers receive requests.

Services contain business logic.

Repositories communicate with the database.

---

## Naming

Functions

camelCase

Classes

PascalCase

Constants

UPPER_SNAKE_CASE

Enums

PascalCase

Database Tables

plural_snake_case

---

# 11. Git Standards

Every feature should have meaningful commits.

Examples

feat(auth): add login endpoint

feat(database): create contacts schema

fix(users): validate duplicate email

refactor(api): simplify permission middleware

docs(architecture): update security standards

---

# 12. Development Workflow

Every new feature follows this order.

Business Requirement

↓

Architecture

↓

Database Design

↓

API Design

↓

Implementation

↓

Testing

↓

Documentation

↓

Deployment

No feature should skip architecture.

---

# 13. Product Roadmap

Phase 1

Platform Foundation

✓ Architecture

✓ Prisma

✓ PostgreSQL

✓ Authentication

✓ Organizations

✓ Users

✓ Permissions

---

Phase 2

Core Platform

Contacts

Documents

Notifications

Dashboard

Settings

Reports

---

Phase 3

Financial Platform

Accounts

Transactions

Payments

Receipts

Ledger

---

Phase 4

AGE-SET Reference Implementation

Members

Contributions

Welfare

Merry-Go-Round

Farming

Reports

---

Phase 5

Commercial SaaS

Subscriptions

Billing

Organizations

Public Registration

Marketplace

---

Phase 6

Mobile Platform

Android

PWA

Offline Mode

Push Notifications

---

# 14. Engineering Philosophy

Before writing code, ask:

Who owns this data?

Who is allowed to access it?

Should this action be audited?

Can this feature be reused by another organization?

Will this design still make sense five years from now?

If the answer is no,

improve the design first.

---

END OF DOCUMENT