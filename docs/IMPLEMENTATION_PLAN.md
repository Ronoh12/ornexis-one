# ORNEXIS ONE

# Master Implementation Plan

**Version:** 2.0
**Status:** ACTIVE ROADMAP
**Product:** ORNEXIS ONE
**Company:** ORNEXIS Technology Ltd.
**Roadmap Model:** Capability-Based Incremental Delivery

---

# 1. Purpose

This document is the authoritative implementation roadmap for ORNEXIS ONE.

It translates the long-term product vision, architecture and product requirements
into an ordered, practical and maintainable engineering programme.

The roadmap exists to ensure that ORNEXIS ONE grows into a comprehensive
organizational operating platform without becoming fragmented,
industry-specific, over-engineered or dependent on hundreds of unnecessarily
small development sprints.

This document defines:

- What ORNEXIS ONE will become
- What capabilities belong to the universal platform core
- What capabilities belong to optional industry packs
- The order in which major platform capabilities should be introduced
- Dependencies between capabilities
- How related functionality should be grouped into implementation sprints
- Security and multi-tenancy expectations
- Architectural boundaries
- Long-term intelligence and automation capabilities
- Commercial and deployment evolution
- Definition of Done for implementation work

This roadmap is a living engineering document.

It may evolve as ORNEXIS ONE grows, but changes must preserve architectural
coherence, backwards compatibility where appropriate, security and the
long-term product vision.

---

# 2. Product Vision

ORNEXIS ONE is a secure, multi-tenant, modular and configurable
organizational operating platform.

Its purpose is to bring the major operational functions of an organization
into one connected environment while preserving strong security,
accountability, auditability and organizational data ownership.

The platform is intended to support organizations across different sectors
without requiring separate codebases for every industry.

Examples include:

- Businesses
- SACCOs
- Cooperatives
- NGOs
- Associations
- Schools
- Clinics
- Churches
- Community organizations
- Farming organizations
- Retail businesses
- Property businesses
- Professional service organizations
- Other configurable organization types

The long-term product principle remains:

> One Platform. Unlimited Possibilities.

---

# 3. Roadmap Philosophy

ORNEXIS ONE development follows capability-based incremental delivery.

Future development must avoid creating one sprint for every small feature.

Instead, related features should be grouped into coherent capability sprints
that produce meaningful platform outcomes.

A sprint may therefore implement several tightly related features when:

- They share the same business capability
- Their data models are closely related
- Their security model can be tested together
- Their implementation does not introduce excessive architectural risk
- They can be fully tested and documented as one controlled delivery

Sprint size must be determined by architectural coherence and implementation
risk, not by an arbitrary number of endpoints or database tables.

Large capabilities may still require multiple sprints when necessary.

Quality must never be sacrificed merely to reduce the number of sprints.

The roadmap therefore distinguishes between:

- Capability
- Milestone
- Sprint
- Feature
- Enhancement

Not every feature requires its own sprint.

---

# 4. Universal Core and Industry Packs

ORNEXIS ONE follows a universal-core plus industry-pack architecture.

The Universal Core contains capabilities useful across most organizations.

Examples include:

- Identity and access
- Organization structure
- Contacts and people
- Documents and records
- Workflow and approvals
- Tasks and accountability
- Service management
- Assets
- CRM
- HR
- Finance
- Communications
- Reporting
- Search
- Security
- Integrations
- Intelligence

Industry Packs extend the Universal Core with sector-specific terminology,
workflows, rules, reports and capabilities.

Examples may include:

- SACCO Pack
- Cooperative Pack
- NGO Pack
- School Pack
- Clinic Pack
- Retail Pack
- Property Pack
- Community Organization Pack
- Farming Pack

Industry Packs must reuse the Universal Core wherever possible.

They must not create separate ORNEXIS products or duplicate core architecture.

---

# 5. Configuration Before Custom Code

Customer-specific requirements should preferably be delivered through:

- Configuration
- Permissions
- Roles
- Custom fields
- Workflow definitions
- Templates
- Organization settings
- Industry packs
- Integrations
- Branding

rather than customer-specific source-code forks.

The objective is to maintain one sustainable ORNEXIS ONE platform capable
of serving many organizations.

---

# 6. Non-Negotiable Engineering Principles

Every ORNEXIS ONE capability must respect:

1. Multi-tenancy
2. Backend authorization
3. Least privilege
4. Auditability
5. Secure-by-design engineering
6. Organization ownership of tenant data
7. Branch and department scope where applicable
8. Data classification where applicable
9. Reusable architecture
10. API-first design
11. Cloud readiness
12. Mobile readiness
13. Maintainability
14. Observability
15. Controlled database migrations
16. Documentation
17. Regression testing

No feature should bypass these principles for implementation speed.

---

# 7. Capability Dependency Principle

Capabilities must be implemented in dependency order.

A later capability may depend on earlier platform foundations.

For example:

Identity and Permissions
        |
Organization Structure
        |
People / Contacts
        |
Documents / Records
        |
Workflow / Tasks / Service Management
        |
Assets / CRM / HR / Finance
        |
Reporting / Search / Intelligence
        |
Automation / AI / Industry Packs

This does not mean every capability must be completely finished before the
next begins.

It means foundational contracts must be sufficiently stable before dependent
capabilities rely on them.

---

# 8. Sprint Consolidation Rule

ORNEXIS ONE should not accumulate hundreds of micro-sprints simply because
the platform contains many features.

From Master Implementation Plan v2.0 onward, implementation should favor
larger capability-oriented sprints.

For example, instead of creating separate sprints for:

- Tasks
- Task comments
- Task assignments
- Task reminders
- Task escalation
- Task history

these may be delivered together as part of a coherent Work Management and
Accountability capability when technically appropriate.

Similarly, closely related security, document, workflow, service management,
asset or CRM functionality may be grouped together where dependencies allow.

However, a capability must be split when combining it would:

- Make testing unreliable
- Introduce excessive migration risk
- Create an unreviewable code change
- Weaken security validation
- Make rollback difficult
- Mix unrelated architectural concerns

The objective is:

> Fewer, stronger, meaningful sprints — not fewer controls.

---


# 9. Implementation Baseline

Master Implementation Plan v2.0 does not restart ORNEXIS ONE development.

It continues from the engineering foundation already completed under the
original implementation roadmap.

The following sprints form the established implementation baseline.

## Sprint 001 — Platform Foundation

**Status:** COMPLETE

Established:

- Repository structure
- Engineering documentation
- PostgreSQL foundation
- Prisma ORM
- API foundation
- Environment configuration
- Logging and error-handling foundations
- Initial engineering standards
- Git-based development workflow

---

## Sprint 002 — Database Foundation

**Status:** COMPLETE

Established the initial persistent domain foundation required by the
multi-tenant platform.

---

## Sprint 003 — Authentication

**Status:** COMPLETE

Established core identity and authentication capabilities including:

- User authentication
- Login
- Current-user identity
- Account activation foundations
- Token-based API authentication
- Protected endpoint foundations

---

## Sprint 004 — Organization Management

**Status:** COMPLETE

