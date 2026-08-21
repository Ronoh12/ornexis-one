# ORNEXIS ONE

**One Platform. Unlimited Possibilities.**

ORNEXIS ONE is a secure, modular, multi-tenant organizational operations
platform developed by ORNEXIS Technology Ltd.

It is being designed as a configurable operating platform through which
organizations can coordinate people, work, services, customers, documents,
assets, finance, governance, accountability, integrations and organizational
intelligence without requiring a different software architecture for every
industry.

> ORNEXIS ONE is being built to become the trusted operating system for
> organizations.

---

## Product Status

**Development Status:** Active Development
**Completed Baseline:** Sprint 001–010
**Roadmap:** Master Implementation Plan v2.0
**Architecture:** System Architecture v2.0
**Engineering Model:** Engineering Manifesto v2.0

The first ten implementation sprints established the initial platform
foundation.

ORNEXIS ONE is now transitioning from foundation development into
capability-based incremental delivery.

The platform is not yet production-ready.

---

## Platform Vision

ORNEXIS ONE follows a **universal core + industry packs** architecture.

The universal platform provides reusable organizational capabilities while
industry packs extend the platform with sector-specific terminology,
workflows, configuration, data models and operational capabilities where
necessary.

This allows ORNEXIS ONE to serve organizations across sectors without
creating separate products or customer-specific forks.

Potential sectors include:

- Financial services
- SACCOs and cooperatives
- Logistics and transport
- Healthcare
- Education
- Manufacturing
- Retail and wholesale
- Agriculture
- Construction
- Professional services
- NGOs and associations
- Other configurable organizational environments

---

## Core Engineering Principles

ORNEXIS ONE is built around several non-negotiable principles:

- Multi-tenant architecture
- Strong tenant isolation
- Secure-by-design engineering
- Backend-enforced authorization
- Role and permission-based access
- Configurable organizational hierarchy
- Configuration before custom code
- Reusable shared platform engines
- Comprehensive auditability
- Customer data ownership
- API-first extensibility
- Integration-ready architecture
- Capability-based incremental delivery
- Explainable organizational intelligence
- Dependency-aware implementation
- Requirements preservation
- Production-grade engineering discipline

---

## Current Implemented Foundation

The completed Sprint 001–010 baseline includes foundations for:

- Repository and application architecture
- PostgreSQL database infrastructure
- Prisma ORM and migrations
- Express and TypeScript API
- Environment configuration
- Authentication
- User activation and login
- Current-user identity
- Organization context
- Multi-tenant membership validation
- Organizations
- Organization users
- Roles
- Permissions
- Role-permission enforcement
- Organizational structure
- User structure assignment
- Contacts
- Dashboard foundation
- Audit logging
- Document management foundation
- Error handling
- Health monitoring

These capabilities form the initial implementation baseline.

Future capabilities described in the roadmap or architecture documents should
not be interpreted as already implemented unless their implementation status
explicitly says so.

---

## Platform Direction

The long-term architecture includes reusable capabilities for:

- Workflow and approvals
- Request Centre
- Notifications
- Service Desk and SLA management
- Asset and technology lifecycle management
- CRM and relationship management
- Human resources and workforce management
- Finance and financial control
- Documents and records
- Organizational knowledge
- Permission-aware enterprise search
- Governance, risk and resilience
- Decision Register
- Expiry and obligation management
- Accountability Engine
- Attention Centre
- Configurable KPI framework
- Hierarchical Organization Health
- Hierarchical Command Centre
- Daily Brief
- Explainable organizational intelligence
- Advanced authentication and conditional access
- Security ecosystem integrations
- Integration Gateway and connector framework
- Reporting and analytics
- Industry packs
- SaaS commercialization and platform administration

These are roadmap capabilities and will be delivered progressively according
to dependency order and implementation priorities.

---


## Architecture Overview

ORNEXIS ONE is designed as a modular platform with clear separation between
platform foundations, reusable business capabilities, integrations and
industry-specific extensions.

