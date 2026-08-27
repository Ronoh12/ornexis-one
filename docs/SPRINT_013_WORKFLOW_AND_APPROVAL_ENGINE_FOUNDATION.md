# ORNEXIS ONE — Sprint 013

# Workflow and Approval Engine Foundation

**Status:** IN PROGRESS

---

## 1. Sprint Objective

Build the first reusable Workflow and Approval Engine foundation for ORNEXIS ONE.

Sprint 013 must establish a platform-level orchestration capability that can be
used by Request Centre and later by HR, Finance, Service Management, CRM,
onboarding/offboarding, governance and other modules.

Workflow and approval logic must not be reimplemented independently inside each
business module.

---

## 2. Architectural Principles

☐ Workflows are organization-scoped.

☐ Workflow definitions are reusable.

☐ Workflow definitions must remain industry-neutral.

☐ Workflow instances are separate from workflow definitions.

☐ Workflow states are explicit.

☐ Workflow transitions are explicit.

☐ Transition rules must be validated.

☐ Workflow history must be preserved.

☐ Approval steps are reusable platform capabilities.

☐ Approval decisions must be immutable from normal API operations.

☐ Approvals may be role-aware.

☐ Approvals may be OrganizationUser-aware.

☐ Approvals may optionally be branch-aware.

☐ Approvals may optionally be department-aware.

☐ Workflow entities must never cross tenant boundaries.

☐ Workflow participants must belong to the active organization.

☐ Workflow design must support future escalation.

☐ Workflow design must support future deadlines.

☐ Workflow design must support future notifications.

☐ Workflow design must support future conditional routing.

☐ Workflow design must support future automation actions.

☐ Workflow design must support multiple consuming modules.

☐ Request Centre must consume workflow rather than own workflow logic.

---

## 3. Workflow Definition

A WorkflowDefinition represents a reusable process template.

Examples include:

- Purchase Approval
- Leave Approval
- Access Request Approval
- Expense Approval
- Service Request Fulfilment
- Employee Onboarding
- Customer Complaint Escalation

These examples must not be hard-coded.

### Minimum WorkflowDefinition fields

☐ id

☐ organizationId

☐ name

☐ code

☐ description

☐ entityType

☐ version

☐ isActive

☐ createdByOrganizationUserId

☐ createdAt

☐ updatedAt

Workflow codes must be unique per organization and version.

---

## 4. Workflow Entity Types

Sprint 013 must support a reusable entity reference model.

Initial supported workflow entity types:

REQUEST

WORK_ITEM

GENERIC

The architecture must allow future entity types without redesigning the engine.

---

## 5. Workflow States

A WorkflowDefinition contains ordered or logically connected states.

### Minimum WorkflowState fields

☐ id

☐ organizationId

☐ workflowDefinitionId

☐ name

☐ code

☐ description

☐ stateType

☐ sortOrder

☐ isInitial

☐ isTerminal

☐ createdAt

☐ updatedAt

State codes must be unique inside a workflow definition.

---

## 6. Workflow State Types

Initial state types:

START

ACTIVE

WAITING_APPROVAL

COMPLETED

REJECTED

CANCELLED

The engine should not assume that all workflows have identical state sequences.

---

## 7. Workflow Transitions

Transitions define which movements are allowed between states.

### Minimum WorkflowTransition fields

☐ id

☐ organizationId

☐ workflowDefinitionId

☐ fromStateId

☐ toStateId

☐ name

☐ code

☐ requiresApproval

☐ isActive

☐ createdAt

☐ updatedAt

Transition codes must be unique within a workflow definition.

A transition must never reference states from another workflow definition or
another organization.

---

## 8. Workflow Instances

A WorkflowInstance represents one running workflow.

### Minimum WorkflowInstance fields

☐ id

☐ organizationId

☐ workflowDefinitionId

☐ entityType

☐ entityId

☐ currentStateId

