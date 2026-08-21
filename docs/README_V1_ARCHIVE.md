# ORNEXIS ONE

**One Platform. Unlimited Possibilities.**

ORNEXIS ONE is the flagship management platform developed by ORNEXIS Technology Ltd.

It is designed to help organizations across different sectors manage operations, people, finance, documents, workflows, reporting, communication and digital services from one configurable platform.

## Company

ORNEXIS Technology Ltd.

## Product

ORNEXIS ONE

## Mission

To empower organizations of every size with secure, intelligent and affordable management software that simplifies operations, strengthens accountability and enables growth.

## Platform Vision

ORNEXIS ONE is designed as a multi-tenant, modular platform that can serve:

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
- Other sectors through configurable modules

## Core Principles

- Multi-organization architecture
- Secure by design
- Role-based access
- Modular functionality
- Configurable branding
- Financial accountability
- Auditability
- Cloud-ready architecture
- Mobile-ready APIs
- Integration-ready services

## Technology Stack

- Node.js
- TypeScript
- PostgreSQL
- Prisma ORM
- React
- REST API
- Git
- Docker
- Cloud object storage

## Current Development Stage

Sprint 001 — Foundation

Status: Complete

Completed foundation includes:

- Repository architecture
- PostgreSQL database
- Prisma ORM
- Database migrations
- Express API
- Environment configuration
- Authentication foundation
- Multi-tenant organization context
- Role-Based Access Control
- Permissions
- Audit logging
- Contacts foundation
- Error handling
- Health monitoring

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Ronoh12/ornexis-one.git
cd ornexis-one
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

Use `.env.example` as the reference.

The PostgreSQL database connection must be configured through `DATABASE_URL`.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ornexis_dev"
```

Do not commit the `.env` file.

### 4. Run Database Migrations

```bash
npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
```

Verify migration status:

```bash
npx prisma migrate status --schema packages/database/prisma/schema.prisma
```

### 5. Start the API

From the project root:

```bash
npx tsx watch apps/api/src/server.ts
```

The API runs by default on port `5000`.

### 6. Verify the API

Request:

```text
GET http://localhost:5000/health
```

A healthy development environment should report:

```json
{
  "status": "healthy",
  "application": "ORNEXIS ONE",
  "version": "1.0.0",
  "database": "connected"
}
```

---

## Current Core Modules

- Authentication
- Organizations
- Organization Users
- Roles
- Permissions
- Role Permissions
- Audit Logs
- Contacts

---

## Security Foundation

Protected organization endpoints enforce:

1. Authentication
2. Active organization context
3. Organization membership
4. Role-based permissions
5. Tenant-scoped database operations

Sensitive business actions can be recorded in the audit log.

---

## First Reference Implementation

AGE-SET Empowerment Group

AGE-SET Digital Platform Version 1.0.0 serves as the reference implementation that inspired ORNEXIS ONE.