The conceptual architecture is:

    Client Applications
            |
            v
    ORNEXIS ONE API
            |
            +-------------------------------+
            |                               |
            v                               v
    Identity and Security           Organization Context
            |                               |
            +---------------+---------------+
                            |
                            v
                 Shared Platform Engines
                            |
            +---------------+---------------+
            |               |               |
            v               v               v
       Core Modules    Operational      Intelligence
                       Capabilities     Capabilities
            |               |               |
            +---------------+---------------+
                            |
                            v
                    Integration Layer
                            |
                            v
                   External Systems

The architecture is intended to preserve:

- Tenant isolation
- Clear module boundaries
- Reusable domain services
- Backend-enforced business rules
- Permission-aware access
- Auditability
- Integration independence
- Extensibility
- Data integrity
- Replaceable infrastructure components

Detailed architectural rules are maintained in
`docs/SYSTEM_ARCHITECTURE.md`.

---

## Multi-Tenant Security Model

Every organization operates inside an isolated tenant context.

Protected organizational operations are expected to evaluate:

1. The authenticated user
2. The active organization
3. Organization membership
4. Required permissions
5. Organizational scope where applicable
6. Ownership of the requested resource
7. Additional security or classification restrictions where applicable

Cross-tenant access is prohibited unless explicitly implemented as a
controlled platform-administration capability.

Tenant isolation is treated as an architectural and testing requirement, not
an assumption.

---

## Technology Stack

### Backend

- Node.js
- TypeScript
- Express
- REST API

### Database

- PostgreSQL
- Prisma ORM
- Prisma migrations

### Frontend Direction

- React
- TypeScript
- Responsive web application architecture

Frontend capabilities will be developed progressively as platform
requirements mature.

### Engineering and Infrastructure

- Git
- GitHub
- npm
- Docker-ready development direction
- Environment-based configuration
- Cloud-ready architecture

### Storage

The document-management foundation currently provides a local storage
provider behind a storage abstraction.

The architecture is designed to support future object-storage providers
without rewriting document business logic.

---

## Repository Structure

The repository follows a monorepo-style structure.

Current high-level structure:

    ornexis-one/
    |
    +-- apps/
    |   |
    |   +-- api/
    |
    +-- packages/
    |   |
    |   +-- database/
    |
    +-- docs/
    |   |
    |   +-- decisions/
    |   +-- logs/
    |   +-- roadmap/
    |   +-- standards/
    |   +-- vision/
    |
    +-- infrastructure/
    |
    +-- scripts/
    |
    +-- uploads/
    |
    +-- .env.example
    +-- package.json
    +-- prisma.config.ts
    +-- tsconfig.json
    +-- README.md

The repository will evolve as new applications, shared packages,
infrastructure components and platform capabilities are introduced.

---

## Authoritative Documentation

ORNEXIS ONE maintains separate documentation for different engineering
concerns.

### Master Implementation Plan

`docs/IMPLEMENTATION_PLAN.md`

Defines:

- Product roadmap
- Capability map
- Strategic requirements
- Delivery phases
- Implementation dependencies
- Requirement governance
- Production-readiness direction

### System Architecture

`docs/SYSTEM_ARCHITECTURE.md`

Defines:

- Architectural boundaries
- Multi-tenancy
- Identity and authorization architecture
- Shared platform engines
- Domain architecture
- Integration architecture
- Intelligence architecture
- Security architecture
- SaaS and platform boundaries

### Engineering Manifesto

`docs/ENGINEERING_MANIFESTO.md`

Defines:

- Engineering principles
- Security expectations
- Development discipline
- Testing philosophy
- Coding philosophy
- Capability completion standards
- Architectural decision principles

### Sprint Documentation

Completed implementation sprints are documented under `docs/`.

These sprint documents preserve the engineering history of the platform and
should not be treated as replacements for the current Master Implementation
Plan.

---


## Local Development Setup

### 1. Clone the Repository

Clone the repository:

    git clone https://github.com/Ronoh12/ornexis-one.git

Then enter the project directory:

    cd ornexis-one

### 2. Install Dependencies

Install project dependencies:

    npm install

### 3. Configure Environment Variables

Create a `.env` file in the project root.

Use `.env.example` as the reference.

PostgreSQL connectivity must be configured through `DATABASE_URL`.

