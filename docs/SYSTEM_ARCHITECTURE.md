# ORNEXIS ONE

# System Architecture

**Architecture Version:** 2.0
**Status:** ACTIVE ARCHITECTURE
**Product:** ORNEXIS ONE
**Company:** ORNEXIS Technology Ltd.
**Architecture Model:** Multi-Tenant Modular Organizational Platform

---

# 1. Purpose

This document defines the architectural structure, boundaries and engineering
constraints of ORNEXIS ONE.

It explains how the platform is organized, how major platform capabilities
relate to one another, how tenant and security boundaries are enforced, and
how future modules should extend the system without fragmenting the
architecture.

This document describes architecture.

It does not replace:

- The Master Implementation Plan, which defines what is built and in what order
- Sprint documents, which define detailed implementation scope
- The Engineering Manifesto, which defines how engineering work is performed
- README, which provides the practical repository entry point

---

# 2. Platform Vision

ORNEXIS ONE is a secure, multi-tenant, modular and configurable
organizational operating platform.

It is designed to help organizations manage:

- People
- Work
- Documents
- Requests
- Services
- Assets
- Customers
- Employees
- Finance
- Governance
- Risk
- Knowledge
- Communications
- Reporting
- Integrations
- Organizational intelligence

The platform must support different industries without requiring separate
product codebases for each sector.

---

# 3. Architectural Status Model

ORNEXIS ONE architecture distinguishes between:

## Implemented Architecture

Capabilities already implemented and validated in the codebase.

At the Sprint 010 baseline, this includes foundations for:

- Repository and API structure
- PostgreSQL and Prisma
- Authentication
- Organizations
- Organization users
- Roles and permissions
- Branches
- Departments
- Organization-user structure assignment
- Contacts
- Dashboard aggregation
- Document management
- Storage abstraction
- Audit logging
- Tenant isolation

## Target Architecture

Capabilities approved as part of the product architecture but not necessarily
implemented yet.

Examples include:

- Workflow and approvals
- Request Centre
- Notifications
- Service Desk
- SLA management
- Assets
- CRM
- HR
- Finance
- Knowledge management
- Enterprise search
- Accountability Engine
- Attention Centre
- Organization Health
- Command Centre
- Advanced authentication
- Trusted devices
- Conditional access
- External integrations
- Industry packs
- SaaS commercialization
- Mobile applications

Target architecture must guide current engineering without being falsely
represented as already implemented.

---

# 4. Core Architecture Principles

Every ORNEXIS ONE capability must preserve:

1. Multi-tenancy
2. Tenant isolation
3. Backend authorization
4. Least privilege
5. Auditability
6. Modular design
7. API-first architecture
8. Reusable platform services
9. Configurability
10. Cloud readiness
11. Mobile readiness
12. Historical integrity where required
13. Organizational hierarchy awareness
14. Data classification awareness
15. Integration readiness
16. Observability
17. Controlled migrations
18. Maintainability
19. Backward compatibility where appropriate
20. Security by design

---

# 5. Universal Core and Industry Packs

ORNEXIS ONE follows a Universal Core plus Industry Pack architecture.

The Universal Core contains capabilities reusable across many organization
types.

Examples include:

- Identity
- Organizations
- Permissions
- People
- Documents
- Workflow
- Notifications
- Service management
- Assets
- CRM
- HR
- Finance
- Reporting
- Search
- Audit
- Integrations
- Intelligence

Industry Packs extend the Universal Core with sector-specific:

- Terminology
- Workflows
- Custom fields
- Reports
- Templates
- Rules
- Dashboards
- Integrations
- Specialized domain capabilities

Industry Packs must reuse core platform services wherever practical.

They must not duplicate universal capabilities simply because an industry uses
different terminology.

---

# 6. Logical Platform Architecture

The conceptual architecture is:

ORNEXIS ONE
    |
    +-- Identity and Access
    |
    +-- Organization and Structure
    |
    +-- People and Contacts
    |
    +-- Documents and Records
    |
    +-- Work, Workflow and Requests
    |
    +-- Service Operations
    |
    +-- Assets and Technology
    |
    +-- CRM and Relationships
    |
    +-- Human Resources
    |
    +-- Finance
    |
    +-- Governance and Resilience
    |
    +-- Communications
    |
    +-- Reporting, Search and Intelligence
    |
    +-- Integration and Automation
    |
    +-- Industry Packs
    |
    +-- SaaS and Delivery Platform

These domains are logically separated but may consume shared platform
services.

---

# 7. Technology Stack

## Backend

- Node.js
- TypeScript
- Express
- Prisma ORM

## Database

- PostgreSQL
- UUID primary keys
- Prisma migrations
- UTC timestamps

## Frontend

Target architecture:

- React
- TypeScript
- Responsive web interface
- Progressive Web App
- Future mobile applications

## Infrastructure

Target architecture:

- Docker
- Cloud deployment
- Object storage
- Secure environment configuration
- Centralized logging
- Monitoring
- Backup and restore
- Deployment automation

## Integrations

Target architecture:

- REST APIs
- Webhooks
- Email
- SMS
- M-Pesa
- Identity providers
- External business systems
- Security platforms
- Industry-specific services

---


# 8. Repository and Application Boundaries

ORNEXIS ONE uses a modular repository structure.

Current repository areas include:

- apps/api
- apps/web
- packages/database
- packages/shared
- packages/config
- infrastructure
- scripts
- docs
- uploads
- backups

The API application owns HTTP request handling and application services.

Database access is centralized through the database package and Prisma.

Future shared packages should be introduced only when functionality is truly
cross-cutting and reusable.

Repository structure should reflect architectural ownership rather than
arbitrary folder growth.

---

# 9. Multi-Tenancy Architecture

Multi-tenancy is a core architectural boundary.

Every tenant-owned capability must preserve organization ownership.

The current tenant model is centered on Organization.

Protected organization-scoped requests generally require:

- Authenticated user
- Active organization context
- Active organization membership
- Required permission
- Tenant-safe resource lookup

Tenant-owned queries must include organization ownership directly or through
a safely constrained relationship.

Cross-organization data access is prohibited unless explicitly supported by
a controlled platform-administration capability.

Tenant isolation must be enforced in backend logic and supported by database
relationships where practical.

---

# 10. Organization and Structure Architecture

Organization is the primary tenant boundary.

The implemented organizational structure currently includes:

- Organization
- Branch
- Department

Organization users may be associated with organizational structure.

Contacts may also be associated with branch and department.

The current Branch and Department model forms the first hierarchy layer.

Future architecture may extend this model to support:

- Region
- Division
- Business unit
- Team
- Site
- Campus
- Cost centre
- Other configurable organizational units

Future hierarchy expansion must preserve:

- Tenant ownership
- Parent-child integrity
- Scoped authorization
- Reporting scope
- Workflow routing
- Dashboard scope
- Health aggregation

The existing structure should be extended carefully rather than replaced
without need.

---

# 11. Identity and Authentication Architecture

Authentication is centralized.

Implemented authentication foundations include:

- User identity
- Login
- Account activation foundations
- Token-based API authentication
- Current-user identity
- Protected endpoints

Future authentication architecture may include:

- Multi-factor authentication
- Passkeys
- Microsoft identity
- Google identity
- Enterprise SSO
- Federation
- Trusted devices
- Conditional access
- Session visibility
- Session revocation
- Authentication risk signals

Authentication proves identity.

It does not by itself grant access to tenant resources.

Authorization remains a separate architectural concern.

---

# 12. Authorization Architecture

ORNEXIS ONE uses role-based access control as the current authorization
foundation.

The implemented model includes:

Organization
    |
Organization User
    |
Role
    |
Permission

Protected operations may additionally depend on:

- Organization context
- Branch
- Department
- Resource ownership
- Business rules

Future authorization may incorporate:

- Region
- Team
- Data classification
- Record sensitivity
- Trusted device state
- Authentication strength
- Conditional access policy
- Workflow state
- Industry-specific restrictions

