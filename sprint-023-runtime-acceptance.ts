import "dotenv/config";

import jwt from "jsonwebtoken";

import app from "./apps/api/src/app.js";

import {
  prisma
} from "./packages/database/index.js";

import {
  evaluateOrganizationHealth
} from "./apps/api/src/services/healthEvaluationService.js";

import {
  AuditEventCategory,
  AuditEventResult,
  AuditEventSource,
  HealthScopeType
} from "./packages/database/generated/client/enums.js";

import {
  evaluateAllSystemKpis
} from "./apps/api/src/services/kpiEvaluatorService.js";

import {
  createAuditLog
} from "./apps/api/src/services/auditService.js";

import {
  verifyAuditIntegrity
} from "./apps/api/src/services/auditIntegrityService.js";

import {
  auditRedactionMarker,
  redactAuditValue
} from "./apps/api/src/services/auditRedactionService.js";

const runId =
  `s023-${Date.now()}`;

const organizationIds: string[] = [];
const userIds: string[] = [];
const roleIds: string[] = [];

function check(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(
      `FAIL: ${message}`
    );
  }

  console.log(`PASS: ${message}`);
}

async function cleanup() {
  if (organizationIds.length > 0) {
    const organizationWhere = {
      organizationId: {
        in: organizationIds
      }
    };

    await prisma.entityRelationship.deleteMany({
      where: organizationWhere
    });

    await prisma.entityAttachment.deleteMany({
      where: organizationWhere
    });

    await prisma.organizationalUnitAssignment.deleteMany({
      where: organizationWhere
    });

    await prisma.organizationalUnit.deleteMany({
      where: organizationWhere
    });

    await prisma.organizationalUnitType.deleteMany({
      where: organizationWhere
    });

    await prisma.workflowHistory.deleteMany({
      where: organizationWhere
    });

    await prisma.approvalDecision.deleteMany({
      where: organizationWhere
    });

    await prisma.workflowInstance.deleteMany({
      where: organizationWhere
    });

    await prisma.approvalStep.deleteMany({
      where: organizationWhere
    });

    await prisma.workflowTransition.deleteMany({
      where: organizationWhere
    });

    await prisma.workflowState.deleteMany({
      where: organizationWhere
    });

    await prisma.workflowDefinition.deleteMany({
      where: organizationWhere
    });

    await prisma.document.deleteMany({
      where: organizationWhere
    });

    await prisma.contact.deleteMany({
      where: organizationWhere
    });

    await prisma.kpiMeasurement.deleteMany({
      where: organizationWhere
    });

    await prisma.kpiDefinition.deleteMany({
      where: organizationWhere
    });

    await prisma.kpiCategory.deleteMany({
      where: organizationWhere
    });

    await prisma.healthContribution.deleteMany({
      where: organizationWhere
    });

    await prisma.healthSnapshot.deleteMany({
      where: organizationWhere
    });

    await prisma.healthIndicatorDefinition.deleteMany({
      where: organizationWhere
    });

    await prisma.attentionItem.deleteMany({
      where: organizationWhere
    });

    await prisma.notification.deleteMany({
      where: organizationWhere
    });

    await prisma.slaEvent.deleteMany({
      where: organizationWhere
    });

    await prisma.slaInstance.deleteMany({
      where: organizationWhere
    });

    await prisma.slaTarget.deleteMany({
      where: organizationWhere
    });

    await prisma.slaPolicy.deleteMany({
      where: organizationWhere
    });

    await prisma.requestActivity.deleteMany({
      where: organizationWhere
    });

    await prisma.requestComment.deleteMany({
      where: organizationWhere
    });

    await prisma.request.deleteMany({
      where: organizationWhere
    });

    await prisma.requestType.deleteMany({
      where: organizationWhere
    });

    await prisma.workItemActivity.deleteMany({
      where: organizationWhere
    });

    await prisma.workItemComment.deleteMany({
      where: organizationWhere
    });

    await prisma.workItem.deleteMany({
      where: organizationWhere
    });

    await prisma.auditLog.deleteMany({
      where: organizationWhere
    });

    await prisma.organizationUser.deleteMany({
      where: organizationWhere
    });

    await prisma.department.deleteMany({
      where: organizationWhere
    });

    await prisma.branch.deleteMany({
      where: organizationWhere
    });
  }

  if (roleIds.length > 0) {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: {
          in: roleIds
        }
      }
    });

    await prisma.role.deleteMany({
      where: {
        id: {
          in: roleIds
        }
      }
    });
  }

  if (userIds.length > 0) {
    await prisma.refreshSession.deleteMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });

    await prisma.invitationToken.deleteMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds
        }
      }
    });
  }

  if (organizationIds.length > 0) {
    await prisma.organization.deleteMany({
      where: {
        id: {
          in: organizationIds
        }
      }
    });
  }
}

async function createOrganization(
  label: string
) {
  const organization =
    await prisma.organization.create({
      data: {
        name:
          `Sprint 023 ${label} ${runId}`,
        slug:
          `${runId}-${label.toLowerCase()}`,
        organizationType:
          "ACCEPTANCE_TEST",
        country: "DE",
        currency: "EUR",
        timezone: "UTC",
        status: "ACTIVE"
      }
    });

  organizationIds.push(
    organization.id
  );

  return organization;
}