Established organization-level management capabilities and the tenant
boundary required by ORNEXIS ONE.

---

## Sprint 005 — Permission Engine

**Status:** COMPLETE

Established the reusable authorization foundation including:

- Roles
- Permissions
- Permission assignment
- Permission validation
- Backend authorization middleware
- Tenant-aware authorization

This capability remains a foundational dependency for all future modules.

---


## Sprint 006 — Organization Structure

**Status:** COMPLETE

Established reusable organizational structure including:

- Branches
- Departments
- Organization-scoped structure
- Structure validation
- Tenant-safe structure management

---

## Sprint 007 — Organization User Structure Assignment

**Status:** COMPLETE

Connected organization users to organizational structure and established
the foundation for scoped responsibility and future hierarchical access.

---

## Sprint 008 — Contact Management and Organization Structure

**Status:** COMPLETE

Established reusable contact-management capabilities and integration
between contacts and organizational structure.

This foundation can later support:

- Customers
- Members
- Employees
- Suppliers
- Donors
- Volunteers
- Partners
- Other organizational stakeholders

---

## Sprint 009 — Dashboard Foundation and Organization Insights

**Status:** COMPLETE

Established the initial dashboard and organizational-insight capability.

This foundation will later evolve into:

- Role-aware dashboards
- Team dashboards
- Department dashboards
- Branch dashboards
- Regional views
- Executive Command Centre
- Organization Health intelligence
- Attention Centre
- Configurable KPI surfaces

---

## Sprint 010 — Document Management Foundation

**Status:** COMPLETE

Established the secure document-management foundation including:

- Document metadata
- Controlled upload
- Controlled download
- Storage abstraction
- Local storage provider
- Organization-isolated storage
- File-size validation
- MIME-type validation
- File-extension validation
- SHA-256 checksums
- Safe generated storage filenames
- Branch assignment
- Department assignment
- Structural integrity validation
- Document permissions
- Upload auditing
- Update auditing
- Download auditing
- Delete auditing
- Secure physical-file deletion
- Tenant-isolation validation
- Cross-tenant security validation
- Path-traversal protection

The document foundation is intentionally extensible.

Future capabilities will build on this foundation for:

- Document versions
- Generic entity attachments
- Contact attachments
- Employee files
- Service Desk attachments
- Workflow attachments
- Records management
- Document classification
- Retention
- Expiry and obligations
- Knowledge management
- Enterprise search
- OCR and content extraction

---


# 10. Roadmap Transition Point

Sprint 010 marks the transition from the early foundation-building phase
into capability-based platform development.

The development model is now:

FOUNDATION DELIVERY
        |
        v
SPRINTS 001-010 COMPLETE
        |
        v
MASTER IMPLEMENTATION PLAN v2.0
        |
        v
CAPABILITY-BASED DELIVERY
        |
        v
CONNECTED ORGANIZATIONAL PLATFORM

Future roadmap capabilities must not automatically become individual sprints.

A major capability may:

- Fit into one consolidated sprint
- Share a sprint with tightly related capabilities
- Be introduced incrementally across several capability sprints
- Receive later enhancement work without reopening its original foundation
- Remain planned until its architectural dependencies are ready

The Master Implementation Plan is authoritative at the capability level.

Individual Sprint documents remain the detailed engineering execution plans.

This separation allows the product roadmap to remain stable while individual
implementation decisions evolve as the platform matures.

---

# 11. Roadmap Status Model

Every major roadmap capability should use one of the following states.

## FOUNDATION COMPLETE

A reusable technical foundation already exists, but the capability may still
receive substantial future functionality.

Examples at the Sprint 010 transition include:

- Authentication
- Organizations
- Permissions
- Organization structure
- Contacts
- Dashboard foundation
- Document management foundation

## PLANNED

The capability has been accepted into the ORNEXIS ONE roadmap but
implementation has not started.

## IN PROGRESS

Engineering implementation is currently active.

## CORE COMPLETE

The primary production-capable version of the capability has been delivered.

Future enhancements may still be introduced without changing this status.

## DEFERRED

The capability remains part of the product vision but has intentionally been
postponed because dependencies, priority, technical maturity or commercial
requirements do not yet justify implementation.

---

# 12. Roadmap Governance Rules

The Master Implementation Plan must be maintained as ORNEXIS ONE evolves.

New product ideas must not automatically create new sprints.

When a new requirement is accepted, it should first be classified as one of:

- Extension of an existing capability
- New universal-core capability
- Industry-pack capability
- Integration
- Security enhancement
- Platform/infrastructure enhancement
- Future research or experimental capability

The requirement should then be placed into the appropriate roadmap capability.

A new sprint should only be created when implementation is ready to begin.

This prevents the roadmap from becoming a list of hundreds of speculative
sprints.

Sprint numbering therefore represents implementation history, not the total
number of ideas within ORNEXIS ONE.

---

# 13. Requirement Preservation Rule

Accepted long-term ORNEXIS ONE requirements must not disappear simply because
they are not scheduled for immediate implementation.

Accepted requirements should be preserved within the Master Implementation
Plan under their appropriate capability area.

Detailed implementation design should normally be deferred until the
capability approaches implementation.

This keeps the roadmap comprehensive without prematurely designing every
future database table, API endpoint or user interface.

---


# 14. ORNEXIS ONE Capability Map

The long-term ORNEXIS ONE roadmap is organized into major capability groups.

These groups are not individual sprints.

They are permanent product domains under which related requirements,
features, enhancements and future sprint work are organized.

---

## Group A — Platform, Identity and Security

Includes:

- Authentication evolution
- Password and account security
- MFA
- Passkeys
- SSO
- Google and Microsoft identity integration
- SAML and enterprise identity
- Session management
- Trusted devices
- Conditional access
- Security policies
- Advanced authorization
- Scoped access
- Data classification
- Audit evolution
- Security event integration
- Firewall integration
- SIEM integration
- Endpoint-security integration

---

## Group B — Organization, People and Work

Includes:

- Organizations
- Branches
- Regions
- Departments
- Teams
- Organization users
- Contacts
- Responsibilities
- Work assignment
- Tasks
- Task dependencies
- Delegation
- Escalation
- Accountability tracking
- Personal work overview
- Team work overview

This group provides the organizational hierarchy required by many later
capabilities.

---

## Group C — Documents, Knowledge and Records

Includes:

- Document management
- Generic entity attachments
- Contact attachments
- Employee files
- Document versioning
- File replacement through controlled versions
- Folder and repository structures
- Document classification
- Records management
- Retention rules
- Expiry management
- Obligation management
- Organizational knowledge
- Knowledge articles
- Permission-aware enterprise search
- OCR
- Content extraction
- Document previews
- Future document templates

The Sprint 010 document foundation belongs to this capability group.

---

## Group D — Workflow, Requests and Approvals

Includes:

- Configurable workflow engine
- Workflow definitions
- Workflow states
- Workflow transitions
- Approval chains
- Multi-level approvals
- Conditional approvals
- Delegated approvals
- Escalations
- Workflow deadlines
- Workflow history
- Request Centre
- Request categories
- Request forms
- Request routing
- Request status
- Request attachments
- Request approvals
- Request fulfilment