Example:

    DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ornexis_dev"

Do not commit `.env` or production secrets to source control.


### 4. Apply Database Migrations

Apply all committed migrations:

    npx prisma migrate deploy --schema packages/database/prisma/schema.prisma

Check migration status:

    npx prisma migrate status --schema packages/database/prisma/schema.prisma

The development database should report that the schema is up to date before
new capability work begins.

### 5. Generate Prisma Client

Generate the Prisma Client after schema changes when required:

    npx prisma generate --schema packages/database/prisma/schema.prisma

The generated client is used by the database layer and API services.

### 6. Start the API

Start the API:

    npx tsx apps/api/src/server.ts

For watch-mode development:

    npx tsx watch apps/api/src/server.ts

The API currently runs on port `5000` by default.


### 7. Verify Platform Health

Check the health endpoint:

    GET http://localhost:5000/health

A healthy development environment should report:

    {
      "status": "healthy",
      "application": "ORNEXIS ONE",
      "version": "1.0.0",
      "database": "connected"
    }

### 8. Verify Authentication

Protected endpoints require a valid access token.

Example authorization header:

    Authorization: Bearer <ACCESS_TOKEN>

Current-user identity can be verified through:

    GET /auth/me

Authentication proves identity.

Authorization and tenant access are evaluated separately.

### 9. Provide Organization Context

Organization-scoped operations require the active organization context.

The current API convention uses:

    x-organization-id: <ORGANIZATION_ID>

Protected organization-scoped requests may require:

- Valid authentication
- Active organization membership
- Required permission
- Tenant-safe resource ownership
- Additional organizational scope rules where applicable

---


## Current API Capability Areas

The current implementation baseline includes API foundations for capabilities
such as:

- Authentication
- Organization management
- Organization users
- Roles
- Permissions
- Organization structure
- User structure assignment
- Contacts
- Dashboard overview
- Audit logs
- Documents

Document capabilities currently include foundations for:

- Upload
- Listing
- Retrieval
- Download
- Metadata update
- Secure deletion
- Branch assignment
- Department assignment
- File validation
- Storage abstraction
- Audit events

The exact API surface will continue to evolve as capability-based development
progresses.

---

## Current Document Storage

The current document-management implementation uses a local storage provider
behind a reusable storage abstraction.

Development storage is organized by organization context.

Physical filenames are generated by trusted backend logic rather than directly
using user-supplied filenames.

Current document security foundations include:

- File-size validation
- MIME-type validation
- Extension validation
- Generated storage filenames
- SHA-256 checksum generation
- Tenant-isolated storage paths
- Path-traversal protection
- Permission-controlled download
- Permission-controlled deletion
- Audit logging

Future production storage providers should reuse the same abstraction rather
than requiring document-domain rewrites.

---


## Security Model

Security is a platform concern, not an individual module concern.

ORNEXIS ONE is designed around layered authorization and tenant isolation.

A protected organization-scoped operation should conceptually establish:

    Request
        |
        v
    Authentication
        |
        v
    Active Organization Context
        |
        v
    Active Organization Membership
        |
        v
    Required Permission
        |
        v
    Organizational Scope
        |
        v
    Resource Ownership / Classification
        |
        v
    Authorized Business Operation
        |
        v
    Audit Where Required

Authentication alone never grants access to organizational data.

The backend remains authoritative for:

- Authentication
- Authorization
- Tenant isolation
- Organizational scope
- Resource ownership
- Data classification
- Business rules
- Validation
- Audit requirements

Frontend visibility must never be treated as a security boundary.

Future security capabilities include:

- MFA
- Passkeys
- SSO
- Trusted-device registration
- Conditional access
- Session management
- Enterprise identity-provider integration
- Security ecosystem integration

These future capabilities are architectural and roadmap requirements unless
explicitly marked as implemented.

---

## Engineering Workflow

ORNEXIS ONE follows capability-based incremental engineering.