async function createRole(
  organizationId: string,
  name: string,
  permissionCodes: string[],
  isSystemRole = false
) {
  const role =
    await prisma.role.create({
      data: {
        organizationId,
        name,
        isSystemRole
      }
    });

  roleIds.push(role.id);

  const permissions =
    await prisma.permission.findMany({
      where: {
        code: {
          in: permissionCodes
        }
      }
    });

  check(
    permissions.length ===
      permissionCodes.length,
    `${name} permissions exist`
  );

  if (permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data:
        permissions.map(
          (permission) => ({
            roleId: role.id,
            permissionId:
              permission.id
          })
        )
    });
  }

  return role;
}

async function createMember(
  organizationId: string,
  roleId: string,
  label: string
) {
  const user =
    await prisma.user.create({
      data: {
        firstName: "Sprint022",
        lastName: label,
        email:
          `${runId}-${label.toLowerCase()}@acceptance.invalid`,
        status: "ACTIVE"
      }
    });

  userIds.push(user.id);

  const membership =
    await prisma.organizationUser.create({
      data: {
        organizationId,
        userId: user.id,
        roleId,
        status: "ACTIVE",
        joinedAt: new Date()
      }
    });

  return {
    user,
    membership
  };
}

function accessToken(
  userId: string
) {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return jwt.sign(
    { userId },
    secret,
    { expiresIn: "15m" }
  );
}

type RequestOptions = {
  token?: string;
  organizationId?: string;
  body?: unknown;
};

async function apiRequest(
  baseUrl: string,
  method: string,
  path: string,
  options: RequestOptions = {}
) {
  const headers:
    Record<string, string> = {};

  if (options.token) {
    headers.authorization =
      `Bearer ${options.token}`;
  }

  if (options.organizationId) {
    headers["x-organization-id"] =
      options.organizationId;
  }

  if (options.body !== undefined) {
    headers["content-type"] =
      "application/json";
  }

  const response =
    await fetch(
      `${baseUrl}${path}`,
      {
        method,
        headers,
        ...(options.body !== undefined
          ? {
              body:
                JSON.stringify(
                  options.body
                )
            }
          : {})
      }
    );

  const text =
    await response.text();

  let json:
    Record<string, any> = {};

  try {
    json =
      text
        ? JSON.parse(text)
        : {};
  } catch {
    json = { text };
  }

  return {
    status:
      response.status,
    json,
    text,
    headers:
      Object.fromEntries(
        response.headers
          .entries()
      )
  };
}

