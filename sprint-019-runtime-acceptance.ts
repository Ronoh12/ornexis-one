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

const runId =
  `s019-${Date.now()}`;

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
          `Sprint 019 ${label} ${runId}`,
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
  const allBriefPermissions = [
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
      allBriefPermissions,
      true
    );

  const scopedViewerRoleA =
    await createRole(
      organizationA.id,
      `Daily Brief Viewer ${runId}`,
      allBriefPermissions
    );

  const emptyRoleA =
    await createRole(
      organizationA.id,
      `No Daily Brief ${runId}`,
      []
    );

  const commandOnlyRoleA =
    await createRole(
      organizationA.id,
      `Daily Brief Only ${runId}`,
      [
        "brief.view"
      ]
    );

  const administratorRoleB =
    await createRole(
      organizationB.id,
      "Administrator",
      allBriefPermissions,
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
      commandOnlyRoleA.id,
      "UnassignedA"
    );

  const limitedBranchA =
    await createMember(
      organizationA.id,
      commandOnlyRoleA.id,
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

function dailyBriefQuery(
  fixtures:
    Awaited<
      ReturnType<
        typeof createBaseFixtures
      >
    >,
  scope?: {
    scopeType:
      HealthScopeType;
    scopeId: string;
  }
) {
  return new URLSearchParams({
    asOf:
      fixtures.now.toISOString(),
    periodStart:
      fixtures.periodStart.toISOString(),
    focusLimit:
      "3",
    recommendationLimit:
      "5",
    ...(scope
      ? {
          scopeType:
            scope.scopeType,
          scopeId:
            scope.scopeId
        }
      : {})
  }).toString();
}

function capability(
  data: Record<string, any>,
  name: string
) {
  return data.capabilities.find(
    (
      item:
        Record<string, any>
    ) =>
      item.capability === name
  );
}

async function recordCounts(
  organizationId: string
) {
  return Promise.all([
    prisma.healthSnapshot.count({
      where: {
        organizationId
      }
    }),
    prisma.attentionItem.count({
      where: {
        organizationId
      }
    }),
    prisma.workItem.count({
      where: {
        organizationId
      }
    }),
    prisma.request.count({
      where: {
        organizationId
      }
    }),
    prisma.slaInstance.count({
      where: {
        organizationId
      }
    }),
    prisma.notification.count({
      where: {
        organizationId
      }
    }),
    prisma.auditLog.count({
      where: {
        organizationId
      }
    })
  ]);
}

async function testDailyBriefCore(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >
) {
  const {
    fixtures,
    health,
    baseUrl
  } = context;

  const unauthenticated =
    await apiRequest(
      baseUrl,
      "GET",
      "/daily-brief"
    );

  check(
    unauthenticated.status ===
      401,
    "unauthenticated Daily Brief access is rejected"
  );

  const missingOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      "/daily-brief",
      {
        token:
          fixtures.tokens
            .administratorA
      }
    );

  check(
    missingOrganization.status ===
      400,
    "Daily Brief requires organization context"
  );

  const foreignMembership =
    await apiRequest(
      baseUrl,
      "GET",
      "/daily-brief",
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

  const missingPermission =
    await apiRequest(
      baseUrl,
      "GET",
      "/daily-brief",
      {
        token:
          fixtures.tokens.emptyA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    missingPermission.status ===
      403,
    "brief.view permission is enforced"
  );

  const unassignedScope =
    await apiRequest(
      baseUrl,
      "GET",
      "/daily-brief",
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
    "unassigned member default Daily Brief scope is rejected"
  );

  const invalidLimit =
    await apiRequest(
      baseUrl,
      "GET",
      "/daily-brief?focusLimit=26",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    invalidLimit.status ===
      400,
    "Daily Brief rejects an out-of-range focus limit"
  );

  const incompleteScope =
    await apiRequest(
      baseUrl,
      "GET",
      "/daily-brief?scopeType=BRANCH",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    incompleteScope.status ===
      400,
    "Daily Brief rejects incomplete explicit scope"
  );

  const beforeCounts =
    await recordCounts(
      fixtures.organizationA.id
    );

  const organizationPath =
    `/daily-brief?${
      dailyBriefQuery(
        fixtures
      )
    }`;

  const response =
    await apiRequest(
      baseUrl,
      "GET",
      organizationPath,
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
    "Administrator reads Organization Daily Brief"
  );

  const data =
    response.json.data;

  check(
    data.scope.type ===
      "ORGANIZATION" &&
    data.scope.id ===
      fixtures.organizationA.id &&
    data.audience ===
      "EXECUTIVE",
    "Administrator default Daily Brief scope resolves to Organization"
  );

  check(
    data.generatedAt ===
      fixtures.now.toISOString() &&
    data.reportingPeriod.start ===
      fixtures.periodStart.toISOString() &&
    data.reportingPeriod.end ===
      fixtures.now.toISOString(),
    "Daily Brief preserves the explicit reporting period"
  );

  check(
    data.headline.tone ===
      "CRITICAL" &&
    data.headline.source !==
      null &&
    data.headline.reason
      .length > 0,
    "Daily Brief headline uses deterministic critical precedence"
  );

  check(
    typeof data.overview ===
      "string" &&
    data.overview.includes(
      fixtures.organizationA.name
    ),
    "Executive overview identifies the authorized Organization"
  );

  const healthSummary =
    capability(
      data,
      "HEALTH"
    );

  const attentionSummary =
    capability(
      data,
      "ATTENTION"
    );

  const workSummary =
    capability(
      data,
      "WORK"
    );

  const requestSummary =
    capability(
      data,
      "REQUESTS"
    );

  const slaSummary =
    capability(
      data,
      "SLA"
    );

  const approvalSummary =
    capability(
      data,
      "APPROVALS"
    );

  check(
    healthSummary.status ===
      "AVAILABLE" &&
    healthSummary.metrics.score ===
      health.organization.score &&
    healthSummary.metrics
      .scoreChange ===
      (
        health.organization.score -
        health.previousOrganization.score
      ),
    "Daily Brief summarizes Health status and movement correctly"
  );

  check(
    data.changes.length ===
      1 &&
    data.changes[0]
      .capability ===
      "HEALTH" &&
    data.changes[0]
      .currentValue ===
      health.organization.score &&
    data.changes[0]
      .previousValue ===
      health.previousOrganization.score,
    "Daily Brief change presentation preserves comparable Health evidence"
  );

  check(
    attentionSummary.status ===
      "AVAILABLE" &&
    attentionSummary.metrics
      .active ===
      2 &&
    attentionSummary.metrics
      .critical ===
      1,
    "Daily Brief summarizes active Attention and excludes terminal items"
  );

  const utcDayStart =
    new Date(
      Date.UTC(
        fixtures.now
          .getUTCFullYear(),
        fixtures.now
          .getUTCMonth(),
        fixtures.now
          .getUTCDate()
      )
    );

  const nextUtcDay =
    new Date(
      utcDayStart.getTime() +
      24 * 60 * 60 * 1000
    );

  const expectedDueToday =
    [
      fixtures.overdueWorkItem,
      fixtures.onTimeWorkItem,
      fixtures.blockedWorkItem
    ].filter(
      (item) =>
        item.dueAt !== null &&
        item.dueAt >=
          utcDayStart &&
        item.dueAt <
          nextUtcDay
    ).length;

  check(
    workSummary.status ===
      "AVAILABLE" &&
    workSummary.metrics.active ===
      3 &&
    workSummary.metrics.overdue ===
      1 &&
    workSummary.metrics.blocked ===
      1 &&
    workSummary.metrics.dueToday ===
      expectedDueToday,
    "Daily Brief summarizes active, due-today, overdue and blocked Work correctly"
  );

  check(
    requestSummary.status ===
      "AVAILABLE" &&
    requestSummary.metrics.active ===
      2 &&
    requestSummary.metrics
      .unassigned ===
      1,
    "Daily Brief summarizes active and unassigned Requests while excluding terminal Requests"
  );

  check(
    slaSummary.status ===
      "AVAILABLE" &&
    slaSummary.metrics.breached ===
      1 &&
    slaSummary.metrics
      .satisfiedDuringPeriod ===
      1,
    "Daily Brief summarizes scoped SLA concerns"
  );

  check(
    approvalSummary.status ===
      "UNAVAILABLE" &&
    approvalSummary.metrics ===
      null,
    "Daily Brief does not invent unavailable Approval information"
  );

  check(
    data.focusToday.length <=
      3 &&
    data.focusToday.length >
      0,
    "Daily Brief focus list is bounded"
  );

  check(
    data.focusToday.every(
      (
        item:
          Record<string, any>
      ) =>
        item.drillDownAvailable ===
        true
    ),
    "Daily Brief focus drill-down reflects authorized source permissions"
  );

  check(
    data.recommendations.length <=
      5 &&
    data.recommendations.every(
      (
        recommendation:
          Record<string, any>
      ) =>
        recommendation.text &&
        recommendation.sources
          .length > 0
    ),
    "Daily Brief recommendations retain source provenance"
  );

  check(
    data.provenance
      .compositionVersion ===
      "sprint-019-v1" &&
    data.provenance.scope.id ===
      fixtures.organizationA.id &&
    data.provenance
      .sourceStatuses.health ===
      "AVAILABLE" &&
    data.provenance
      .sourceStatuses.approvals ===
      "UNAVAILABLE",
    "Daily Brief provides deterministic composition provenance"
  );

  return {
    organizationPath,
    organizationData:
      data,
    beforeCounts
  };
}

async function testDailyBriefScopeAndSafety(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  core:
    Awaited<
      ReturnType<
        typeof testDailyBriefCore
      >
    >
) {
  const {
    fixtures,
    health,
    baseUrl
  } = context;

  const repeatedQuery =
    await apiRequest(
      baseUrl,
      "GET",
      "/daily-brief?focusLimit=3&focusLimit=4",
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
    "Daily Brief rejects repeated single-value query fields"
  );

  const branchResponse =
    await apiRequest(
      baseUrl,
      "GET",
      `/daily-brief?${
        dailyBriefQuery(
          fixtures
        )
      }`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    branchResponse.status ===
      200 &&
    branchResponse.json.data
      .scope.type ===
      "BRANCH" &&
    branchResponse.json.data
      .scope.id ===
      fixtures.branch.id &&
    branchResponse.json.data
      .audience ===
      "BRANCH",
    "Branch member default Daily Brief scope resolves to assigned Branch"
  );

  check(
    capability(
      branchResponse.json.data,
      "HEALTH"
    ).metrics.score ===
      health.branch.score,
    "Branch Daily Brief uses Branch Health evidence"
  );

  const departmentResponse =
    await apiRequest(
      baseUrl,
      "GET",
      `/daily-brief?${
        dailyBriefQuery(
          fixtures
        )
      }`,
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    departmentResponse.status ===
      200 &&
    departmentResponse.json.data
      .scope.type ===
      "DEPARTMENT" &&
    departmentResponse.json.data
      .scope.id ===
      fixtures.department.id &&
    departmentResponse.json.data
      .audience ===
      "DEPARTMENT",
    "Department member default Daily Brief scope resolves to assigned Department"
  );

  check(
    capability(
      departmentResponse.json.data,
      "HEALTH"
    ).metrics.score ===
      health.department.score,
    "Department Daily Brief uses Department Health evidence"
  );

  const forbiddenOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      `/daily-brief?${
        dailyBriefQuery(
          fixtures,
          {
            scopeType:
              HealthScopeType.ORGANIZATION,
            scopeId:
              fixtures.organizationA.id
          }
        )
      }`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    forbiddenOrganization.status ===
      403,
    "explicit Organization Daily Brief scope is Administrator-only"
  );

  const otherBranch =
    await prisma.branch.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        name:
          `Other Brief Branch ${runId}`,
        code:
          `OBB-${runId}`,
        isActive: true
      }
    });

  const forbiddenBranch =
    await apiRequest(
      baseUrl,
      "GET",
      `/daily-brief?${
        dailyBriefQuery(
          fixtures,
          {
            scopeType:
              HealthScopeType.BRANCH,
            scopeId:
              otherBranch.id
          }
        )
      }`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    forbiddenBranch.status ===
      403,
    "Branch member cannot request another Branch Daily Brief"
  );

  const otherDepartment =
    await prisma.department.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        branchId:
          fixtures.branch.id,
        name:
          `Other Brief Department ${runId}`,
        code:
          `OBD-${runId}`,
        isActive: true
      }
    });

  const forbiddenDepartment =
    await apiRequest(
      baseUrl,
      "GET",
      `/daily-brief?${
        dailyBriefQuery(
          fixtures,
          {
            scopeType:
              HealthScopeType.DEPARTMENT,
            scopeId:
              otherDepartment.id
          }
        )
      }`,
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    forbiddenDepartment.status ===
      403,
    "Department member cannot request another Department Daily Brief"
  );

  const foreignScope =
    await apiRequest(
      baseUrl,
      "GET",
      `/daily-brief?${
        dailyBriefQuery(
          fixtures,
          {
            scopeType:
              HealthScopeType.ORGANIZATION,
            scopeId:
              fixtures.organizationA.id
          }
        )
      }`,
      {
        token:
          fixtures.tokens
            .administratorB,
        organizationId:
          fixtures.organizationB.id
      }
    );

  check(
    foreignScope.status ===
      404,
    "foreign-tenant Daily Brief scope reveals no information"
  );

  const missingEvidence =
    await apiRequest(
      baseUrl,
      "GET",
      `/daily-brief?${
        dailyBriefQuery(
          fixtures
        )
      }`,
      {
        token:
          fixtures.tokens
            .administratorB,
        organizationId:
          fixtures.organizationB.id
      }
    );

  check(
    missingEvidence.status ===
      200 &&
    capability(
      missingEvidence.json.data,
      "HEALTH"
    ).status ===
      "NO_DATA" &&
    capability(
      missingEvidence.json.data,
      "HEALTH"
    ).metrics ===
      null &&
    missingEvidence.json.data
      .changes[0].status ===
      "NO_DATA",
    "missing Health evidence is explicit and is not represented as healthy"
  );

  const limitedResponse =
    await apiRequest(
      baseUrl,
      "GET",
      `/daily-brief?${
        dailyBriefQuery(
          fixtures
        )
      }`,
      {
        token:
          fixtures.tokens
            .limitedBranchA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    limitedResponse.status ===
      200 &&
    limitedResponse.json.data
      .scope.type ===
      "BRANCH",
    "brief.view permits an authorized scoped Daily Brief shell"
  );

  check(
    limitedResponse.json.data
      .capabilities.every(
        (
          item:
            Record<string, any>
        ) =>
          item.status ===
            "FORBIDDEN" &&
          item.metrics ===
            null
      ),
    "forbidden capability summaries contain no protected metrics"
  );

  check(
    limitedResponse.json.data
      .changes.length ===
      1 &&
    limitedResponse.json.data
      .changes[0].status ===
      "FORBIDDEN" &&
    limitedResponse.json.data
      .changes[0]
      .currentValue ===
      null &&
    limitedResponse.json.data
      .focusToday.length ===
      0 &&
    limitedResponse.json.data
      .recommendations.length ===
      0 &&
    limitedResponse.json.data
      .headline.source ===
      null,
    "restricted Daily Brief exposes no source details"
  );

  const commandQuery =
    new URLSearchParams({
      asOf:
        fixtures.now.toISOString(),
      periodStart:
        fixtures.periodStart.toISOString(),
      priorityLimit:
        "3",
      recommendationLimit:
        "5"
    }).toString();

  const commandResponse =
    await apiRequest(
      baseUrl,
      "GET",
      `/command-centre?${commandQuery}`,
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

  check(
    JSON.stringify(
      core.organizationData
        .focusToday
    ) ===
    JSON.stringify(
      commandResponse.json.data
        .priorityItems
    ),
    "Daily Brief focus ordering exactly matches Command Centre ordering"
  );

  const repeatedBrief =
    await apiRequest(
      baseUrl,
      "GET",
      core.organizationPath,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    repeatedBrief.status ===
      200 &&
    JSON.stringify(
      repeatedBrief.json.data
    ) ===
    JSON.stringify(
      core.organizationData
    ),
    "repeated identical Daily Brief reads are deterministic"
  );

  const afterCounts =
    await recordCounts(
      fixtures.organizationA.id
    );

  check(
    JSON.stringify(
      afterCounts
    ) ===
    JSON.stringify(
      core.beforeCounts
    ),
    "Daily Brief reads create no operational, snapshot, notification or audit records"
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
    "existing authenticated dashboard endpoint remains compatible"
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

  const core =
    await testDailyBriefCore(
      runtimeContext
    );

  await testDailyBriefScopeAndSafety(
    runtimeContext,
    core
  );

  console.log(
    "\nSPRINT 019 RUNTIME ACCEPTANCE: PASS"
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
