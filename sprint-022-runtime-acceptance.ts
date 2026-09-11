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
  HealthScopeType
} from "./packages/database/generated/client/enums.js";

import {
  evaluateAllSystemKpis
} from "./apps/api/src/services/kpiEvaluatorService.js";

const runId =
  `s022-${Date.now()}`;

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
          `Sprint 022 ${label} ${runId}`,
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
    json
  };
}

async function createBaseFixtures() {
  const allHierarchyPermissions = [
    "relationships.view",
    "relationships.manage",
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
      allHierarchyPermissions,
      true
    );

  const scopedViewerRoleA =
    await createRole(
      organizationA.id,
      `Hierarchy Viewer ${runId}`,
      allHierarchyPermissions
    );

  const emptyRoleA =
    await createRole(
      organizationA.id,
      `No Hierarchy ${runId}`,
      []
    );

  const hierarchyOnlyRoleA =
    await createRole(
      organizationA.id,
      `Hierarchy Only ${runId}`,
      [
        "hierarchy.view"
      ]
    );

  const administratorRoleB =
    await createRole(
      organizationB.id,
      "Administrator",
      allHierarchyPermissions,
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
      hierarchyOnlyRoleA.id,
      "UnassignedA"
    );

  const limitedBranchA =
    await createMember(
      organizationA.id,
      hierarchyOnlyRoleA.id,
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


async function testHierarchySecurityAndReconciliation(
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
      "/hierarchy/units"
    );

  check(
    unauthenticated.status ===
      401,
    "unauthenticated hierarchy access is rejected"
  );

  const missingOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      "/hierarchy/units",
      {
        token:
          fixtures.tokens
            .administratorA
      }
    );

  check(
    missingOrganization.status ===
      400,
    "hierarchy access requires organization context"
  );

  const foreignMembership =
    await apiRequest(
      baseUrl,
      "GET",
      "/hierarchy/units",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationB.id
      }
    );

  check(
    foreignMembership.status ===
      403,
    "foreign organization membership is rejected"
  );

  const missingViewPermission =
    await apiRequest(
      baseUrl,
      "GET",
      "/hierarchy/units",
      {
        token:
          fixtures.tokens.emptyA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    missingViewPermission.status ===
      403,
    "hierarchy.view permission is enforced"
  );

  const viewOnlyList =
    await apiRequest(
      baseUrl,
      "GET",
      "/hierarchy/unit-types",
      {
        token:
          fixtures.tokens
            .unassignedA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    viewOnlyList.status ===
      200,
    "hierarchy.view operates independently"
  );

  const viewOnlyMutation =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/unit-types",
      {
        token:
          fixtures.tokens
            .unassignedA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          code:
            `DENIED-${runId}`,
          name:
            `Denied ${runId}`
        }
      }
    );

  check(
    viewOnlyMutation.status ===
      403,
    "hierarchy.manage is independently enforced"
  );

  const firstReconciliation =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/reconcile",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    firstReconciliation.status ===
      200 &&
    firstReconciliation.json.data
      .typesCreated ===
      2 &&
    firstReconciliation.json.data
      .unitsCreated ===
      2 &&
    firstReconciliation.json.data
      .failed ===
      0,
    "legacy Branch and Department hierarchy is reconciled"
  );

  const secondReconciliation =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/reconcile",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    secondReconciliation.status ===
      200 &&
    secondReconciliation.json.data
      .typesExisting ===
      2 &&
    secondReconciliation.json.data
      .unitsExisting ===
      2 &&
    secondReconciliation.json.data
      .unitsCreated ===
      0 &&
    secondReconciliation.json.data
      .unitsUpdated ===
      0,
    "hierarchy compatibility reconciliation is idempotent"
  );

  const branchUnit =
    await prisma
      .organizationalUnit
      .findFirst({
        where: {
          organizationId:
            fixtures.organizationA.id,
          legacyBranchId:
            fixtures.branch.id
        },
        include: {
          unitType: true
        }
      });

  const departmentUnit =
    await prisma
      .organizationalUnit
      .findFirst({
        where: {
          organizationId:
            fixtures.organizationA.id,
          legacyDepartmentId:
            fixtures.department.id
        },
        include: {
          unitType: true
        }
      });

  check(
    branchUnit !==
      null &&
    branchUnit.unitType.code ===
      "BRANCH" &&
    departmentUnit !==
      null &&
    departmentUnit.unitType.code ===
      "DEPARTMENT" &&
    departmentUnit.parentId ===
      branchUnit.id,
    "legacy compatibility units preserve Branch and Department structure"
  );

  const reservedType =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/unit-types",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          code:
            "BRANCH",
          name:
            `Reserved ${runId}`
        }
      }
    );

  check(
    reservedType.status ===
      409,
    "reserved compatibility unit-type codes are protected"
  );

  const foreignReconciliation =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/reconcile",
      {
        token:
          fixtures.tokens
            .administratorB,
        organizationId:
          fixtures.organizationB.id
      }
    );

  check(
    foreignReconciliation.status ===
      200 &&
    foreignReconciliation.json.data
      .typesCreated ===
      2 &&
    foreignReconciliation.json.data
      .unitsCreated ===
      0,
    "hierarchy reconciliation remains tenant-isolated"
  );

  const reconciliationAudit =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action:
          "HIERARCHY_COMPATIBILITY_RECONCILED"
      }
    });

  check(
    reconciliationAudit ===
      2,
    "hierarchy reconciliation is audited per request"
  );

  return {
    branchUnit:
      branchUnit!,
    departmentUnit:
      departmentUnit!
  };
}