async function createBaseFixtures() {
  const allAuditPermissions = [
    "relationships.view",
    "relationships.manage",
    "audit_logs.view",
    "audit_logs.export",
    "hierarchy.view",
    "hierarchy.manage",
    "hierarchy.assign",
    "hierarchy.reconcile",
    "documents.view",
    "documents.download",
    "documents.upload",
    "documents.update",
    "documents.delete",
    "contacts.view",
    "contacts.create",
    "contacts.update",
    "contacts.delete",
    "branches.view",
    "branches.manage",
    "departments.view",
    "departments.manage",
    "work_items.view",
    "work_items.update",
    "work_items.attach",
    "requests.view",
    "requests.update",
    "workflow.view",
    "health.view",
    "attention.view",
    "command.view",
    "brief.view",
    "kpi.view",
    "dashboard.view"
  ];

  const organizationA =
    await createOrganization("A");

  const organizationB =
    await createOrganization("B");

  const administratorRoleA =
    await createRole(
      organizationA.id,
      "Administrator",
      allAuditPermissions,
      true
    );

  const scopedViewerRoleA =
    await createRole(
      organizationA.id,
      `Audit Viewer ${runId}`,
      allAuditPermissions
    );

  const emptyRoleA =
    await createRole(
      organizationA.id,
      `No Audit ${runId}`,
      []
    );

  const auditOnlyRoleA =
    await createRole(
      organizationA.id,
      `Audit View Only ${runId}`,
      [
        "audit_logs.view"
      ]
    );

  const administratorRoleB =
    await createRole(
      organizationB.id,
      "Administrator",
      allAuditPermissions,
      true
    );

  const branch =
    await prisma.branch.create({
      data: {
        organizationId:
          organizationA.id,
        name:
          `Command Branch ${runId}`,
        code:
          `HB-${runId}`,
        isActive: true
      }
    });

  const department =
    await prisma.department.create({
      data: {
        organizationId:
          organizationA.id,
        branchId:
          branch.id,
        name:
          `Command Department ${runId}`,
        code:
          `HD-${runId}`,
        isActive: true
      }
    });

  const administratorA =
    await createMember(
      organizationA.id,
      administratorRoleA.id,
      "AdministratorA"
    );

  const branchViewerA =
    await createMember(
      organizationA.id,
      scopedViewerRoleA.id,
      "BranchViewerA"
    );

  const departmentViewerA =
    await createMember(
      organizationA.id,
      scopedViewerRoleA.id,
      "DepartmentViewerA"
    );

  const emptyA =
    await createMember(
      organizationA.id,
      emptyRoleA.id,
      "EmptyA"
    );

  const unassignedA =
    await createMember(
      organizationA.id,
      auditOnlyRoleA.id,
      "UnassignedA"
    );

  const limitedBranchA =
    await createMember(
      organizationA.id,
      auditOnlyRoleA.id,
      "LimitedBranchA"
    );

  const limitedBranchMembership =
    await prisma.organizationUser.update({
      where: {
        id:
          limitedBranchA.membership.id
      },
      data: {
        branchId:
          branch.id
      }
    });

  const administratorB =
    await createMember(
      organizationB.id,
      administratorRoleB.id,
      "AdministratorB"
    );

  const branchMembership =
    await prisma.organizationUser.update({
      where: {
        id:
          branchViewerA.membership.id
      },
      data: {
        branchId:
          branch.id
      }
    });

  const departmentMembership =
    await prisma.organizationUser.update({
      where: {
        id:
          departmentViewerA.membership.id
      },
      data: {
        departmentId:
          department.id
      }
    });

  const now =
    new Date();

  const periodStart =
    new Date(
      now.getTime() -
      30 * 24 * 60 * 60 * 1000
    );

  const overdueWorkItem =
    await prisma.workItem.create({
      data: {
        organizationId:
          organizationA.id,
        branchId:
          branch.id,
        departmentId:
          department.id,
        createdByOrganizationUserId:
          administratorA.membership.id,
        ownerOrganizationUserId:
          administratorA.membership.id,
        assigneeOrganizationUserId:
          departmentMembership.id,
        title:
          `Overdue health work ${runId}`,
        priority: "HIGH",
        status: "OPEN",
        dueAt:
          new Date(
            now.getTime() -
            60 * 60 * 1000
          )
      }
    });

  const onTimeWorkItem =
    await prisma.workItem.create({
      data: {
        organizationId:
          organizationA.id,
        branchId:
          branch.id,
        departmentId:
          department.id,
        createdByOrganizationUserId:
          administratorA.membership.id,
        ownerOrganizationUserId:
          administratorA.membership.id,
        assigneeOrganizationUserId:
          departmentMembership.id,
        title:
          `On-time health work ${runId}`,
        priority: "NORMAL",
        status: "IN_PROGRESS",
        dueAt:
          new Date(
            now.getTime() +
            24 * 60 * 60 * 1000
          )
      }
    });

  const blockedWorkItem =
    await prisma.workItem.create({
      data: {
        organizationId:
          organizationA.id,
        branchId:
          branch.id,
        departmentId:
          department.id,
        createdByOrganizationUserId:
          administratorA.membership.id,
        ownerOrganizationUserId:
          administratorA.membership.id,
        assigneeOrganizationUserId:
          departmentMembership.id,
        title:
          `Blocked Daily Brief work ${runId}`,
        description:
          "Acceptance blocked Work Item.",
        priority:
          "URGENT",
        status:
          "BLOCKED",
        dueAt:
          new Date(
            now.getTime() +
            2 * 24 * 60 * 60 * 1000
          )
      }
    });

  const requestType =
    await prisma.requestType.create({
      data: {
        organizationId:
          organizationA.id,
        name:
          `Health request ${runId}`,
        code:
          `HEALTH-${runId}`,
        isActive: true
      }
    });

  const assignedRequest =
    await prisma.request.create({
      data: {
        organizationId:
          organizationA.id,
        requestTypeId:
          requestType.id,
        requesterOrganizationUserId:
          departmentMembership.id,
        assignedToOrganizationUserId:
          branchMembership.id,
        branchId:
          branch.id,
        departmentId:
          department.id,
        title:
          `Assigned health request ${runId}`,
        priority: "NORMAL",
        status: "SUBMITTED",
        submittedAt:
          now
      }
    });

  const unassignedRequest =
    await prisma.request.create({
      data: {
        organizationId:
          organizationA.id,
        requestTypeId:
          requestType.id,
        requesterOrganizationUserId:
          departmentMembership.id,
        assignedToOrganizationUserId:
          null,
        branchId:
          branch.id,
        departmentId:
          department.id,
        title:
          `Unassigned health request ${runId}`,
        priority: "HIGH",
        status: "IN_REVIEW",
        submittedAt:
          now
      }
    });

  await prisma.attentionItem.createMany({
    data: [
      {
        organizationId:
          organizationA.id,
        signalType:
          "WORK_ITEM_OVERDUE",
        sourceType:
          "WORK_ITEM",
        sourceId:
          overdueWorkItem.id,
        title:
          `Critical health attention ${runId}`,
        summary:
          "Acceptance high-pressure attention item.",
        severity:
          "CRITICAL",
        status:
          "OPEN",
        responsibleOrganizationUserId:
          departmentMembership.id,
        branchId:
          branch.id,
        departmentId:
          department.id,
        fingerprint:
          `health-critical:${runId}`
      },
      {
        organizationId:
          organizationA.id,
        signalType:
          "WORK_ITEM_OVERDUE",
        sourceType:
          "WORK_ITEM",
        sourceId:
          onTimeWorkItem.id,
        title:
          `Low health attention ${runId}`,
        summary:
          "Acceptance controlled attention item.",
        severity:
          "LOW",
        status:
          "OPEN",
        responsibleOrganizationUserId:
          departmentMembership.id,
        branchId:
          branch.id,
        departmentId:
          department.id,
        fingerprint:
          `health-low:${runId}`
      }
    ]
  });

  const completedWorkItem =
    await prisma.workItem.create({
      data: {
        organizationId:
          organizationA.id,
        branchId:
          branch.id,
        departmentId:
          department.id,
        createdByOrganizationUserId:
          administratorA.membership.id,
        ownerOrganizationUserId:
          administratorA.membership.id,
        assigneeOrganizationUserId:
          departmentMembership.id,
        completedByOrganizationUserId:
          administratorA.membership.id,
        title:
          `Completed command work ${runId}`,
        priority:
          "CRITICAL",
        status:
          "COMPLETED",
        dueAt:
          new Date(
            now.getTime() -
            24 * 60 * 60 * 1000
          ),
        completedAt:
          now
      }
    });

  const completedRequest =
    await prisma.request.create({
      data: {
        organizationId:
          organizationA.id,
        requestTypeId:
          requestType.id,
        requesterOrganizationUserId:
          departmentMembership.id,
        assignedToOrganizationUserId:
          branchMembership.id,
        branchId:
          branch.id,
        departmentId:
          department.id,
        title:
          `Completed command request ${runId}`,
        priority:
          "CRITICAL",
        status:
          "COMPLETED",
        submittedAt:
          new Date(
            now.getTime() -
            24 * 60 * 60 * 1000
          ),
        completedAt:
          now
      }
    });

  await prisma.attentionItem.create({
    data: {
      organizationId:
        organizationA.id,
      signalType:
        "WORK_ITEM_OVERDUE",
      sourceType:
        "WORK_ITEM",
      sourceId:
        completedWorkItem.id,
      title:
        `Resolved command attention ${runId}`,
      summary:
        "Terminal acceptance control item.",
      severity:
        "CRITICAL",
      status:
        "RESOLVED",
      responsibleOrganizationUserId:
        departmentMembership.id,
      branchId:
        branch.id,
      departmentId:
        department.id,
      resolvedAt:
        now,
      fingerprint:
        `command-resolved:${runId}`
    }
  });

  const policy =
    await prisma.slaPolicy.create({
      data: {
        organizationId:
          organizationA.id,
        name:
          `Health SLA ${runId}`,
        code:
          `HEALTH-SLA-${runId}`,
        isActive: true
      }
    });

  const target =
    await prisma.slaTarget.create({
      data: {
        organizationId:
          organizationA.id,
        slaPolicyId:
          policy.id,
        name:
          `Health target ${runId}`,
        targetType:
          "COMPLETION",
        durationMinutes: 60,
        warningMinutesBefore: 15,
        escalationMinutesAfter: 30,
        notifyOnWarning: false,
        notifyOnBreach: false,
        notifyOnEscalation: false,
        isActive: true
      }
    });

  const startedAt =
    new Date(
      now.getTime() -
      2 * 60 * 60 * 1000
    );

  const targetAt =
    new Date(
      now.getTime() -
      60 * 60 * 1000
    );

  const breachedSla =
    await prisma.slaInstance.create({
      data: {
        organizationId:
          organizationA.id,
        slaPolicyId:
          policy.id,
        slaTargetId:
          target.id,
        sourceType:
          "WORK_ITEM",
        sourceId:
          overdueWorkItem.id,
        status:
          "BREACHED",
        startedAt,
        targetAt,
        breachedAt:
          targetAt
      }
    });

  const satisfiedSla =
    await prisma.slaInstance.create({
      data: {
        organizationId:
          organizationA.id,
        slaPolicyId:
          policy.id,
        slaTargetId:
          target.id,
        sourceType:
          "WORK_ITEM",
        sourceId:
          onTimeWorkItem.id,
        status:
          "SATISFIED",
        startedAt,
        targetAt,
        satisfiedAt:
          new Date(
            targetAt.getTime() -
            5 * 60 * 1000
          )
      }
    });

  return {
    organizationA,
    organizationB,
    branch,
    department,
    administratorA,
    branchViewerA: {
      ...branchViewerA,
      membership:
        branchMembership
    },
    departmentViewerA: {
      ...departmentViewerA,
      membership:
        departmentMembership
    },
    emptyA,
    unassignedA,
    limitedBranchA: {
      ...limitedBranchA,
      membership:
        limitedBranchMembership
    },
    administratorB,
    now,
    periodStart,
    overdueWorkItem,
    onTimeWorkItem,
    blockedWorkItem,
    assignedRequest,
    unassignedRequest,
    breachedSla,
    satisfiedSla,
    tokens: {
      administratorA:
        accessToken(
          administratorA.user.id
        ),
      branchViewerA:
        accessToken(
          branchViewerA.user.id
        ),
      departmentViewerA:
        accessToken(
          departmentViewerA.user.id
        ),
      emptyA:
        accessToken(
          emptyA.user.id
        ),
      unassignedA:
        accessToken(
          unassignedA.user.id
        ),
      limitedBranchA:
        accessToken(
          limitedBranchA.user.id
        ),
      administratorB:
        accessToken(
          administratorB.user.id
        )
    }
  };
}

