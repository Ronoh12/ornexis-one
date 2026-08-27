# ORNEXIS ONE — Sprint 013

# Workflow and Approval Engine Foundation

**Status:** COMPLETE

---

## 1. Sprint Objective

Sprint 013 establishes the first reusable, organization-scoped Workflow and
Approval Engine foundation for ORNEXIS ONE.

The engine provides platform-level orchestration that can be consumed by
Request Centre, Work Management and future modules including HR, Finance,
Service Management, CRM, onboarding/offboarding and governance.

Workflow logic remains a shared platform capability rather than being
reimplemented independently by individual business modules.

---

## 2. Architectural Principles

Implemented principles:

- Workflows are organization-scoped.
- Workflow definitions are reusable.
- Workflow definitions remain industry-neutral.
- Workflow definitions and running workflow instances are separate.
- Workflow states are explicit.
- Workflow transitions are explicit.
- Transition integrity is validated.
- Workflow history is preserved.
- Approval steps are reusable workflow capabilities.
- Approval decisions are append-only through normal workflow APIs.
- Workflow operations respect tenant boundaries.
- Workflow participants operate within the active organization context.
- Approval-gated transitions cannot proceed without required approval.
- Rejected approvals block protected transitions.
- Duplicate approval decisions from the same approver are prevented.
- Self-approval can be enabled or disabled per approval step.
- Minimum approval thresholds are supported.
- The architecture remains extensible for future escalation, deadlines,
  notifications, conditional routing and automation.

---

## 3. Implemented Domain Model

Sprint 013 introduced the following Prisma models:

- WorkflowDefinition
- WorkflowState
- WorkflowTransition
- WorkflowInstance
- WorkflowHistory
- ApprovalStep
- ApprovalDecision

All workflow-domain models are organization scoped.

Composite tenant-aware relationships are used where appropriate to prevent
cross-organization relationships.

---

## 4. Workflow Definitions

WorkflowDefinition represents a reusable process template.

Implemented capabilities include:

- organization ownership
- reusable name and code
- description
- entity type
- versioning
- active/inactive state
- workflow states
- transitions
- approval steps
- running instances

Workflow definitions can represent arbitrary organizational processes rather
than hard-coded business workflows.

---

## 5. Workflow States

WorkflowState represents a state inside a workflow definition.

Implemented capabilities include:

- organization ownership
- workflow-definition ownership
- name
- code
- description
- position
- initial-state designation
- terminal-state designation

State codes are unique within a workflow definition.

The runtime automatically begins a workflow instance in its configured
initial state.

---

## 6. Workflow Transitions

WorkflowTransition represents an allowed movement between workflow states.

Implemented capabilities include:

- organization ownership
- workflow-definition ownership
- source state
- target state
- name
- code
- description
- position
- active/inactive state
- requiresApproval
- conditionConfig foundation

Transition validation prevents invalid state/workflow relationships.

Approval-required transitions are enforced by the runtime engine.

---

## 7. Workflow Instances

WorkflowInstance represents one running execution of a workflow definition.

Implemented capabilities include:

- organization ownership
- workflow-definition reference
- current state
- entity type
- entity ID
- starting organization user
- completing organization user
- runtime status
- contextual JSON data
- started timestamp
- completed timestamp
- workflow history
- approval decisions

A workflow instance starts in the definition's initial state.

Terminal-state transitions complete the workflow instance.

---

## 8. Workflow History

WorkflowHistory preserves workflow-domain operational history.

Runtime events include workflow lifecycle and approval activity such as:

- STARTED
- transition events
- APPROVED
- REJECTED
- COMPLETED
- cancellation-related activity where applicable

History records preserve:

- organization
- workflow instance
- previous state
- resulting state
- actor
- action
- comment
- metadata
- occurrence timestamp

Workflow history complements the platform Audit infrastructure.

---

## 9. Approval Architecture

Sprint 013 uses a lightweight runtime approval architecture based on:

WorkflowInstance
→ ApprovalStep
→ ApprovalDecision

A separate ApprovalRequest persistence layer was intentionally not introduced
in this foundation.