Frontend visibility must never be treated as sufficient authorization.

Backend authorization is authoritative.

---

# 13. Audit Architecture

Audit logging is a reusable platform concern.

Implemented audit foundations support recording important business actions.

Examples already relevant to the current platform include:

- Authentication activity
- User and role activity
- Contact operations
- Document upload
- Document update
- Document download
- Document delete

Audit records should normally preserve:

- Organization
- Actor
- Action
- Entity type
- Entity identifier
- Timestamp
- Relevant before state
- Relevant after state

Future audit architecture may add:

- Search
- Filtering
- Retention policies
- Export
- Investigation views
- Correlation
- Security analytics
- SIEM forwarding

Audit history should normally be append-oriented and protected from ordinary
business-user modification.

---

# 14. Contact and People Foundation

The Contact domain provides a reusable organization-owned people and
relationship foundation.

Contacts can represent multiple relationship types such as:

- Member
- Customer
- Employee
- Supplier
- Volunteer
- Donor
- Partner
- Other

Contacts can be associated with:

- Organization
- Branch
- Department

Future modules such as CRM, HR, supplier management and industry packs should
reuse this foundation where appropriate rather than create disconnected
duplicate identity models.

A Contact is not automatically equivalent to a User.

User identity and organizational relationship data must remain distinct where
their responsibilities differ.

---

# 15. Dashboard Foundation

The current dashboard architecture provides organization-scoped aggregated
insights.

The implemented foundation includes examples such as:

- Contact totals
- Contact status distribution
- Contact type distribution
- Organization-user statistics
- Branch statistics
- Department statistics
- Contact branch distribution

Dashboard aggregation is read-oriented.

Future architecture should expand this foundation into:

- Role-aware dashboards
- Team dashboards
- Department dashboards
- Branch dashboards
- Regional dashboards
- Executive Command Centre
- KPI framework
- Attention Centre
- Organization Health

Dashboard visibility must remain permission-aware and scope-aware.

---

# 16. Document Management Architecture

Sprint 010 established the current document foundation.

The Document domain includes:

- Organization ownership
- Optional branch assignment
- Optional department assignment
- Uploading user
- Title
- Description
- Original filename
- Generated stored filename
- Storage provider
- Storage key
- MIME type
- File extension
- File size
- SHA-256 checksum
- Document status
- Audit events

The current storage architecture uses a provider abstraction.

Implemented provider:

- Local Storage Provider

Target providers may include:

- Amazon S3-compatible storage
- Azure Blob Storage
- Other object-storage providers

Application services should depend on the storage abstraction rather than
directly on provider-specific filesystem or cloud APIs.

---

# 17. Document Security Architecture

Document security must protect both metadata and physical file storage.

Current controls include:

- Authentication
- Organization context
- Permission checks
- Tenant-scoped document lookup
- File-size validation
- MIME validation
- Extension validation
- Safe generated stored filenames
- SHA-256 checksums
- Organization-isolated storage paths
- Path-traversal protection
- Controlled download
- Controlled deletion
- Audit logging

Original filenames must not control physical storage paths.

Storage keys must be generated and managed by trusted backend logic.

Physical file replacement should not occur through uncontrolled metadata
updates.

Future physical replacement should use controlled document-version
architecture.

---

# 18. Current Document Extension Points

The Sprint 010 architecture intentionally supports future expansion.

Planned extension points include:

- Generic entity attachments
- Contact attachments
- Employee files
- Ticket attachments
- Workflow attachments
- Request attachments
- Document versions
- Version history
- Folder hierarchy
- Records management
- Retention
- Expiry
- Obligations
- OCR
- Content extraction
- Search
- Document preview
- Knowledge management

These future capabilities should reuse the existing storage, permission,
audit and tenant-isolation foundations.

---


# 19. Shared Platform Engine Architecture

Future ORNEXIS ONE capabilities should be built around reusable platform
engines rather than isolated module-specific implementations.

A shared engine should be introduced when multiple domains require the same
fundamental capability.

Examples include:

- Workflow Engine
- Approval Engine
- Notification Engine
- SLA Engine
- Attachment Framework
- Search Engine
- Audit Engine
- KPI Framework
- Accountability Engine
- Attention Engine

Industry packs and business modules should consume these engines rather than
reimplement them independently.

---

# 20. Generic Entity Relationship and Attachment Architecture

Many ORNEXIS ONE capabilities will need relationships between documents,
people, requests, tickets, assets, workflows and other records.

The target architecture should therefore support reusable entity
relationships.

Conceptually:

Entity
    |
    +-- Relationship
    |
    +-- Attachment
    |
    +-- Activity
    |
    +-- Audit

A generic relationship architecture may support relationships such as:

- Contact -> Document
- Employee -> Document
- Ticket -> Document
- Request -> Document
- Asset -> Document
- Supplier -> Document
- Customer -> Document
- Workflow Instance -> Document
- Decision -> Document
- Obligation -> Document

Generic relationships must remain:

- Tenant-safe
- Permission-aware
- Type-safe
- Auditable
- Extensible

The framework must not allow arbitrary entity identifiers to bypass ownership
or authorization checks.

---

# 21. Workflow and Approval Architecture

The target Workflow Engine provides reusable orchestration for business
processes.

A workflow may contain:

- Trigger
- Steps
- Assignees
- Conditions
- Decisions
- Approvals
- Rejections
- Escalations
- Notifications
- Due dates
- SLA rules
- Completion rules
- Audit events

Workflow definitions should be configurable where practical.

Workflow execution should preserve historical state even when a workflow
definition later changes.

Approval logic should be reusable across capabilities such as:

- Procurement
- Finance
- HR
- Requests
- Documents
- Access requests
- Customer processes
- Industry-specific operations

The workflow engine should orchestrate domain actions.

It should not absorb all domain business logic.

---

# 22. Request Centre Architecture

The Request Centre is the target universal entry point for structured
organizational requests.

Examples include:

- Leave requests
- Purchase requests
- Access requests
- Equipment requests
- Maintenance requests
- Document requests
- Service requests
- Approval requests
- Industry-specific requests

Requests may integrate with:

- Workflow
- Approvals
- Notifications
- SLA
- Documents
- Assets
- HR
- Finance
- Service Desk

Request types should be configurable.

Request visibility must respect organizational scope and permissions.

---

# 23. Notification Architecture

Notifications are a shared platform service.

Target channels include:

- In-app
- Email
- SMS
- Push notifications

Notification producers should publish meaningful business events or invoke a
shared notification service rather than implement delivery logic separately
inside every module.

Notification architecture should support:

- Templates
- Recipients
- Channels
- Delivery status
- Retry handling
- Preferences
- Escalation
- Localization
- Auditability where required

Sensitive information must not be exposed through a notification channel
without considering the security characteristics of that channel.

---

# 24. Service Desk Architecture

The Service Desk is a reusable service-management capability.

Target concepts include:

- Tickets
- Ticket categories
- Priorities
- Queues
- Assignment
- Ownership
- Status
- Comments
- Attachments
- SLA
- Escalations
- Service catalogue
- Request relationships
- Knowledge relationships
- Audit history

The Service Desk should support internal organizational services as well as
customer-facing support where configured.

Service Desk architecture should integrate with:

- Contacts
- Organization users
- Teams
- Assets
- Documents
- Notifications
- Workflow
- Knowledge
- Reporting
- Attention Centre

---

# 25. SLA Architecture

SLA management should be implemented as a reusable timing and service-control
capability.

An SLA may define:

- Response target
- Resolution target
- Business hours
- Priority
- Service
- Escalation rules
- Pause conditions
- Breach conditions

SLA state may contribute to:

- Ticket prioritization
- Notifications
- Escalations
- Dashboards
- Attention Centre
- Accountability
- Organization Health

SLA calculations must be deterministic and explainable.

---

# 26. Asset and Technology Operations Architecture