async function testHierarchyLifecycleAndTraversal(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  compatibility:
    Awaited<
      ReturnType<
        typeof testHierarchySecurityAndReconciliation
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  async function createType(
    code: string,
    name: string,
    displayOrder: number
  ) {
    const response =
      await apiRequest(
        baseUrl,
        "POST",
        "/hierarchy/unit-types",
        {
          token:
            fixtures.tokens
              .administratorA,
          organizationId:
            fixtures.organizationA.id,
          body: {
            code,
            name,
            displayOrder
          }
        }
      );

    check(
      response.status ===
        201,
      `${name} organizational unit type is created`
    );

    return response.json.data;
  }

  async function createUnit(
    input: {
      unitTypeId: string;
      parentId?:
        string | null;
      code: string;
      name: string;
    }
  ) {
    const response =
      await apiRequest(
        baseUrl,
        "POST",
        "/hierarchy/units",
        {
          token:
            fixtures.tokens
              .administratorA,
          organizationId:
            fixtures.organizationA.id,
          body:
            input
        }
      );

    check(
      response.status ===
        201,
      `${input.name} organizational unit is created`
    );

    return response.json.data;
  }

  const regionType =
    await createType(
      `REGION-${runId}`,
      `Region ${runId}`,
      10
    );

  const divisionType =
    await createType(
      `DIVISION-${runId}`,
      `Division ${runId}`,
      20
    );

  const teamType =
    await createType(
      `TEAM-${runId}`,
      `Team ${runId}`,
      30
    );

  const rootA =
    await createUnit({
      unitTypeId:
        regionType.id,
      code:
        `NORTH-${runId}`,
      name:
        `North Region ${runId}`
    });

  const rootB =
    await createUnit({
      unitTypeId:
        regionType.id,
      code:
        `SOUTH-${runId}`,
      name:
        `South Region ${runId}`
    });

  const division =
    await createUnit({
      unitTypeId:
        divisionType.id,
      parentId:
        rootA.id,
      code:
        `OPS-${runId}`,
      name:
        `Operations Division ${runId}`
    });

  const team =
    await createUnit({
      unitTypeId:
        teamType.id,
      parentId:
        division.id,
      code:
        `SERVICE-${runId}`,
      name:
        `Service Team ${runId}`
    });

  const roots =
    await apiRequest(
      baseUrl,
      "GET",
      "/hierarchy/units?parentId=null&limit=200",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const rootIds =
    new Set(
      roots.json.data.map(
        (
          unit:
            { id: string }
        ) =>
          unit.id
      )
    );

  check(
    roots.status ===
      200 &&
    rootIds.has(
      rootA.id
    ) &&
    rootIds.has(
      rootB.id
    ) &&
    rootIds.has(
      compatibility
        .branchUnit.id
    ),
    "multiple deterministic hierarchy roots are supported"
  );

  const ancestors =
    await apiRequest(
      baseUrl,
      "GET",
      `/hierarchy/units/${team.id}/ancestors`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    ancestors.status ===
      200 &&
    ancestors.json.data
      .map(
        (
          item:
            {
              unit: {
                id: string;
              };
            }
        ) =>
          item.unit.id
      )
      .join(",") ===
      [
        rootA.id,
        division.id
      ].join(","),
    "ancestors are ordered from root to immediate parent"
  );

  const descendants =
    await apiRequest(
      baseUrl,
      "GET",
      `/hierarchy/units/${rootA.id}/descendants?maxDepth=32&limit=200`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    descendants.status ===
      200 &&
    descendants.json.data
      .map(
        (
          item:
            {
              unit: {
                id: string;
              };
              depth: number;
            }
        ) =>
          `${
            item.unit.id
          }:${
            item.depth
          }`
      )
      .join(",") ===
      [
        `${division.id}:1`,
        `${team.id}:2`
      ].join(","),
    "descendant traversal is depth-first and deterministic"
  );

  const duplicateSibling =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/units",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          unitTypeId:
            teamType.id,
          parentId:
            division.id,
          code:
            `SERVICE-SECOND-${runId}`,
          name:
            `  service   team ${runId}  `
        }
      }
    );

  check(
    duplicateSibling.status ===
      409,
    "normalized duplicate sibling identity is rejected"
  );

  const selfParent =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/hierarchy/units/${rootA.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          parentId:
            rootA.id
        }
      }
    );

  check(
    selfParent.status ===
      409,
    "self-parenting is rejected"
  );

  const indirectCycle =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/hierarchy/units/${rootA.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          parentId:
            team.id
        }
      }
    );

  check(
    indirectCycle.status ===
      409,
    "indirect hierarchy cycles are rejected"
  );

  const activeParentDeactivation =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/hierarchy/units/${rootA.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          isActive:
            false
        }
      }
    );

  check(
    activeParentDeactivation.status ===
      409,
    "units with active children cannot be deactivated"
  );

  const protectedCompatibilityUpdate =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/hierarchy/units/${compatibility.branchUnit.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          name:
            "Unauthorized compatibility rename"
        }
      }
    );

  const protectedCompatibilityDelete =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/hierarchy/units/${compatibility.departmentUnit.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    protectedCompatibilityUpdate.status ===
      409 &&
    protectedCompatibilityDelete.status ===
      409,
    "legacy compatibility units are protected from direct mutation"
  );

  const typeInUseDelete =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/hierarchy/unit-types/${teamType.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    typeInUseDelete.status ===
      409,
    "unit types in use cannot be deleted"
  );

  const unknownField =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/units",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          unitTypeId:
            teamType.id,
          code:
            `UNKNOWN-${runId}`,
          name:
            `Unknown ${runId}`,
          organizationId:
            fixtures.organizationB.id
        }
      }
    );

  check(
    unknownField.status ===
      400,
    "client-supplied hierarchy ownership is rejected"
  );

  const mutationAudits =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action: {
          in: [
            "HIERARCHY_UNIT_TYPE_CREATED",
            "HIERARCHY_UNIT_CREATED"
          ]
        }
      }
    });

  check(
    mutationAudits ===
      7,
    "successful hierarchy type and unit creation is audited"
  );

  return {
    regionType,
    divisionType,
    teamType,
    rootA,
    rootB,
    division,
    team
  };
}