This capability should become a reusable orchestration layer rather than
hard-coding approval logic independently inside every module.

---

## Group E — Service Management and Support Operations

Includes:

- Service Desk
- Tickets
- Ticket categories
- Priorities
- Queues
- Assignment
- Ticket comments
- Ticket attachments
- SLA policies
- SLA timers
- Escalations
- Incidents
- Service requests
- Problem-management foundations
- Service history
- Internal support
- External/customer support where enabled

Service Management should reuse workflow, notification, document and
accountability capabilities rather than duplicate them.

---

## Group F — Assets and Technology Operations

Includes:

- Asset register
- Asset categories
- Devices
- Hardware
- Software
- Software installations
- Licences
- Licence allocation
- Ownership
- Custody
- Assignment
- Check-in and check-out
- Asset lifecycle
- Procurement relationship
- Warranty
- Maintenance
- Repair history
- Disposal
- Device compliance
- Security posture
- Endpoint integration
- Infrastructure integration
- Asset-related incidents
- Asset-related documents

This group should support both general organizational assets and deeper IT
asset-management requirements.

---

## Group G — CRM and Relationship Management

Includes:

- Leads
- Prospects
- Customers
- Organizations
- Relationship history
- Opportunities
- Sales pipeline
- Activities
- Follow-ups
- Reminders
- Customer communications
- Complaints
- Customer documents
- Customer requests
- Customer service integration
- Conversion tracking
- Relationship ownership
- Configurable sales stages

CRM should build upon the shared Contact foundation instead of creating a
second disconnected customer identity model.

---


## Group H — Human Resources and Workforce

Includes:

- Employee records
- Employment lifecycle
- Organizational assignment
- Job roles
- Positions
- Contracts
- Employee documents
- Onboarding
- Offboarding
- Leave
- Training
- Skills
- Workforce compliance
- Performance foundations
- HR requests
- HR approvals
- Employee self-service
- Workforce reporting

HR should reuse:

- Contacts
- Documents
- Workflow
- Notifications
- Organization structure
- Permissions

rather than creating parallel foundations.

---

## Group I — Finance and Commercial Operations

Includes:

- Accounts
- Transactions
- Ledger
- Payments
- Receipts
- Expenses
- Income
- Financial categories
- Financial approvals
- Budgeting foundations
- Reconciliation foundations
- Organization billing
- Commercial controls
- Financial documents
- Financial reporting
- Auditability
- Historical financial integrity

Financial capabilities must preserve historical integrity and must not allow
business-critical financial history to be casually rewritten.

---

## Group J — Governance, Risk and Resilience

Includes:

- Decision Register
- Risks
- Controls
- Issues
- Findings
- Actions
- Policies
- Compliance obligations
- Evidence
- Exceptions
- Reviews
- Governance ownership
- Business continuity
- Recovery planning
- Resilience
- Critical-process identification
- Dependency mapping
- Continuity exercises
- Incident follow-up
- Governance reporting

This capability group should support both operational governance and future
industry-specific compliance requirements.

---

## Group K — Communications and Notifications

Includes:

- In-app notifications
- Email notifications
- SMS notifications
- Push notifications
- Notification templates
- Notification preferences
- Event-driven notifications
- Workflow notifications
- Approval notifications
- SLA notifications
- Reminder notifications
- Escalation notifications
- Digest notifications
- Delivery tracking
- Failure handling
- Provider abstraction

Notification logic should be centralized so individual modules do not build
independent communication engines.

---

## Group L — Reporting, Search and Intelligence

Includes:

- Operational reporting
- Management reporting
- Executive reporting
- Dashboards
- Charts
- PDF export
- Excel export
- KPI framework
- KPI definitions
- KPI ownership
- Trends
- Period comparison
- Permission-aware reporting
- Permission-aware enterprise search
- Cross-module search
- Organizational intelligence
- Attention Centre
- Daily Brief
- Recommendations
- Organization Health
- Command Centre
- Explainable AI-assisted insights

The Intelligence layer must build upon trustworthy operational data rather
than inventing disconnected scores.

---

### Hierarchical Organization Health and Command Centre

Organization Health must be hierarchical and scope-aware.

The conceptual hierarchy is:

Organization
    |
Region / Branch
    |
Department
    |
Team
    |
Individual Work Context

Different management levels should see health intelligence for the area they
are responsible for.

Examples:

- Executives may see organization-wide health
- Regional managers may see their regions
- Branch managers may see their branches
- Department heads may see their departments
- Team leaders may see their teams
- Employees may see a personal work overview

Health intelligence may incorporate:

- KPIs
- SLA performance
- Risks
- Incidents
- Overdue work
- Workflow delays
- Compliance obligations
- Asset issues
- Security posture
- Customer-service indicators
- Financial indicators
- HR indicators
- Industry-specific indicators

Health scores must not be simple unexplained averages.

Future scoring should support:

- Weighted indicators
- Severity
- Business criticality
- Trend direction
- Thresholds
- Time sensitivity
- Organization configuration
- Industry-specific weighting

ORNEXIS ONE should be able to explain:

- Why a score has changed
- Which indicators contributed most
- Which areas require attention
- Which risks are worsening
- Which recommended actions may improve the situation

The Health system must remain permission-aware.

A user may be allowed to see an aggregate health indicator without being
allowed to open confidential underlying records.

Authorization may consider:

- Role
- Permission
- Organization
- Region
- Branch
- Department
- Team
- Data classification
- Record sensitivity

---

### Accountability Engine

The Accountability Engine should connect responsibility to outcomes.

It may include:

- Assigned responsibility
- Tasks
- Commitments
- Due dates
- Ownership
- Dependencies
- Escalation
- Overdue work
- Completion evidence
- Follow-up
- Performance signals
- Accountability history

The Accountability Engine should feed relevant indicators into dashboards,
Attention Centre and Organization Health.

---

### Attention Centre

The Attention Centre should surface items requiring action.

Potential inputs include:

- Overdue tasks
- SLA risks
- Expiring obligations
- Failed workflows
- Critical incidents
- Security alerts
- Asset risks
- Customer complaints
- Approval bottlenecks
- Missing evidence
- Compliance concerns
- Business continuity risks

The Attention Centre should be prioritized and role-aware rather than becoming
a simple notification list.

---

## Group M — Integration and Automation Platform

Includes:

- REST APIs
- Webhooks
- External integration framework
- Integration credentials
- Integration configuration
- Event publishing
- Event consumption
- M-Pesa
- Banks and payment services
- Email providers
- SMS providers
- External CRM systems
- EDMS integrations
- HR systems
- Accounting systems
- Identity providers
- Firewall platforms
- SIEM platforms
- Endpoint-security platforms
- Device-management platforms
- Monitoring platforms
- Workflow triggers
- Automation actions
- Scheduled integrations
- Integration logging
- Failure handling
- Retry strategy

Integrations should use stable platform contracts rather than direct
cross-module database coupling.

---

## Group N — Industry Packs, SaaS, Deployment and Experience

Includes:

### Industry Packs

- SACCO
- Cooperative
- NGO
- School
- Clinic
- Retail
- Property
- Farming
- Community organizations
- Associations
- Other future sectors

Industry Packs may provide:

- Terminology
- Workflows
- Custom fields
- Reports
- Templates
- Rules
- Dashboards
- Integrations
- Sector-specific modules

### SaaS and Commercial Platform

- Subscription plans
- Billing
- Trials
- Tenant provisioning
- Feature entitlements
- Usage controls
- Commercial packaging
- Upgrade/downgrade flows
- Suspension
- Renewal
- Platform administration

### Deployment and Operations

- Cloud deployment
- Containers
- Object storage
- Environment management
- Backup
- Restore
- Disaster recovery
- Monitoring
- Logging
- Health checks
- Scaling
- Production security
- Release management

### User Experience and Mobile

- Responsive web experience
- Progressive Web App
- Mobile applications
- Push notifications
- Offline-capable workflows where appropriate
- Accessibility
- Role-aware navigation
- Organization branding
- Personalization

---


# 15. Post-Sprint-010 Delivery Roadmap

The completion of Sprint 010 marks the end of the initial foundation-building
sequence.

Future implementation follows larger capability-based delivery phases.

The purpose of this model is to:

- Deliver meaningful platform capabilities faster
- Reduce unnecessary micro-sprints
- Keep closely related architecture together
- Preserve engineering quality
- Maintain clear dependencies
- Allow ORNEXIS ONE to become operationally useful earlier
- Prevent the roadmap from expanding into hundreds of isolated feature sprints

A phase is not a sprint.

Each phase may contain several capability sprints.

A capability sprint may contain multiple related features, database changes,
APIs, permissions, audit events and supporting infrastructure when those
components form one coherent business capability.

---

## Phase 1 — Operational Core

### Objective

Transform the existing platform foundations into a usable organizational
work-management environment.

### Major capabilities

- Tasks and work items
- Ownership and assignment
- Due dates
- Priorities
- Status tracking
- Comments and activity
- Generic entity attachments
- Contact attachments
- Request Centre
- Request types
- Request submission
- Request assignment
- Workflow foundation
- Approval foundation
- Workflow states
- Approval decisions
- Escalation foundations
- Notification foundations
- In-app notifications
- Email notification foundations
- Accountability foundations

### Builds upon

- Authentication
- Organizations
- Permission Engine
- Organization Structure
- Contacts
- Dashboard Foundation
- Document Management Foundation
- Audit infrastructure

### Expected outcome

Organizations can begin coordinating real operational work inside ORNEXIS ONE.

---

## Phase 2 — Service and Technology Operations

### Objective

Introduce structured operational support and technology-management
capabilities.

### Major capabilities

- Service Desk
- Tickets
- Ticket categories
- Queues
- Assignment
- Priorities
- SLA policies
- SLA timers
- Escalations
- Ticket attachments
- Ticket activity history
- Assets
- Devices
- Software inventory
- Licenses
- Asset assignment
- Asset lifecycle
- Maintenance
- Warranty tracking
- Technology ownership
- Configuration foundations

### Expected outcome

ORNEXIS ONE can support internal IT, service operations and organizational
asset management.

---

## Phase 3 — People and Relationship Operations

### Objective

Expand the reusable people foundation into structured CRM and workforce
management.

### Major capabilities

- CRM accounts
- Leads
- Opportunities
- Customer interactions
- Follow-ups
- Relationship history
- Employee records
- Positions
- Employment information
- Employee documents
- Onboarding
- Offboarding
- Leave foundations
- Training
- Skills
- Employee self-service
- Workforce requests
- Workforce approvals

### Expected outcome

ORNEXIS ONE can manage both external organizational relationships and internal
workforce lifecycles.

---

## Phase 4 — Knowledge, Governance and Records

### Objective

Build the organizational memory, governance and obligation-management layer.

### Major capabilities

- Organizational knowledge
- Knowledge articles
- Permission-aware knowledge access
- Document folders
- Document versioning
- Records classification
- Retention foundations
- Expiry tracking
- Obligation management
- Policy management
- Decision Register
- Risks
- Controls
- Issues
- Findings
- Actions
- Evidence
- Compliance foundations
- Business continuity
- Recovery planning
- Resilience foundations

### Expected outcome

ORNEXIS ONE becomes a system of organizational record, knowledge,
responsibility and governance.

---

## Phase 5 — Finance and Commercial Operations

### Objective

Introduce reusable financial and commercial capabilities.

### Major capabilities

- Accounts
- Transactions
- Ledger
- Payments
- Receipts
- Income
- Expenses
- Financial categories
- Financial approvals
- Budget foundations
- Reconciliation foundations
- Financial documents
- Financial reports
- Payment integrations

### Engineering requirement

Financial history must preserve integrity and auditability.

Financial records must not be treated as ordinary mutable CRUD records.

### Expected outcome

ORNEXIS ONE can support controlled organizational financial operations.

---

## Phase 6 — Reporting and Organizational Intelligence

### Objective

Turn operational data into actionable organizational intelligence.

### Major capabilities

- Reporting framework
- Configurable reports
- PDF export
- Excel export
- KPI framework
- KPI ownership
- Trends
- Period comparisons
- Permission-aware enterprise search
- Cross-module search
- Accountability Engine
- Attention Centre
- Daily Brief
- Hierarchical Organization Health
- Command Centre
- Explainable recommendations
- AI-assisted organizational insights

### Intelligence hierarchy

Organization
    |
Region / Branch
    |
Department
    |
Team
    |
Individual Work Context

Health intelligence must remain permission-aware and explainable.

### Expected outcome

ORNEXIS ONE begins functioning as an organizational intelligence and
management platform rather than merely a collection of operational modules.

---

## Phase 7 — Advanced Security, Identity and Integrations

### Objective

Strengthen enterprise security and connect ORNEXIS ONE with external systems.

### Major capabilities

- MFA
- Passkeys
- Trusted devices
- Session management
- Conditional access
- SSO
- Microsoft identity integration
- Google identity integration
- Enterprise identity providers
- API credentials
- Webhooks
- Integration framework
- Integration monitoring
- Firewall integrations
- SIEM integrations
- Endpoint-security integrations
- Device-management integrations
- Monitoring integrations
- EDMS integrations
- CRM integrations
- HR integrations
- Accounting integrations
- M-Pesa
- Banking and payment integrations

### Expected outcome

ORNEXIS ONE becomes suitable for increasingly mature and security-conscious
organizations.

---

## Phase 8 — Industry Packs

### Objective

Transform the universal platform into configurable sector-specific solutions
without creating separate product codebases.

### Initial industry-pack candidates

- SACCO
- Cooperative
- NGO
- Association
- School
- Clinic
- Retail
- Property
- Farming
- Community organization

### Industry packs may configure

- Terminology
- Fields
- Workflows
- Dashboards
- Reports
- Permissions
- Templates
- Integrations
- Business rules
- Sector-specific capabilities

### Expected outcome

ORNEXIS ONE can serve multiple sectors while retaining one shared platform
architecture.

