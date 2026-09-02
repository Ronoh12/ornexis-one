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
  `s018-${Date.now()}`;

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
          `Sprint 018 ${label} ${runId}`,
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
        firstName: "Sprint018",
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
  const allCommandPermissions = [
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
      allCommandPermissions,
      true
    );

  const scopedViewerRoleA =
    await createRole(
      organizationA.id,
      `Command Viewer ${runId}`,
      allCommandPermissions
    );

  const emptyRoleA =
    await createRole(
      organizationA.id,
      `No Command ${runId}`,
      []
    );

  const commandOnlyRoleA =
    await createRole(
      organizationA.id,
      `Command Only ${runId}`,
      [
        "command.view"
      ]
    );

  const administratorRoleB =
    await createRole(
      organizationB.id,
      "Administrator",
      allCommandPermissions,
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

function reportingQuery(
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
  const query =
    new URLSearchParams({
      asOf:
        fixtures.now.toISOString(),
      periodStart:
        fixtures.periodStart.toISOString(),
      priorityLimit:
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
    });

  return query.toString();
}

async function testCommandCentre(
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
      "/command-centre"
    );

  check(
    unauthenticated.status ===
      401,
    "unauthenticated Command Centre access is rejected"
  );

  const missingOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      "/command-centre",
      {
        token:
          fixtures.tokens
            .administratorA
      }
    );

  check(
    missingOrganization.status ===
      400,
    "Command Centre requires organization context"
  );

  const foreignMembership =
    await apiRequest(
      baseUrl,
      "GET",
      "/command-centre",
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

  const missingCommandPermission =
    await apiRequest(
      baseUrl,
      "GET",
      "/command-centre",
      {
        token:
          fixtures.tokens.emptyA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    missingCommandPermission.status ===
      403,
    "command.view permission is enforced"
  );

  const unassignedScope =
    await apiRequest(
      baseUrl,
      "GET",
      "/command-centre",
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
    "unassigned member default scope is rejected"
  );

  const beforeReadCounts =
    await Promise.all([
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

  const organizationPath =
    `/command-centre?${
      reportingQuery(
        fixtures
      )
    }`;

  const organizationResponse =
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
    organizationResponse.status ===
      200,
    "administrator reads Organization Command Centre"
  );

  const organizationData =
    organizationResponse.json.data;

  check(
    organizationData.scope.type ===
      "ORGANIZATION" &&
    organizationData.scope.id ===
      fixtures.organizationA.id &&
    organizationData.scope.audience ===
      "EXECUTIVE",
    "Administrator default scope resolves to Organization"
  );

  check(
    organizationData
      .capabilities.health.status ===
      "AVAILABLE" &&
    organizationData
      .capabilities.health.data
      .current.snapshotId ===
      health.organization.id,
    "latest Organization Health snapshot is represented"
  );

  const healthMovement =
    organizationData
      .capabilities.health.data
      .movement;

  const expectedMovement =
    health.organization.score -
    health.previousOrganization.score;

  check(
    healthMovement.available ===
      true &&
    healthMovement.previousScore ===
      health.previousOrganization.score &&
    healthMovement.currentScore ===
      health.organization.score &&
    healthMovement.scoreChange ===
      expectedMovement &&
    healthMovement.direction ===
      (
        expectedMovement > 0
          ? "IMPROVING"
          : expectedMovement < 0
            ? "DECLINING"
            : "STABLE"
      ),
    "comparable Health movement is calculated correctly"
  );

  check(
    organizationData
      .capabilities.attention.status ===
      "AVAILABLE" &&
    organizationData
      .capabilities.attention.data
      .summary.totalActive ===
      2 &&
    organizationData
      .capabilities.attention.data
      .summary.critical ===
      1,
    "active Attention summary excludes terminal items"
  );

  check(
    organizationData
      .capabilities.work.status ===
      "AVAILABLE" &&
    organizationData
      .capabilities.work.data
      .totalActive ===
      2 &&
    organizationData
      .capabilities.work.data
      .overdue ===
      1 &&
    organizationData
      .capabilities.work.data
      .dueWithinSevenDays ===
      1,
    "active Work summary excludes terminal items and calculates deadlines"
  );

  check(
    organizationData
      .capabilities.requests.status ===
      "AVAILABLE" &&
    organizationData
      .capabilities.requests.data
      .totalActive ===
      2 &&
    organizationData
      .capabilities.requests.data
      .unassigned ===
      1,
    "active Request summary excludes terminal items and counts ownership"
  );

  check(
    organizationData
      .capabilities.sla.status ===
      "AVAILABLE" &&
    organizationData
      .capabilities.sla.data
      .breached ===
      1 &&
    organizationData
      .capabilities.sla.data
      .satisfiedDuringPeriod ===
      1,
    "scoped SLA summary includes breach and reporting-period satisfaction"
  );

  check(
    organizationData
      .capabilities.approvals.status ===
      "UNAVAILABLE",
    "Approval capability reports authoritative-data limitation"
  );

  check(
    organizationData
      .priorityItems.length <=
      3 &&
    organizationData
      .priorityItems.length >
      0,
    "priority composition is bounded"
  );

  check(
    organizationData
      .priorityItems[0]
      .severityRank >=
    organizationData
      .priorityItems[
        organizationData
          .priorityItems.length -
        1
      ].severityRank,
    "priority results use deterministic severity ordering"
  );

  check(
    organizationData
      .priorityItems.every(
        (
          item:
            Record<string, any>
        ) =>
          item.drillDownAvailable ===
          true
      ),
    "priority drill-down availability reflects source permissions"
  );

  check(
    organizationData
      .recommendations.length <=
      5 &&
    organizationData
      .recommendations.every(
        (
          recommendation:
            Record<string, any>
        ) =>
          recommendation.text &&
          recommendation.sources
            .length > 0
      ),
    "recommendations identify deterministic sources"
  );

  const branchResponse =
    await apiRequest(
      baseUrl,
      "GET",
      `/command-centre?${
        reportingQuery(
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
      fixtures.branch.id,
    "Branch member default scope resolves to assigned Branch"
  );

  check(
    branchResponse.json.data
      .capabilities.health.data
      .current.snapshotId ===
      health.branch.id,
    "Branch Command Centre uses Branch Health evidence"
  );

  const departmentResponse =
    await apiRequest(
      baseUrl,
      "GET",
      `/command-centre?${
        reportingQuery(
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
      fixtures.department.id,
    "Department member default scope resolves to assigned Department"
  );

  check(
    departmentResponse.json.data
      .capabilities.health.data
      .current.snapshotId ===
      health.department.id,
    "Department Command Centre uses Department Health evidence"
  );

  const forbiddenOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      `/command-centre?${
        reportingQuery(
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
    "explicit Organization scope is Administrator-only"
  );

  const otherBranch =
    await prisma.branch.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        name:
          `Other Command Branch ${runId}`,
        code:
          `OCB-${runId}`,
        isActive: true
      }
    });

  const forbiddenBranch =
    await apiRequest(
      baseUrl,
      "GET",
      `/command-centre?${
        reportingQuery(
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
    "Branch member cannot request another Branch"
  );

  const otherDepartment =
    await prisma.department.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        branchId:
          fixtures.branch.id,
        name:
          `Other Command Department ${runId}`,
        code:
          `OCD-${runId}`,
        isActive: true
      }
    });

  const forbiddenDepartment =
    await apiRequest(
      baseUrl,
      "GET",
      `/command-centre?${
        reportingQuery(
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
    "Department member cannot request another Department"
  );

  const noHealthEvidence =
    await apiRequest(
      baseUrl,
      "GET",
      `/command-centre?${
        reportingQuery(
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
    noHealthEvidence.status ===
      200 &&
    noHealthEvidence.json.data
      .capabilities.health.status ===
      "NO_DATA" &&
    noHealthEvidence.json.data
      .capabilities.health.data ===
      null,
    "missing Health evidence is reported explicitly"
  );

  const foreignScope =
    await apiRequest(
      baseUrl,
      "GET",
      `/command-centre?${
        reportingQuery(
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
    "foreign-tenant Command Centre scope exposes no information"
  );

  const limitedResponse =
    await apiRequest(
      baseUrl,
      "GET",
      `/command-centre?${
        reportingQuery(
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
    "command.view permits scoped Command Centre shell"
  );

  const limitedCapabilities =
    limitedResponse.json.data
      .capabilities;

  check(
    limitedCapabilities
      .health.status ===
      "FORBIDDEN" &&
    limitedCapabilities
      .attention.status ===
      "FORBIDDEN" &&
    limitedCapabilities
      .work.status ===
      "FORBIDDEN" &&
    limitedCapabilities
      .requests.status ===
      "FORBIDDEN" &&
    limitedCapabilities
      .sla.status ===
      "FORBIDDEN" &&
    limitedCapabilities
      .approvals.status ===
      "FORBIDDEN",
    "missing module permissions hide restricted capability details"
  );

  check(
    limitedResponse.json.data
      .priorityItems.length ===
      0 &&
    limitedResponse.json.data
      .recommendations.length ===
      0,
    "restricted source permissions produce no priority or recommendation leakage"
  );

  const repeatedResponse =
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
    repeatedResponse.status ===
      200 &&
    JSON.stringify(
      repeatedResponse.json.data
        .priorityItems
    ) ===
    JSON.stringify(
      organizationData
        .priorityItems
    ) &&
    JSON.stringify(
      repeatedResponse.json.data
        .recommendations
    ) ===
    JSON.stringify(
      organizationData
        .recommendations
    ),
    "repeated Command Centre reads are deterministic"
  );

  const afterReadCounts =
    await Promise.all([
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
      afterReadCounts
    ) ===
    JSON.stringify(
      beforeReadCounts
    ),
    "Command Centre reads create no operational or snapshot records"
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

  await testCommandCentre(
    runtimeContext
  );

  console.log(
    "\nSPRINT 018 RUNTIME ACCEPTANCE: PASS"
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