The target Asset capability manages organizational resources throughout their
lifecycle.

Asset domains may include:

- Devices
- Equipment
- Infrastructure
- Software
- Licenses
- Vehicles
- Facilities-related assets
- Other configurable asset classes

Lifecycle concepts may include:

- Acquisition
- Registration
- Assignment
- Custody
- Location
- Maintenance
- Compliance
- Warranty
- Licensing
- Transfer
- Return
- Retirement
- Disposal

Assets may relate to:

- Users
- Employees
- Branches
- Departments
- Sites
- Tickets
- Documents
- Suppliers
- Finance
- Security integrations

Technology assets may later receive compliance and security posture signals
from external systems.

---

# 27. CRM and Relationship Architecture

CRM should build upon the existing Contact foundation.

Target CRM concepts include:

- Organizations and customer accounts
- Contacts
- Leads
- Opportunities
- Activities
- Follow-ups
- Communications
- Customer requests
- Complaints
- Sales pipelines
- Relationship history

CRM data should integrate with:

- Documents
- Workflow
- Notifications
- Finance
- Service Desk
- Reporting
- Attention Centre
- Organization Health

CRM must not create a parallel disconnected representation of people when the
Contact foundation can be reused safely.

---

# 28. Human Resources Architecture

HR should build upon shared identity, contact, document, workflow and
organizational structure capabilities.

Target HR concepts include:

- Employee records
- Employment lifecycle
- Organizational assignment
- Contracts
- Employee documents
- Leave
- Attendance
- Training
- Performance
- Policies
- Onboarding
- Offboarding

Employee onboarding and offboarding should orchestrate multiple shared
capabilities.

For example:

Employee Lifecycle
    |
    +-- Identity
    +-- Organizational Assignment
    +-- Documents
    +-- Assets
    +-- Access
    +-- Workflow
    +-- Notifications
    +-- Training
    +-- Audit

Offboarding must support accountable return and revocation processes.

---

# 29. Finance Architecture

Finance requires stronger historical-integrity controls than ordinary
operational records.

Target finance concepts may include:

- Accounts
- Transactions
- Ledger
- Payments
- Receipts
- Expenses
- Income
- Budgets
- Reconciliation
- Financial approvals
- Financial reporting

Financial architecture should prefer immutable or reversal-based accounting
patterns where historical integrity requires them.

Posted financial history should not be casually overwritten.

Finance must integrate with:

- Permissions
- Workflow
- Approvals
- Audit
- Documents
- Contacts
- Suppliers
- Customers
- Reporting
- Organization Health

Industry-specific finance capabilities should extend shared financial
foundations rather than create incompatible ledgers.

---

# 30. Knowledge and Enterprise Search Architecture

Organizational knowledge should connect structured records and controlled
content.

Target knowledge capabilities include:

- Knowledge articles
- Policies
- Procedures
- Guides
- FAQs
- Operational documentation
- Linked documents
- Version-aware knowledge
- Classification
- Ownership

Enterprise search should provide permission-aware discovery across supported
platform domains.

Search results must never expose information the requesting user is not
authorized to access.

Search architecture should therefore preserve:

- Organization boundaries
- Permissions
- Organizational scope
- Data classification
- Entity visibility
- Document visibility

Search indexing must not become a security bypass around the source system.

---

# 31. Governance, Risk and Resilience Architecture

Governance capabilities should provide reusable structures for organizational
control.

Target concepts include:

- Risks
- Controls
- Obligations
- Decisions
- Policies
- Reviews
- Evidence
- Expiry
- Compliance actions
- Continuity plans
- Recovery plans
- Exercises
- Incidents
- Lessons learned

The Decision Register should preserve significant organizational decisions,
including appropriate context, ownership and supporting evidence.

Expiry and Obligation Management should surface time-sensitive commitments
before they become failures.

Business Continuity and Resilience should connect plans with responsible
people, assets, systems, suppliers, locations and recovery actions.

---

# 32. Accountability Engine Architecture

The Accountability Engine is a shared ORNEXIS ONE platform capability for
preserving responsibility, ownership, commitments and follow-through across
organizational operations.

Accountability must not be implemented independently inside every module.

The shared architecture should support concepts such as:

- Responsible person
- Responsible team
- Responsible department
- Responsible branch
- Due date
- Expected outcome
- Current status
- Escalation state
- Completion evidence
- Related records
- Audit history

The Accountability Engine may eventually connect to:

- Tasks
- Requests
- Approvals
- Service Desk tickets
- Decisions
- Risks
- Compliance actions
- Obligations
- Customer activities
- Employee actions
- Asset actions
- Financial controls
- Projects
- Business continuity actions

Accountability records must remain organization-scoped and permission-aware.

The engine should make it possible to answer questions such as:

- Who owns this?
- What is overdue?
- What has not been followed up?
- What was promised?
- When was it due?
- Was it completed?
- What evidence exists?
- Who needs to be informed?
- What requires escalation?

The Accountability Engine should feed future dashboards, the Attention Centre,
organizational health and explainable intelligence.

---

# 33. Attention Centre Architecture

The Attention Centre is the shared platform capability responsible for
surfacing operational conditions that require human attention.

It should not simply become another notification inbox.

Notifications communicate events.

The Attention Centre identifies conditions that may require action.

Potential attention items include:

- Overdue work
- SLA breach risk
- Expiring obligations
- Unresolved critical incidents
- Missing approvals
- Unassigned requests
- Customer follow-up gaps
- Security concerns
- Asset compliance issues
- Financial exceptions
- Risk-treatment delays
- Employee onboarding gaps
- Business continuity actions
- Repeated operational failures

Attention items should contain sufficient context to explain:

- What happened
- Why it matters
- Severity
- Responsible scope
- Responsible owner where applicable
- Related record
- Required or recommended action
- Due date where applicable
- Current state

The Attention Centre must be:

- Organization-scoped
- Permission-aware
- Structure-aware
- Classification-aware
- Auditable where required

Future intelligence may prioritize attention items, but deterministic business
rules must remain available for critical operational controls.

---


# 34. Hierarchical Organization Health Architecture

Organization Health is a hierarchical, role-aware and permission-aware
intelligence capability.

It must not be designed as a CEO-only dashboard.

The conceptual hierarchy is:

Organization
    |
Region / Organizational Unit
    |
Branch
    |
Department
    |
Team
    |
Individual Work Context

The exact hierarchy must remain configurable because organizations differ in
structure.

Health may be calculated at multiple organizational scopes.

Examples include:

- Organization health
- Regional health
- Branch health
- Department health
- Team health

Individual users may receive a personal work overview rather than an
organizational health score.

---


Possible Organization Health inputs include:

- KPI performance
- SLA compliance
- Overdue work
- Open critical incidents
- Security posture
- Asset compliance
- Customer follow-up
- Financial control indicators
- Risk exposure
- Compliance obligations
- Workflow delays
- Service performance
- Workforce indicators
- Industry-specific indicators

Health scores must not be arbitrary.

The architecture must support weighted scoring and contribution analysis.

A higher-level score may be informed by lower-level operational indicators,
but must not necessarily be a simple mathematical average.

Different indicators may have:

- Weight
- Severity
- Threshold
- Direction
- Scope
- Data source
- Evaluation period
- Confidence
- Business importance


Health calculations must preserve permission boundaries.

A manager may be authorized to see a summarized health indicator without being
authorized to inspect the confidential records that contributed to it.

For example:

Finance Health: 71/100

does not automatically grant access to:

- Salaries
- Restricted financial transactions
- Confidential financial documents
- Sensitive employee records

The health architecture therefore separates:

Indicator Evaluation
    |
Health Contribution
    |
Aggregated Health
    |
Permission-Aware Explanation

This separation is mandatory.

Health should support recursive organizational intelligence:

Operational Indicators
    |
Team Health
    |
Department Health
    |
Branch Health
    |
Regional Health
    |
Organization Health

Higher-level health must not simply average lower-level scores.