async function testHierarchyAssignmentsAndScope(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  hierarchy:
    Awaited<
      ReturnType<
        typeof testHierarchyLifecycleAndTraversal
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  async function createAssignment(
    body:
      Record<
        string,
        unknown
      >,
    expectedStatus =
      201
  ) {
    const response =
      await apiRequest(
        baseUrl,
        "POST",
        "/hierarchy/assignments",
        {
          token:
            fixtures.tokens
              .administratorA,
          organizationId:
            fixtures.organizationA.id,
          body
        }
      );

    check(
      response.status ===
        expectedStatus,
      `hierarchy assignment request returns ${expectedStatus}`
    );

    return response;
  }

  const managerAssignment =
    await createAssignment({
      organizationalUnitId:
        hierarchy.rootA.id,
      organizationUserId:
        fixtures.branchViewerA
          .membership.id,
      assignmentRole:
        "MANAGER",
      isPrimary:
        true,
      responsibilityLabel:
        "Regional manager"
    });

  check(
    managerAssignment.json.data
      .isPrimary ===
      true &&
    managerAssignment.json.data
      .assignmentRole ===
      "MANAGER",
    "manager primary assignment is persisted"
  );

  const secondaryAssignment =
    await createAssignment({
      organizationalUnitId:
        hierarchy.rootB.id,
      organizationUserId:
        fixtures.branchViewerA
          .membership.id,
      assignmentRole:
        "RESPONSIBLE",
      isPrimary:
        false,
      responsibilityLabel:
        "Secondary regional responsibility"
    });

  check(
    secondaryAssignment.json.data
      .isPrimary ===
      false,
    "multiple non-primary unit assignments are supported"
  );

  const memberAssignment =
    await createAssignment({
      organizationalUnitId:
        hierarchy.team.id,
      organizationUserId:
        fixtures.departmentViewerA
          .membership.id,
      assignmentRole:
        "MEMBER",
      isPrimary:
        true
    });

  const duplicateAssignment =
    await createAssignment(
      {
        organizationalUnitId:
          hierarchy.team.id,
        organizationUserId:
          fixtures.departmentViewerA
            .membership.id,
        assignmentRole:
          "MEMBER"
      },
      409
    );

  check(
    duplicateAssignment.json.code ===
      "HIERARCHY_ASSIGNMENT_DUPLICATE",
    "duplicate active semantic assignments are rejected"
  );

  const secondPrimary =
    await createAssignment(
      {
        organizationalUnitId:
          hierarchy.division.id,
        organizationUserId:
          fixtures.departmentViewerA
            .membership.id,
        assignmentRole:
          "RESPONSIBLE",
        isPrimary:
          true
      },
      409
    );

  check(
    secondPrimary.json.code ===
      "HIERARCHY_PRIMARY_ASSIGNMENT_CONFLICT",
    "one active primary assignment is enforced"
  );

  const invalidPeriod =
    await createAssignment(
      {
        organizationalUnitId:
          hierarchy.rootB.id,
        organizationUserId:
          fixtures.unassignedA
            .membership.id,
        assignmentRole:
          "MEMBER",
        effectiveStart:
          new Date(
            fixtures.now.getTime() +
            60 * 60 * 1000
          ).toISOString(),
        effectiveEnd:
          fixtures.now
            .toISOString()
      },
      400
    );

  check(
    invalidPeriod.json.code ===
      "HIERARCHY_EFFECTIVE_PERIOD_INVALID",
    "invalid assignment effective periods are rejected"
  );

  const foreignUserAssignment =
    await createAssignment(
      {
        organizationalUnitId:
          hierarchy.rootA.id,
        organizationUserId:
          fixtures.administratorB
            .membership.id,
        assignmentRole:
          "MEMBER"
      },
      400
    );

  check(
    foreignUserAssignment.json.code ===
      "HIERARCHY_ASSIGNMENT_INVALID",
    "cross-tenant organization-user assignment is rejected"
  );

  const managerDescendant =
    await apiRequest(
      baseUrl,
      "GET",
      `/hierarchy/units/${hierarchy.team.id}`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    managerDescendant.status ===
      200,
    "manager assignments provide descendant visibility"
  );

  const memberOwnUnit =
    await apiRequest(
      baseUrl,
      "GET",
      `/hierarchy/units/${hierarchy.team.id}`,
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const memberAncestor =
    await apiRequest(
      baseUrl,
      "GET",
      `/hierarchy/units/${hierarchy.rootA.id}`,
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const memberForeignRoot =
    await apiRequest(
      baseUrl,
      "GET",
      `/hierarchy/units/${hierarchy.rootB.id}`,
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    memberOwnUnit.status ===
      200 &&
    memberAncestor.status ===
      200 &&
    memberForeignRoot.status ===
      404,
    "ordinary members see their unit and ancestors but not unrelated hierarchy"
  );

  const unassignedUnits =
    await apiRequest(
      baseUrl,
      "GET",
      "/hierarchy/units?limit=200",
      {
        token:
          fixtures.tokens
            .unassignedA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    unassignedUnits.status ===
      200 &&
    unassignedUnits.json.data
      .length ===
      0,
    "unassigned non-administrators receive no hierarchy units"
  );

  const selfMemberships =
    await apiRequest(
      baseUrl,
      "GET",
      `/hierarchy/memberships/${fixtures.departmentViewerA.membership.id}?active=true`,
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    selfMemberships.status ===
      200 &&
    selfMemberships.json.data
      .length ===
      1 &&
    selfMemberships.json.data[0]
      .id ===
      memberAssignment.json.data.id,
    "organization users may view their own active unit assignments"
  );

  const unauthorizedMemberships =
    await apiRequest(
      baseUrl,
      "GET",
      `/hierarchy/memberships/${fixtures.branchViewerA.membership.id}`,
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    unauthorizedMemberships.status ===
      404,
    "ordinary members cannot inspect another user assignment history"
  );

  const managedMembers =
    await apiRequest(
      baseUrl,
      "GET",
      `/hierarchy/units/${hierarchy.team.id}/members?active=true`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    managedMembers.status ===
      200 &&
    managedMembers.json.data
      .some(
        (
          assignment:
            { id: string }
        ) =>
          assignment.id ===
            memberAssignment
              .json.data.id
      ),
    "hierarchy managers may list members in descendant units"
  );

  const deactivate =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/hierarchy/assignments/${memberAssignment.json.data.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    deactivate.status ===
      200 &&
    deactivate.json.data
      .isActive ===
      false &&
    deactivate.json.data
      .isPrimary ===
      false,
    "assignment removal preserves history through deactivation"
  );

  const replacementAssignment =
    await createAssignment({
      organizationalUnitId:
        hierarchy.division.id,
      organizationUserId:
        fixtures.departmentViewerA
          .membership.id,
      assignmentRole:
        "MEMBER",
      isPrimary:
        true
    });

  check(
    replacementAssignment.status ===
      201,
    "a new primary assignment is allowed after prior deactivation"
  );

  const assignmentAudits =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action: {
          in: [
            "HIERARCHY_ASSIGNMENT_CREATED",
            "HIERARCHY_ASSIGNMENT_DEACTIVATED"
          ]
        }
      }
    });

  check(
    assignmentAudits ===
      5,
    "successful hierarchy assignment mutations are audited"
  );

  return {
    managerAssignment:
      managerAssignment.json.data,
    secondaryAssignment:
      secondaryAssignment.json.data,
    replacementAssignment:
      replacementAssignment.json.data
  };
}