async function prepareAcceptance() {
  const fixtures =
    await createBaseFixtures();

  const evaluationInput = {
    now:
      fixtures.now,
    periodStart:
      fixtures.periodStart,
    periodEnd:
      fixtures.now
  };

  const previousNow =
    new Date(
      fixtures.now.getTime() -
      24 * 60 * 60 * 1000
    );

  const previousOrganizationHealth =
    await evaluateOrganizationHealth(
      fixtures.organizationA.id,
      {
        scopeType:
          HealthScopeType.ORGANIZATION
      },
      {
        now:
          previousNow,
        periodStart:
          new Date(
            previousNow.getTime() -
            30 * 24 * 60 * 60 * 1000
          ),
        periodEnd:
          previousNow
      }
    );

  const organizationHealth =
    await evaluateOrganizationHealth(
      fixtures.organizationA.id,
      {
        scopeType:
          HealthScopeType.ORGANIZATION
      },
      evaluationInput
    );

  const branchHealth =
    await evaluateOrganizationHealth(
      fixtures.organizationA.id,
      {
        scopeType:
          HealthScopeType.BRANCH,
        branchId:
          fixtures.branch.id
      },
      evaluationInput
    );

  const departmentHealth =
    await evaluateOrganizationHealth(
      fixtures.organizationA.id,
      {
        scopeType:
          HealthScopeType.DEPARTMENT,
        departmentId:
          fixtures.department.id
      },
      evaluationInput
    );

  check(
    organizationHealth.snapshot.id !==
      undefined,
    "organization Health snapshot exists"
  );

  check(
    branchHealth.snapshot.id !==
      undefined,
    "branch Health snapshot exists"
  );

  check(
    departmentHealth.snapshot.id !==
      undefined,
    "department Health snapshot exists"
  );

  const server =
    app.listen(0);

  await new Promise<void>(
    (resolve) =>
      server.once(
        "listening",
        resolve
      )
  );

  const address =
    server.address();

  check(
    typeof address ===
      "object" &&
    address !== null,
    "acceptance API server started"
  );

  const baseUrl =
    `http://127.0.0.1:${
      (
        address as {
          port: number;
        }
      ).port
    }`;

  return {
    fixtures,
    health: {
      previousOrganization:
        previousOrganizationHealth.snapshot,
      organization:
        organizationHealth.snapshot,
      branch:
        branchHealth.snapshot,
      department:
        departmentHealth.snapshot
    },
    server,
    baseUrl
  };
}