Contribution may depend on:

- Weight
- Severity
- Business criticality
- Trend direction
- Threshold breach
- Time sensitivity
- Organizational configuration
- Industry-specific rules

The platform should eventually be able to explain:

- Why a score changed
- Which indicators contributed most
- Which risks are worsening
- Which operational areas require attention
- Which areas are improving
- Which recommended actions may improve health

Organization Health must remain explainable, scope-aware and permission-aware.

---


# 35. Hierarchical Command Centre Architecture

The Command Centre is the role-aware operational intelligence surface built
upon ORNEXIS ONE data, permissions, organizational structure and health
indicators.

It must adapt to organizational responsibility.

It must not be designed only for executives.

Different roles should receive different views.

Examples:

Executive
    |
Organization-wide authorized intelligence

Regional Manager
    |
Assigned regional intelligence

Branch Manager
    |
Assigned branch intelligence

Department Head
    |
Assigned department intelligence

Team Leader
    |
Assigned team intelligence

Employee
    |
Personal work overview

The Command Centre should combine authorized information from capabilities
such as:

- Organization structure
- Dashboard metrics
- Workflow
- Requests
- Service Desk
- SLA
- Assets
- CRM
- HR
- Finance
- Documents
- Risks
- Obligations
- Decisions
- Accountability
- Attention Centre
- Security indicators
- Industry packs


The Command Centre must respect the user's organizational responsibility.

A department head should primarily receive intelligence relevant to the
department or departments they are authorized to manage.

A branch manager should receive equivalent intelligence for the branch or
branches within their authorized responsibility.

Regional managers may receive aggregated intelligence across authorized
branches or organizational units.

Executives may receive broader organization-wide intelligence according to
their permissions.

Team leaders should receive intelligence relevant to their assigned teams.

Employees should receive a work-focused view containing information such as:

- Assigned work
- Overdue work
- Requests
- Tickets
- Approvals
- Training due
- Assigned assets
- Relevant obligations
- Personal attention items

A summarized indicator must never automatically grant access to its underlying
restricted records.

Command Centre authorization should consider:

User
    +
Organization
    +
Role
    +
Permission
    +
Organizational Scope
    +
Data Classification
    +
Business Rule

For example, a manager may be authorized to see that another organizational
area has a critical health indicator without being authorized to inspect its
confidential records.

Drill-down access must therefore be independently authorized.

The Command Centre is an intelligence and presentation layer.

It is not an authorization bypass.


The Command Centre should eventually surface authorized information such as:

- Current health
- KPI status
- Risks
- SLA issues
- Overdue responsibilities
- Critical incidents
- Security concerns
- Asset concerns
- Workflow bottlenecks
- Request backlogs
- Customer concerns
- Workforce concerns
- Financial exceptions
- Compliance issues
- Expiring obligations
- Important decisions
- Trends
- Attention items
- Recommended actions
- Explainable score changes

The architecture should allow each management level to answer:

What requires my attention?

Why does it require my attention?

Who is responsible?

What changed?

What is the operational impact?

What action should happen next?

Where permissions allow, users should be able to move from summarized
intelligence into the underlying operational context.

The Command Centre should reuse existing platform engines and authoritative
records rather than creating duplicate operational data.

---


# 36. Configurable KPI Architecture

ORNEXIS ONE should provide a reusable KPI framework rather than hard-coding
performance indicators separately inside individual modules.

A KPI definition may eventually include:

- Name
- Description
- Organization
- Module
- Scope type
- Scope identifier
- Data source
- Calculation rule
- Target
- Warning threshold
- Critical threshold
- Unit
- Direction
- Weight
- Evaluation period
- Owner
- Visibility
- Effective dates
- Status

KPIs may be:

- Platform-defined
- Industry-pack-defined
- Organization-configured

Examples include:

- SLA Compliance
- Customer Follow-Up Rate
- Ticket Resolution Time
- Device Compliance
- Revenue Target Achievement
- Training Completion
- Obligation Compliance
- Asset Maintenance Compliance

The KPI framework should eventually feed:

- Dashboards
- Reports
- Command Centre
- Organization Health
- Attention Centre
- Daily Brief
- Trend analysis

KPI calculations must be reproducible and explainable.

KPI visibility must respect:

- Tenant isolation
- Role
- Permission
- Organizational scope
- Data classification

Industry packs should be able to introduce KPI definitions without requiring
changes to the universal KPI engine.

---


# 37. Explainable Organizational Intelligence Architecture

ORNEXIS ONE intelligence must be explainable.

The platform should not present organizational scores, warnings,
recommendations or AI-generated conclusions without sufficient supporting
context.

Users should be able to understand why the platform reached an operational
conclusion.

Explainable intelligence should support questions such as:

- Why is this health score 74?
- Why did the score decrease?
- Which indicators contributed most?
- What changed since the previous period?
- Which department is affecting organization health?
- Why is this item considered critical?
- Which SLA breaches contributed to this warning?
- Which obligations are approaching failure?
- What data supports this recommendation?
- What action could improve the situation?

The architecture should conceptually separate:

Authoritative Operational Data
    |
    v
Deterministic Metrics and Rules
    |
    v
KPI Evaluation
    |
    v
Health and Attention Evaluation
    |
    v
Intelligence and Recommendations
    |
    v
Permission-Aware Explanation

Authoritative records remain the source of truth.

AI must not become the source of truth for organizational facts.

Where deterministic calculations exist, ORNEXIS should preserve the inputs,
rules, thresholds and resulting calculations necessary to explain the output.

An explanation may eventually include:

- Current value
- Previous value
- Target
- Threshold
- Weight
- Trend
- Contributing indicators
- Contributing organizational scopes
- Related operational records
- Time period
- Severity
- Data source
- Calculation method
- Recommended action

For example:

Organization Health decreased from 89 to 86.

Primary contributors:

- Operations recorded three SLA breaches
- IT has two unresolved critical incidents
- Sales follow-up compliance decreased by 11%

The explanation must only expose underlying information that the requesting
user is authorized to access.

A user may therefore be authorized to see:

Finance Health: 71/100

without being authorized to inspect:

- Individual salaries
- Restricted transactions
- Confidential financial documents
- Sensitive employee information

This distinction is mandatory.

Explanation generation must respect:

- Organization
- Role
- Permission
- Organizational scope
- Data classification
- Record-level authorization where applicable

Future AI capabilities may summarize, correlate and recommend actions from
authorized information.

AI-generated recommendations must be distinguishable from authoritative
business records and deterministic platform calculations.

The architecture should preserve enough provenance for important intelligence
outputs to identify:

- Which data contributed
- Which rules contributed
- When evaluation occurred
- Which scope was evaluated
- Which calculation or intelligence version was used

This allows organizational intelligence to remain trustworthy, auditable and
explainable as ORNEXIS ONE becomes more intelligent.

---


# 38. Daily Brief Architecture

The Daily Brief is a role-aware operational summary capability.

Its purpose is to answer:

What do I need to know today?

The Daily Brief should not create independent business logic.

It should summarize authorized information produced by existing platform
capabilities.

Potential sources include:

- Accountability Engine
- Attention Centre
- Workflow Engine
- Request Centre
- Service Desk
- SLA Engine
- KPI Framework
- Organization Health
- CRM
- HR
- Finance
- Assets
- Risks
- Obligations
- Security indicators

Brief content may include:

- Work due today
- Overdue work
- Approvals waiting
- Requests requiring action
- SLA risks
- Critical incidents
- Expiring obligations
- Customer follow-ups
- Asset concerns
- Security concerns
- KPI changes
- Health changes
- Financial exceptions
- Risk changes
- Recommended attention items

The Daily Brief must be personalized according to:

- Organization
- Role
- Permission
- Organizational scope
- Responsibility
- Data classification

An executive may receive:

- Organization Health movement
- Critical risks
- Major SLA issues
- Significant financial indicators
- Department attention areas

A department head may receive:

- Department Health
- Department KPIs
- Overdue responsibilities
- Approval bottlenecks
- Team workload
- Relevant risks

An employee may receive:

- Assigned tasks
- Due dates
- Requests
- Tickets
- Training due
- Assigned assets
- Personal attention items

The Daily Brief should remain explainable.

Where a brief item originates from a warning, score or recommendation, the
user should be able to understand the underlying authorized reason.

---


# 39. Advanced Identity and Conditional Access Architecture

ORNEXIS ONE authentication must evolve beyond basic username and password
authentication while preserving a centralized identity architecture.

Advanced identity capabilities should be introduced through the shared
authentication and security layer rather than independently inside business
modules.

Target authentication capabilities include:

- Password authentication
- Multi-factor authentication
- Passkeys
- Single Sign-On
- OAuth and OpenID Connect
- Microsoft identity integration
- Google identity integration
- SAML-based enterprise authentication
- Session management
- Authentication policy enforcement
- Account recovery controls

Organizations should eventually be able to configure authentication policies
according to their security requirements.

---

## Trusted Device Architecture

ORNEXIS ONE should support trusted-device awareness.

A trusted-device model may eventually preserve information such as:

- Organization
- User
- Device identifier
- Device name
- Device type
- Operating system
- Browser or client
- First-seen time
- Last-seen time
- Trust state
- Trust establishment method
- Trust expiry
- Revocation state
- Security metadata

Device trust must not be based only on a user-controlled device name.

Trust establishment should require an appropriate verified mechanism.

Users and authorized administrators should eventually be able to review and
revoke trusted devices.

---

## Conditional Access

Conditional access should evaluate contextual security signals before
allowing or restricting sensitive access.

Potential signals include:

- User identity
- Organization
- Role
- Permission
- Device trust
- Authentication strength
- Session state
- Network context
- Geographic context
- Risk indicators
- Requested resource
- Requested action
- Data classification
- Organizational security policy

Potential outcomes may include:

- Allow access
- Require MFA
- Require stronger authentication
- Require trusted device
- Restrict sensitive operation
- Deny access
- Require re-authentication
- Generate security attention item
- Generate audit event

Conditional access decisions must be enforced by authoritative backend
security controls.

Frontend behavior may improve the user experience but must never become the
security boundary.

---

## Step-Up Authentication

Sensitive operations may require stronger authentication than ordinary
platform access.

Examples may include:

- Financial approvals
- Permission changes
- Security-policy changes
- Confidential document access
- High-risk exports
- Credential changes
- Sensitive administrative operations

The architecture should therefore support step-up authentication without
requiring users to establish entirely separate accounts or authentication
systems.

---

## Session Security

Session architecture should eventually support:

- Session identification
- Session revocation
- Device association
- Authentication-strength tracking
- Last activity
- Expiry
- Security-event correlation
- Administrative session termination

Security-sensitive identity events should be auditable.

Examples include:

- Successful login
- Failed authentication
- MFA challenge
- Trusted-device registration
- Trusted-device revocation
- Session revocation
- Password change
- Recovery event
- SSO authentication
- Conditional-access denial

Advanced identity architecture must remain:

- Multi-tenant
- Policy-driven
- Auditable
- Extensible
- Backend-enforced
- Compatible with enterprise identity providers

---


# 40. Security Ecosystem Integration Architecture

ORNEXIS ONE should integrate with external security platforms without
attempting to replace specialized security products.

The platform should act as an organizational security coordination,
visibility and intelligence layer where appropriate.

Potential security integrations include:

- SIEM platforms
- Firewalls
- Endpoint protection platforms
- EDR and XDR platforms
- Identity providers
- Vulnerability management platforms
- Network security platforms
- Email security platforms
- Cloud security platforms
- Security monitoring services
- Threat-intelligence services

---

## Integration Principle

External security systems remain authoritative for the security telemetry and
controls they own.

ORNEXIS ONE may consume, correlate, display and act upon authorized security
information where useful to organizational operations.

For example:

SIEM
    |
Security Event
    |
ORNEXIS Integration Layer
    |
Security Finding / Operational Context
    |
Attention Centre
    |
Accountability / Workflow
    |
Command Centre

ORNEXIS should not duplicate complete SIEM event stores merely to provide
organizational visibility.

Only information required for the ORNEXIS business capability should be
persisted.

---

## Security Integration Layer

Security integrations should use the shared integration architecture.

Supported patterns may eventually include:

- REST APIs
- Webhooks
- Event ingestion
- Scheduled synchronization
- Secure connector credentials
- Message or event queues
- Vendor-specific adapters

Vendor-specific behavior should remain behind integration adapters.

Core ORNEXIS business logic should not become tightly coupled to one security
vendor.

---

## Security Findings

Where external security information becomes operationally relevant, ORNEXIS
may create normalized security findings.

A finding may eventually include:

- Organization
- Source system
- Source reference
- Finding type
- Severity
- Status
- Detection time
- Affected asset
- Affected user
- Affected service
- Organizational scope
- Summary
- Recommended action
- Responsible owner
- Related records
- Resolution state

This normalized model allows different security products to participate in
shared ORNEXIS capabilities.

---

## Operational Integration

Security findings may eventually connect to:

- Assets
- Users
- Service Desk
- Incidents
- Workflow
- Accountability Engine
- Attention Centre
- Risk management
- Compliance
- Organization Health
- Command Centre
- Notifications
- Reporting

For example, a critical endpoint-security finding may:

- Identify the affected managed asset
- Create an Attention Centre item
- Open or relate to a Service Desk incident
- Assign responsibility
- Trigger an approved workflow
- Affect security-health indicators
- Appear in an authorized Command Centre

---

## Security Data Protection

Security telemetry may itself contain sensitive information.

Access must therefore respect:

- Tenant isolation
- Permission
- Organizational scope
- Data classification
- Integration-specific authorization

Integration credentials must never be exposed through ordinary API responses,
logs or frontend configuration.

Secrets should eventually be stored through an appropriate secrets-management
mechanism.

---

## Audit and Traceability

Important integration activity should be traceable.

Examples include:

- Connector creation
- Connector configuration changes
- Credential rotation
- Synchronization failure
- Security finding ingestion
- Security finding state change
- Automated operational action
- Integration disablement

ORNEXIS should preserve sufficient source references to correlate important
records with the originating external security platform.

---

## Architectural Boundary

ORNEXIS ONE is not intended to become:

- A firewall
- Antivirus software
- An EDR agent
- A packet-inspection engine
- A full SIEM replacement
- A vulnerability scanner

Instead, ORNEXIS should connect specialized security technology with the
organization's people, assets, responsibilities, workflows, risks,
accountability and management intelligence.

This allows security to become part of organizational operations without
duplicating specialized security infrastructure.

---


# 41. Integration and Extensibility Architecture

ORNEXIS ONE is an API-first platform and must be designed to integrate with
external systems without tightly coupling the universal core to individual
vendors.

Integrations should extend the platform rather than bypass its security,
authorization, audit and tenant-isolation architecture.

Potential integration categories include:

- Payment platforms
- Banking systems
- Accounting systems
- Email providers
- SMS providers
- Identity providers
- CRM platforms
- HR systems
- Document platforms
- Security platforms
- Government services
- Industry-specific systems
- Customer-owned applications
- Partner applications

---

## Integration Boundary

External systems should communicate with ORNEXIS ONE through controlled
integration boundaries.

Supported patterns may include:

- REST APIs
- Webhooks
- Event-driven integration
- Scheduled synchronization
- Import and export
- Secure service credentials
- Vendor adapters
- Future integration connectors

Business modules should not contain unnecessary vendor-specific logic.

Where possible:

External Provider
    |
    v
Integration Adapter
    |
    v
Shared ORNEXIS Service Boundary
    |
    v
Business Capability

This allows providers to change without redesigning the business capability.

---

## API-First Principle

Core ORNEXIS capabilities should expose stable service and API boundaries
where appropriate.

