import "dotenv/config";

import jwt from "jsonwebtoken";

import app from "./apps/api/src/app.js";

import {
  prisma
} from "./packages/database/index.js";

const runId =
  `s017-${Date.now()}`;

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
          `Sprint 017 ${label} ${runId}`,
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
        firstName: "Sprint016",
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
  const allHealthPermissions = [
    "health.view",
    "health.manage",
    "health.evaluate"
  ];

  const organizationA =
    await createOrganization("A");

  const organizationB =
    await createOrganization("B");

  const administratorRoleA =
    await createRole(
      organizationA.id,
      "Administrator",
      allHealthPermissions,
      true
    );

  const scopedViewerRoleA =
    await createRole(
      organizationA.id,
      `Health Viewer ${runId}`,
      [
        "health.view"
      ]
    );

  const emptyRoleA =
    await createRole(
      organizationA.id,
      `No Health ${runId}`,
      []
    );

  const administratorRoleB =
    await createRole(
      organizationB.id,
      "Administrator",
      allHealthPermissions,
      true
    );

  const branch =
    await prisma.branch.create({
      data: {
        organizationId:
          organizationA.id,
        name:
          `Health Branch ${runId}`,
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
          `Health Department ${runId}`,
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
    typeof address === "object" &&
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
    server,
    baseUrl
  };
}

async function testAccessAndEvaluation(
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

  const publicHealth =
    await apiRequest(
      baseUrl,
      "GET",
      "/health/"
    );

  check(
    publicHealth.status === 200 &&
    publicHealth.json.status ===
      "healthy",
    "original public system health remains available"
  );

  const unauthenticated =
    await apiRequest(
      baseUrl,
      "GET",
      "/health/snapshots"
    );

  check(
    unauthenticated.status === 401,
    "unauthenticated Organization Health access is rejected"
  );

  const missingOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      "/health/snapshots",
      {
        token:
          fixtures.tokens
            .administratorA
      }
    );

  check(
    missingOrganization.status === 400,
    "organization context is required"
  );

  const foreignMembership =
    await apiRequest(
      baseUrl,
      "GET",
      "/health/snapshots",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationB.id
      }
    );

  check(
    foreignMembership.status === 403,
    "foreign organization membership is rejected"
  );

  const noPermission =
    await apiRequest(
      baseUrl,
      "GET",
      "/health/snapshots",
      {
        token:
          fixtures.tokens.emptyA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    noPermission.status === 403,
    "health.view permission is enforced"
  );

  const scopedDefinitions =
    await apiRequest(
      baseUrl,
      "GET",
      "/health/definitions",
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    scopedDefinitions.status === 200,
    "health.view permits definition access"
  );

  const forbiddenEvaluation =
    await apiRequest(
      baseUrl,
      "POST",
      "/health/evaluate",
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          scopeType:
            "BRANCH",
          scopeId:
            fixtures.branch.id,
          now:
            fixtures.now.toISOString(),
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now.toISOString()
        }
      }
    );

  check(
    forbiddenEvaluation.status === 403,
    "health.evaluate permission is enforced"
  );

  const evaluateOrganization =
    await apiRequest(
      baseUrl,
      "POST",
      "/health/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          scopeType:
            "ORGANIZATION",
          now:
            fixtures.now.toISOString(),
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now.toISOString()
        }
      }
    );

  check(
    evaluateOrganization.status === 200 &&
    evaluateOrganization.json.data
      .outcome === "created",
    "administrator evaluates organization health"
  );

  const organizationSnapshot =
    evaluateOrganization.json.data
      .snapshot;

  check(
    organizationSnapshot.score === 50,
    "organization weighted score is deterministically 50"
  );

  check(
    organizationSnapshot.status ===
      "AT_RISK",
    "score 50 maps to AT_RISK"
  );

  check(
    organizationSnapshot.confidence ===
      40,
    "confidence reflects two evidence records per indicator"
  );

  check(
    organizationSnapshot.contributions
      .length === 4,
    "snapshot contains four explainable contributions"
  );

  check(
    organizationSnapshot.contributions
      .every(
        (
          contribution:
            Record<string, any>
        ) =>
          contribution.indicatorScore ===
            50 &&
          typeof contribution.explanation ===
            "string" &&
          contribution.explanation.length >
            0
      ),
    "every contribution explains its score"
  );

  const repeatedOrganization =
    await apiRequest(
      baseUrl,
      "POST",
      "/health/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          scopeType:
            "ORGANIZATION",
          now:
            fixtures.now.toISOString(),
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now.toISOString()
        }
      }
    );

  check(
    repeatedOrganization.status === 200 &&
    repeatedOrganization.json.data
      .outcome === "existing" &&
    repeatedOrganization.json.data
      .snapshot.id ===
      organizationSnapshot.id,
    "repeated identical evaluation is idempotent"
  );

  const evaluateBranch =
    await apiRequest(
      baseUrl,
      "POST",
      "/health/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          scopeType:
            "BRANCH",
          scopeId:
            fixtures.branch.id,
          now:
            fixtures.now.toISOString(),
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now.toISOString()
        }
      }
    );

  check(
    evaluateBranch.status === 200 &&
    evaluateBranch.json.data.snapshot
      .score === 50 &&
    evaluateBranch.json.data.snapshot
      .branchId ===
      fixtures.branch.id,
    "branch health is calculated from branch-scoped evidence"
  );

  const branchSnapshot =
    evaluateBranch.json.data.snapshot;

  const evaluateDepartment =
    await apiRequest(
      baseUrl,
      "POST",
      "/health/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          scopeType:
            "DEPARTMENT",
          scopeId:
            fixtures.department.id,
          now:
            fixtures.now.toISOString(),
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now.toISOString()
        }
      }
    );

  check(
    evaluateDepartment.status === 200 &&
    evaluateDepartment.json.data.snapshot
      .score === 50 &&
    evaluateDepartment.json.data.snapshot
      .departmentId ===
      fixtures.department.id,
    "department health is calculated from department-scoped evidence"
  );

  const departmentSnapshot =
    evaluateDepartment.json.data.snapshot;

  const administratorList =
    await apiRequest(
      baseUrl,
      "GET",
      "/health/snapshots",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    administratorList.status === 200 &&
    administratorList.json.data
      .items.length === 3,
    "administrator sees organization, branch and department health"
  );

  const branchList =
    await apiRequest(
      baseUrl,
      "GET",
      "/health/snapshots",
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    branchList.status === 200 &&
    branchList.json.data.items
      .length === 1 &&
    branchList.json.data.items[0]
      .id === branchSnapshot.id,
    "branch viewer sees only assigned branch health"
  );

  const departmentList =
    await apiRequest(
      baseUrl,
      "GET",
      "/health/snapshots",
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    departmentList.status === 200 &&
    departmentList.json.data.items
      .length === 1 &&
    departmentList.json.data.items[0]
      .id === departmentSnapshot.id,
    "department viewer sees only assigned department health"
  );

  const foreignSnapshot =
    await apiRequest(
      baseUrl,
      "GET",
      `/health/snapshots/${
        organizationSnapshot.id
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
    foreignSnapshot.status === 404,
    "foreign tenant cannot read another tenant health snapshot"
  );

  const latestBranch =
    await apiRequest(
      baseUrl,
      "GET",
      `/health/scopes/BRANCH/${
        fixtures.branch.id
      }/latest`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    latestBranch.status === 200 &&
    latestBranch.json.data.id ===
      branchSnapshot.id,
    "authorized branch viewer reads latest branch health"
  );

  return {
    organizationSnapshot,
    branchSnapshot,
    departmentSnapshot
  };
}

async function testChangeAndGovernance(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  initial:
    Awaited<
      ReturnType<
        typeof testAccessAndEvaluation
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const definitionsResponse =
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
    definitionsResponse.status === 200 &&
    definitionsResponse.json.data
      .length === 4,
    "four default Health Indicator definitions exist"
  );

  const workDefinition =
    definitionsResponse.json.data
      .find(
        (
          definition:
            Record<string, any>
        ) =>
          definition.code ===
            "WORK_EXECUTION"
      );

  check(
    Boolean(workDefinition),
    "Work Execution definition exists"
  );

  const forbiddenDefinitionUpdate =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/health/definitions/${
        workDefinition.id
      }`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          name:
            "Forbidden update"
        }
      }
    );

  check(
    forbiddenDefinitionUpdate.status ===
      403,
    "health.manage permission is enforced"
  );

  const updatedDefinition =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/health/definitions/${
        workDefinition.id
      }`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          name:
            "Work Execution Health"
        }
      }
    );

  check(
    updatedDefinition.status === 200 &&
    updatedDefinition.json.data.name ===
      "Work Execution Health",
    "administrator updates a Health Indicator definition"
  );

  const auditCount =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action:
          "HEALTH_INDICATOR_UPDATED",
        entityId:
          workDefinition.id
      }
    });

  check(
    auditCount === 1,
    "Health Indicator update is audited"
  );

  const foreignDefinitionUpdate =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/health/definitions/${
        workDefinition.id
      }`,
      {
        token:
          fixtures.tokens
            .administratorB,
        organizationId:
          fixtures.organizationB.id,
        body: {
          name:
            "Foreign update"
        }
      }
    );

  check(
    foreignDefinitionUpdate.status ===
      404,
    "foreign tenant cannot update another tenant definition"
  );

  const improvedAt =
    new Date(
      fixtures.now.getTime() +
      1000
    );

  await prisma.workItem.update({
    where: {
      id:
        fixtures.overdueWorkItem.id
    },
    data: {
      status:
        "COMPLETED",
      completedAt:
        improvedAt,
      completedByOrganizationUserId:
        fixtures.administratorA
          .membership.id
    }
  });

  await prisma.request.update({
    where: {
      id:
        fixtures.unassignedRequest.id
    },
    data: {
      assignedToOrganizationUserId:
        fixtures.branchViewerA
          .membership.id
    }
  });

  await prisma.attentionItem.updateMany({
    where: {
      organizationId:
        fixtures.organizationA.id,
      severity:
        "CRITICAL",
      status: {
        in: [
          "OPEN",
          "ACKNOWLEDGED"
        ]
      }
    },
    data: {
      status:
        "RESOLVED",
      resolvedAt:
        improvedAt
    }
  });

  const improvedEvaluation =
    await apiRequest(
      baseUrl,
      "POST",
      "/health/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          scopeType:
            "ORGANIZATION",
          now:
            improvedAt.toISOString(),
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            improvedAt.toISOString()
        }
      }
    );

  check(
    improvedEvaluation.status === 200 &&
    improvedEvaluation.json.data
      .outcome === "created",
    "changed operational evidence creates a new immutable snapshot"
  );

  const improvedSnapshot =
    improvedEvaluation.json.data
      .snapshot;

  check(
    improvedSnapshot.score === 85 &&
    improvedSnapshot.status ===
      "HEALTHY",
    "improved operational conditions raise health to 85 HEALTHY"
  );

  check(
    improvedSnapshot.confidence ===
      30,
    "improved snapshot confidence remains evidence-based"
  );

  const improvedScores =
    Object.fromEntries(
      improvedSnapshot.contributions.map(
        (
          contribution:
            Record<string, any>
        ) => [
          contribution.indicatorCode,
          contribution.indicatorScore
        ]
      )
    );

  check(
    improvedScores.WORK_EXECUTION ===
      100 &&
    improvedScores.SLA_RELIABILITY ===
      50 &&
    improvedScores.REQUEST_OWNERSHIP ===
      100 &&
    improvedScores.ATTENTION_PRESSURE ===
      100,
    "improved snapshot preserves explainable indicator scores"
  );

  const originalSnapshot =
    await prisma.healthSnapshot.findUnique({
      where: {
        id:
          initial.organizationSnapshot.id
      }
    });

  check(
    originalSnapshot?.score === 50,
    "previous health snapshot remains immutable"
  );

  const concurrentAt =
    new Date(
      improvedAt.getTime() +
      1000
    );

  const concurrentBody = {
    scopeType:
      "ORGANIZATION",
    now:
      concurrentAt.toISOString(),
    periodStart:
      fixtures.periodStart
        .toISOString(),
    periodEnd:
      concurrentAt.toISOString()
  };

  const [
    concurrentOne,
    concurrentTwo
  ] = await Promise.all([
    apiRequest(
      baseUrl,
      "POST",
      "/health/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          concurrentBody
      }
    ),
    apiRequest(
      baseUrl,
      "POST",
      "/health/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          concurrentBody
      }
    )
  ]);

  check(
    concurrentOne.status === 200 &&
    concurrentTwo.status === 200 &&
    concurrentOne.json.data.snapshot
      .id ===
      concurrentTwo.json.data.snapshot
        .id,
    "concurrent identical evaluation is database-idempotent"
  );

  const missingEvidence =
    await apiRequest(
      baseUrl,
      "POST",
      "/health/evaluate",
      {
        token:
          fixtures.tokens
            .administratorB,
        organizationId:
          fixtures.organizationB.id,
        body: {
          scopeType:
            "ORGANIZATION",
          now:
            fixtures.now.toISOString(),
          periodStart:
            fixtures.periodStart
              .toISOString(),
          periodEnd:
            fixtures.now.toISOString()
        }
      }
    );

  check(
    missingEvidence.status === 200 &&
    missingEvidence.json.data.snapshot
      .confidence === 0 &&
    missingEvidence.json.data.snapshot
      .contributions.every(
        (
          contribution:
            Record<string, any>
        ) =>
          contribution.measuredValue ===
            null
      ),
    "missing evidence produces zero confidence rather than assumed health"
  );

  const organizationSnapshotCount =
    await prisma.healthSnapshot.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        scopeType:
          "ORGANIZATION"
      }
    });

  check(
    organizationSnapshotCount === 3,
    "organization health history contains exactly three distinct evaluations"
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

  const initial =
    await testAccessAndEvaluation(
      runtimeContext
    );

  await testChangeAndGovernance(
    runtimeContext,
    initial
  );

  console.log(
    "\nSPRINT 017 RUNTIME ACCEPTANCE: PASS"
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
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