async function testAuditSecurityAndCore(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const unauthenticated =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs"
    );

  const missingOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs",
      {
        token:
          fixtures.tokens
            .administratorA
      }
    );

  const foreignMembership =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs",
      {
        token:
          fixtures.tokens
            .administratorB,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const noPermission =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs",
      {
        token:
          fixtures.tokens.emptyA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const viewOnly =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs?limit=1",
      {
        token:
          fixtures.tokens
            .unassignedA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const exportDenied =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs/export",
      {
        token:
          fixtures.tokens
            .unassignedA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    unauthenticated.status ===
      401 &&
    missingOrganization.status ===
      400 &&
    foreignMembership.status ===
      403,
    "audit authentication, organization context and membership are enforced"
  );

  check(
    noPermission.status ===
      403 &&
    viewOnly.status ===
      200 &&
    exportDenied.status ===
      403,
    "audit view and export permissions are independently enforced"
  );

  const callerOwned = {
    password:
      "top-secret",
    nested: {
      accessToken:
        "token-secret",
      safe:
        "visible"
    },
    items: [
      {
        api_key:
          "key-secret"
      }
    ]
  };

  const redacted =
    redactAuditValue(
      callerOwned
    ) as
      Record<string, any>;

  check(
    redacted.password ===
      auditRedactionMarker &&
    redacted.nested
      .accessToken ===
      auditRedactionMarker &&
    redacted.items[0]
      .api_key ===
      auditRedactionMarker &&
    callerOwned.password ===
      "top-secret",
    "recursive redaction protects secrets without mutating caller objects"
  );

  const legacy =
    await createAuditLog({
      organizationId:
        fixtures.organizationA.id,
      userId:
        fixtures.administratorA
          .user.id,
      action:
        " legacy audit test ",
      entityType:
        " test entity ",
      entityId:
        fixtures.overdueWorkItem.id,
      newValues: {
        state:
          "created"
      }
    });

  check(
    legacy.action ===
      "LEGACY_AUDIT_TEST" &&
    legacy.entityType ===
      "TEST_ENTITY" &&
    legacy.category ===
      "BUSINESS" &&
    legacy.source ===
      "APPLICATION" &&
    legacy.result ===
      "SUCCESS" &&
    typeof legacy.integrityHash ===
      "string",
    "legacy audit creation remains compatible with normalized defaults"
  );

  const contextual =
    await createAuditLog({
      organizationId:
        fixtures.organizationA.id,
      userId:
        fixtures.administratorA
          .user.id,
      organizationUserId:
        fixtures.administratorA
          .membership.id,
      action:
        "security investigation opened",
      entityType:
        "audit investigation",
      entityId:
        fixtures.assignedRequest.id,
      category:
        AuditEventCategory.SECURITY,
      source:
        AuditEventSource.API,
      result:
        AuditEventResult.SUCCESS,
      oldValues: {
        passwordHash:
          "hidden-old"
      },
      newValues: {
        clientSecret:
          "hidden-new"
      },
      metadata: {
        cookie:
          "hidden-cookie"
      },
      ipAddress:
        "192.0.2.23",
      userAgent:
        "Sprint023Acceptance",
      requestId:
        `request-${runId}`,
      correlationId:
        `correlation-${runId}`,
      httpMethod:
        "post",
      requestPath:
        "/audit-investigations",
      httpStatusCode:
        201
    });

  check(
    contextual.organizationUserId ===
      fixtures.administratorA
        .membership.id &&
    contextual.category ===
      "SECURITY" &&
    contextual.source ===
      "API" &&
    contextual.httpMethod ===
      "POST" &&
    (
      contextual.oldValues as
        Record<string, any>
    ).passwordHash ===
      auditRedactionMarker &&
    (
      contextual.newValues as
        Record<string, any>
    ).clientSecret ===
      auditRedactionMarker &&
    (
      contextual.metadata as
        Record<string, any>
    ).cookie ===
      auditRedactionMarker,
    "audit actor, request context and redacted snapshots persist"
  );

  check(
    verifyAuditIntegrity(
      contextual
    ) &&
    !verifyAuditIntegrity({
      ...contextual,
      action:
        "ALTERED_ACTION"
    }),
    "audit integrity verification detects changed content"
  );

  let invalidEvents =
    0;

  for (
    const input
    of [
      {
        action:
          "   ",
        entityType:
          "TEST"
      },
      {
        action:
          "TEST",
        entityType:
          "   "
      }
    ]
  ) {
    try {
      await createAuditLog({
        organizationId:
          fixtures.organizationA.id,
        ...input
      });
    } catch {
      invalidEvents += 1;
    }
  }

  check(
    invalidEvents ===
      2,
    "blank audit action and entity type values are rejected"
  );

  let foreignActorRejected =
    false;

  try {
    await createAuditLog({
      organizationId:
        fixtures.organizationA.id,
      organizationUserId:
        fixtures.administratorB
          .membership.id,
      action:
        "FOREIGN_ACTOR_TEST",
      entityType:
        "AUDIT_TEST"
    });
  } catch {
    foreignActorRejected =
      true;
  }

  check(
    foreignActorRejected,
    "cross-tenant audit membership context is rejected"
  );

  const foreign =
    await createAuditLog({
      organizationId:
        fixtures.organizationB.id,
      userId:
        fixtures.administratorB
          .user.id,
      organizationUserId:
        fixtures.administratorB
          .membership.id,
      action:
        "FOREIGN_AUDIT_EVENT",
      entityType:
        "AUDIT_TEST",
      entityId:
        fixtures.organizationB.id,
      category:
        AuditEventCategory.SECURITY,
      source:
        AuditEventSource.SYSTEM,
      result:
        AuditEventResult.DENIED,
      requestId:
        `foreign-${runId}`
    });

  return {
    legacy,
    contextual,
    foreign
  };
}

async function testAuditQueryAndPagination(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  core:
    Awaited<
      ReturnType<
        typeof testAuditSecurityAndCore
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const created = [];

  for (
    let index = 0;
    index < 5;
    index += 1
  ) {
    created.push(
      await createAuditLog({
        organizationId:
          fixtures.organizationA.id,
        userId:
          fixtures.administratorA
            .user.id,
        organizationUserId:
          fixtures.administratorA
            .membership.id,
        action:
          "PAGINATION_TEST",
        entityType:
          "AUDIT_PAGE",
        entityId:
          fixtures.overdueWorkItem.id,
        category:
          AuditEventCategory.SECURITY,
        source:
          AuditEventSource.API,
        result:
          AuditEventResult.SUCCESS,
        requestId:
          `page-request-${index}-${runId}`,
        correlationId:
          `page-correlation-${runId}`,
        metadata: {
          index
        }
      })
    );
  }

  const auth = {
    token:
      fixtures.tokens
        .administratorA,
    organizationId:
      fixtures.organizationA.id
  };

  const filtered =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs" +
      "?action=PAGINATION_TEST" +
      "&entityType=AUDIT_PAGE" +
      "&category=SECURITY" +
      "&source=API" +
      "&result=SUCCESS" +
      "&correlationId=" +
      encodeURIComponent(
        `page-correlation-${runId}`
      ) +
      "&limit=2",
      auth
    );

  check(
    filtered.status ===
      200 &&
    filtered.json.data
      .items.length ===
      2 &&
    filtered.json.data
      .hasMore ===
      true &&
    typeof filtered.json.data
      .nextCursor ===
      "string",
    "combined audit filters and bounded first page work"
  );

  const collected =
    new Set<string>();

  let cursor:
    string | null =
      null;

  do {
    const page =
      await apiRequest(
        baseUrl,
        "GET",
        "/audit-logs" +
        "?action=PAGINATION_TEST" +
        "&limit=2" +
        (
          cursor
            ? `&cursor=${
                encodeURIComponent(
                  cursor
                )
              }`
            : ""
        ),
        auth
      );

    check(
      page.status ===
        200,
      "audit cursor page returns successfully"
    );

    for (
      const event
      of page.json.data.items
    ) {
      check(
        !collected.has(
          event.id
        ),
        "audit cursor pagination contains no duplicates"
      );

      collected.add(
        event.id
      );
    }

    cursor =
      page.json.data
        .nextCursor;
  } while (cursor);

  check(
    collected.size ===
      5 &&
    created.every(
      (event) =>
        collected.has(
          event.id
        )
    ),
    "audit cursor pagination contains no omissions"
  );

  const exactRequest =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs?requestId=" +
      encodeURIComponent(
        `page-request-2-${runId}`
      ),
      auth
    );

  const actorFilter =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs?userId=" +
      fixtures.administratorA
        .user.id +
      "&organizationUserId=" +
      fixtures.administratorA
        .membership.id,
      auth
    );

  const entityFilter =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs?entityId=" +
      fixtures.overdueWorkItem.id +
      "&entityType=AUDIT_PAGE",
      auth
    );

  const search =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs?search=" +
      encodeURIComponent(
        fixtures.administratorA
          .user.email
      ),
      auth
    );

  const createdFrom =
    new Date(
      created[0].createdAt
        .getTime() -
      1000
    ).toISOString();

  const createdTo =
    new Date(
      created[
        created.length - 1
      ].createdAt.getTime() +
      1000
    ).toISOString();

  const dateFilter =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs" +
      "?action=PAGINATION_TEST" +
      `&createdFrom=${
        encodeURIComponent(
          createdFrom
        )
      }` +
      `&createdTo=${
        encodeURIComponent(
          createdTo
        )
      }`,
      auth
    );

  check(
    exactRequest.status ===
      200 &&
    exactRequest.json.data
      .items.length ===
      1 &&
    actorFilter.status ===
      200 &&
    actorFilter.json.data
      .items.length >=
      5 &&
    entityFilter.status ===
      200 &&
    entityFilter.json.data
      .items.length ===
      5 &&
    search.status ===
      200 &&
    search.json.data
      .items.length >=
      5 &&
    dateFilter.status ===
      200 &&
    dateFilter.json.data
      .items.length ===
      5,
    "request, actor, entity, search and date filters work"
  );

  const invalidQueries = [
    "/audit-logs?unknown=true",
    "/audit-logs?userId=invalid",
    "/audit-logs?category=UNKNOWN",
    "/audit-logs?createdFrom=invalid",
    "/audit-logs?createdFrom=2030-01-01T00%3A00%3A00.000Z&createdTo=2020-01-01T00%3A00%3A00.000Z",
    "/audit-logs?limit=0",
    "/audit-logs?limit=201",
    "/audit-logs?cursor=malformed"
  ];

  for (
    const path
    of invalidQueries
  ) {
    const response =
      await apiRequest(
        baseUrl,
        "GET",
        path,
        auth
      );

    check(
      response.status ===
        400,
      `invalid audit query is rejected: ${path}`
    );
  }

  const retrieved =
    await apiRequest(
      baseUrl,
      "GET",
      `/audit-logs/${
        core.contextual.id
      }`,
      auth
    );

  const foreign =
    await apiRequest(
      baseUrl,
      "GET",
      `/audit-logs/${
        core.foreign.id
      }`,
      auth
    );

  const missing =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs/00000000-0000-4000-8000-000000000000",
      auth
    );

  check(
    retrieved.status ===
      200 &&
    retrieved.json.data.id ===
      core.contextual.id &&
    foreign.status ===
      404 &&
    missing.status ===
      404,
    "single-event retrieval is tenant-isolated and non-disclosing"
  );

  const beforeReads =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id
      }
    });

  await apiRequest(
    baseUrl,
    "GET",
    "/audit-logs?limit=5",
    auth
  );

  await apiRequest(
    baseUrl,
    "GET",
    `/audit-logs/${
      core.legacy.id
    }`,
    auth
  );

  const afterReads =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id
      }
    });

  check(
    beforeReads ===
      afterReads,
    "audit listing and retrieval are read-only"
  );

  return {
    created,
    auth
  };
}