API operations must preserve the same security expectations as interactive
platform operations.

This includes:

- Authentication
- Tenant identification
- Authorization
- Validation
- Organizational scope
- Data classification
- Audit
- Rate and abuse controls where required

External access must never become a shortcut around normal platform security.

---

## Webhook Architecture

ORNEXIS ONE should eventually support outbound and inbound webhook patterns.

Outbound webhooks may notify authorized external systems about relevant
platform events.

Inbound webhooks may receive verified events from trusted external systems.

Webhook architecture should support:

- Organization ownership
- Endpoint configuration
- Event subscriptions
- Secret management
- Signature verification
- Delivery attempts
- Retry handling
- Failure state
- Delivery history
- Disablement
- Auditability

Webhook payloads must expose only information appropriate for the configured
integration and authorization context.

---

## Idempotency and Reliability

Integration operations may be retried.

The architecture should therefore support idempotency where duplicate
processing could cause incorrect business outcomes.

This is particularly important for:

- Payments
- Financial transactions
- Provisioning
- Workflow triggers
- External event ingestion
- Webhooks
- Synchronization jobs

Integration failures should be observable and recoverable without silently
corrupting organizational data.

---

## Integration Identity

Machine-to-machine access should use dedicated integration identities or
credentials rather than ordinary employee credentials.

Integration identities should eventually support:

- Organization ownership
- Explicit permissions
- Credential lifecycle
- Revocation
- Rotation
- Usage auditing
- Scope restrictions

An integration should receive only the access required for its intended
purpose.

---

## Extensibility

Industry packs and future platform extensions should reuse stable universal
core services rather than modifying foundational behavior unnecessarily.

Extensibility mechanisms may eventually include:

- Configuration
- Custom fields
- Workflow definitions
- API integrations
- Webhooks
- Event subscriptions
- Industry packs
- Provider adapters
- Controlled extension points

The preferred order remains:

Configuration
    |
    v
Shared Platform Capability
    |
    v
Integration / Extension
    |
    v
Custom Code Only When Necessary

This protects ORNEXIS ONE from customer-specific fragmentation.

---

## Integration Observability

Important integration activity should be observable.

The platform should eventually provide authorized visibility into:

- Integration status
- Last successful synchronization
- Failed synchronization
- Webhook delivery failures
- Credential problems
- Provider availability
- Processing errors
- Retry state

Operationally significant integration failures may feed:

- Attention Centre
- Service Desk
- Accountability Engine
- Notifications
- Command Centre
- Organization Health

Integration architecture must remain secure, tenant-aware, auditable,
replaceable and provider-neutral.

---


# 42. Configuration and Customization Architecture

ORNEXIS ONE should adapt to different organizations primarily through
configuration rather than customer-specific source-code changes.

Configuration is a core architectural capability.

The platform should distinguish between:

- Platform defaults
- Industry-pack defaults
- Organization configuration
- Authorized user preferences

Configuration must never weaken mandatory platform security, tenant isolation,
auditability or data-integrity controls.

---

## Configuration Scope

Configuration may eventually control capabilities such as:

- Organization settings
- Branding
- Enabled modules
- Organizational terminology
- Custom fields
- Workflow definitions
- Approval rules
- Request types
- Service Desk categories
- SLA policies
- Notification preferences
- KPI definitions
- Dashboard configuration
- Document classifications
- Retention rules
- Risk categories
- Asset categories
- CRM stages
- HR policies
- Finance configuration
- Industry-pack behavior

Configuration ownership must always be explicit.

---

## Configuration Hierarchy

Where appropriate, configuration may follow a layered model:

Platform Default
    |
    v
Industry Pack Default
    |
    v
Organization Configuration
    |
    v
Authorized User Preference

Lower layers may override higher layers only where the capability explicitly
allows it.

Security-critical platform controls must not become bypassable through tenant
configuration.

---

## Custom Fields

ORNEXIS ONE should support controlled custom fields where organizations need
additional structured information that does not justify changing the universal
database model.

A custom-field definition may eventually include:

- Organization
- Target entity type
- Field name
- Label
- Description
- Data type
- Required state
- Default value
- Validation rules
- Allowed values
- Visibility
- Editability
- Display order
- Active state

Potential field types may include:

- Text
- Long text
- Number
- Decimal
- Boolean
- Date
- Date and time
- Selection
- Multi-selection
- Reference
- URL
- Email
- Phone

Custom fields must remain organization-scoped.

---

## Custom Field Security

Custom fields may contain sensitive organizational information.

Their architecture should therefore support:

- Permission-aware visibility
- Permission-aware editing
- Data classification
- Audit where required
- Validation
- Tenant isolation

A custom field must not provide a mechanism for bypassing authorization or
storing uncontrolled executable logic.

---

## Configuration Validation

Configuration changes must be validated before becoming authoritative.

Invalid configuration should not be allowed to destabilize shared platform
capabilities.

Important configuration changes may require:

- Permission validation
- Approval
- Effective dates
- Audit events
- Version tracking
- Dependency validation

Where configuration affects business rules, ORNEXIS should preserve enough
context to determine which configuration was effective when an important
business action occurred.

---

## Industry-Pack Configuration

Industry packs should extend configuration rather than fork the universal
platform.

For example, a SACCO pack may introduce:

- Member terminology
- Contribution configuration
- Loan-related configuration
- SACCO-specific KPIs
- SACCO workflows
- SACCO reports

while continuing to reuse universal capabilities such as:

- Identity
- Permissions
- Documents
- Workflow
- Notifications
- Finance
- Reporting
- Audit
- Organization Health

This principle applies to all future industry packs.

---

## Architectural Boundary

Configuration should be preferred when organizational differences represent
policy, terminology, workflow, fields, thresholds or optional behavior.

Custom source code should be introduced only when the requirement represents
a genuinely reusable capability or an intentionally supported extension.

The preferred decision order is:

Can configuration solve it?
    |
    No
    v
Can an existing shared engine solve it?
    |
    No
    v
Should the universal platform gain a reusable capability?
    |
    No
    v
Should an industry pack provide it?
    |
    No
    v
Evaluate controlled extension or custom integration

This protects ORNEXIS ONE from becoming a collection of customer-specific
software variants.

---


# 43. Reporting, Export and Analytics Architecture

ORNEXIS ONE should provide shared reporting, export and analytical
capabilities across the platform.

Individual modules should contribute authorized data and report definitions
without independently implementing separate reporting engines.

The reporting architecture should support operational, management,
compliance and executive reporting.

---

## Reporting Sources

Reports may eventually consume authorized information from capabilities such
as:

- Organization structure
- Contacts
- Documents
- Workflow
- Requests
- Service Desk
- SLA
- Assets
- CRM
- HR
- Finance
- Risks
- Compliance
- Obligations
- Decisions
- Accountability
- KPIs
- Organization Health
- Industry packs

Reporting must use authoritative platform records.

---

## Report Types

The architecture should eventually support:

- Operational reports
- Management reports
- Executive reports
- Financial reports
- Compliance reports
- Audit reports
- SLA reports
- Asset reports
- Workforce reports
- CRM reports
- Risk reports
- Industry-specific reports
- Configurable reports

Reports may be:

- On-demand
- Scheduled
- Periodic
- Event-triggered where appropriate

---

## Report Definitions

A report definition may eventually include:

- Name
- Description
- Organization
- Report type
- Data source
- Filters
- Columns
- Grouping
- Sorting
- Aggregation
- Date range
- Organizational scope
- Required permission
- Output format
- Schedule
- Delivery configuration
- Active state

Platform-defined and industry-pack-defined reports may coexist with
organization-configured reports.

---

## Permission-Aware Reporting

Generating a report must never bypass ordinary authorization.

Report access must respect:

- Organization
- Role
- Permission
- Organizational scope
- Data classification
- Record-level authorization where applicable

A user must not gain access to restricted information merely because it is
included in a report definition.

Report generation should evaluate authorization at execution time.