☐ status

☐ startedByOrganizationUserId

☐ startedAt

☐ completedAt

☐ cancelledAt

☐ createdAt

☐ updatedAt

One entity may participate in multiple workflow instances over time.

---

## 9. Workflow Instance Status

Initial workflow instance statuses:

ACTIVE

COMPLETED

REJECTED

CANCELLED

---

## 10. Workflow History

Every important workflow event must produce history.

### Minimum WorkflowHistory fields

☐ id

☐ organizationId

☐ workflowInstanceId

☐ actorOrganizationUserId

☐ eventType

☐ fromStateId

☐ toStateId

☐ transitionId

☐ metadata

☐ createdAt

History must not be editable through normal workflow APIs.

---

## 11. Workflow History Event Types

Initial events:

STARTED

TRANSITIONED

APPROVAL_REQUESTED

APPROVED

REJECTED

CANCELLED

COMPLETED

Future events may include:

ESCALATED

DELEGATED

RETURNED_FOR_CHANGES

AUTOMATION_EXECUTED

---

## 12. Approval Foundation

An ApprovalStep represents approval requirements connected to a workflow
transition.

### Minimum ApprovalStep fields

☐ id

☐ organizationId

☐ workflowTransitionId

☐ name

☐ stepOrder

☐ approverType

☐ approverOrganizationUserId

☐ approverRoleId

☐ approverDepartmentId

☐ approverBranchId

☐ isRequired

☐ createdAt

☐ updatedAt

---

## 13. Approver Types

Initial approver types:

ORGANIZATION_USER

ROLE

DEPARTMENT

BRANCH

The architecture must remain extensible for future approver-resolution rules.

---

## 14. Approval Requests

When a workflow reaches an approval-required transition, the engine creates an
ApprovalRequest.

### Minimum ApprovalRequest fields

☐ id

☐ organizationId

☐ workflowInstanceId

☐ workflowTransitionId

☐ approvalStepId

☐ assignedApproverOrganizationUserId

☐ status

☐ requestedAt

☐ decidedAt

☐ createdAt

☐ updatedAt

---

## 15. Approval Request Status

Initial statuses:

PENDING

APPROVED

REJECTED

CANCELLED

---

## 16. Approval Decisions

Approval decisions must record the decision itself rather than overwriting
history.

### Minimum ApprovalDecision fields

☐ id

☐ organizationId

☐ approvalRequestId

☐ decidedByOrganizationUserId

☐ decision

☐ comment

☐ decidedAt

☐ createdAt

ApprovalDecision records must be immutable through ordinary APIs.

---

## 17. Approval Decision Types

Initial decisions:

APPROVED

REJECTED

Future support may include:

RETURNED_FOR_CHANGES

DELEGATED

---

## 18. Request Centre Integration Boundary

Sprint 013 should make Workflow Engine capable of attaching to Request records.

Request Centre must not duplicate:

- workflow definitions
- workflow states
- transitions
- approval records
- approval history

The Request record remains the business entity.

Workflow remains the orchestration layer.

---

## 19. Work Management Integration Boundary

Workflow Engine may also orchestrate WorkItem records.

WorkItem remains the accountability/work-execution entity.

Workflow should coordinate progression, not replace WorkItem.

---

## 20. Permission Model

Sprint 013 should introduce:

workflow.view

workflow.manage_definitions

workflow.start

workflow.transition

workflow.approve

workflow.cancel

workflow.history.view

Permissions must remain organization-scoped.

No Workflow route may bypass authentication, organization context or the
permission engine.

---

## 21. Tenant Isolation

Every Workflow query must scope by organizationId.

Cross-tenant access must fail safely.

Foreign organization data must never be accepted for:

- workflow definitions
- states
- transitions
- instances
- approvers
- roles
- branches
- departments
- approval requests
- approval decisions
- linked business entities

---

## 22. Validation

Validation must cover:

☐ UUID fields

