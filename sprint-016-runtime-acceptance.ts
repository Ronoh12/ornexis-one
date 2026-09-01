import "dotenv/config";

import jwt from "jsonwebtoken";

import app from "./apps/api/src/app.js";

import {
  prisma
} from "./packages/database/index.js";

const runId =
  `s016-${Date.now()}`;

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
          `Sprint 016 ${label} ${runId}`,
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
  const permissionCodes = [
    "attention.view",
    "attention.manage",
    "attention.evaluate"
  ];

  const organizationA =
    await createOrganization("A");

  const organizationB =
    await createOrganization("B");

  const administratorRoleA =
    await createRole(
      organizationA.id,
      "Administrator",
      permissionCodes,
      true
    );

  const workerRoleA =
    await createRole(
      organizationA.id,
      `Attention Worker ${runId}`,
      [
        "attention.view",
        "attention.manage"
      ]
    );

  const emptyRoleA =
    await createRole(
      organizationA.id,
      `No Attention ${runId}`,
      []
    );

  const administratorRoleB =
    await createRole(
      organizationB.id,
      "Administrator",
      permissionCodes,
      true
    );

  const administratorA =
    await createMember(
      organizationA.id,
      administratorRoleA.id,
      "AdministratorA"
    );

  const workerA =
    await createMember(
      organizationA.id,
      workerRoleA.id,
      "WorkerA"
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

  const now = new Date();

  const overdueWorkItem =
    await prisma.workItem.create({
      data: {
        organizationId:
          organizationA.id,
        createdByOrganizationUserId:
          administratorA.membership.id,
        ownerOrganizationUserId:
          administratorA.membership.id,
        assigneeOrganizationUserId:
          workerA.membership.id,
        title:
          `Overdue work ${runId}`,
        priority: "HIGH",
        status: "OPEN",
        dueAt:
          new Date(
            now.getTime() -
            60 * 60 * 1000
          )
      }
    });

  const requestType =
    await prisma.requestType.create({
      data: {
        organizationId:
          organizationA.id,
        name:
          `Acceptance request ${runId}`,
        code:
          `S016-${runId}`,
        isActive: true
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
          workerA.membership.id,
        assignedToOrganizationUserId:
          null,
        title:
          `Unassigned request ${runId}`,
        priority: "NORMAL",
        status: "SUBMITTED",
        submittedAt: now,
        dueAt:
          new Date(
            now.getTime() +
            60 * 60 * 1000
          )
      }
    });

  return {
    now,
    organizationA,
    organizationB,
    administratorA,
    workerA,
    emptyA,
    administratorB,
    overdueWorkItem,
    unassignedRequest,
    tokens: {
      administratorA:
        accessToken(
          administratorA.user.id
        ),
      workerA:
        accessToken(
          workerA.user.id
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

async function createSlaFixtures(
  fixtures:
    Awaited<
      ReturnType<
        typeof createBaseFixtures
      >
    >
) {
  const policy =
    await prisma.slaPolicy.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        name:
          `Attention SLA ${runId}`,
        code:
          `ATTENTION-${runId}`,
        isActive: true
      }
    });

  const target =
    await prisma.slaTarget.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        slaPolicyId:
          policy.id,
        name:
          `Attention target ${runId}`,
        targetType: "COMPLETION",
        durationMinutes: 30,
        warningMinutesBefore: 10,
        escalationMinutesAfter: 15,
        notifyOnWarning: false,
        notifyOnBreach: false,
        notifyOnEscalation: false,
        isActive: true
      }
    });

  const startedAt =
    new Date(
      fixtures.now.getTime() -
      2 * 60 * 60 * 1000
    );

  const targetAt =
    new Date(
      fixtures.now.getTime() -
      60 * 60 * 1000
    );

  const instance =
    await prisma.slaInstance.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        slaPolicyId:
          policy.id,
        slaTargetId:
          target.id,
        sourceType:
          "WORK_ITEM",
        sourceId:
          fixtures.overdueWorkItem.id,
        status: "BREACHED",
        startedAt,
        targetAt,
        breachedAt: targetAt
      }
    });

  const events =
    await Promise.all(
      [
        "WARNING",
        "BREACHED",
        "ESCALATED"
      ].map(
        async (
          eventType,
          index
        ) =>
          prisma.slaEvent.create({
            data: {
              organizationId:
                fixtures.organizationA.id,
              slaInstanceId:
                instance.id,
              eventType:
                eventType as
                  | "WARNING"
                  | "BREACHED"
                  | "ESCALATED",
              occurredAt:
                new Date(
                  targetAt.getTime() +
                  index * 1000
                ),
              idempotencyKey:
                `${instance.id}:${eventType}:${runId}`,
              metadata: {
                acceptance: true
              }
            }
          })
      )
    );

  return {
    policy,
    target,
    instance,
    events
  };
}

