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
  `s020-${Date.now()}`;

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
          `Sprint 020 ${label} ${runId}`,
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
        firstName: "Sprint019",
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
  const allKpiPermissions = [
    "kpi.view",
    "kpi.manage",
    "kpi.evaluate",
    "brief.view",
    "command.view",
    "health.view",
    "attention.view",
    "work_items.view",
    "requests.view",
    "sla.view",
    "workflow.view",
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
      allKpiPermissions,
      true
    );

  const scopedViewerRoleA =
    await createRole(
      organizationA.id,
      `KPI Viewer ${runId}`,
      allKpiPermissions
    );

  const emptyRoleA =
    await createRole(
      organizationA.id,
      `No KPI ${runId}`,
      []
    );

  const kpiOnlyRoleA =
    await createRole(
      organizationA.id,
      `KPI Only ${runId}`,
      [
        "kpi.view"
      ]
    );

  const administratorRoleB =
    await createRole(
      organizationB.id,
      "Administrator",
      allKpiPermissions,
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
      kpiOnlyRoleA.id,
      "UnassignedA"
    );

  const limitedBranchA =
    await createMember(
      organizationA.id,
      kpiOnlyRoleA.id,
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


function definitionBody(
  fixtures:
    Awaited<
      ReturnType<
        typeof createBaseFixtures
      >
    >,
  input: {
    code: string;
    dataSourceType:
      "MANUAL" |
      "SYSTEM" |
      "INTEGRATION" |
      "DERIVED";
    calculationRuleCode?:
      string;
    scopeType?:
      HealthScopeType;
    scopeId?: string;
    categoryId?: string;
    ownerOrganizationUserId?:
      string;
  }
) {
  return {
    ...(input.categoryId
      ? {
          categoryId:
            input.categoryId
        }
      : {}),
    code:
      input.code,
    name:
      `${input.code} ${runId}`,
    description:
      `Acceptance KPI ${input.code}`,
    module:
      "acceptance",
    dataSourceType:
      input.dataSourceType,
    ...(input.calculationRuleCode
      ? {
          calculationRuleCode:
            input
              .calculationRuleCode
        }
      : {}),
    scopeType:
      input.scopeType ??
      HealthScopeType.ORGANIZATION,
    scopeId:
      input.scopeId ??
      fixtures.organizationA.id,
    ...(input
      .ownerOrganizationUserId
      ? {
          ownerOrganizationUserId:
            input
              .ownerOrganizationUserId
        }
      : {}),
    unit:
      "PERCENTAGE",
    direction:
      "HIGHER_IS_BETTER",
    target:
      "90",
    warningThreshold:
      "75",
    criticalThreshold:
      "50",
    weight:
      "1",
    periodType:
      "CUSTOM",
    isActive:
      true,
    configuration: {
      acceptance:
        runId
    }
  };
}

async function testKpiSecurityAndGovernance(
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
      "/kpis/categories"
    );

  check(
    unauthenticated.status ===
      401,
    "unauthenticated KPI access is rejected"
  );

  const missingOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      "/kpis/categories",
      {
        token:
          fixtures.tokens
            .administratorA
      }
    );

  check(
    missingOrganization.status ===
      400,
    "KPI access requires organization context"
  );

  const foreignMembership =
    await apiRequest(
      baseUrl,
      "GET",
      "/kpis/categories",
      {
        token:
          fixtures.tokens
            .administratorB,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    foreignMembership.status ===
      403,
    "foreign organization membership is rejected"
  );

  const noView =
    await apiRequest(
      baseUrl,
      "GET",
      "/kpis/categories",
      {
        token:
          fixtures.tokens.emptyA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    noView.status ===
      403,
    "kpi.view permission is enforced"
  );

  const viewOnly =
    await apiRequest(
      baseUrl,
      "GET",
      `/kpis/definitions?scopeType=BRANCH&scopeId=${fixtures.branch.id}`,
      {
        token:
          fixtures.tokens
            .limitedBranchA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    viewOnly.status ===
      200,
    "kpi.view permits an authorized KPI shell"
  );

  const viewCannotManage =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/categories",
      {
        token:
          fixtures.tokens
            .limitedBranchA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          code:
            `DENIED-${runId}`,
          name:
            "Denied KPI category"
        }
      }
    );

  check(
    viewCannotManage.status ===
      403,
    "kpi.manage permission is independently enforced"
  );

  const viewCannotEvaluate =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/evaluate",
      {
        token:
          fixtures.tokens
            .limitedBranchA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          definitionId:
            fixtures.overdueWorkItem.id,
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now
              .toISOString(),
          evaluatedAt:
            fixtures.now
              .toISOString()
        }
      }
    );

  check(
    viewCannotEvaluate.status ===
      403,
    "kpi.evaluate permission is independently enforced"
  );

  const unassignedScope =
    await apiRequest(
      baseUrl,
      "GET",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .unassignedA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    unassignedScope.status ===
      403,
    "unassigned member default KPI scope is rejected"
  );

  const categoryResponse =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/categories",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          code:
            `OPERATIONS-${runId}`,
          name:
            "Operations",
          description:
            "Operational acceptance KPIs",
          displayOrder: 10
        }
      }
    );

  check(
    categoryResponse.status ===
      201,
    "Administrator creates a tenant-isolated KPI category"
  );

  const category =
    categoryResponse.json.data;

  const duplicateCategory =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/categories",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          code:
            `operations-${runId}`,
          name:
            "Duplicate Operations"
        }
      }
    );

  check(
    duplicateCategory.status ===
      409,
    "duplicate tenant KPI category code fails safely"
  );

  const categoryBResponse =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/categories",
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
            "Foreign KPI category"
        }
      }
    );

  check(
    categoryBResponse.status ===
      201,
    "foreign tenant KPI category fixture exists"
  );

  const crossTenantCategory =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `FOREIGN-CATEGORY-${runId}`,
              dataSourceType:
                "MANUAL",
              categoryId:
                categoryBResponse
                  .json.data.id
            }
          )
      }
    );

  check(
    crossTenantCategory.status ===
      400,
    "cross-tenant KPI category relationship fails"
  );

  const crossTenantOwner =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `FOREIGN-OWNER-${runId}`,
              dataSourceType:
                "MANUAL",
              ownerOrganizationUserId:
                fixtures.administratorB
                  .membership.id
            }
          )
      }
    );

  check(
    crossTenantOwner.status ===
      400,
    "cross-tenant KPI owner relationship fails"
  );

  const crossTenantScope =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `FOREIGN-SCOPE-${runId}`,
              dataSourceType:
                "MANUAL",
              scopeType:
                HealthScopeType.ORGANIZATION,
              scopeId:
                fixtures.organizationB.id
            }
          )
      }
    );

  check(
    crossTenantScope.status ===
      404,
    "cross-tenant KPI scope relationship fails without disclosure"
  );

  const inactiveBranch =
    await prisma.branch.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        name:
          `Inactive KPI Branch ${runId}`,
        code:
          `IKB-${runId}`,
        isActive: false
      }
    });

  const inactiveScope =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `INACTIVE-SCOPE-${runId}`,
              dataSourceType:
                "MANUAL",
              scopeType:
                HealthScopeType.BRANCH,
              scopeId:
                inactiveBranch.id
            }
          )
      }
    );

  check(
    inactiveScope.status ===
      400,
    "inactive structural scope rejects new KPI definitions"
  );

  const invalidThresholds =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          ...definitionBody(
            fixtures,
            {
              code:
                `INVALID-THRESHOLD-${runId}`,
              dataSourceType:
                "MANUAL"
            }
          ),
          target: "50",
          warningThreshold:
            "75",
          criticalThreshold:
            "90"
        }
      }
    );

  check(
    invalidThresholds.status ===
      400,
    "invalid KPI threshold ordering is rejected"
  );

  const targetRange =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          ...definitionBody(
            fixtures,
            {
              code:
                `TARGET-RANGE-${runId}`,
              dataSourceType:
                "MANUAL"
            }
          ),
          direction:
            "TARGET_RANGE"
        }
      }
    );

  check(
    targetRange.status ===
      201,
    "target-range KPI definition is represented for future evaluation"
  );

  const unsupportedSource =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `INTEGRATION-${runId}`,
              dataSourceType:
                "INTEGRATION"
            }
          )
      }
    );

  check(
    unsupportedSource.status ===
      201,
    "integration KPI definition is represented for future evaluation"
  );

  const manualDefinitionResponse =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `MANUAL-${runId}`,
              dataSourceType:
                "MANUAL",
              categoryId:
                category.id,
              ownerOrganizationUserId:
                fixtures.administratorA
                  .membership.id
            }
          )
      }
    );

  check(
    manualDefinitionResponse.status ===
      201,
    "Administrator creates an Organization manual KPI definition"
  );

  const duplicateDefinition =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `manual-${runId}`,
              dataSourceType:
                "MANUAL"
            }
          )
      }
    );

  check(
    duplicateDefinition.status ===
      409,
    "duplicate tenant KPI definition code fails safely"
  );

  const systemRules = [
    "WORK_ON_TIME_RATE",
    "REQUEST_ASSIGNMENT_RATE",
    "SLA_COMPLIANCE_RATE",
    "ATTENTION_RESOLUTION_RATE"
  ] as const;

  const systemDefinitions:
    Record<
      typeof systemRules[number],
      Record<string, any>
    > = {} as Record<
      typeof systemRules[number],
      Record<string, any>
    >;

  for (
    const rule
    of systemRules
  ) {
    const response =
      await apiRequest(
        baseUrl,
        "POST",
        "/kpis/definitions",
        {
          token:
            fixtures.tokens
              .administratorA,
          organizationId:
            fixtures.organizationA.id,
          body:
            definitionBody(
              fixtures,
              {
                code:
                  `${rule}-${runId}`,
                dataSourceType:
                  "SYSTEM",
                calculationRuleCode:
                  rule,
                categoryId:
                  category.id
              }
            )
        }
      );

    check(
      response.status ===
        201,
      `${rule} system KPI definition is created`
    );

    systemDefinitions[rule] =
      response.json.data;
  }

  const branchDefinitionResponse =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `BRANCH-${runId}`,
              dataSourceType:
                "MANUAL",
              scopeType:
                HealthScopeType.BRANCH,
              scopeId:
                fixtures.branch.id
            }
          )
      }
    );

  check(
    branchDefinitionResponse.status ===
      201,
    "Administrator creates a Branch KPI definition"
  );

  const departmentDefinitionResponse =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `DEPARTMENT-${runId}`,
              dataSourceType:
                "MANUAL",
              scopeType:
                HealthScopeType.DEPARTMENT,
              scopeId:
                fixtures.department.id
            }
          )
      }
    );

  check(
    departmentDefinitionResponse.status ===
      201,
    "Administrator creates a Department KPI definition"
  );

  return {
    category,
    targetRangeDefinition:
      targetRange.json.data,
    integrationDefinition:
      unsupportedSource
        .json.data,
    manualDefinition:
      manualDefinitionResponse
        .json.data,
    systemDefinitions,
    branchDefinition:
      branchDefinitionResponse
        .json.data,
    departmentDefinition:
      departmentDefinitionResponse
        .json.data
  };
}