async function testHierarchyDepthAndConcurrency(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  hierarchy:
    Awaited<
      ReturnType<
        typeof testHierarchyLifecycleAndTraversal
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  let parent =
    await prisma
      .organizationalUnit
      .create({
        data: {
          organizationId:
            fixtures.organizationA.id,
          unitTypeId:
            hierarchy.teamType.id,
          parentId:
            null,
          code:
            `DEPTH-ROOT-${runId}`,
          name:
            `Depth Root ${runId}`,
          normalizedName:
            `depth root ${runId}`,
          isActive:
            true
        }
      });

  for (
    let level = 1;
    level <= 31;
    level += 1
  ) {
    parent =
      await prisma
        .organizationalUnit
        .create({
          data: {
            organizationId:
              fixtures.organizationA.id,
            unitTypeId:
              hierarchy.teamType.id,
            parentId:
              parent.id,
            code:
              `DEPTH-${level}-${runId}`,
            name:
              `Depth ${level} ${runId}`,
            normalizedName:
              `depth ${level} ${runId}`,
            isActive:
              true
          }
        });
  }

  const depthOverflow =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/units",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          unitTypeId:
            hierarchy.teamType.id,
          parentId:
            parent.id,
          code:
            `DEPTH-OVERFLOW-${runId}`,
          name:
            `Depth Overflow ${runId}`
        }
      }
    );

  check(
    depthOverflow.status ===
      400 &&
    depthOverflow.json.code ===
      "HIERARCHY_DEPTH_EXCEEDED",
    "maximum hierarchy depth is enforced"
  );

  const concurrentA =
    await prisma
      .organizationalUnit
      .create({
        data: {
          organizationId:
            fixtures.organizationA.id,
          unitTypeId:
            hierarchy.regionType.id,
          code:
            `CONCURRENT-A-${runId}`,
          name:
            `Concurrent A ${runId}`,
          normalizedName:
            `concurrent a ${runId}`,
          isActive:
            true
        }
      });

  const concurrentB =
    await prisma
      .organizationalUnit
      .create({
        data: {
          organizationId:
            fixtures.organizationA.id,
          unitTypeId:
            hierarchy.regionType.id,
          code:
            `CONCURRENT-B-${runId}`,
          name:
            `Concurrent B ${runId}`,
          normalizedName:
            `concurrent b ${runId}`,
          isActive:
            true
        }
      });

  const cycleResponses =
    await Promise.all([
      apiRequest(
        baseUrl,
        "PATCH",
        `/hierarchy/units/${concurrentA.id}`,
        {
          token:
            fixtures.tokens
              .administratorA,
          organizationId:
            fixtures.organizationA.id,
          body: {
            parentId:
              concurrentB.id
          }
        }
      ),
      apiRequest(
        baseUrl,
        "PATCH",
        `/hierarchy/units/${concurrentB.id}`,
        {
          token:
            fixtures.tokens
              .administratorA,
          organizationId:
            fixtures.organizationA.id,
          body: {
            parentId:
              concurrentA.id
          }
        }
      )
    ]);

  const cycleStatuses =
    cycleResponses
      .map(
        (response) =>
          response.status
      )
      .sort();

  check(
    cycleStatuses.join(",") ===
      "200,409",
    "concurrent conflicting parent mutations persist one safe outcome"
  );

  const persistedConcurrentUnits =
    await prisma
      .organizationalUnit
      .findMany({
        where: {
          id: {
            in: [
              concurrentA.id,
              concurrentB.id
            ]
          }
        },
        select: {
          id: true,
          parentId: true
        }
      });

  check(
    !(
      persistedConcurrentUnits[0]
        ?.parentId ===
        persistedConcurrentUnits[1]
          ?.id &&
      persistedConcurrentUnits[1]
        ?.parentId ===
        persistedConcurrentUnits[0]
          ?.id
    ),
    "concurrent hierarchy mutation does not persist a cycle"
  );

  const primaryResponses =
    await Promise.all([
      apiRequest(
        baseUrl,
        "POST",
        "/hierarchy/assignments",
        {
          token:
            fixtures.tokens
              .administratorA,
          organizationId:
            fixtures.organizationA.id,
          body: {
            organizationalUnitId:
              hierarchy.rootA.id,
            organizationUserId:
              fixtures.unassignedA
                .membership.id,
            assignmentRole:
              "MEMBER",
            isPrimary:
              true
          }
        }
      ),
      apiRequest(
        baseUrl,
        "POST",
        "/hierarchy/assignments",
        {
          token:
            fixtures.tokens
              .administratorA,
          organizationId:
            fixtures.organizationA.id,
          body: {
            organizationalUnitId:
              hierarchy.rootB.id,
            organizationUserId:
              fixtures.unassignedA
                .membership.id,
            assignmentRole:
              "MEMBER",
            isPrimary:
              true
          }
        }
      )
    ]);

  const primaryStatuses =
    primaryResponses
      .map(
        (response) =>
          response.status
      )
      .sort();

  check(
    primaryStatuses.join(",") ===
      "201,409",
    "concurrent primary assignments persist one active primary"
  );

  const activePrimaryCount =
    await prisma
      .organizationalUnitAssignment
      .count({
        where: {
          organizationId:
            fixtures.organizationA.id,
          organizationUserId:
            fixtures.unassignedA
              .membership.id,
          isActive:
            true,
          isPrimary:
            true
        }
      });

  check(
    activePrimaryCount ===
      1,
    "database constraints preserve one active primary assignment"
  );
}