async function prepareAcceptance() {
  const fixtures =
    await createBaseFixtures();

  const sla =
    await createSlaFixtures(
      fixtures
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
    address !== null &&
    typeof address === "object",
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
    sla,
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

  const unauthenticated =
    await apiRequest(
      baseUrl,
      "GET",
      "/attention-items"
    );

  check(
    unauthenticated.status === 401,
    "unauthenticated access is rejected"
  );

  const missingOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      "/attention-items",
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
      "/attention-items",
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
      "/attention-items",
      {
        token:
          fixtures.tokens.emptyA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    noPermission.status === 403,
    "attention.view permission is enforced"
  );

  const workerBefore =
    await apiRequest(
      baseUrl,
      "GET",
      "/attention-items",
      {
        token:
          fixtures.tokens.workerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    workerBefore.status === 200,
    "authorized worker can access Attention Centre"
  );

  const workerEvaluation =
    await apiRequest(
      baseUrl,
      "POST",
      "/attention-items/evaluate",
      {
        token:
          fixtures.tokens.workerA,
        organizationId:
          fixtures.organizationA.id,
        body: {}
      }
    );

  check(
    workerEvaluation.status === 403,
    "attention.evaluate permission is enforced"
  );

  const firstEvaluation =
    await apiRequest(
      baseUrl,
      "POST",
      "/attention-items/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          limit: 100
        }
      }
    );

  check(
    firstEvaluation.status === 200,
    "administrator can invoke evaluation"
  );

  check(
    firstEvaluation.json.data.created === 5,
    "five deterministic attention signals are created"
  );

  check(
    firstEvaluation.json.data.failed === 0,
    "attention evaluation has no failures"
  );

  const secondEvaluation =
    await apiRequest(
      baseUrl,
      "POST",
      "/attention-items/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          limit: 100
        }
      }
    );

  check(
    secondEvaluation.status === 200,
    "repeated evaluation succeeds"
  );

  check(
    secondEvaluation.json.data.created === 0,
    "repeated evaluation creates no duplicates"
  );

  check(
    secondEvaluation.json.data.failed === 0,
    "repeated evaluation has no failures"
  );

  const administratorList =
    await apiRequest(
      baseUrl,
      "GET",
      "/attention-items?limit=100",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    administratorList.status === 200,
    "administrator can list organization attention items"
  );

  check(
    administratorList.json
      .data.pagination.total === 5,
    "administrator sees all five attention items"
  );

  const items:
    Array<Record<string, any>> =
      administratorList.json
        .data.items;

  const signalTypes =
    new Set(
      items.map(
        (item) =>
          item.signalType
      )
    );

  for (
    const signalType of [
      "WORK_ITEM_OVERDUE",
      "SLA_WARNING",
      "SLA_BREACHED",
      "SLA_ESCALATED",
      "REQUEST_UNASSIGNED"
    ]
  ) {
    check(
      signalTypes.has(signalType),
      `${signalType} is represented`
    );
  }

  const workerList =
    await apiRequest(
      baseUrl,
      "GET",
      "/attention-items?limit=100",
      {
        token:
          fixtures.tokens.workerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    workerList.status === 200,
    "responsible worker can list assigned attention"
  );

  check(
    workerList.json
      .data.pagination.total === 4,
    "worker sees assigned items but not unassigned organization-wide item"
  );

  const workItemAttention =
    items.find(
      (item) =>
        item.signalType ===
        "WORK_ITEM_OVERDUE"
    );

  const warningAttention =
    items.find(
      (item) =>
        item.signalType ===
        "SLA_WARNING"
    );

  const requestAttention =
    items.find(
      (item) =>
        item.signalType ===
        "REQUEST_UNASSIGNED"
    );

  check(
    workItemAttention &&
    warningAttention &&
    requestAttention,
    "required lifecycle test items exist"
  );

  const foreignRead =
    await apiRequest(
      baseUrl,
      "GET",
      `/attention-items/${
        workItemAttention.id
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
    foreignRead.status === 404,
    "foreign tenant cannot read another tenant attention item"
  );

  return {
    items,
    workItemAttention,
    warningAttention,
    requestAttention
  };
}

async function testLifecycleAndResolution(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  items:
    Awaited<
      ReturnType<
        typeof testAccessAndEvaluation
      >
    >
) {
  const {
    fixtures,
    sla,
    baseUrl
  } = context;

  const acknowledged =
    await apiRequest(
      baseUrl,
      "POST",
      `/attention-items/${
        items.workItemAttention.id
      }/acknowledge`,
      {
        token:
          fixtures.tokens.workerA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          comment:
            "Acceptance acknowledgement"
        }
      }
    );

  check(
    acknowledged.status === 200,
    "responsible worker can acknowledge assigned attention"
  );

  check(
    acknowledged.json.data.status ===
      "ACKNOWLEDGED",
    "acknowledgement updates lifecycle state"
  );

  const dismissed =
    await apiRequest(
      baseUrl,
      "POST",
      `/attention-items/${
        items.warningAttention.id
      }/dismiss`,
      {
        token:
          fixtures.tokens.workerA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          comment:
            "Acceptance dismissal"
        }
      }
    );

  check(
    dismissed.status === 200,
    "responsible worker can dismiss assigned attention"
  );

  check(
    dismissed.json.data.status ===
      "DISMISSED",
    "dismissal updates lifecycle state"
  );

  const auditCount =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action: {
          in: [
            "ATTENTION_ITEM_ACKNOWLEDGED",
            "ATTENTION_ITEM_DISMISSED"
          ]
        }
      }
    });

  check(
    auditCount === 2,
    "acknowledgement and dismissal are audited"
  );

  const resolvedAt = new Date();

  await prisma.workItem.update({
    where: {
      id:
        fixtures.overdueWorkItem.id
    },
    data: {
      status: "COMPLETED",
      completedAt: resolvedAt,
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
        fixtures.workerA.membership.id
    }
  });

  await prisma.slaInstance.update({
    where: {
      id: sla.instance.id
    },
    data: {
      status: "SATISFIED",
      satisfiedAt: resolvedAt
    }
  });

  const resolutionEvaluation =
    await apiRequest(
      baseUrl,
      "POST",
      "/attention-items/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          limit: 100
        }
      }
    );

  check(
    resolutionEvaluation.status === 200,
    "resolution evaluation succeeds"
  );

  check(
    resolutionEvaluation.json.data
      .resolved === 4,
    "four active conditions resolve automatically"
  );

  const records =
    await prisma.attentionItem.findMany({
      where: {
        organizationId:
          fixtures.organizationA.id
      },
      select: {
        signalType: true,
        status: true
      }
    });

  const statusBySignal =
    Object.fromEntries(
      records.map(
        (record) => [
          record.signalType,
          record.status
        ]
      )
    );

  check(
    statusBySignal.WORK_ITEM_OVERDUE ===
      "RESOLVED",
    "completed Work Item resolves overdue attention"
  );

  check(
    statusBySignal.REQUEST_UNASSIGNED ===
      "RESOLVED",
    "assigned Request resolves unassigned attention"
  );

  check(
    statusBySignal.SLA_WARNING ===
      "DISMISSED",
    "dismissed attention remains dismissed"
  );

  check(
    statusBySignal.SLA_BREACHED ===
      "RESOLVED" &&
    statusBySignal.SLA_ESCALATED ===
      "RESOLVED",
    "satisfied SLA resolves active SLA attention"
  );

  const finalEvaluation =
    await apiRequest(
      baseUrl,
      "POST",
      "/attention-items/evaluate",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          limit: 100
        }
      }
    );

  check(
    finalEvaluation.status === 200,
    "terminal-state reevaluation succeeds"
  );

  check(
    finalEvaluation.json.data.created === 0,
    "terminal items are not reopened"
  );

  const finalCount =
    await prisma.attentionItem.count({
      where: {
        organizationId:
          fixtures.organizationA.id
      }
    });

  check(
    finalCount === 5,
    "idempotent lifecycle retains exactly five history records"
  );
}

let runtimeContext:
  Awaited<
    ReturnType<
      typeof prepareAcceptance
    >
  > | undefined;

async function main() {
  runtimeContext =
    await prepareAcceptance();

  const items =
    await testAccessAndEvaluation(
      runtimeContext
    );

  await testLifecycleAndResolution(
    runtimeContext,
    items
  );

  console.log(
    "\nSPRINT 016 RUNTIME ACCEPTANCE: PASS"
  );
}

main()
  .catch((error) => {
    console.error(
      "\nSPRINT 016 RUNTIME ACCEPTANCE: FAIL"
    );

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