---

## Phase 9 — SaaS Commercialization and Production Operations

### Objective

Prepare ORNEXIS ONE for commercial multi-tenant operation.

### Major capabilities

- Tenant provisioning
- Subscription plans
- Billing
- Trials
- Feature entitlements
- Usage controls
- Upgrade and downgrade
- Renewal
- Suspension
- Platform administration
- Production deployment
- Object storage
- Backup
- Restore
- Disaster recovery
- Monitoring
- Centralized logging
- Release management
- Scaling
- Production security controls

### Expected outcome

ORNEXIS ONE becomes commercially deployable as a managed SaaS platform.

---

## Phase 10 — Experience, Mobile and Platform Maturity

### Objective

Provide mature user experiences across devices and operating environments.

### Major capabilities

- Mature web application
- Responsive experience
- Progressive Web App
- Mobile applications
- Push notifications
- Offline-capable workflows where justified
- Accessibility
- Role-aware navigation
- Organization branding
- Personalization
- Performance optimization
- User-experience refinement

### Expected outcome

ORNEXIS ONE provides a mature, accessible and deployable experience for
different organizational roles and environments.

---

# 16. Sprint Consolidation Strategy

Future sprints should implement coherent capability slices.

ORNEXIS ONE should avoid patterns such as:

Sprint X — Create task table

Sprint X+1 — Create task endpoint

Sprint X+2 — Add task permissions

Sprint X+3 — Add task comments

Sprint X+4 — Add task audit

when these components naturally belong to one controlled capability.

Instead, a capability sprint should normally include:

- Architecture
- Database design
- Migrations
- Services
- Controllers
- Routes
- Validation
- Permissions
- Audit
- Tenant isolation
- Security tests
- Regression tests
- Documentation

for the agreed capability scope.

Large capabilities may still be split when implementation risk justifies it.

The objective is not fewer sprints at any cost.

The objective is fewer unnecessary sprints while maintaining engineering
discipline.

---

# 17. Roadmap Dependency Principle

Implementation order must follow dependencies rather than feature excitement.

Examples:

Workflow should exist before advanced approval-dependent modules.

Notification infrastructure should exist before widespread automated
escalations.

Operational data should exist before advanced Organization Health scoring.

Document foundations should exist before records management and document
versioning.

Service Desk foundations should exist before mature SLA intelligence.

Assets should exist before advanced device-compliance intelligence.

Finance foundations should exist before financial-health intelligence.

Knowledge and permission foundations should exist before enterprise-wide
search.

Therefore, later phases may be partially prepared earlier, but dependencies
must not be bypassed.

---


# 18. Strategic Requirements Register

The Strategic Requirements Register preserves major ORNEXIS ONE product and
architecture requirements that must influence future implementation.

A requirement appearing in this register does not mean that it must be
implemented immediately.

Instead, it means:

- The requirement is part of the approved long-term product direction
- Future architecture must not unnecessarily block it
- It must be considered when related capabilities are designed
- It should be introduced when its architectural dependencies are ready
- It must not disappear merely because it is outside the scope of the current sprint

This register may evolve as the product vision develops.

---

## SR-001 — Industry-Neutral Multi-Tenant Core

ORNEXIS ONE must remain an industry-neutral platform at its architectural core.

Industry-specific behaviour should normally be introduced through:

- Configuration
- Industry packs
- Custom fields
- Workflows
- Permissions
- Templates
- Terminology
- Integrations
- Business rules

Separate sector-specific codebases should be avoided.

---

## SR-002 — Industry Packs

ORNEXIS ONE must support optional industry packs capable of extending the
universal core for sectors such as:

- SACCOs
- Cooperatives
- NGOs
- Associations
- Schools
- Clinics
- Retail
- Property
- Farming
- Community organizations
- Other future sectors

Industry packs must build upon the universal platform rather than duplicate it.

---

## SR-003 — Service Desk and SLA Management

ORNEXIS ONE should provide reusable service-management capabilities including:

- Tickets
- Queues
- Categories
- Priorities
- Assignment
- Ownership
- SLA policies
- SLA timers
- Escalations
- Activity history
- Attachments
- Service reporting
- SLA intelligence

The capability should support internal IT as well as other organizational
service functions where appropriate.

---

## SR-004 — Trusted Device and Conditional Access

The security architecture must support future introduction of:

- Trusted devices
- Device registration
- Device trust state
- Session visibility
- Session revocation
- Conditional access
- Authentication risk signals
- Context-aware access decisions

These controls must complement rather than replace authorization.

---

## SR-005 — Advanced Authentication

ORNEXIS ONE should progressively support:

- Multi-factor authentication
- Passkeys
- Microsoft identity
- Google identity
- Enterprise SSO
- SAML or equivalent enterprise federation
- Strong session management
- Recovery controls

Authentication strength should be configurable according to organizational
security requirements.

---


## SR-006 — Security Ecosystem Integrations

ORNEXIS ONE should support integrations with security and technology
platforms where justified, including:

- Firewalls
- SIEM platforms
- Endpoint-security platforms
- Endpoint management
- Device-management platforms
- Monitoring systems
- Identity providers
- Security-alert sources

Security integrations should feed controlled operational workflows and
intelligence rather than merely display disconnected external data.

---

## SR-007 — Asset and Technology Lifecycle Management

ORNEXIS ONE should provide lifecycle management for:

- Physical assets
- IT devices
- Software
- Licenses
- Assignment
- Ownership
- Procurement references
- Maintenance
- Warranty
- Renewal
- Compliance
- Retirement
- Disposal

Assets should eventually integrate with employees, departments, branches,
Service Desk, security and financial records where appropriate.

---

## SR-008 — Configurable Workflow and Approval Engine

Workflow must become a reusable platform capability rather than being
reimplemented separately inside every module.

The engine should progressively support:

- Workflow definitions
- States
- Transitions
- Assignment
- Approval steps
- Rejection
- Return for changes
- Escalation
- Conditions
- Deadlines
- Notifications
- Audit history
- Multi-step approvals
- Role-aware approvals
- Branch-aware approvals
- Department-aware approvals

Modules should consume the workflow engine where appropriate.

---

## SR-009 — Request Centre

ORNEXIS ONE should provide a centralized Request Centre through which users
can submit and track organizational requests.

Examples may include:

- IT requests
- HR requests
- Procurement requests
- Finance requests
- Access requests
- Administrative requests
- Asset requests
- Leave requests
- Other configurable organizational requests

Request types should be configurable and capable of connecting to workflow,
approval, SLA, notification and accountability capabilities.

---

## SR-010 — Accountability Engine

ORNEXIS ONE should provide an Accountability Engine that connects:

- Responsibility
- Ownership
- Assignment
- Deadlines
- Commitments
- Approvals
- Requests
- Tasks
- Tickets
- Obligations
- Decisions
- Escalations
- Completion evidence

The platform should make it possible to determine:

- Who owns an item
- What is expected
- When it is due
- Whether action has occurred
- What is overdue
- What is blocked
- What has been escalated
- What evidence supports completion

The Accountability Engine should become a cross-module capability rather than
a standalone isolated feature.