Meaningful capability work should follow the engineering sequence defined by
the Engineering Manifesto:

    Business Problem
        |
        v
    Requirement Classification
        |
        v
    Dependency Review
        |
        v
    Architecture
        |
        v
    Security and Tenant Model
        |
        v
    Data Model
        |
        v
    API and Service Design
        |
        v
    Implementation
        |
        v
    Validation and Authorization
        |
        v
    Audit Integration
        |
        v
    Testing
        |
        v
    Regression Verification
        |
        v
    Documentation
        |
        v
    Git Review
        |
        v
    Commit and Push
        |
        v
    Capability Complete

Architecture should precede implementation.

Dependencies should precede feature excitement.

Shared platform engines should be reused before new domain-specific mechanisms
are introduced.

---

## Roadmap and Implementation Governance

ORNEXIS ONE distinguishes between:

- Product vision
- Strategic requirements
- Architecture
- Planned capabilities
- Active implementation
- Completed implementation

A capability appearing in the Master Implementation Plan or System
Architecture does not mean that capability currently exists in the running
platform.

Implementation status must be determined from:

- Completed sprint documentation
- Current source code
- Database migrations
- Tests
- API behavior
- Current implementation documentation

This distinction prevents roadmap intent from being confused with delivered
software.

Requirements discovered during product design should be preserved even when
their implementation is deferred.

Implementation order should follow architectural dependencies rather than
document order alone.

---

## Development Discipline

Before beginning a new capability:

1. Confirm the working tree is clean.
2. Confirm the database schema is up to date.
3. Confirm the Prisma Client is current.
4. Confirm the API starts successfully.
5. Confirm the existing health endpoint succeeds.
6. Review relevant roadmap requirements.
7. Review relevant architecture.
8. Identify capability dependencies.
9. Define security and tenant boundaries.
10. Define completion criteria before implementation.

Before completing a capability:

1. Validate expected behavior.
2. Validate authorization.
3. Validate tenant isolation.
4. Validate important audit events.
5. Run relevant tests.
6. Perform regression checks.
7. Review database migrations.
8. Update implementation documentation.
9. Run Git diff checks.
10. Commit and push only after verification.

---

## Production Readiness

ORNEXIS ONE is currently under active development.

The existing implementation is a development baseline and must not yet be
interpreted as a production-ready SaaS platform.

Production readiness will require progressive work across areas including:

- Automated testing
- Integration testing
- Security testing
- Tenant-isolation testing
- Production authentication hardening
- Secrets management
- Production object storage
- Backup and recovery
- Observability
- Metrics
- Alerting
- Rate limiting
- Deployment automation
- Infrastructure hardening
- Data-retention controls
- Operational runbooks
- Incident response
- Disaster recovery
- Performance and scalability validation

Production readiness is a platform milestone, not a single feature.

---

## Project Direction

ORNEXIS ONE is being built progressively from a secure organizational
foundation into a reusable operating platform.

The objective is not to build every module at once.

The objective is to establish the correct shared foundations and then deliver
business capabilities in dependency-aware increments.

The long-term platform should connect:

    People
        +
    Structure
        +
    Work
        +
    Customers
        +
    Documents
        +
    Assets
        +
    Finance
        +
    Governance
        +
    Security
        +
    Accountability
        +
    Integrations
        +
    Organizational Intelligence

while preserving tenant isolation, authorization, auditability, configuration
and customer ownership of data.

---

## Documentation Versions

Current authoritative engineering documentation:

- **Master Implementation Plan:** Version 2.0
- **System Architecture:** Version 2.0
- **Engineering Manifesto:** Version 2.0
- **README:** Version 2.0

Historical versions are preserved for engineering traceability where
appropriate.

---

## Current Baseline

**Completed Sprints:** 001–010

**Current State:** Foundation baseline complete; capability-based development
continues from the Master Implementation Plan.

**Production Status:** Not production-ready.

**Architecture:** Multi-tenant, modular, configurable and integration-ready.

**Engineering Direction:** Secure, dependency-aware, reusable platform
engineering.

---

## ORNEXIS ONE

**One Platform. Unlimited Possibilities.**

Built by **ORNEXIS Technology Ltd.**

> Building the trusted operating system for organizations.

---

# End of Document

**README Version:** 2.0
**Status:** ACTIVE
**Product:** ORNEXIS ONE

© ORNEXIS Technology Ltd.