Approval state is derived from configured ApprovalSteps and immutable
ApprovalDecision records associated with a workflow instance.

This avoids unnecessary duplicate persistence while preserving the ability to
introduce assignment, inbox, delegation or escalation records later if those
capabilities require them.

---

## 10. Approval Steps

ApprovalStep defines an approval requirement for a workflow state.

Implemented configuration includes:

- organization ownership
- workflow-definition ownership
- workflow-state ownership
- name
- code
- description
- approver type
- approver configuration
- minimum approval count
- allowSelfApproval
- required/optional designation
- active/inactive state
- position

Approval step codes are unique within a workflow definition.

The current foundation supports generic approval resolution and explicit user
configuration while remaining extensible for richer role, department, branch
and organizational hierarchy resolution.

---

## 11. Approval Decisions

ApprovalDecision records an approver's decision for an active workflow
instance and approval step.

Implemented fields include:

- organizationId
- workflowInstanceId
- approvalStepId
- approverOrganizationUserId
- decision
- comment
- metadata
- decidedAt
- createdAt

Initial supported decisions:

- APPROVED
- REJECTED

Approval decisions are not exposed through ordinary update/delete workflow
operations.

The engine prevents the same approver from submitting multiple decisions for
the same approval step and workflow instance.

---

## 12. Approval Enforcement

For an approval-required transition, the engine:

1. resolves active required approval steps for the workflow's current state;
2. verifies that approval configuration exists;
3. counts approved decisions;
4. counts rejected decisions;
5. blocks the transition when a required step has been rejected;
6. blocks the transition when minimum approvals have not been reached;
7. allows the transition when all required approval conditions are satisfied.

This behavior was verified through runtime API acceptance testing.

---

## 13. Self-Approval

Approval steps support:

allowSelfApproval

When disabled, an actor who started the workflow cannot approve their own
workflow where the runtime self-approval rule applies.

The service returns a dedicated self-approval validation error rather than
silently accepting the decision.

---

## 14. Duplicate Decision Protection

For each combination of:

- workflow instance
- approval step
- approver organization user

only one decision may be submitted through the workflow runtime.

Duplicate submissions are rejected with:

APPROVAL_DECISION_ALREADY_EXISTS

This behavior was verified through API testing.

---

## 15. Entity Integration Boundary

Workflow definitions use entityType and workflow instances use entityType plus
entityId.

This allows the workflow engine to orchestrate platform entities without
taking ownership of their business data.

Expected consumers include:

- Request Centre
- Work Management
- HR
- Finance
- CRM
- Service Management
- onboarding/offboarding
- governance
- future industry packs

The consuming module remains responsible for its business entity.

Workflow remains responsible for process orchestration.

---

## 16. Request Centre Boundary

Request Centre must consume Workflow Engine capabilities rather than duplicate
workflow infrastructure.

Request remains the business entity.

WorkflowDefinition, WorkflowState, WorkflowTransition, WorkflowInstance,
ApprovalStep, ApprovalDecision and WorkflowHistory remain platform workflow
capabilities.

---

## 17. Work Management Boundary

WorkItem remains the accountability and execution entity.

Workflow Engine may coordinate WorkItem progression without replacing
WorkItem.

---

## 18. Permission Model

Sprint 013 introduced workflow permissions including:

- workflow.view
- workflow.manage_definitions
- workflow.start
- workflow.transition
- workflow.approve
- workflow.cancel
- workflow.history.view

Workflow routes operate behind authentication, organization context and
permission middleware.

Approval submission specifically requires:

workflow.approve

Workflow transition specifically requires:

workflow.transition

---

## 19. Tenant Isolation

Workflow services scope operations by organizationId.

Tenant-aware relationships prevent foreign organizations from being
silently connected through workflow records.

Isolation applies to:

- workflow definitions
- workflow states
- workflow transitions
- workflow instances
- approval steps
- approval decisions
- organization users participating in workflow operations

Cross-tenant workflow relationships must fail safely.

---

## 20. Validation

Sprint 013 validation covers workflow input and runtime integrity including:

- UUID validation
- workflow definition input
- state input
- transition input
- approval-step input
- approval-decision input
- workflow ownership
- state ownership
- transition ownership
- entity-type compatibility
- initial-state requirements
- terminal-state behavior
- approval-step ownership
- approval eligibility
- self-approval rules
- duplicate approval decisions
- approval thresholds
- rejected approvals
- transition eligibility

---

## 21. API Surface — As Built

### Workflow configuration

Mounted through the workflow router.

Capabilities include:

- workflow definition creation/listing/management
- workflow state creation/listing/management
- workflow transition creation/listing/management
- approval-step creation

### Workflow runtime

Mounted at:

/workflow-instances

Implemented runtime operations include:

- list workflow instances
- start workflow instance
- retrieve workflow instance
- execute transition
- submit approval decision
- cancel workflow instance
- retrieve workflow history

Approval decision submission:

POST /workflow-instances/:id/approvals

Required permission:

workflow.approve

---

## 22. Runtime Acceptance Results

The workflow runtime was exercised through API acceptance tests.

### Basic workflow

Verified:

- workflow definition creation
- state creation
- transition creation
- workflow instance start
- initial-state selection
- valid transition
- terminal-state completion
- workflow history persistence

Result: PASS

### Approval gate without approval

A protected transition was attempted without the required decision.

Verified:

- transition rejected
- workflow remained ACTIVE
- current state remained unchanged
- no approval decision existed

Result: PASS

### Approved workflow

A fresh workflow instance received an APPROVED decision.

Verified:

- decision persisted
- required approval count reached
- approval status became approved
- protected transition succeeded
- terminal state reached
- workflow became COMPLETED
- history preserved approval and completion events

Result: PASS

### Rejected workflow

A fresh workflow instance received a REJECTED decision.

Verified:

- rejection persisted
- approval status became rejected
- protected transition was rejected
- workflow remained ACTIVE
- current state remained unchanged
- rejection history was preserved

Result: PASS

### Duplicate approval

The same approver attempted another decision for an approval step for which
they had already submitted a decision.

Verified:

- duplicate decision rejected
- duplicate record not created

Result: PASS

---

## 23. Engineering Quality Gates

Final Sprint 013 validation completed successfully:

- TypeScript compilation: PASS
- Prisma schema validation: PASS
- Prisma migration status: CURRENT
- git diff --check: PASS
- Sprint implementation committed: PASS
- push to origin/main: PASS
- final working tree clean: PASS

---

## 24. Database Migrations

Sprint 013 introduced:

20260827155018_sprint_013_workflow_approval_engine

and:

20260827175132_add_sprint_013_workflow_permissions

The final migration status reported the database schema as up to date.

---

## 25. Sprint Boundaries

Sprint 013 intentionally does not implement:

- visual workflow designer
- BPMN engine
- arbitrary scripting
- full expression language
- automated workflow notifications
- SLA engine
- escalation engine
- approval delegation
- scheduled workflow actions
- external workflow integrations
- AI workflow generation
- advanced workflow analytics

These capabilities may build on the Sprint 013 foundation later.

---

## 26. Future Extension Points

The foundation is designed to support later additions including:

- role-based approver resolution
- department-based approver resolution
- branch-based approver resolution
- hierarchy-aware approval routing
- approval inboxes
- delegation
- escalation
- deadlines
- SLA integration
- notifications
- conditional routing
- automated actions
- external integrations
- AI-assisted workflow creation
- workflow analytics
- Organization Health / Command Centre signals

These are roadmap capabilities and are not claimed as completed Sprint 013
functionality unless explicitly implemented in later sprints.

---

## 27. Sprint Completion Evidence

Sprint 013 completion included:

1. specification;
2. database implementation;
3. Prisma migrations;
4. validation;
5. service implementation;
6. controller implementation;
7. route implementation;
8. API runtime acceptance testing;
9. workflow tenant-scoping architecture;
10. approval runtime verification;
11. engineering quality gates;
12. Git commit and push;
13. final documentation reconciliation.

Implementation commit:

b7d4e87 feat(workflows): complete Sprint 013 workflow and approval engine

---

# Sprint Status

**Status:** COMPLETE