---

## Export Architecture

ORNEXIS ONE should support controlled export of authorized organizational
data.

Potential formats include:

- CSV
- Excel
- PDF
- JSON where appropriate

Exports may contain sensitive information and should therefore support:

- Permission checks
- Scope checks
- Data classification
- Audit events
- Export-size controls
- Secure temporary storage where required
- Expiration of generated files
- Controlled download

Sensitive or unusually large exports may eventually require additional
approval or step-up authentication.

---

## Scheduled Reporting

Authorized users may eventually schedule recurring reports.

Scheduled reports should support:

- Organization ownership
- Report definition
- Schedule
- Recipient configuration
- Delivery method
- Last execution
- Next execution
- Failure state
- Audit history

Scheduled execution must preserve the appropriate authorization and security
model.

Reports must not continue exposing data after the underlying authorization
has been revoked.

---

## Analytics Architecture

Analytics should build upon trusted operational data rather than creating an
uncontrolled secondary source of organizational truth.

Analytical capabilities may eventually support:

- Aggregation
- Trends
- Comparisons
- Period analysis
- Performance analysis
- KPI analysis
- Operational patterns
- Organizational health analysis

Analytics may feed:

- Dashboards
- Command Centre
- Daily Brief
- Organization Health
- Reports
- Attention Centre
- Explainable intelligence

---

## Historical Interpretation

Where business meaning changes over time, reporting architecture should
preserve sufficient historical context to interpret past results correctly.

Examples may include:

- Organizational structure changes
- KPI-definition changes
- SLA-policy changes
- Workflow changes
- Configuration changes
- Financial-period changes

Historical reporting must not silently reinterpret past organizational
activity using incompatible current configuration.

---

## Reporting Performance

Complex reports should not degrade normal transactional platform operations.

As ORNEXIS ONE scales, the architecture may introduce:

- Background report generation
- Queued processing
- Cached aggregates
- Read-optimized models
- Materialized views
- Analytical stores where justified

Such optimization must preserve tenant isolation and authoritative data
lineage.

---

## Architectural Boundary

Reporting and analytics summarize and interpret operational data.

They should not become alternative systems for editing authoritative business
records.

The architectural flow should remain:

Authoritative Operational Records
    |
    v
Authorized Reporting / Analytics
    |
    +------> Reports and Exports
    |
    +------> Dashboards
    |
    +------> KPI Evaluation
    |
    +------> Organizational Intelligence

Reporting architecture must remain secure, explainable, auditable,
tenant-aware and reusable across the platform.

---


# 44. SaaS and Platform Administration Architecture

ORNEXIS ONE should support commercial multi-tenant SaaS operation without
mixing platform administration with ordinary tenant business operations.

The platform-administration layer is responsible for managing the ORNEXIS
service itself.

Tenant business modules remain responsible for organizational operations.

---

## SaaS Commercial Model

Target commercial capabilities may include:

- Tenant provisioning
- Subscription plans
- Trials
- Billing
- Renewals
- Upgrade
- Downgrade
- Suspension
- Reactivation
- Feature entitlements
- Usage controls
- Commercial administration

Commercial capability determines whether an organization is entitled to use a
platform feature.

Authorization determines whether a specific user may perform an action inside
that feature.

These are different concerns.

For example:

Subscription Entitlement:
Organization may use Service Desk.

User Authorization:
This user may create tickets.

Both conditions may need to be satisfied.

---

## Tenant Provisioning

Tenant provisioning should eventually coordinate:

- Organization creation
- Initial administrator
- Subscription state
- Enabled capabilities
- Default roles
- Default permissions
- Default configuration
- Industry pack where applicable
- Branding foundations
- Storage allocation
- Audit initialization

Provisioning must be repeatable and auditable.

Manual undocumented production provisioning should be avoided.

---

## Feature Entitlements

Feature entitlements may determine which capabilities are available to an
organization.

Examples may include:

- Service Desk
- Advanced reporting
- CRM
- HR
- Finance
- Industry packs
- Advanced security
- Integrations
- Mobile capabilities

Entitlements must not replace normal permissions.

An enabled module may still contain actions the current user is not permitted
to perform.

---

## Subscription State

Subscription state may eventually include:

- Trial
- Active
- Past due
- Suspended
- Cancelled
- Expired

Changes in commercial state should not silently destroy organizational data.

Suspension should normally restrict service access while preserving tenant data
according to retention and contractual policies.

---

## Platform Administration

Platform administrators may require capabilities such as:

- Tenant provisioning
- Subscription management
- Platform configuration
- Operational support
- Environment monitoring
- Release management
- Service health
- Billing administration
- Incident response

Platform-administration capabilities must be strongly separated from ordinary
organization-user capabilities.

---

## Administrative Access to Tenant Data

Being a platform administrator must not automatically imply unrestricted
access to tenant business data.

Any support or administrative access to tenant data should be:

- Explicitly designed
- Least-privileged
- Time-bounded where appropriate
- Purpose-limited
- Audited
- Revocable
- Visible to appropriate governance controls

Future support-access architecture may require customer approval or controlled
break-glass procedures for sensitive situations.

---

## Usage Metering

Where commercial plans depend on usage, ORNEXIS may eventually meter:

- Users
- Storage
- Documents
- Transactions
- API usage
- Notifications
- Integrations
- Industry-specific usage units

Metering must not become an authorization bypass or compromise tenant
isolation.

---

## Platform and Tenant Boundary

The architectural boundary is:

ORNEXIS Platform Administration
        |
        +-- Commercial state
        +-- Provisioning
        +-- Platform operations
        +-- Entitlements
        |
        v
Tenant Boundary
        |
        +-- Organization
        +-- Users
        +-- Roles
        +-- Permissions
        +-- Business Data
        +-- Operational Capabilities

Platform administration controls the service.

Tenant authorization controls organizational operations.

This separation is mandatory.

---


# 45. Deployment, Production and Experience Architecture

ORNEXIS ONE must evolve from a development platform into a secure,
observable, maintainable and commercially operable production service.

Production architecture must preserve the same principles established
throughout the platform:

- Security
- Tenant isolation
- Reliability
- Auditability
- Modularity
- Configuration
- Operational visibility
- Controlled change
- Data ownership

Deployment architecture must not weaken application-level security or tenant
boundaries.

---

## Deployment Model

ORNEXIS ONE is intended primarily as a web and cloud-delivered platform.

The target deployment model should support:

- Web application delivery
- API services
- Managed relational database infrastructure
- Object or managed document storage
- Background processing
- Scheduled jobs
- Integration workers
- Notification processing
- Observability services
- Secure configuration management
- Controlled deployment pipelines

The architecture should remain sufficiently portable to avoid unnecessary
dependency on one infrastructure provider.

---

## Environment Separation

ORNEXIS ONE should maintain controlled environment separation.

Typical environments may include:

Development
    |
    v
Testing / Integration
    |
    v
Staging
    |
    v
Production

Production data must not be casually copied into development or testing
environments.

Where representative test data is required, synthetic, anonymized or otherwise
appropriately protected data should be preferred.

Environment-specific configuration must remain outside application source
code where appropriate.

---

## Configuration and Secrets

Runtime configuration may include:

- Database connections
- Storage configuration
- Authentication settings
- Integration endpoints
- Email providers
- SMS providers
- Payment providers
- Identity providers
- Feature configuration
- Observability configuration

Secrets must not be committed to source control.

Sensitive configuration should eventually use an appropriate secrets-management
mechanism.

Secrets should support controlled rotation.

Application logs must not expose credentials, authentication tokens or other
sensitive secrets.

---

## Production Database Architecture

Production database architecture should support:

- Reliable persistence
- Controlled migrations
- Backup
- Recovery
- Monitoring
- Encryption
- Access control
- Performance observation
- Capacity planning

Database migrations must be treated as controlled production changes.

Destructive schema changes require explicit review and appropriate migration
planning.