async function testHierarchyCompatibilityAndRegression(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  compatibility:
    Awaited<
      ReturnType<
        typeof testHierarchySecurityAndReconciliation
      >
    >,
  hierarchy:
    Awaited<
      ReturnType<
        typeof testHierarchyLifecycleAndTraversal
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const renamedBranch =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/branches/${fixtures.branch.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          name:
            `Renamed Branch ${runId}`
        }
      }
    );

  check(
    renamedBranch.status ===
      200,
    "existing Branch update endpoint remains compatible"
  );

  const secondBranch =
    await apiRequest(
      baseUrl,
      "POST",
      "/branches",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          name:
            `Second Hierarchy Branch ${runId}`,
          code:
            `HB2-${runId}`,
          isActive:
            true
        }
      }
    );

  check(
    secondBranch.status ===
      201,
    "existing Branch creation endpoint remains compatible"
  );

  const movedDepartment =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/departments/${fixtures.department.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          branchId:
            secondBranch.json.data.id
        }
      }
    );

  check(
    movedDepartment.status ===
      200,
    "existing Department reassignment remains compatible"
  );

  const reconciliation =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/reconcile",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    reconciliation.status ===
      200 &&
    reconciliation.json.data
      .unitsCreated >=
      1 &&
    reconciliation.json.data
      .unitsUpdated >=
      2 &&
    reconciliation.json.data
      .failed ===
      0,
    "compatibility reconciliation captures legacy structural changes"
  );

  const updatedBranchUnit =
    await prisma
      .organizationalUnit
      .findFirst({
        where: {
          organizationId:
            fixtures.organizationA.id,
          legacyBranchId:
            fixtures.branch.id
        }
      });

  const secondBranchUnit =
    await prisma
      .organizationalUnit
      .findFirst({
        where: {
          organizationId:
            fixtures.organizationA.id,
          legacyBranchId:
            secondBranch.json.data.id
        }
      });

  const movedDepartmentUnit =
    await prisma
      .organizationalUnit
      .findFirst({
        where: {
          organizationId:
            fixtures.organizationA.id,
          legacyDepartmentId:
            fixtures.department.id
        }
      });

  check(
    updatedBranchUnit?.name ===
      `Renamed Branch ${runId}` &&
    secondBranchUnit !==
      null &&
    movedDepartmentUnit?.parentId ===
      secondBranchUnit.id,
    "Branch drift and Department movement are reconciled deterministically"
  );

  check(
    updatedBranchUnit?.id ===
      compatibility.branchUnit.id &&
    movedDepartmentUnit?.id ===
      compatibility.departmentUnit.id,
    "compatibility reconciliation preserves stable unit identities"
  );

  const foreignType =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/unit-types",
      {
        token:
          fixtures.tokens
            .administratorB,
        organizationId:
          fixtures.organizationB.id,
        body: {
          code:
            `FOREIGN-${runId}`,
          name:
            `Foreign Unit Type ${runId}`
        }
      }
    );

  const foreignUnit =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/units",
      {
        token:
          fixtures.tokens
            .administratorB,
        organizationId:
          fixtures.organizationB.id,
        body: {
          unitTypeId:
            foreignType.json.data.id,
          code:
            `FOREIGN-UNIT-${runId}`,
          name:
            `Foreign Unit ${runId}`
        }
      }
    );

  check(
    foreignType.status ===
      201 &&
    foreignUnit.status ===
      201,
    "foreign hierarchy fixture is created in its own tenant"
  );

  const crossTenantUnit =
    await apiRequest(
      baseUrl,
      "GET",
      `/hierarchy/units/${foreignUnit.json.data.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    crossTenantUnit.status ===
      404,
    "cross-tenant hierarchy records are unavailable"
  );

  const excessiveLimit =
    await apiRequest(
      baseUrl,
      "GET",
      "/hierarchy/units?limit=201",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    excessiveLimit.status ===
      400,
    "hierarchy lists enforce their maximum bound"
  );

  const disposableType =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/unit-types",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          code:
            `DISPOSABLE-${runId}`,
          name:
            `Disposable Type ${runId}`
        }
      }
    );

  const disposableUnit =
    await apiRequest(
      baseUrl,
      "POST",
      "/hierarchy/units",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          unitTypeId:
            disposableType
              .json.data.id,
          code:
            `DISPOSABLE-UNIT-${runId}`,
          name:
            `Disposable Unit ${runId}`
        }
      }
    );

  const deleteDisposableUnit =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/hierarchy/units/${disposableUnit.json.data.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const deleteDisposableType =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/hierarchy/unit-types/${disposableType.json.data.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    deleteDisposableUnit.status ===
      200 &&
    deleteDisposableType.status ===
      200,
    "unused custom hierarchy records may be deleted safely"
  );

  const compatibilityChecks = [
    {
      path:
        "/branches",
      message:
        "existing Branch listing remains compatible"
    },
    {
      path:
        "/departments",
      message:
        "existing Department listing remains compatible"
    },
    {
      path:
        "/health/scopes/ORGANIZATION/latest",
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
        {
          token:
            fixtures.tokens
              .administratorA,
          organizationId:
            fixtures.organizationA.id
        }
      );

    check(
      response.status ===
        200,
      item.message
    );
  }

  const deletionAudits =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action: {
          in: [
            "HIERARCHY_UNIT_DELETED",
            "HIERARCHY_UNIT_TYPE_DELETED"
          ]
        },
        entityId: {
          in: [
            disposableUnit
              .json.data.id,
            disposableType
              .json.data.id
          ]
        }
      }
    });

  check(
    deletionAudits ===
      2,
    "custom hierarchy deletion is audited"
  );

  check(
    hierarchy.rootA.id !==
      hierarchy.rootB.id,
    "custom hierarchy fixture identities remain distinct"
  );
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

  const compatibility =
    await testHierarchySecurityAndReconciliation(
      runtimeContext
    );

  const hierarchy =
    await testHierarchyLifecycleAndTraversal(
      runtimeContext,
      compatibility
    );

  await testHierarchyAssignmentsAndScope(
    runtimeContext,
    hierarchy
  );

  await testHierarchyDepthAndConcurrency(
    runtimeContext,
    hierarchy
  );

  await testHierarchyCompatibilityAndRegression(
    runtimeContext,
    compatibility,
    hierarchy
  );

  console.log(
    "\nSPRINT 022 RUNTIME ACCEPTANCE: PASS"
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
      if (
        runtimeContext
      ) {
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