☐ workflow codes

☐ state codes

☐ transition codes

☐ duplicate workflow definitions

☐ initial-state integrity

☐ terminal-state integrity

☐ state ownership

☐ transition ownership

☐ approver ownership

☐ organization-user ownership

☐ branch ownership

☐ department ownership

☐ role ownership

☐ workflow entity references

☐ approval decision state

☐ transition eligibility

---

## 23. Auditability

WorkflowHistory provides workflow-domain operational history.

Existing Audit infrastructure should continue to capture security-sensitive and
system-level actions where appropriate.

The two histories must complement each other rather than duplicate every event.

---

## 24. API Foundation

Target API surface:

### Workflow Definitions

GET /workflow-definitions

POST /workflow-definitions

GET /workflow-definitions/:id

PATCH /workflow-definitions/:id

### Workflow States

GET /workflow-definitions/:id/states

POST /workflow-definitions/:id/states

PATCH /workflow-states/:id

### Workflow Transitions

GET /workflow-definitions/:id/transitions

POST /workflow-definitions/:id/transitions

PATCH /workflow-transitions/:id

### Workflow Instances

GET /workflow-instances

POST /workflow-instances

GET /workflow-instances/:id

POST /workflow-instances/:id/transition

POST /workflow-instances/:id/cancel

GET /workflow-instances/:id/history

### Approvals

GET /approvals

GET /approvals/:id

POST /approvals/:id/approve

POST /approvals/:id/reject

---

## 25. Sprint Boundaries

Sprint 013 DOES NOT implement:

- visual workflow designer
- arbitrary scripting
- complex expression language
- automated notifications
- SLA engine
- escalation engine
- delegation engine
- scheduled workflow actions
- external workflow integrations
- AI workflow generation
- complete BPMN support

These capabilities may build on this foundation later.

---

## 26. Acceptance Tests

Sprint 013 is COMPLETE only when the following are demonstrated.

### Platform

☐ TypeScript compilation succeeds

☐ Prisma schema validates

☐ Database migrations apply successfully

☐ Migration status is current

### Workflow Definitions

☐ Workflow definition can be created

☐ Workflow definitions can be listed

☐ Workflow definition can be retrieved

☐ Workflow definition can be updated

☐ Duplicate organization workflow code/version is rejected

### Workflow States

☐ State can be created

☐ States can be listed

☐ State can be updated

☐ Initial state can be identified

☐ Terminal state can be identified

### Workflow Transitions

☐ Transition can be created

☐ Transitions can be listed

☐ Invalid cross-workflow transition is rejected

### Workflow Instances

☐ Workflow instance can be started

☐ Instance begins in initial state

☐ Instance can be retrieved

☐ Instances can be listed

☐ Valid transition succeeds

☐ Invalid transition fails safely

☐ Workflow history is recorded

☐ Terminal workflow can complete

### Approvals

☐ Approval-required transition creates approval request

☐ Approval request can be listed

☐ Authorized approver can approve

☐ Authorized approver can reject

☐ Approval decision history is preserved

☐ Unauthorized approval fails safely

### Security

☐ Authentication is required

☐ Organization context is required

☐ Permissions are enforced

☐ Cross-tenant workflow access is rejected

☐ Foreign approver assignment is rejected

☐ Foreign branch/department references are rejected

### Engineering

☐ git diff --check passes

☐ working tree is clean after final commit

☐ implementation is pushed to origin/main

---

## 27. Sprint Completion Rule

Sprint 013 must not be marked COMPLETE merely because database tables exist.

It becomes COMPLETE only after:

1. specification;
2. database implementation;
3. migrations;
4. validation;
5. service implementation;
6. controller implementation;
7. route implementation;
8. API acceptance testing;
9. tenant-isolation verification;
10. approval verification;
11. Git validation;
12. final documentation update.

---

# Sprint Status

**Status:** IN PROGRESS