async function testAuditExportAndCompatibility(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  core:
    Awaited<
      ReturnType<
        typeof testAuditSecurityAndCore
      >
    >,
  query:
    Awaited<
      ReturnType<
        typeof testAuditQueryAndPagination
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const formulaEvent =
    await createAuditLog({
      organizationId:
        fixtures.organizationA.id,
      userId:
        fixtures.administratorA
          .user.id,
      organizationUserId:
        fixtures.administratorA
          .membership.id,
      action:
        "EXPORT_FORMULA_TEST",
      entityType:
        "AUDIT_EXPORT",
      category:
        AuditEventCategory.SECURITY,
      source:
        AuditEventSource.API,
      result:
        AuditEventResult.SUCCESS,
      userAgent:
        "=2+2",
      metadata: {
        export:
          true
      }
    });

  const exportAuditsBefore =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action:
          "AUDIT_LOG_EXPORTED"
      }
    });

  const exported =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs/export?action=EXPORT_FORMULA_TEST",
      query.auth
    );

  check(
    exported.status ===
      200 &&
    exported.headers[
      "content-type"
    ]?.includes(
      "text/csv"
    ) &&
    exported.headers[
      "content-disposition"
    ]?.includes(
      "ornexis-audit-"
    ) &&
    exported.headers[
      "x-audit-record-count"
    ] ===
      "1",
    "authorized filtered CSV audit export succeeds"
  );

  check(
    exported.text.includes(
      formulaEvent.id
    ) &&
    exported.text.includes(
      "\"'=2+2\""
    ) &&
    !exported.text.includes(
      "AUDIT_LOG_EXPORTED"
    ),
    "CSV export is formula-safe and excludes its own audit event"
  );

  const exportAudits =
    await prisma.auditLog.findMany({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action:
          "AUDIT_LOG_EXPORTED"
      },
      orderBy: {
        createdAt:
          "desc"
      }
    });

  check(
    exportAudits.length -
      exportAuditsBefore ===
      1 &&
    (
      exportAudits[0]
        ?.metadata as
        Record<string, any>
    ).exportedCount ===
      1,
    "successful audit export is audited exactly once"
  );

  const unsupportedExport =
    await apiRequest(
      baseUrl,
      "GET",
      "/audit-logs/export?format=json",
      query.auth
    );

  check(
    unsupportedExport.status ===
      400,
    "unsupported audit export formats are rejected"
  );

  const updateAttempt =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/audit-logs/${
        core.contextual.id
      }`,
      {
        ...query.auth,
        body: {
          action:
            "ALTERED"
        }
      }
    );

  const deleteAttempt =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/audit-logs/${
        core.contextual.id
      }`,
      query.auth
    );

  check(
    updateAttempt.status ===
      404 &&
    deleteAttempt.status ===
      404,
    "audit API exposes no update or delete operations"
  );

  const compatibilityChecks = [
    {
      path:
        "/contacts",
      message:
        "existing Contact endpoint remains compatible"
    },
    {
      path:
        "/documents",
      message:
        "existing Document endpoint remains compatible"
    },
    {
      path:
        "/work-items",
      message:
        "existing Work Item endpoint remains compatible"
    },
    {
      path:
        "/requests",
      message:
        "existing Request endpoint remains compatible"
    },
    {
      path:
        "/workflows",
      message:
        "existing Workflow endpoint remains compatible"
    },
    {
      path:
        "/health/definitions",
      message:
        "existing Organization Health endpoint remains compatible"
    },
    {
      path:
        "/command-centre",
      message:
        "existing Command Centre endpoint remains compatible"
    },
    {
      path:
        "/daily-brief",
      message:
        "existing Daily Brief endpoint remains compatible"
    },
    {
      path:
        "/kpis/categories",
      message:
        "existing KPI endpoint remains compatible"
    },
    {
      path:
        "/relationships?entityType=WORK_ITEM&entityId=" +
        fixtures.overdueWorkItem.id,
      message:
        "existing relationship endpoint remains compatible"
    },
    {
      path:
        "/hierarchy/unit-types",
      message:
        "existing hierarchy endpoint remains compatible"
    },
    {
      path:
        "/dashboard/overview",
      message:
        "existing dashboard endpoint remains compatible"
    }
  ];

  for (
    const item
    of compatibilityChecks
  ) {
    const response =
      await apiRequest(
        baseUrl,
        "GET",
        item.path,
        query.auth
      );

    check(
      response.status ===
        200,
      item.message
    );
  }
}

let runtimeContext:
  Awaited<
    ReturnType<
      typeof prepareAcceptance
    >
  > | null = null;

async function main() {
  runtimeContext =
    await prepareAcceptance();

  const core =
    await testAuditSecurityAndCore(
      runtimeContext
    );

  const query =
    await testAuditQueryAndPagination(
      runtimeContext,
      core
    );

  await testAuditExportAndCompatibility(
    runtimeContext,
    core,
    query
  );

  console.log(
    "\nSPRINT 023 RUNTIME ACCEPTANCE: PASS"
  );
}

main()
  .catch(
    (error) => {
      console.error(error);
      process.exitCode = 1;
    }
  )
  .finally(async () => {
    try {
      if (runtimeContext) {
        runtimeContext.server
          .closeAllConnections();

        await new Promise<void>(
          (resolve) =>
            runtimeContext!.server.close(
              () => resolve()
            )
        );
      }

      await cleanup();

      console.log(
        "PASS: Acceptance fixtures cleaned up."
      );
    } catch (error) {
      console.error(
        "FAIL: Acceptance cleanup failed.",
        error
      );

      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  });