---


## SR-011 — Attention Centre

ORNEXIS ONE should provide a permission-aware Attention Centre.

Its purpose is to surface what requires a user's attention without forcing
the user to inspect every module manually.

Potential signals include:

- Overdue work
- Approvals awaiting action
- SLA risks
- Expiring documents
- Expiring licenses
- Security concerns
- Unresolved incidents
- Customer follow-ups
- Compliance obligations
- High-risk issues
- Workflow bottlenecks
- Failed integrations
- Operational anomalies

Attention signals must respect role, responsibility, organizational scope and
data classification.

---

## SR-012 — Organizational Knowledge

ORNEXIS ONE should provide a controlled organizational knowledge capability.

This may include:

- Knowledge articles
- Procedures
- Policies
- Guides
- Frequently asked questions
- Operational instructions
- Internal references
- Department knowledge
- Service knowledge
- Industry-specific knowledge

Knowledge must support permission-aware access and future enterprise search.

---

## SR-013 — Permission-Aware Enterprise Search

ORNEXIS ONE should eventually provide enterprise-wide search across supported
platform data.

Search must never become a mechanism for bypassing authorization.

Search results must respect:

- Organization
- Role
- Permission
- Branch
- Department
- Entity ownership where applicable
- Data classification
- Module-specific business rules

A user may only discover information that the user is authorized to discover.

---

## SR-014 — Document and Records Management

The Document Management Foundation introduced in Sprint 010 must evolve into
a broader document and records capability.

Future capabilities may include:

- Document versioning
- Version history
- Folder hierarchy
- Generic entity attachments
- Contact attachments
- Employee files
- Service Desk attachments
- Workflow attachments
- Records classification
- Retention
- Archival
- Controlled replacement
- Metadata
- Document preview
- OCR
- Content search
- Templates
- Records governance

The secure Sprint 010 storage, permission, audit and tenant-isolation model
should remain the foundation.

---

## SR-015 — Expiry and Obligation Management

ORNEXIS ONE should support time-sensitive organizational obligations.

Examples include:

- Contract expiry
- License expiry
- Certification expiry
- Insurance expiry
- Document expiry
- Policy review dates
- Regulatory obligations
- Maintenance deadlines
- Renewal dates
- Compliance deadlines

The capability should integrate with:

- Notifications
- Workflow
- Accountability Engine
- Attention Centre
- Documents
- Assets
- Governance
- Reporting

The platform should progressively support responsible owners, due dates,
reminders, escalation and evidence of completion.

---


## SR-016 — Employee Onboarding and Offboarding

Employee lifecycle management should support controlled onboarding and
offboarding processes.

Onboarding should progressively coordinate:

- Employee records
- Employment information
- Required documents
- Accounts
- System access
- Roles and permissions
- Devices
- Software
- Licenses
- Training
- Policies
- Tasks
- Approvals
- Organizational structure assignment

Offboarding should progressively coordinate:

- Account suspension or revocation
- Access removal
- Role and permission removal
- Asset return
- Software and license recovery
- Knowledge handover
- Outstanding work
- Document completion
- Exit processes
- Responsibility reassignment
- Audit evidence

This capability should reuse workflow, assets, identity, documents,
notifications and the Accountability Engine rather than duplicating them.

---

## SR-017 — Decision Register

ORNEXIS ONE should maintain an organizational Decision Register.

Important decisions should be capable of recording:

- Decision
- Context
- Decision owner
- Participants
- Decision date
- Rationale
- Alternatives considered where appropriate
- Supporting documents
- Approvals
- Actions arising
- Responsible owners
- Review date
- Status
- Related risks
- Related projects or work
- Related organizational units

The Decision Register should preserve organizational memory and provide
traceability between decisions and resulting actions.

Where appropriate, resulting actions should integrate with the
Accountability Engine.

---

## SR-018 — Business Continuity and Resilience

ORNEXIS ONE should support organizational continuity and resilience
management.

Potential capabilities include:

- Critical processes
- Critical services
- Critical systems
- Critical assets
- Dependencies
- Business impact information
- Continuity plans
- Recovery plans
- Recovery responsibilities
- Recovery objectives
- Exercises and tests
- Incidents
- Lessons learned
- Corrective actions
- Supporting evidence
- Review cycles

This capability should eventually connect with:

- Risks
- Assets
- Service Desk
- Security
- Documents
- Employees
- Suppliers
- Obligations
- Notifications
- Accountability
- Organizational intelligence

The architecture should allow industry packs to extend continuity and
resilience requirements where sectors have specific regulatory needs.

---

## SR-019 — CRM and Relationship Management

CRM should evolve from the reusable contact-management foundation rather than
creating a separate duplicate contact model.

Capabilities may include:

- Organizations and accounts
- Contacts
- Leads
- Opportunities
- Pipeline
- Activities
- Interactions
- Follow-ups
- Relationship history
- Relationship ownership
- Customer requests
- Customer complaints
- Customer documents
- Communications
- Tasks
- Sales activities
- Reporting
- CRM dashboards

CRM should integrate where appropriate with:

- Documents
- Workflow
- Notifications
- Accountability
- Attention Centre
- Finance
- Reporting
- Enterprise search

CRM architecture should remain reusable across industries.

---

## SR-020 — Human Resources and Workforce Management

ORNEXIS ONE should provide reusable workforce-management capabilities.

Potential capabilities include:

- Employee records
- Employment information
- Positions
- Job roles
- Departments
- Branches
- Reporting lines
- Employee documents
- Leave
- Training
- Skills
- Qualifications
- Certification tracking
- Performance foundations
- Employee requests
- Onboarding
- Offboarding
- Employee self-service
- Workforce reporting
- Workforce dashboards

Sensitive workforce information must receive appropriate access controls.

Being a manager must not automatically grant access to all confidential HR
information.

HR access should be governed by:

- Organization
- Role
- Permission
- Organizational scope
- Responsibility
- Data classification
- Applicable business rules

The workforce capability should reuse existing identity, organizational
structure, document, workflow, notification and audit foundations.

---


## SR-021 — Finance and Financial Control

ORNEXIS ONE should provide reusable financial foundations capable of
supporting different organization types.

Potential capabilities include:

- Chart of accounts
- Accounts
- Ledger
- Transactions
- Payments
- Receipts
- Income
- Expenses
- Budgets
- Financial categories
- Financial approvals
- Reconciliation
- Financial documents
- Payment integrations
- Financial reporting
- Financial dashboards

Financial history must preserve integrity, traceability and auditability.

Business-critical financial records must not be treated as ordinary mutable
CRUD records.

Where corrections are required, architecture should favor controlled
adjustments, reversals or compensating entries rather than destructive
history rewriting.

Financial access must respect:

- Organization
- Role
- Permission
- Organizational scope
- Data classification
- Approval authority
- Applicable business rules

---

## SR-022 — Hierarchical Organization Health

Organization Health must be hierarchical, permission-aware and explainable.

The conceptual hierarchy may include:

Organization
    |
Region
    |
Branch
    |
Department
    |
Team
    |
Individual Work Context