Production migration procedures should consider rollback, compatibility and
data preservation.

---

## Storage Architecture

Document and attachment storage should eventually move from development-local
storage to production-capable managed or object storage.

The storage abstraction already established by the document-management
foundation should allow storage providers to change without rewriting
document-domain logic.

Production storage should support appropriate controls for:

- Organization isolation
- Encryption
- Access control
- Durability
- Backup or redundancy
- Retention
- Secure deletion
- Malware-scanning integration where required
- Signed or controlled access where appropriate

Storage identifiers must not become authorization mechanisms.

Authorization must remain enforced by ORNEXIS ONE.

---

## Background Processing

Some platform operations should not depend on synchronous HTTP requests.

Future background processing may support:

- Notification delivery
- Email processing
- SMS processing
- Webhook delivery
- Integration synchronization
- Document processing
- Scheduled evaluations
- SLA evaluation
- Expiry evaluation
- KPI evaluation
- Health evaluation
- Daily Brief generation
- Reporting jobs
- Audit-support processing

Background jobs must preserve:

- Organization context
- Authorization assumptions
- Idempotency where required
- Retry safety
- Traceability
- Error visibility

A failed background operation must not silently disappear.

---

## Observability

Production ORNEXIS ONE should provide sufficient observability to understand
platform behavior.

Observability should eventually include:

- Structured application logs
- Error monitoring
- Service health
- Database health
- Request performance
- Background-job health
- Integration health
- Storage health
- Authentication anomalies
- Resource utilization
- Deployment status

Operational telemetry must not expose tenant-sensitive information
unnecessarily.

---

## Health Checks

Services should expose appropriate operational health information.

Health checks may distinguish:

- Process availability
- Database connectivity
- Storage availability
- Queue availability
- Critical integration availability

Public health endpoints should reveal only the information appropriate for
their audience.

Detailed operational diagnostics should require controlled administrative
access.

---

## Reliability and Failure Handling

ORNEXIS ONE should assume that dependencies can fail.

Examples include:

- Database interruptions
- Storage failures
- Email-provider failures
- SMS-provider failures
- Payment-provider failures
- External API failures
- Identity-provider failures
- Queue failures
- Network interruptions

Architecture should therefore support appropriate:

- Timeouts
- Retries
- Idempotency
- Failure recording
- Recovery
- Escalation
- Operational visibility

External provider failure must not silently corrupt authoritative ORNEXIS
records.

---

## Backup and Recovery

Production architecture must support tested backup and recovery procedures.

Backup strategy should eventually cover:

- Database data
- Document metadata
- Stored documents where required
- Configuration required for recovery
- Critical operational state

Backup existence alone is insufficient.

Recovery procedures must be tested.

Recovery objectives should eventually define appropriate:

- Recovery Point Objectives
- Recovery Time Objectives

These may vary according to deployment tier and business criticality.

---

## Security Operations

Production security architecture should eventually include:

- Secure transport
- Encryption at rest where appropriate
- Secrets management
- Vulnerability management
- Dependency monitoring
- Security logging
- Access review
- Privileged-access controls
- Incident-response procedures
- Backup protection
- Secure deployment controls
- Security monitoring

Security controls must evolve with the maturity and risk profile of the
platform.

---

## Controlled Deployment

Production releases should use a controlled delivery process.

The conceptual flow is:

Source Control
    |
    v
Automated Validation
    |
    v
Build
    |
    v
Test
    |
    v
Security Checks
    |
    v
Deployment Approval
    |
    v
Production Deployment
    |
    v
Post-Deployment Verification

As the platform matures, deployment automation should reduce manual error
without eliminating appropriate control.

---

## Release Compatibility

Capability delivery should consider compatibility across:

- Database schema
- Backend services
- APIs
- Frontend applications
- Background workers
- Integrations
- Mobile clients where applicable

Breaking changes must be controlled.

External integrations should not be unexpectedly broken by ordinary platform
releases.

API versioning may be introduced where compatibility requirements justify it.

---

## Web Experience Architecture

The primary ORNEXIS ONE user experience should be delivered through a
responsive web application.

The frontend should consume authoritative backend APIs rather than duplicating
business rules.

Frontend responsibilities include:

- Presentation
- Navigation
- User interaction
- Client-side usability validation
- Authorized capability discovery
- Responsive experience
- Accessibility support
- Clear operational feedback

Backend services remain authoritative for:

- Authentication
- Authorization
- Tenant isolation
- Business rules
- Data validation
- Audit requirements
- State transitions

Hiding a frontend control is not authorization.

---

## Role-Aware Experience

The ORNEXIS ONE experience should adapt to the user's authorized work context.

Different users may require different:

- Navigation
- Dashboards
- Work queues
- Attention items
- Reports
- Actions
- Daily Briefs
- Command Centre views

Experience personalization must be derived from authorized capability and
organizational context.

It must never expose information merely because a frontend component exists.

---

## Responsive and Accessible Design

The platform should support practical use across common screen sizes.

Experience architecture should consider:

- Desktop
- Laptop
- Tablet
- Mobile browser

Accessibility should be treated as a platform quality concern rather than a
late visual enhancement.

Interfaces should progressively support:

- Keyboard navigation
- Clear focus states
- Semantic structure
- Readable contrast
- Understandable validation
- Accessible forms
- Appropriate assistive-technology compatibility

---

## Mobile Architecture

Native or dedicated mobile applications may be introduced when operational
value justifies them.

Mobile applications should reuse ORNEXIS APIs and authorization architecture.

Mobile development must not create an independent business-logic platform.

Potential mobile capabilities may include:

- Personal work
- Requests
- Approvals
- Service Desk
- Notifications
- Attention items
- Asset actions
- Field operations
- Daily Brief
- Limited management intelligence

Offline capability may be introduced selectively where business requirements
justify the additional synchronization complexity.

---

## Progressive Experience Evolution

ORNEXIS ONE should not attempt to build every final user experience before the
underlying capabilities exist.

Experience should evolve progressively:

Platform Foundations
    |
    v
Operational Capabilities
    |
    v
Unified Navigation
    |
    v
Role-Aware Workspaces
    |
    v
Attention and Daily Brief
    |
    v
Hierarchical Command Centre
    |
    v
Mobile and Advanced Experience

This keeps user experience aligned with authoritative platform capability.

---

## Production Readiness

A capability is not production-ready merely because its endpoints function.

Production readiness may require:

- Security review
- Tenant-isolation validation
- Permission validation
- Audit verification
- Migration safety
- Failure handling
- Observability
- Backup implications
- Performance consideration
- Documentation
- Operational procedures
- Deployment verification
- Regression testing

The required depth depends on the risk and maturity of the capability.

---

## Architectural Maturity Principle

ORNEXIS ONE should grow operational sophistication as real requirements
justify it.

The platform should avoid premature infrastructure complexity while also
avoiding architectural shortcuts that make production maturity impossible.

The preferred evolution is:

Simple
    |
    v
Correct
    |
    v
Secure
    |
    v
Observable
    |
    v
Reliable
    |
    v
Scalable
    |
    v
Highly Available Where Required

Complexity must be earned by real operational need.

---

## Final Architecture Principle

ORNEXIS ONE is not a collection of disconnected modules.

It is one organizational operating platform built from reusable, secure and
interoperable capabilities.

The architecture must preserve:

- One multi-tenant platform
- One security model
- One authorization philosophy
- One audit philosophy
- Shared platform engines
- Configurable organizational structure
- Reusable operational capabilities
- Controlled industry specialization
- API-first integration
- Explainable organizational intelligence
- Customer data ownership
- Production-grade operational discipline

Every future architectural decision should strengthen these properties rather
than weaken them.

The long-term architectural objective remains:

> ORNEXIS ONE becomes the trusted operating system for organizations.

---

# End of Document

**System Architecture Version:** 2.0
**Status:** ACTIVE
**Product:** ORNEXIS ONE

© ORNEXIS Technology Ltd.