async function testKpiHierarchyAndManualMeasurements(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  governance:
    Awaited<
      ReturnType<
        typeof testKpiSecurityAndGovernance
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const administratorDefinitions =
    await apiRequest(
      baseUrl,
      "GET",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    administratorDefinitions.status ===
      200 &&
    administratorDefinitions.json.data
      .scope.scopeType ===
      "ORGANIZATION" &&
    administratorDefinitions.json.data
      .scope.scopeId ===
      fixtures.organizationA.id,
    "Administrator default KPI scope resolves to Organization"
  );

  const branchDefinitions =
    await apiRequest(
      baseUrl,
      "GET",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    branchDefinitions.status ===
      200 &&
    branchDefinitions.json.data
      .scope.scopeType ===
      "BRANCH" &&
    branchDefinitions.json.data
      .definitions.some(
        (
          definition:
            Record<string, any>
        ) =>
          definition.id ===
          governance
            .branchDefinition.id
      ) &&
    !branchDefinitions.json.data
      .definitions.some(
        (
          definition:
            Record<string, any>
        ) =>
          definition.id ===
          governance
            .manualDefinition.id
      ),
    "Branch member default KPI scope resolves to assigned Branch"
  );

  const departmentDefinitions =
    await apiRequest(
      baseUrl,
      "GET",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    departmentDefinitions.status ===
      200 &&
    departmentDefinitions.json.data
      .scope.scopeType ===
      "DEPARTMENT" &&
    departmentDefinitions.json.data
      .definitions.some(
        (
          definition:
            Record<string, any>
        ) =>
          definition.id ===
          governance
            .departmentDefinition.id
      ),
    "Department member default KPI scope resolves to assigned Department"
  );

  const branchOrganizationScope =
    await apiRequest(
      baseUrl,
      "GET",
      `/kpis/definitions?scopeType=ORGANIZATION&scopeId=${fixtures.organizationA.id}`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    branchOrganizationScope.status ===
      403,
    "explicit Organization KPI scope is Administrator-only"
  );

  const otherBranch =
    await prisma.branch.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        name:
          `Other KPI Branch ${runId}`,
        code:
          `OKB-${runId}`,
        isActive: true
      }
    });

  const otherDepartment =
    await prisma.department.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        branchId:
          otherBranch.id,
        name:
          `Other KPI Department ${runId}`,
        code:
          `OKD-${runId}`,
        isActive: true
      }
    });

  const wrongBranch =
    await apiRequest(
      baseUrl,
      "GET",
      `/kpis/definitions?scopeType=BRANCH&scopeId=${otherBranch.id}`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    wrongBranch.status ===
      403,
    "Branch member cannot access another Branch KPI scope"
  );

  const wrongDepartment =
    await apiRequest(
      baseUrl,
      "GET",
      `/kpis/definitions?scopeType=DEPARTMENT&scopeId=${otherDepartment.id}`,
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    wrongDepartment.status ===
      403,
    "Department member cannot access another Department KPI scope"
  );

  const foreignScope =
    await apiRequest(
      baseUrl,
      "GET",
      `/kpis/definitions?scopeType=ORGANIZATION&scopeId=${fixtures.organizationB.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    foreignScope.status ===
      404,
    "foreign-tenant KPI scope reveals no information"
  );

  const categoryUpdate =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/kpis/categories/${governance.category.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          description:
            "Updated operational KPI category"
        }
      }
    );

  check(
    categoryUpdate.status ===
      200,
    "Administrator updates a KPI category"
  );

  const definitionUpdate =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/kpis/definitions/${governance.manualDefinition.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          description:
            "Updated manual KPI definition",
          weight:
            "2"
        }
      }
    );

  check(
    definitionUpdate.status ===
      200,
    "Administrator updates a KPI definition"
  );

  const mutationAudits =
    await prisma.auditLog.findMany({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action: {
          in: [
            "KPI_CATEGORY_CREATED",
            "KPI_CATEGORY_UPDATED",
            "KPI_DEFINITION_CREATED",
            "KPI_DEFINITION_UPDATED"
          ]
        }
      },
      select: {
        action: true,
        entityId: true
      }
    });

  check(
    mutationAudits.some(
      (audit) =>
        audit.action ===
          "KPI_CATEGORY_UPDATED" &&
        audit.entityId ===
          governance.category.id
    ) &&
    mutationAudits.some(
      (audit) =>
        audit.action ===
          "KPI_DEFINITION_UPDATED" &&
        audit.entityId ===
          governance
            .manualDefinition.id
    ),
    "KPI category and definition governance is audited"
  );

  const statusInjection =
    await apiRequest(
      baseUrl,
      "POST",
      `/kpis/definitions/${governance.manualDefinition.id}/measurements`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          measuredValue:
            "80",
          status:
            "HEALTHY",
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now
              .toISOString(),
          evaluatedAt:
            fixtures.now
              .toISOString()
        }
      }
    );

  check(
    statusInjection.status ===
      400,
    "caller cannot submit a final KPI status"
  );

  const firstManual =
    await apiRequest(
      baseUrl,
      "POST",
      `/kpis/definitions/${governance.manualDefinition.id}/measurements`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          measuredValue:
            "80",
          sampleSize: 5,
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now
              .toISOString(),
          evaluatedAt:
            fixtures.now
              .toISOString(),
          metadata: {
            evidenceRecords: 5
          }
        }
      }
    );

  check(
    firstManual.status ===
      201 &&
    firstManual.json.data
      .created === true &&
    firstManual.json.data
      .measurement.status ===
      "WATCH",
    "manual KPI status is calculated deterministically"
  );

  check(
    firstManual.json.data
      .measurement.confidence ===
      50 &&
    firstManual.json.data
      .measurement.explanation
      .length > 0,
    "manual KPI measurement is explainable with conservative confidence"
  );

  const repeatedManual =
    await apiRequest(
      baseUrl,
      "POST",
      `/kpis/definitions/${governance.manualDefinition.id}/measurements`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          measuredValue:
            "80",
          sampleSize: 5,
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now
              .toISOString(),
          evaluatedAt:
            fixtures.now
              .toISOString(),
          metadata: {
            evidenceRecords: 5
          }
        }
      }
    );

  check(
    repeatedManual.status ===
      200 &&
    repeatedManual.json.data
      .created === false &&
    repeatedManual.json.data
      .measurement.id ===
      firstManual.json.data
        .measurement.id,
    "repeated identical manual measurement is idempotent"
  );

  const manualCount =
    await prisma.kpiMeasurement.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        kpiDefinitionId:
          governance
            .manualDefinition.id
      }
    });

  check(
    manualCount === 1,
    "manual measurement idempotency is database-protected"
  );

  const systemAsManual =
    await apiRequest(
      baseUrl,
      "POST",
      `/kpis/definitions/${governance.systemDefinitions.WORK_ON_TIME_RATE.id}/measurements`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          measuredValue:
            "90",
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now
              .toISOString(),
          evaluatedAt:
            fixtures.now
              .toISOString()
        }
      }
    );

  check(
    systemAsManual.status ===
      400,
    "manual submission requires a MANUAL KPI definition"
  );

  const targetRangeEvaluation =
    await apiRequest(
      baseUrl,
      "POST",
      `/kpis/definitions/${governance.targetRangeDefinition.id}/measurements`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          measuredValue:
            "80",
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now
              .toISOString(),
          evaluatedAt:
            fixtures.now
              .toISOString()
        }
      }
    );

  check(
    targetRangeEvaluation.status ===
      400,
    "unsupported target-range evaluation fails explicitly"
  );

  const integrationEvaluation =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          definitionId:
            governance
              .integrationDefinition.id,
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now
              .toISOString(),
          evaluatedAt:
            fixtures.now
              .toISOString()
        }
      }
    );

  check(
    integrationEvaluation.status ===
      400,
    "unsupported integration evaluation fails explicitly"
  );

  const manualAsSystem =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          definitionId:
            governance
              .manualDefinition.id,
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now
              .toISOString(),
          evaluatedAt:
            fixtures.now
              .toISOString()
        }
      }
    );

  check(
    manualAsSystem.status ===
      400,
    "system evaluation requires a SYSTEM KPI definition"
  );

  const secondEvaluatedAt =
    new Date(
      fixtures.now.getTime() +
      60 * 1000
    );

  const secondManual =
    await apiRequest(
      baseUrl,
      "POST",
      `/kpis/definitions/${governance.manualDefinition.id}/measurements`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          measuredValue:
            "95",
          sampleSize: 6,
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now
              .toISOString(),
          evaluatedAt:
            secondEvaluatedAt
              .toISOString(),
          metadata: {
            evidenceRecords: 6
          }
        }
      }
    );

  check(
    secondManual.status ===
      201 &&
    secondManual.json.data
      .measurement.status ===
      "HEALTHY",
    "changed KPI evidence creates a new immutable measurement"
  );

  const latest =
    await apiRequest(
      baseUrl,
      "GET",
      `/kpis/definitions/${governance.manualDefinition.id}/latest`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    latest.status ===
      200 &&
    latest.json.data.status ===
      "AVAILABLE" &&
    latest.json.data.measurement.id ===
      secondManual.json.data
        .measurement.id,
    "latest KPI measurement selection is deterministic"
  );

  check(
    latest.json.data.measurement
      .movement.comparable ===
      true &&
    latest.json.data.measurement
      .movement.previousValue ===
      "80.0000" &&
    latest.json.data.measurement
      .movement.absoluteChange ===
      "15.0000" &&
    latest.json.data.measurement
      .movement.movement ===
      "IMPROVED",
    "comparable KPI movement is calculated correctly"
  );

  const firstPersisted =
    await prisma.kpiMeasurement.findUnique({
      where: {
        id:
          firstManual.json.data
            .measurement.id
      }
    });

  check(
    firstPersisted !== null &&
    firstPersisted.measuredValue
      .toFixed(4) ===
      "80.0000" &&
    firstPersisted.target
      .toFixed(4) ===
      "90.0000" &&
    firstPersisted.weight ===
      undefined,
    "previous KPI measurement remains immutable with copied definition context"
  );

  const manualAudit =
    await prisma.auditLog.findFirst({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action:
          "KPI_MANUAL_MEASUREMENT_SUBMITTED",
        entityId:
          firstManual.json.data
            .measurement.id
      }
    });

  check(
    manualAudit !== null,
    "manual KPI measurement creation is audited"
  );

  return {
    firstManual:
      firstManual.json.data
        .measurement,
    secondManual:
      secondManual.json.data
        .measurement
  };
}

function expectedPercentage(
  numerator: number,
  denominator: number
) {
  return (
    numerator /
    denominator *
    100
  ).toFixed(4);
}

async function testKpiSystemEvaluation(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  governance:
    Awaited<
      ReturnType<
        typeof testKpiSecurityAndGovernance
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const systemPeriodEnd =
    new Date(
      fixtures.now.getTime() +
      60 * 60 * 1000
    );

  const rules = [
    {
      code:
        "WORK_ON_TIME_RATE",
      numerator:
        "onTime",
      denominator:
        "qualifying"
    },
    {
      code:
        "REQUEST_ASSIGNMENT_RATE",
      numerator:
        "assigned",
      denominator:
        "active"
    },
    {
      code:
        "SLA_COMPLIANCE_RATE",
      numerator:
        "compliant",
      denominator:
        "qualifying"
    },
    {
      code:
        "ATTENTION_RESOLUTION_RATE",
      numerator:
        "resolved",
      denominator:
        "qualifying"
    }
  ] as const;

  const evaluated:
    Record<
      string,
      Record<string, any>
    > = {};

  for (
    const rule
    of rules
  ) {
    const response =
      await apiRequest(
        baseUrl,
        "POST",
        "/kpis/evaluate",
        {
          token:
            fixtures.tokens
              .administratorA,
          organizationId:
            fixtures.organizationA.id,
          body: {
            definitionId:
              governance
                .systemDefinitions[
                  rule.code
                ].id,
            periodStart:
              fixtures.periodStart
                .toISOString(),
            periodEnd:
              systemPeriodEnd
                .toISOString(),
            evaluatedAt:
              systemPeriodEnd
                .toISOString()
          }
        }
      );

    check(
      response.status ===
        201 &&
      response.json.data.status ===
        "AVAILABLE" &&
      response.json.data.created ===
        true,
      `${rule.code} system KPI evaluates successfully`
    );

    const measurement =
      response.json.data
        .measurement;

    const metadata =
      measurement.metadata as
        Record<string, number>;

    check(
      measurement
        .calculationRuleCode ===
        rule.code &&
      measurement.sampleSize ===
        metadata[
          rule.denominator
        ] &&
      measurement.sampleSize >
        0,
      `${rule.code} records deterministic evidence counts`
    );

    check(
      measurement.measuredValue ===
        expectedPercentage(
          metadata[
            rule.numerator
          ],
          metadata[
            rule.denominator
          ]
        ),
      `${rule.code} measured value matches its evidence`
    );

    check(
      measurement.confidence >
        0 &&
      measurement.confidence <=
        100 &&
      measurement.explanation
        .length > 0,
      `${rule.code} is explainable with evidence-based confidence`
    );

    evaluated[rule.code] =
      measurement;
  }

  const repeated =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          definitionId:
            governance
              .systemDefinitions
              .WORK_ON_TIME_RATE.id,
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            systemPeriodEnd
              .toISOString(),
          evaluatedAt:
            systemPeriodEnd
              .toISOString()
        }
      }
    );

  check(
    repeated.status ===
      200 &&
    repeated.json.data.created ===
      false &&
    repeated.json.data
      .measurement.id ===
      evaluated
        .WORK_ON_TIME_RATE.id,
    "repeated identical system KPI evaluation is idempotent"
  );

  const concurrentEvaluatedAt =
    new Date(
      systemPeriodEnd.getTime() +
      60 * 1000
    );

  const concurrentResponses =
    await Promise.all(
      Array.from(
        {
          length: 5
        },
        () =>
          apiRequest(
            baseUrl,
            "POST",
            "/kpis/evaluate",
            {
              token:
                fixtures.tokens
                  .administratorA,
              organizationId:
                fixtures.organizationA.id,
              body: {
                definitionId:
                  governance
                    .systemDefinitions
                    .WORK_ON_TIME_RATE.id,
                periodStart:
                  fixtures.periodStart
                    .toISOString(),
                periodEnd:
                  systemPeriodEnd
                    .toISOString(),
                evaluatedAt:
                  concurrentEvaluatedAt
                    .toISOString()
              }
            }
          )
      )
    );

  check(
    concurrentResponses.every(
      (response) =>
        response.status ===
          200 ||
        response.status ===
          201
    ),
    "concurrent identical KPI evaluations all succeed"
  );

  const concurrentIds =
    new Set(
      concurrentResponses.map(
        (response) =>
          response.json.data
            .measurement.id
      )
    );

  check(
    concurrentIds.size === 1,
    "concurrent identical KPI evaluation is database-idempotent"
  );

  const workMeasurementCount =
    await prisma.kpiMeasurement.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        kpiDefinitionId:
          governance
            .systemDefinitions
            .WORK_ON_TIME_RATE.id
      }
    });

  check(
    workMeasurementCount ===
      2,
    "concurrent evaluation leaves exactly two distinct Work KPI measurements"
  );

  const emptyScopeDefinition =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `NO-EVIDENCE-${runId}`,
              dataSourceType:
                "SYSTEM",
              calculationRuleCode:
                "WORK_ON_TIME_RATE",
              scopeType:
                HealthScopeType.BRANCH,
              scopeId:
                (
                  await prisma.branch.create({
                    data: {
                      organizationId:
                        fixtures.organizationA.id,
                      name:
                        `Empty KPI Branch ${runId}`,
                      code:
                        `EKB-${runId}`,
                      isActive: true
                    }
                  })
                ).id
            }
          )
      }
    );

  check(
    emptyScopeDefinition.status ===
      201,
    "missing-evidence KPI definition fixture is created"
  );

  const missingEvidence =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          definitionId:
            emptyScopeDefinition
              .json.data.id,
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            systemPeriodEnd
              .toISOString(),
          evaluatedAt:
            systemPeriodEnd
              .toISOString()
        }
      }
    );

  check(
    missingEvidence.status ===
      200 &&
    missingEvidence.json.data
      .status ===
      "NO_EVIDENCE" &&
    missingEvidence.json.data
      .measurement ===
      null,
    "missing KPI evidence does not become fabricated zero performance"
  );

  const missingMeasurementCount =
    await prisma.kpiMeasurement.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        kpiDefinitionId:
          emptyScopeDefinition
            .json.data.id
      }
    });

  check(
    missingMeasurementCount ===
      0,
    "missing KPI evidence persists no fabricated measurement"
  );

  const sourcePermission =
    await prisma.permission.findUnique({
      where: {
        code:
          "kpi.evaluate"
      },
      select: {
        id: true
      }
    });

  check(
    sourcePermission !== null,
    "kpi.evaluate permission exists for source-isolation test"
  );

  await prisma.rolePermission.create({
    data: {
      roleId:
        fixtures.limitedBranchA
          .membership.roleId,
      permissionId:
        sourcePermission.id
    }
  });

  const restrictedDefinition =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          definitionBody(
            fixtures,
            {
              code:
                `RESTRICTED-SOURCE-${runId}`,
              dataSourceType:
                "SYSTEM",
              calculationRuleCode:
                "WORK_ON_TIME_RATE",
              scopeType:
                HealthScopeType.BRANCH,
              scopeId:
                fixtures.branch.id
            }
          )
      }
    );

  check(
    restrictedDefinition.status ===
      201,
    "restricted-source KPI definition fixture is created"
  );

  const restrictedEvaluation =
    await apiRequest(
      baseUrl,
      "POST",
      "/kpis/evaluate",
      {
        token:
          fixtures.tokens
            .limitedBranchA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          definitionId:
            restrictedDefinition
              .json.data.id,
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            systemPeriodEnd
              .toISOString(),
          evaluatedAt:
            systemPeriodEnd
              .toISOString()
        }
      }
    );

  check(
    restrictedEvaluation.status ===
      403,
    "KPI evaluation cannot bypass source-module permission"
  );

  const systemAudits =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action: {
          in: [
            "KPI_SYSTEM_EVALUATED",
            "KPI_SYSTEM_EVALUATED_NO_EVIDENCE"
          ]
        }
      }
    });

  check(
    systemAudits >= 6,
    "system KPI evaluation requests are audited"
  );

  return {
    evaluated,
    systemPeriodEnd
  };
}

async function testKpiReadSafetyAndCompatibility(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  governance:
    Awaited<
      ReturnType<
        typeof testKpiSecurityAndGovernance
      >
    >,
  manual:
    Awaited<
      ReturnType<
        typeof testKpiHierarchyAndManualMeasurements
      >
    >,
  system:
    Awaited<
      ReturnType<
        typeof testKpiSystemEvaluation
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const evaluatorResult =
    await evaluateAllSystemKpis({
      periodStart:
        fixtures.periodStart,
      periodEnd:
        system.systemPeriodEnd,
      evaluatedAt:
        new Date(
          system.systemPeriodEnd
            .getTime() +
          2 * 60 * 1000
        )
    });

  check(
    evaluatorResult.definitions >=
      6 &&
    evaluatorResult.failed ===
      0 &&
    evaluatorResult.evaluated ===
      evaluatorResult
        .definitions,
    "reusable KPI evaluator service processes active system definitions"
  );

  const beforeReadCounts =
    await Promise.all([
      prisma.kpiCategory.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.kpiDefinition.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.kpiMeasurement.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.auditLog.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.healthSnapshot.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.attentionItem.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.workItem.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.request.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.slaInstance.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      })
    ]);

  const boundedHistory =
    await apiRequest(
      baseUrl,
      "GET",
      `/kpis/measurements?definitionId=${governance.manualDefinition.id}&limit=1`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    boundedHistory.status ===
      200 &&
    boundedHistory.json.data
      .measurements.length ===
      1 &&
    boundedHistory.json.data
      .measurements[0].id ===
      manual.secondManual.id,
    "bounded authorized KPI history is deterministically ordered"
  );

  const repeatedQuery =
    await apiRequest(
      baseUrl,
      "GET",
      "/kpis/measurements?limit=1&limit=2",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    repeatedQuery.status ===
      400,
    "repeated single-value KPI query parameters are rejected"
  );

  const foreignMeasurement =
    await apiRequest(
      baseUrl,
      "GET",
      `/kpis/measurements/${manual.firstManual.id}`,
      {
        token:
          fixtures.tokens
            .administratorB,
        organizationId:
          fixtures.organizationB.id
      }
    );

  check(
    foreignMeasurement.status ===
      404,
    "foreign tenant cannot read another tenant KPI measurement"
  );

  const structurallyRestricted =
    await apiRequest(
      baseUrl,
      "GET",
      `/kpis/measurements/${manual.firstManual.id}`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    structurallyRestricted.status ===
      403,
    "restricted structural scope exposes no KPI measurement details"
  );

  const immutableRoute =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/kpis/measurements/${manual.firstManual.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          measuredValue:
            "1"
        }
      }
    );

  check(
    immutableRoute.status ===
      404,
    "KPI measurement history exposes no mutation endpoint"
  );

  const healthResponse =
    await apiRequest(
      baseUrl,
      "GET",
      "/health/definitions",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    healthResponse.status ===
      200,
    "existing Organization Health endpoint remains compatible"
  );

  const attentionResponse =
    await apiRequest(
      baseUrl,
      "GET",
      "/attention-items",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    attentionResponse.status ===
      200,
    "existing Attention Centre endpoint remains compatible"
  );

  const commandResponse =
    await apiRequest(
      baseUrl,
      "GET",
      "/command-centre",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    commandResponse.status ===
      200,
    "existing Command Centre endpoint remains compatible"
  );

  const briefResponse =
    await apiRequest(
      baseUrl,
      "GET",
      "/daily-brief",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    briefResponse.status ===
      200,
    "existing Daily Brief endpoint remains compatible"
  );

  const dashboardResponse =
    await apiRequest(
      baseUrl,
      "GET",
      "/dashboard/overview",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    dashboardResponse.status ===
      200,
    "existing dashboard endpoint remains compatible"
  );

  const afterReadCounts =
    await Promise.all([
      prisma.kpiCategory.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.kpiDefinition.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.kpiMeasurement.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.auditLog.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.healthSnapshot.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.attentionItem.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.workItem.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.request.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.slaInstance.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      })
    ]);

  check(
    JSON.stringify(
      beforeReadCounts
    ) ===
    JSON.stringify(
      afterReadCounts
    ),
    "KPI and compatibility reads create no records"
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

  const governance =
    await testKpiSecurityAndGovernance(
      runtimeContext
    );

  const manual =
    await testKpiHierarchyAndManualMeasurements(
      runtimeContext,
      governance
    );

  const system =
    await testKpiSystemEvaluation(
      runtimeContext,
      governance
    );

  await testKpiReadSafetyAndCompatibility(
    runtimeContext,
    governance,
    manual,
    system
  );

  console.log(
    "\nSPRINT 020 RUNTIME ACCEPTANCE: PASS"
  );
}

main()
  .catch(
    (error) => {
      console.error(error);
      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      try {
        if (runtimeContext) {
          runtimeContext.server
            .closeAllConnections();

          await new Promise<void>(
            (resolve) =>
              runtimeContext!.server
                .close(
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
    }
  );