Different management levels should receive health intelligence for the areas
they are responsible for.

Examples include:

- Executives — organization-wide health
- Regional managers — regional health
- Branch managers — branch health
- Department heads — departmental health
- Team leaders — team health
- Employees — personal work overview

Health indicators may eventually incorporate:

- KPIs
- SLA performance
- Overdue work
- Risks
- Incidents
- Security posture
- Asset compliance
- Customer activity
- Customer complaints
- Workflow performance
- Approval delays
- Obligations
- Financial indicators
- Workforce indicators
- Business continuity indicators
- Industry-specific indicators

Health scoring must not be a simple unexplained average.

Future scoring should support:

- Weighted indicators
- Severity
- Business criticality
- Thresholds
- Trend direction
- Time sensitivity
- Organizational configuration
- Industry-specific weighting
- Data quality confidence

A health score must not expose confidential underlying information to users
who are not authorized to access it.

A user may be permitted to see an aggregate health indicator while being
denied access to the confidential records contributing to that indicator.

The platform should eventually be capable of answering questions such as:

- Why is this health score 76?
- What reduced the score?
- What improved this week?
- Which issues have the greatest negative impact?
- Which areas are improving?
- What requires management attention?
- What actions may improve organizational health?

---

## SR-023 — Hierarchical Command Centre

The ORNEXIS Command Centre must adapt to organizational responsibility.

It must not be designed only for chief executives.

Potential views include:

- Executive Command Centre
- Regional Command Centre
- Branch Command Centre
- Department Command Centre
- Team operational view
- Individual work overview

Displayed information must be determined by:

- Role
- Permission
- Organization
- Region
- Branch
- Department
- Team
- Responsibility
- Data classification
- Record sensitivity

The Command Centre should progressively combine:

- Organization Health
- KPIs
- Attention signals
- Risks
- SLA performance
- Work
- Tasks
- Requests
- Tickets
- Security
- Assets
- Workflows
- Approvals
- Obligations
- Financial indicators
- Workforce indicators
- Trends
- Recommendations

A management role must not automatically grant access to confidential data
outside the user's authorized scope.

For example, a department head may see that another department has a weak
health score without necessarily being allowed to open its confidential
financial, HR or security records.

---

## SR-024 — Explainable Organizational Intelligence

ORNEXIS ONE intelligence should explain the evidence behind important
recommendations, warnings and scores.

For example, instead of merely reporting:

Organization Health: 82

the platform should eventually explain the major contributors.

An explanation may identify factors such as:

- SLA breaches
- Critical incidents
- Overdue obligations
- Workflow delays
- Falling customer follow-up rates
- Security posture changes
- Asset-compliance concerns
- Financial performance changes
- Workforce indicators
- Risk exposure

Intelligence should distinguish:

- Observed facts
- Calculated indicators
- Configured thresholds
- Recommendations
- AI-generated interpretation

AI-assisted capabilities must operate over authorized organizational context.

AI must not bypass:

- Tenant isolation
- Permissions
- Data classification
- Organizational scope
- Record-level restrictions

Where practical, important AI-supported conclusions should be traceable back
to the underlying authorized indicators or source records.

---

## SR-025 — Daily Brief and Role-Aware Operational Summary

ORNEXIS ONE should eventually provide role-aware operational summaries.

A Daily Brief may summarize:

- Work due today
- Overdue items
- Approvals awaiting action
- Requests requiring action
- SLA risks
- Expiring obligations
- Important incidents
- Security concerns
- Asset issues
- Customer follow-ups
- Organizational changes
- Health movements
- KPI movements
- Recommended attention items

The Daily Brief must reflect:

- User responsibility
- Organizational scope
- Role
- Permissions
- Data classification

Different roles should therefore receive materially different briefs.

Examples:

An executive may receive:

- Organization Health movement
- Critical risks
- Major SLA concerns
- Financial indicators
- Department attention areas

A department head may receive:

- Department Health
- Department KPIs
- Overdue work
- Approval bottlenecks
- Team workload
- Relevant risks

An employee may receive:

- Assigned tasks
- Due dates
- Requests
- Required approvals
- Training due
- Assigned assets
- Personal attention items

The Daily Brief should reuse existing platform intelligence and should not
become a separate disconnected data model.

---


## SR-026 — Configurable KPI Framework

ORNEXIS ONE should provide a reusable KPI framework rather than hard-coding
performance indicators separately into individual modules.

The framework should eventually support:

- KPI definitions
- KPI categories
- KPI ownership
- Organizational scope
- Targets
- Thresholds
- Measurement periods
- Units of measurement
- Data sources
- Calculation rules
- Weighting
- Trend analysis
- Historical values
- Status indicators
- Dashboard presentation
- Health-score contribution
- Alerts
- Reporting

KPIs may apply to:

- Organization
- Region
- Branch
- Department
- Team
- Role
- Individual work context
- Process
- Service
- Asset category
- Customer operation
- Financial operation
- Industry-specific capability

The framework should distinguish between:

- Manually entered KPIs
- System-calculated KPIs
- Integration-sourced KPIs
- Derived KPIs

KPI visibility must respect:

- Tenant isolation
- Role
- Permission
- Organizational scope
- Data classification

The KPI framework should become a reusable input into:

- Dashboards
- Organization Health
- Command Centre
- Attention Centre
- Daily Brief
- Reporting
- Organizational intelligence

Industry packs should be capable of introducing additional KPI definitions
without requiring modification of the universal KPI engine.

---

## SR-027 — Generic Entity Relationship and Attachment Framework

ORNEXIS ONE should progressively support reusable relationships between
platform entities.

The platform should avoid implementing completely separate attachment and
relationship architectures for every module.

Examples include:

- Document attached to contact
- Document attached to employee
- Document attached to ticket
- Document attached to asset
- Document attached to workflow
- Document attached to request
- Document attached to supplier
- Document attached to transaction
- Document attached to decision
- Document attached to obligation
- Asset assigned to employee
- Contact associated with organization process
- Risk associated with department
- Decision associated with project or workflow

The framework must preserve:

- Organization ownership
- Entity type
- Entity identifier
- Relationship type
- Permissions
- Auditability
- Referential integrity where practical
- Data classification

Generic relationships must not become a mechanism for bypassing module-level
security.

Access to a relationship does not automatically grant access to the related
record.

Authorization must still be evaluated for the target resource.

This framework should build upon the Sprint 010 document foundation and
future modular platform capabilities.

---

## SR-028 — Configurable Organizational Hierarchy

ORNEXIS ONE must support organizations with different structural models.

The platform must not permanently assume that every organization consists
only of:

Organization
    |
Branch
    |
Department

Different organizations may require structures such as:

Organization
    |
Region
    |
Branch
    |
Department
    |
Team

or:

Organization
    |
Campus
    |
Faculty
    |
Department

or:

Organization
    |
County
    |
Sub-County
    |
Office

or other industry-specific structures.

The existing Branch and Department foundation remains valid and should not
be unnecessarily replaced.

Future architecture should extend this foundation carefully when real
requirements justify additional hierarchy levels.

The hierarchy model should eventually support:

- Configurable organizational units
- Parent-child relationships
- Unit types
- Managers
- Membership
- Responsibility
- Scoped permissions
- Reporting relationships
- Dashboard scope
- Health aggregation
- Workflow routing
- Approval routing

Hierarchy flexibility must not weaken tenant isolation or authorization.

Organizational hierarchy should become reusable by:

- HR
- Service Desk
- Assets
- Workflow
- Reporting
- Command Centre
- Organization Health
- Accountability
- Finance
- Industry packs

---

## SR-029 — Comprehensive Auditability and Traceability

Auditability is a platform-wide requirement.

ORNEXIS ONE should progressively provide comprehensive traceability for
security-sensitive and business-significant actions.

Examples include:

- Authentication events
- User invitations
- User activation
- Role changes
- Permission changes
- Structure changes
- Contact changes
- Document actions
- Workflow actions
- Approval decisions
- Ticket activity
- Asset assignment
- Financial actions
- HR actions
- Security events
- Configuration changes
- Integration activity
- Administrative operations

Audit records should capture appropriate context such as:

- Organization
- User
- Action
- Entity type
- Entity identifier
- Timestamp
- Previous values where appropriate
- New values where appropriate
- Request context where appropriate
- Source
- Result

Audit history should normally be append-oriented and resistant to ordinary
business-user modification.

Sensitive audit information must itself be permission-controlled.

Future audit capabilities may include:

- Search
- Filtering
- Retention policies
- Export
- Compliance reporting
- Security investigation views
- Correlation
- Anomaly detection
- SIEM forwarding

Auditability must remain a cross-cutting platform concern rather than a
feature implemented independently by each module.

---

## SR-030 — API-First Integration and Extensibility Architecture

ORNEXIS ONE must remain API-first and integration-ready.

Major platform capabilities should expose controlled service interfaces that
can support:

- ORNEXIS web applications
- Mobile applications
- External systems
- Industry integrations
- Automation
- Partner applications
- Customer systems

Integration capabilities should progressively include:

- REST APIs
- Webhooks
- Integration credentials
- API clients
- Scoped access
- Event delivery
- Retry handling
- Delivery logs
- Rate limiting
- Integration auditing
- Secret management
- External identifiers
- Idempotency where required

Potential integrations include:

- M-Pesa
- Banks
- Payment gateways
- Email providers
- SMS providers
- Identity providers
- Microsoft services
- Google services
- CRM systems
- EDMS platforms
- Accounting platforms
- HR platforms
- Firewall platforms
- SIEM platforms
- Endpoint-security platforms
- Device-management platforms
- Industry-specific systems

External integrations must never bypass:

- Authentication
- Authorization
- Tenant isolation
- Data classification
- Audit requirements

The integration architecture should allow ORNEXIS ONE to operate both as a
complete organizational platform and as a connected component within a
customer's existing technology environment.

---


# 19. Requirements Register Governance

The Strategic Requirements Register is a living product-governance mechanism.

New approved long-term requirements should be added to this register when
they materially affect ORNEXIS ONE product direction.

Requirements should not be removed merely because they are not scheduled for
immediate implementation.

A requirement may later be marked with states such as:

- PLANNED
- FOUNDATION AVAILABLE
- PARTIALLY IMPLEMENTED
- IMPLEMENTED
- DEFERRED
- SUPERSEDED

When a requirement becomes part of an implementation sprint, the sprint
document should reference the relevant strategic requirement where useful.

The Master Implementation Plan remains the roadmap authority.

Individual Sprint documents define the implementation contract for a
particular delivery.

System Architecture defines architectural principles and boundaries.

The Engineering Manifesto defines engineering discipline and quality
expectations.

Together these documents form the ORNEXIS ONE engineering governance system.

---

# 20. Capability Definition of Done

A capability should not be considered CORE COMPLETE merely because its
database tables or API endpoints exist.

A capability is complete only when the agreed scope has satisfied all
applicable engineering requirements.

These normally include:

- Architecture reviewed
- Database design reviewed
- Tenant ownership defined
- Permissions defined
- Backend authorization enforced
- Input validation implemented
- Business rules enforced
- Audit requirements implemented
- Tenant isolation tested
- Cross-tenant security tested
- Data integrity tested
- Relevant lifecycle operations tested
- Error handling verified
- Regression testing completed
- Prisma schema valid
- Migrations applied and reviewed
- TypeScript compilation successful
- Documentation complete
- Git diff reviewed
- Git commit completed
- Git push completed

Additional capability-specific requirements may apply.

Examples include:

Financial capabilities:
- Historical integrity
- Reconciliation behaviour
- Controlled corrections

Security capabilities:
- Threat-oriented testing
- Session and access-control validation

Document capabilities:
- Storage integrity
- File validation
- Path protection

Workflow capabilities:
- State-transition integrity
- Approval integrity
- Escalation behaviour

---

# 21. Production Readiness Model

Development completion and production readiness are not the same thing.

Before ORNEXIS ONE is considered production-ready for external customers,
the platform must progressively establish:

- Production environment strategy
- Secure secret management
- Object storage
- TLS
- Domain configuration
- Centralized logging
- Monitoring
- Alerting
- Database backup
- Restore testing
- Disaster recovery
- Migration strategy
- Deployment automation
- Environment separation
- Rate limiting
- Security headers
- API protection
- Dependency vulnerability management
- Operational runbooks
- Incident-response procedures
- Support processes
- Release management
- Data retention policies
- Privacy controls
- Customer onboarding process
- Tenant provisioning
- Commercial configuration
- Service-level expectations

Production-readiness work should be introduced progressively rather than being
left entirely until the end of platform development.

---

# 22. Roadmap Review and Change Control

The Master Implementation Plan should be reviewed periodically.

Review should occur when:

- A major capability is completed
- A new major product requirement is approved
- Architecture changes materially
- Customer requirements reveal a reusable platform need
- Security requirements change
- Regulatory requirements change
- Integration priorities change
- Product commercialization priorities change
- A planned capability becomes obsolete or should be merged with another

Roadmap changes should preserve:

- Completed implementation history
- Architectural rationale
- Strategic requirements
- Dependency ordering
- Security principles
- Product coherence

The roadmap should evolve deliberately.

It should not be rewritten casually based on every new feature request.

---

# 23. Long-Term Product Direction

ORNEXIS ONE is intended to evolve from a management application into a
connected organizational operating platform.

The long-term platform should enable organizations to:

- Understand their structure
- Manage people
- Coordinate work
- Manage requests
- Operate services
- Manage assets
- Manage customers
- Manage employees
- Control documents and records
- Manage financial operations
- Preserve decisions
- Track obligations
- Manage risk
- Improve resilience
- Integrate external systems
- Monitor organizational health
- Surface what requires attention
- Understand why performance is changing
- Preserve accountability
- Support industry-specific operations
- Make informed decisions from trustworthy organizational data

The long-term goal remains:

> ORNEXIS ONE becomes the trusted operating system for organizations.

---

# End of Document

**Master Implementation Plan Version:** 2.0
**Status:** ACTIVE ROADMAP