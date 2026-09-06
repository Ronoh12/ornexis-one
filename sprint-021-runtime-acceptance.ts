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
  `s021-${Date.now()}`;

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
          `Sprint 021 ${label} ${runId}`,
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
  const allRelationshipPermissions = [
    "relationships.view",
    "relationships.manage",
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
      allRelationshipPermissions,
      true
    );

  const scopedViewerRoleA =
    await createRole(
      organizationA.id,
      `Relationship Viewer ${runId}`,
      allRelationshipPermissions
    );

  const emptyRoleA =
    await createRole(
      organizationA.id,
      `No Relationships ${runId}`,
      []
    );

  const relationshipOnlyRoleA =
    await createRole(
      organizationA.id,
      `Relationships Only ${runId}`,
      [
        "relationships.view"
      ]
    );

  const administratorRoleB =
    await createRole(
      organizationB.id,
      "Administrator",
      allRelationshipPermissions,
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
      relationshipOnlyRoleA.id,
      "UnassignedA"
    );

  const limitedBranchA =
    await createMember(
      organizationA.id,
      relationshipOnlyRoleA.id,
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

async function createRelationshipFixtures(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >
) {
  const {
    fixtures
  } = context;

  const otherBranch =
    await prisma.branch.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        name:
          `Other Relationship Branch ${runId}`,
        code:
          `RB2-${runId}`,
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
          `Other Relationship Department ${runId}`,
        code:
          `RD2-${runId}`,
        isActive: true
      }
    });

  const guardedBranch =
    await prisma.branch.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        name:
          `Guarded Relationship Branch ${runId}`,
        code:
          `RGB-${runId}`,
        isActive: true
      }
    });

  const guardedDepartment =
    await prisma.department.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        branchId:
          fixtures.branch.id,
        name:
          `Guarded Relationship Department ${runId}`,
        code:
          `RGD-${runId}`,
        isActive: true
      }
    });

  const contact =
    await prisma.contact.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        branchId:
          fixtures.branch.id,
        departmentId:
          fixtures.department.id,
        contactType:
          "CUSTOMER",
        firstName:
          "Relationship",
        lastName:
          `Contact ${runId}`,
        email:
          `relationship-${runId}@example.test`,
        status:
          "ACTIVE"
      }
    });

  const guardedContact =
    await prisma.contact.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        branchId:
          fixtures.branch.id,
        departmentId:
          fixtures.department.id,
        contactType:
          "PARTNER",
        firstName:
          "Guarded",
        lastName:
          `Contact ${runId}`,
        status:
          "ACTIVE"
      }
    });

  const otherScopeContact =
    await prisma.contact.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        branchId:
          otherBranch.id,
        departmentId:
          otherDepartment.id,
        contactType:
          "CUSTOMER",
        firstName:
          "Other Scope",
        lastName:
          `Contact ${runId}`,
        status:
          "ACTIVE"
      }
    });

  const foreignContact =
    await prisma.contact.create({
      data: {
        organizationId:
          fixtures.organizationB.id,
        contactType:
          "CUSTOMER",
        firstName:
          "Foreign",
        lastName:
          `Contact ${runId}`,
        status:
          "ACTIVE"
      }
    });

  const activeDocument =
    await prisma.document.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        branchId:
          fixtures.branch.id,
        departmentId:
          fixtures.department.id,
        uploadedByUserId:
          fixtures.administratorA
            .user.id,
        title:
          `Active Relationship Document ${runId}`,
        originalFileName:
          `active-${runId}.txt`,
        storedFileName:
          `active-${runId}.txt`,
        storageProvider:
          "LOCAL",
        storageKey:
          `acceptance/${runId}/active.txt`,
        mimeType:
          "text/plain",
        fileExtension:
          ".txt",
        sizeBytes:
          10n,
        checksumSha256:
          "a".repeat(64),
        status:
          "ACTIVE"
      }
    });

  const secondDocument =
    await prisma.document.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        branchId:
          fixtures.branch.id,
        departmentId:
          fixtures.department.id,
        uploadedByUserId:
          fixtures.administratorA
            .user.id,
        title:
          `Second Relationship Document ${runId}`,
        originalFileName:
          `second-${runId}.txt`,
        storedFileName:
          `second-${runId}.txt`,
        storageProvider:
          "LOCAL",
        storageKey:
          `acceptance/${runId}/second.txt`,
        mimeType:
          "text/plain",
        fileExtension:
          ".txt",
        sizeBytes:
          11n,
        checksumSha256:
          "b".repeat(64),
        status:
          "ACTIVE"
      }
    });

  const archivedDocument =
    await prisma.document.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        branchId:
          fixtures.branch.id,
        departmentId:
          fixtures.department.id,
        uploadedByUserId:
          fixtures.administratorA
            .user.id,
        title:
          `Archived Relationship Document ${runId}`,
        originalFileName:
          `archived-${runId}.txt`,
        storedFileName:
          `archived-${runId}.txt`,
        storageProvider:
          "LOCAL",
        storageKey:
          `acceptance/${runId}/archived.txt`,
        mimeType:
          "text/plain",
        fileExtension:
          ".txt",
        sizeBytes:
          12n,
        checksumSha256:
          "c".repeat(64),
        status:
          "ARCHIVED"
      }
    });

  const foreignDocument =
    await prisma.document.create({
      data: {
        organizationId:
          fixtures.organizationB.id,
        uploadedByUserId:
          fixtures.administratorB
            .user.id,
        title:
          `Foreign Relationship Document ${runId}`,
        originalFileName:
          `foreign-${runId}.txt`,
        storedFileName:
          `foreign-${runId}.txt`,
        storageProvider:
          "LOCAL",
        storageKey:
          `acceptance/${runId}/foreign.txt`,
        mimeType:
          "text/plain",
        fileExtension:
          ".txt",
        sizeBytes:
          13n,
        checksumSha256:
          "d".repeat(64),
        status:
          "ACTIVE"
      }
    });

  const workflowDefinition =
    await prisma.workflowDefinition.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        name:
          `Relationship Workflow ${runId}`,
        code:
          `REL-${runId}`,
        entityType:
          "WORK_ITEM",
        version: 1,
        isActive: true
      }
    });

  const workflowState =
    await prisma.workflowState.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        workflowDefinitionId:
          workflowDefinition.id,
        name:
          "Initial",
        code:
          `INITIAL-${runId}`,
        position: 0,
        isInitial: true,
        isTerminal: false
      }
    });

  const workflowInstance =
    await prisma.workflowInstance.create({
      data: {
        organizationId:
          fixtures.organizationA.id,
        workflowDefinitionId:
          workflowDefinition.id,
        currentStateId:
          workflowState.id,
        entityType:
          "WORK_ITEM",
        entityId:
          fixtures.overdueWorkItem.id,
        startedByOrganizationUserId:
          fixtures.administratorA
            .membership.id,
        status:
          "ACTIVE"
      }
    });

  return {
    otherBranch,
    otherDepartment,
    guardedBranch,
    guardedDepartment,
    contact,
    guardedContact,
    otherScopeContact,
    foreignContact,
    activeDocument,
    secondDocument,
    archivedDocument,
    foreignDocument,
    workflowDefinition,
    workflowState,
    workflowInstance
  };
}

function relationshipBody(
  source: {
    entityType: string;
    entityId: string;
  },
  target: {
    entityType: string;
    entityId: string;
  },
  relationshipType:
    string
) {
  return {
    source,
    target,
    relationshipType,
    description:
      `Sprint 021 acceptance ${relationshipType}`,
    metadata: {
      acceptance:
        true
    }
  };
}

function relationshipQuery(
  endpoint: {
    entityType: string;
    entityId: string;
  },
  input?: {
    direction?:
      "ANY" |
      "OUTGOING" |
      "INCOMING";
    relationshipType?:
      string;
    limit?: number;
  }
) {
  return new URLSearchParams({
    entityType:
      endpoint.entityType,
    entityId:
      endpoint.entityId,
    direction:
      input?.direction ??
      "ANY",
    limit:
      String(
        input?.limit ??
        50
      ),
    ...(input?.relationshipType
      ? {
          relationshipType:
            input.relationshipType
        }
      : {})
  }).toString();
}

async function testRelationshipSecurityAndIdentity(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  entities:
    Awaited<
      ReturnType<
        typeof createRelationshipFixtures
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const contactEndpoint = {
    entityType:
      "CONTACT",
    entityId:
      entities.contact.id
  };

  const workEndpoint = {
    entityType:
      "WORK_ITEM",
    entityId:
      fixtures.overdueWorkItem.id
  };

  const requestEndpoint = {
    entityType:
      "REQUEST",
    entityId:
      fixtures.assignedRequest.id
  };

  const unauthenticated =
    await apiRequest(
      baseUrl,
      "GET",
      `/relationships?${relationshipQuery(
        contactEndpoint
      )}`
    );

  check(
    unauthenticated.status ===
      401,
    "unauthenticated relationship access is rejected"
  );

  const missingOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      `/relationships?${relationshipQuery(
        contactEndpoint
      )}`,
      {
        token:
          fixtures.tokens
            .administratorA
      }
    );

  check(
    missingOrganization.status ===
      400,
    "relationship access requires organization context"
  );

  const foreignMembership =
    await apiRequest(
      baseUrl,
      "GET",
      `/relationships?${relationshipQuery(
        contactEndpoint
      )}`,
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
      `/relationships?${relationshipQuery(
        contactEndpoint
      )}`,
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
    "relationships.view permission is enforced"
  );

  const missingManagePermission =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .limitedBranchA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            contactEndpoint,
            workEndpoint,
            "RELATED_TO"
          )
      }
    );

  check(
    missingManagePermission.status ===
      403,
    "relationships.manage permission is independently enforced"
  );

  const invalidEntityType =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            {
              entityType:
                "ARBITRARY_ENTITY",
              entityId:
                entities.contact.id
            },
            workEndpoint,
            "RELATED_TO"
          )
      }
    );

  check(
    invalidEntityType.status ===
      400,
    "arbitrary relationship entity types are rejected"
  );

  const invalidRelationshipType =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            contactEndpoint,
            workEndpoint,
            "ARBITRARY_RELATIONSHIP"
          )
      }
    );

  check(
    invalidRelationshipType.status ===
      400,
    "arbitrary relationship types are rejected"
  );

  const invalidUuid =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            {
              entityType:
                "CONTACT",
              entityId:
                "not-a-uuid"
            },
            workEndpoint,
            "RELATED_TO"
          )
      }
    );

  check(
    invalidUuid.status ===
      400,
    "invalid relationship UUIDs are rejected"
  );

  const unknownField =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          ...relationshipBody(
            contactEndpoint,
            workEndpoint,
            "RELATED_TO"
          ),
          finalStatus:
            "APPROVED"
        }
      }
    );

  check(
    unknownField.status ===
      400,
    "unknown relationship mutation fields are rejected"
  );

  const unsupportedPair =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            contactEndpoint,
            {
              entityType:
                "BRANCH",
              entityId:
                fixtures.branch.id
            },
            "RELATED_TO"
          )
      }
    );

  check(
    unsupportedPair.status ===
      400,
    "unsupported relationship entity pairs are rejected"
  );

  const selfRelationship =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            contactEndpoint,
            contactEndpoint,
            "RELATED_TO"
          )
      }
    );

  check(
    selfRelationship.status ===
      400,
    "self-relationships are rejected"
  );

  const unrestrictedList =
    await apiRequest(
      baseUrl,
      "GET",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    unrestrictedList.status ===
      400,
    "unrestricted organization-wide relationship listing is rejected"
  );

  const symmetric =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            contactEndpoint,
            workEndpoint,
            "RELATED_TO"
          )
      }
    );

  check(
    symmetric.status ===
      201 &&
    symmetric.json.data.created ===
      true &&
    symmetric.json.data
      .relationship.symmetric ===
      true,
    "same-tenant symmetric relationship creation succeeds"
  );

  const symmetricRelationship =
    symmetric.json.data
      .relationship;

  check(
    symmetricRelationship.source
      .entityType !==
      symmetricRelationship.target
        .entityType ||
    symmetricRelationship.source
      .entityId <
      symmetricRelationship.target
        .entityId,
    "symmetric relationship endpoints are canonically normalized"
  );

  const reversedSymmetric =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            workEndpoint,
            contactEndpoint,
            "RELATED_TO"
          )
      }
    );

  check(
    reversedSymmetric.status ===
      200 &&
    reversedSymmetric.json.data
      .created ===
      false &&
    reversedSymmetric.json.data
      .relationship.id ===
      symmetricRelationship.id,
    "reversed symmetric relationship creation is idempotent"
  );

  const directional =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            workEndpoint,
            requestEndpoint,
            "DEPENDS_ON"
          )
      }
    );

  check(
    directional.status ===
      201 &&
    directional.json.data
      .relationship.source
      .entityType ===
      "WORK_ITEM" &&
    directional.json.data
      .relationship.source
      .entityId ===
      fixtures.overdueWorkItem.id &&
    directional.json.data
      .relationship.target
      .entityType ===
      "REQUEST" &&
    directional.json.data
      .relationship.target
      .entityId ===
      fixtures.assignedRequest.id,
    "directional relationship endpoint order is preserved"
  );

  const repeatedDirectional =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            workEndpoint,
            requestEndpoint,
            "DEPENDS_ON"
          )
      }
    );

  check(
    repeatedDirectional.status ===
      200 &&
    repeatedDirectional.json.data
      .created ===
      false &&
    repeatedDirectional.json.data
      .relationship.id ===
      directional.json.data
        .relationship.id,
    "duplicate directional relationship creation is idempotent"
  );

  const concurrentBody =
    relationshipBody(
      workEndpoint,
      requestEndpoint,
      "SUPPORTS"
    );

  const concurrent =
    await Promise.all(
      Array.from(
        {
          length: 6
        },
        () =>
          apiRequest(
            baseUrl,
            "POST",
            "/relationships",
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
      )
    );

  check(
    concurrent.every(
      (response) =>
        response.status ===
          200 ||
        response.status ===
          201
    ),
    "concurrent identical relationship requests succeed safely"
  );

  const concurrentIds =
    new Set(
      concurrent.map(
        (response) =>
          response.json.data
            .relationship.id
      )
    );

  check(
    concurrentIds.size ===
      1 &&
    concurrent.filter(
      (response) =>
        response.json.data
          .created ===
        true
    ).length ===
      1,
    "concurrent identical relationship creation is database-idempotent"
  );

  const storedConcurrent =
    await prisma.entityRelationship.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        relationshipType:
          "SUPPORTS",
        OR: [
          {
            sourceId:
              fixtures.overdueWorkItem.id,
            targetId:
              fixtures.assignedRequest.id
          },
          {
            sourceId:
              fixtures.assignedRequest.id,
            targetId:
              fixtures.overdueWorkItem.id
          }
        ]
      }
    });

  check(
    storedConcurrent ===
      1,
    "one concurrent relationship record is persisted"
  );

  const createdAudits =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action:
          "ENTITY_RELATIONSHIP_CREATED",
        entityId: {
          in: [
            symmetricRelationship.id,
            directional.json.data
              .relationship.id,
            [
              ...concurrentIds
            ][0]
          ]
        }
      }
    });

  check(
    createdAudits ===
      3,
    "relationship creation is audited exactly once per persisted record"
  );

  return {
    contactEndpoint,
    workEndpoint,
    requestEndpoint,
    symmetric:
      symmetricRelationship,
    directional:
      directional.json.data
        .relationship,
    concurrentId:
      [
        ...concurrentIds
      ][0]
  };
}

async function testRelationshipScopeAndLifecycle(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  entities:
    Awaited<
      ReturnType<
        typeof createRelationshipFixtures
      >
    >,
  identity:
    Awaited<
      ReturnType<
        typeof testRelationshipSecurityAndIdentity
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const foreignSource =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            {
              entityType:
                "CONTACT",
              entityId:
                entities.foreignContact.id
            },
            identity.workEndpoint,
            "RELATED_TO"
          )
      }
    );

  check(
    foreignSource.status ===
      404,
    "cross-tenant relationship source fails without disclosure"
  );

  const foreignTarget =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            identity.workEndpoint,
            {
              entityType:
                "CONTACT",
              entityId:
                entities.foreignContact.id
            },
            "RELATED_TO"
          )
      }
    );

  check(
    foreignTarget.status ===
      404,
    "cross-tenant relationship target fails without disclosure"
  );

  const sourceRestrictedRole =
    await createRole(
      fixtures.organizationA.id,
      `Source Restricted ${runId}`,
      [
        "relationships.view",
        "relationships.manage",
        "work_items.view",
        "work_items.update"
      ]
    );

  const sourceRestrictedMember =
    await createMember(
      fixtures.organizationA.id,
      sourceRestrictedRole.id,
      "SourceRestricted"
    );

  await prisma.organizationUser.update({
    where: {
      id:
        sourceRestrictedMember
          .membership.id
    },
    data: {
      branchId:
        fixtures.branch.id
    }
  });

  const sourcePermission =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          accessToken(
            sourceRestrictedMember
              .user.id
          ),
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            identity.contactEndpoint,
            identity.workEndpoint,
            "ASSOCIATED_WITH"
          )
      }
    );

  check(
    sourcePermission.status ===
      403,
    "relationship source-module permission is enforced"
  );

  const targetRestrictedRole =
    await createRole(
      fixtures.organizationA.id,
      `Target Restricted ${runId}`,
      [
        "relationships.view",
        "relationships.manage",
        "contacts.view",
        "contacts.update"
      ]
    );

  const targetRestrictedMember =
    await createMember(
      fixtures.organizationA.id,
      targetRestrictedRole.id,
      "TargetRestricted"
    );

  await prisma.organizationUser.update({
    where: {
      id:
        targetRestrictedMember
          .membership.id
    },
    data: {
      branchId:
        fixtures.branch.id
    }
  });

  const targetPermission =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          accessToken(
            targetRestrictedMember
              .user.id
          ),
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            identity.contactEndpoint,
            identity.workEndpoint,
            "ASSOCIATED_WITH"
          )
      }
    );

  check(
    targetPermission.status ===
      403,
    "relationship target-module permission is enforced"
  );

  const unassignedRole =
    await createRole(
      fixtures.organizationA.id,
      `Unassigned Relationship ${runId}`,
      [
        "relationships.view",
        "relationships.manage",
        "contacts.view",
        "contacts.update",
        "work_items.view",
        "work_items.update"
      ]
    );

  const unassignedMember =
    await createMember(
      fixtures.organizationA.id,
      unassignedRole.id,
      "UnassignedRelationship"
    );

  const unassignedScope =
    await apiRequest(
      baseUrl,
      "GET",
      `/relationships?${relationshipQuery(
        identity.contactEndpoint
      )}`,
      {
        token:
          accessToken(
            unassignedMember.user.id
          ),
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    unassignedScope.status ===
      403,
    "unassigned-member relationship scope is rejected"
  );

  const branchForeignScope =
    await apiRequest(
      baseUrl,
      "GET",
      `/relationships?${relationshipQuery(
        {
          entityType:
            "CONTACT",
          entityId:
            entities.otherScopeContact.id
        }
      )}`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    branchForeignScope.status ===
      403,
    "Branch structural relationship scope is enforced"
  );

  const departmentAuthorized =
    await apiRequest(
      baseUrl,
      "GET",
      `/relationships?${relationshipQuery(
        identity.contactEndpoint
      )}`,
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    departmentAuthorized.status ===
      200,
    "Department member can list relationships for its own scope"
  );

  const departmentForeignScope =
    await apiRequest(
      baseUrl,
      "GET",
      `/relationships?${relationshipQuery(
        {
          entityType:
            "CONTACT",
          entityId:
            entities.otherScopeContact.id
        }
      )}`,
      {
        token:
          fixtures.tokens
            .departmentViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    departmentForeignScope.status ===
      403,
    "Department structural relationship scope is enforced"
  );

  const contactRequest =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            identity.contactEndpoint,
            identity.requestEndpoint,
            "ASSOCIATED_WITH"
          )
      }
    );

  check(
    contactRequest.status ===
      201,
    "additional anchored relationship is created"
  );

  const anchoredPath =
    `/relationships?${relationshipQuery(
      identity.contactEndpoint,
      {
        limit: 100
      }
    )}`;

  const firstList =
    await apiRequest(
      baseUrl,
      "GET",
      anchoredPath,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const secondList =
    await apiRequest(
      baseUrl,
      "GET",
      anchoredPath,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    firstList.status ===
      200 &&
    firstList.json.data.count >=
      2,
    "relationship listing requires and accepts an authorized anchor"
  );

  check(
    JSON.stringify(
      firstList.json.data
        .relationships
    ) ===
    JSON.stringify(
      secondList.json.data
        .relationships
    ),
    "repeated identical relationship reads are deterministic"
  );

  const boundedList =
    await apiRequest(
      baseUrl,
      "GET",
      `/relationships?${relationshipQuery(
        identity.contactEndpoint,
        {
          limit: 1
        }
      )}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    boundedList.status ===
      200 &&
    boundedList.json.data
      .relationships.length ===
      1 &&
    boundedList.json.data.limit ===
      1,
    "relationship lists are bounded"
  );

  const repeatedQuery =
    await apiRequest(
      baseUrl,
      "GET",
      `/relationships?entityType=CONTACT&entityType=WORK_ITEM&entityId=${entities.contact.id}`,
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
    "repeated single-value relationship query fields are rejected"
  );

  const safeRelationship =
    firstList.json.data
      .relationships[0];

  const safeSummaryKeys =
    [
      "drillDownAvailable",
      "entityId",
      "entityType",
      "label",
      "scope",
      "status"
    ];

  check(
    JSON.stringify(
      Object.keys(
        safeRelationship.source
      ).sort()
    ) ===
      JSON.stringify(
        safeSummaryKeys
      ) &&
    JSON.stringify(
      Object.keys(
        safeRelationship.target
      ).sort()
    ) ===
      JSON.stringify(
        safeSummaryKeys
      ) &&
    safeRelationship.source
      .storageKey ===
      undefined &&
    safeRelationship.target
      .contextData ===
      undefined,
    "relationship safe summaries are data-minimized"
  );

  const hiddenRelationship =
    await apiRequest(
      baseUrl,
      "GET",
      `/relationships/${identity.symmetric.id}`,
      {
        token:
          accessToken(
            targetRestrictedMember
              .user.id
          ),
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    hiddenRelationship.status ===
      404 &&
    hiddenRelationship.json.data ===
      undefined,
    "restricted endpoints expose no relationship details"
  );

  const patchAttempt =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/relationships/${identity.symmetric.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          description:
            "Mutated"
        }
      }
    );

  check(
    patchAttempt.status ===
      404,
    "relationship records expose no mutable update endpoint"
  );

  const beforeDirectionalEndpoints =
    await Promise.all([
      prisma.workItem.findUnique({
        where: {
          id:
            fixtures.overdueWorkItem.id
        }
      }),
      prisma.request.findUnique({
        where: {
          id:
            fixtures.assignedRequest.id
        }
      })
    ]);

  const removal =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/relationships/${identity.directional.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    removal.status ===
      200 &&
    removal.json.data.removed ===
      true,
    "authorized relationship removal succeeds"
  );

  const removedRecord =
    await prisma.entityRelationship.findUnique({
      where: {
        id:
          identity.directional.id
      }
    });

  const afterDirectionalEndpoints =
    await Promise.all([
      prisma.workItem.findUnique({
        where: {
          id:
            fixtures.overdueWorkItem.id
        }
      }),
      prisma.request.findUnique({
        where: {
          id:
            fixtures.assignedRequest.id
        }
      })
    ]);

  check(
    removedRecord ===
      null &&
    beforeDirectionalEndpoints[0]
      ?.id ===
      afterDirectionalEndpoints[0]
        ?.id &&
    beforeDirectionalEndpoints[1]
      ?.id ===
      afterDirectionalEndpoints[1]
        ?.id,
    "relationship removal deletes neither endpoint"
  );

  const removalAudit =
    await prisma.auditLog.findFirst({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action:
          "ENTITY_RELATIONSHIP_REMOVED",
        entityId:
          identity.directional.id
      }
    });

  check(
    removalAudit !==
      null,
    "relationship removal is audited"
  );

  const guardedContactRelationship =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            {
              entityType:
                "CONTACT",
              entityId:
                entities.guardedContact.id
            },
            identity.workEndpoint,
            "RELATED_TO"
          )
      }
    );

  check(
    guardedContactRelationship.status ===
      201,
    "guarded Contact relationship fixture is created"
  );

  const guardedStructureRelationship =
    await apiRequest(
      baseUrl,
      "POST",
      "/relationships",
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body:
          relationshipBody(
            {
              entityType:
                "BRANCH",
              entityId:
                entities.guardedBranch.id
            },
            {
              entityType:
                "DEPARTMENT",
              entityId:
                entities.guardedDepartment.id
            },
            "RELATED_TO"
          )
      }
    );

  check(
    guardedStructureRelationship.status ===
      201,
    "guarded structural relationship fixture is created"
  );

  const guardedContactDelete =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/contacts/${entities.guardedContact.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const guardedBranchDelete =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/branches/${entities.guardedBranch.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const guardedDepartmentDelete =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/departments/${entities.guardedDepartment.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    guardedContactDelete.status ===
      409 &&
    guardedBranchDelete.status ===
      409 &&
    guardedDepartmentDelete.status ===
      409,
    "relationship dependencies block physical endpoint deletion"
  );

  return {
    contactRequest:
      contactRequest.json.data
        .relationship,
    sourceRestrictedMember,
    targetRestrictedMember
  };
}

async function testSharedAttachmentCore(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  entities:
    Awaited<
      ReturnType<
        typeof createRelationshipFixtures
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const workActivityBefore =
    await prisma.workItemActivity.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        workItemId:
          fixtures.overdueWorkItem.id,
        activityType:
          "ATTACHMENT_ADDED"
      }
    });

  const workAttach =
    await apiRequest(
      baseUrl,
      "POST",
      `/work-items/${fixtures.overdueWorkItem.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.activeDocument.id
        }
      }
    );

  check(
    workAttach.status ===
      201 &&
    workAttach.json.data.id &&
    workAttach.json.data
      .documentId ===
      entities.activeDocument.id &&
    workAttach.json.data
      .entityType ===
      "WORK_ITEM" &&
    workAttach.json.data
      .entityId ===
      fixtures.overdueWorkItem.id,
    "Work Item attachments use the shared service with compatible IDs"
  );

  const workAttachmentId =
    workAttach.json.data.id;

  const workRetry =
    await apiRequest(
      baseUrl,
      "POST",
      `/work-items/${fixtures.overdueWorkItem.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.activeDocument.id
        }
      }
    );

  check(
    workRetry.status ===
      201 &&
    workRetry.json.data.id ===
      workAttachmentId,
    "Work Item attachment retry preserves the existing attachment ID"
  );

  const workAttachmentCount =
    await prisma.entityAttachment.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        documentId:
          entities.activeDocument.id,
        entityType:
          "WORK_ITEM",
        entityId:
          fixtures.overdueWorkItem.id
      }
    });

  const workActivityAfter =
    await prisma.workItemActivity.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        workItemId:
          fixtures.overdueWorkItem.id,
        activityType:
          "ATTACHMENT_ADDED"
      }
    });

  check(
    workAttachmentCount ===
      1 &&
    workActivityAfter -
      workActivityBefore ===
      1,
    "Work Item attachment retries create no duplicate record or activity"
  );

  const workList =
    await apiRequest(
      baseUrl,
      "GET",
      `/work-items/${fixtures.overdueWorkItem.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    workList.status ===
      200 &&
    workList.json.data.some(
      (
        attachment:
          Record<string, any>
      ) =>
        attachment.id ===
          workAttachmentId
    ),
    "Work Item shared attachment listing remains compatible"
  );

  const requestActivityBefore =
    await prisma.requestActivity.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        requestId:
          fixtures.assignedRequest.id,
        activityType:
          "ATTACHMENT_ADDED"
      }
    });

  const requestAttach =
    await apiRequest(
      baseUrl,
      "POST",
      `/requests/${fixtures.assignedRequest.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.secondDocument.id
        }
      }
    );

  check(
    requestAttach.status ===
      201 &&
    requestAttach.json.data.id &&
    requestAttach.json.data
      .entityType ===
      "REQUEST" &&
    requestAttach.json.data
      .entityId ===
      fixtures.assignedRequest.id,
    "Request attachments use the shared service with compatible IDs"
  );

  const requestAttachmentId =
    requestAttach.json.data.id;

  const requestRetry =
    await apiRequest(
      baseUrl,
      "POST",
      `/requests/${fixtures.assignedRequest.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.secondDocument.id
        }
      }
    );

  check(
    requestRetry.status ===
      201 &&
    requestRetry.json.data.id ===
      requestAttachmentId,
    "Request attachment retry preserves the existing attachment ID"
  );

  const requestAttachmentCount =
    await prisma.entityAttachment.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        documentId:
          entities.secondDocument.id,
        entityType:
          "REQUEST",
        entityId:
          fixtures.assignedRequest.id
      }
    });

  const requestActivityAfter =
    await prisma.requestActivity.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        requestId:
          fixtures.assignedRequest.id,
        activityType:
          "ATTACHMENT_ADDED"
      }
    });

  check(
    requestAttachmentCount ===
      1 &&
    requestActivityAfter -
      requestActivityBefore ===
      1,
    "Request attachment retries create no duplicate record or activity"
  );

  const requestList =
    await apiRequest(
      baseUrl,
      "GET",
      `/requests/${fixtures.assignedRequest.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    requestList.status ===
      200 &&
    requestList.json.data.some(
      (
        attachment:
          Record<string, any>
      ) =>
        attachment.id ===
          requestAttachmentId
    ),
    "Request shared attachment listing remains compatible"
  );

  const contactAttach =
    await apiRequest(
      baseUrl,
      "POST",
      `/contacts/${entities.contact.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.activeDocument.id
        }
      }
    );

  check(
    contactAttach.status ===
      201 &&
    contactAttach.json.created ===
      true &&
    contactAttach.json.data.id &&
    contactAttach.json.data
      .entityType ===
      "CONTACT" &&
    contactAttach.json.data
      .entityId ===
      entities.contact.id,
    "Contact attachment endpoint creates a shared attachment"
  );

  const contactAttachmentId =
    contactAttach.json.data.id;

  const contactRetry =
    await apiRequest(
      baseUrl,
      "POST",
      `/contacts/${entities.contact.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.activeDocument.id
        }
      }
    );

  check(
    contactRetry.status ===
      200 &&
    contactRetry.json.created ===
      false &&
    contactRetry.json.data.id ===
      contactAttachmentId,
    "duplicate Contact attachment creation is idempotent"
  );

  const contactList =
    await apiRequest(
      baseUrl,
      "GET",
      `/contacts/${entities.contact.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    contactList.status ===
      200 &&
    contactList.json.data.some(
      (
        attachment:
          Record<string, any>
      ) =>
        attachment.id ===
          contactAttachmentId
    ),
    "Contact attachment listing works"
  );

  const safeAttachment =
    contactAttach.json.data;

  check(
    safeAttachment.storageKey ===
      undefined &&
    safeAttachment.storedFileName ===
      undefined &&
    safeAttachment.checksumSha256 ===
      undefined &&
    safeAttachment.document
      .storageKey ===
      undefined &&
    safeAttachment.document
      .storedFileName ===
      undefined &&
    safeAttachment.document
      .checksumSha256 ===
      undefined,
    "attachment responses expose no storage internals"
  );

  const concurrentResponses =
    await Promise.all(
      Array.from(
        {
          length: 6
        },
        () =>
          apiRequest(
            baseUrl,
            "POST",
            `/contacts/${entities.contact.id}/attachments`,
            {
              token:
                fixtures.tokens
                  .administratorA,
              organizationId:
                fixtures.organizationA.id,
              body: {
                documentId:
                  entities.secondDocument.id
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
    "concurrent identical Contact attachment requests succeed safely"
  );

  const concurrentAttachmentIds =
    new Set(
      concurrentResponses.map(
        (response) =>
          response.json.data.id
      )
    );

  check(
    concurrentAttachmentIds.size ===
      1 &&
    concurrentResponses.filter(
      (response) =>
        response.json.created ===
          true
    ).length ===
      1,
    "concurrent identical attachment creation is database-idempotent"
  );

  const concurrentAttachmentId =
    [
      ...concurrentAttachmentIds
    ][0];

  const concurrentStoredCount =
    await prisma.entityAttachment.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        documentId:
          entities.secondDocument.id,
        entityType:
          "CONTACT",
        entityId:
          entities.contact.id
      }
    });

  check(
    concurrentStoredCount ===
      1,
    "one concurrent attachment record is persisted"
  );

  const genericCreationAudits =
    await prisma.auditLog.groupBy({
      by: [
        "entityId"
      ],
      where: {
        organizationId:
          fixtures.organizationA.id,
        action:
          "ENTITY_ATTACHMENT_CREATED",
        entityId: {
          in: [
            workAttachmentId,
            requestAttachmentId,
            contactAttachmentId,
            concurrentAttachmentId
          ]
        }
      },
      _count: {
        _all: true
      }
    });

  check(
    genericCreationAudits.length ===
      4 &&
    genericCreationAudits.every(
      (audit) =>
        audit._count._all ===
          1
    ),
    "idempotent attachment retries create one generic audit per record"
  );

  const moduleCreationAudits =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        action: {
          in: [
            "WORK_ITEM_ATTACHMENT_ADDED",
            "REQUEST_ATTACHMENT_ADDED",
            "CONTACT_ATTACHMENT_ADDED"
          ]
        },
        entityId: {
          in: [
            workAttachmentId,
            requestAttachmentId,
            contactAttachmentId,
            concurrentAttachmentId
          ]
        }
      }
    });

  check(
    moduleCreationAudits ===
      4,
    "shared attachment creation preserves module-specific auditing"
  );

  return {
    workAttachmentId,
    requestAttachmentId,
    contactAttachmentId,
    concurrentAttachmentId
  };
}

async function testAttachmentSafetyAndRemoval(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  entities:
    Awaited<
      ReturnType<
        typeof createRelationshipFixtures
      >
    >,
  attachments:
    Awaited<
      ReturnType<
        typeof testSharedAttachmentCore
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const noDocumentRole =
    await createRole(
      fixtures.organizationA.id,
      `No Document Visibility ${runId}`,
      [
        "contacts.view",
        "contacts.update"
      ]
    );

  const noDocumentMember =
    await createMember(
      fixtures.organizationA.id,
      noDocumentRole.id,
      "NoDocumentVisibility"
    );

  await prisma.organizationUser.update({
    where: {
      id:
        noDocumentMember
          .membership.id
    },
    data: {
      branchId:
        fixtures.branch.id
    }
  });

  const noDocumentToken =
    accessToken(
      noDocumentMember.user.id
    );

  const documentVisibilityCreate =
    await apiRequest(
      baseUrl,
      "POST",
      `/contacts/${entities.contact.id}/attachments`,
      {
        token:
          noDocumentToken,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.activeDocument.id
        }
      }
    );

  check(
    documentVisibilityCreate.status ===
      403,
    "attachment creation requires Document visibility"
  );

  const documentVisibilityList =
    await apiRequest(
      baseUrl,
      "GET",
      `/contacts/${entities.contact.id}/attachments`,
      {
        token:
          noDocumentToken,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    documentVisibilityList.status ===
      403,
    "attachment listing requires documents.view"
  );

  const parentAuthorization =
    await apiRequest(
      baseUrl,
      "POST",
      `/contacts/${entities.otherScopeContact.id}/attachments`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.activeDocument.id
        }
      }
    );

  check(
    parentAuthorization.status ===
      403,
    "attachment creation requires parent authorization"
  );

  const archivedDocument =
    await apiRequest(
      baseUrl,
      "POST",
      `/contacts/${entities.contact.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.archivedDocument.id
        }
      }
    );

  check(
    archivedDocument.status ===
      400,
    "archived Documents cannot be newly attached"
  );

  const foreignDocument =
    await apiRequest(
      baseUrl,
      "POST",
      `/contacts/${entities.contact.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.foreignDocument.id
        }
      }
    );

  check(
    foreignDocument.status ===
      404,
    "foreign Documents cannot be attached"
  );

  const viewOnlyDocumentRole =
    await createRole(
      fixtures.organizationA.id,
      `Document View Only ${runId}`,
      [
        "documents.view"
      ]
    );

  const viewOnlyDocumentMember =
    await createMember(
      fixtures.organizationA.id,
      viewOnlyDocumentRole.id,
      "DocumentViewOnly"
    );

  await prisma.organizationUser.update({
    where: {
      id:
        viewOnlyDocumentMember
          .membership.id
    },
    data: {
      branchId:
        fixtures.branch.id
    }
  });

  const downloadWithoutPermission =
    await apiRequest(
      baseUrl,
      "GET",
      `/documents/${entities.activeDocument.id}/download`,
      {
        token:
          accessToken(
            viewOnlyDocumentMember
              .user.id
          ),
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    downloadWithoutPermission.status ===
      403,
    "attachment download still requires documents.download"
  );

  const hiddenParentAttachment =
    await apiRequest(
      baseUrl,
      "POST",
      `/contacts/${entities.otherScopeContact.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          documentId:
            entities.activeDocument.id
        }
      }
    );

  check(
    hiddenParentAttachment.status ===
      201,
    "hidden-parent attachment fixture is created"
  );

  const administratorDocumentSide =
    await apiRequest(
      baseUrl,
      "GET",
      `/documents/${entities.activeDocument.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    administratorDocumentSide.status ===
      200 &&
    administratorDocumentSide.json.data
      .some(
        (
          attachment:
            Record<string, any>
        ) =>
          attachment.id ===
            attachments
              .workAttachmentId
      ) &&
    administratorDocumentSide.json.data
      .some(
        (
          attachment:
            Record<string, any>
        ) =>
          attachment.id ===
            attachments
              .contactAttachmentId
      ) &&
    administratorDocumentSide.json.data
      .some(
        (
          attachment:
            Record<string, any>
        ) =>
          attachment.id ===
            hiddenParentAttachment
              .json.data.id
      ),
    "Document-side listing returns authorized parent attachments"
  );

  const scopedDocumentSide =
    await apiRequest(
      baseUrl,
      "GET",
      `/documents/${entities.activeDocument.id}/attachments`,
      {
        token:
          fixtures.tokens
            .branchViewerA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    scopedDocumentSide.status ===
      200 &&
    scopedDocumentSide.json.data
      .every(
        (
          attachment:
            Record<string, any>
        ) =>
          attachment.entity
            .entityId !==
          entities.otherScopeContact.id
      ) &&
    JSON.stringify(
      scopedDocumentSide.json
    ).includes(
      entities.otherScopeContact.id
    ) ===
      false,
    "Document-side listing leaks no hidden parent IDs or summaries"
  );

  const foreignAttachment =
    await prisma.entityAttachment.create({
      data: {
        organizationId:
          fixtures.organizationB.id,
        documentId:
          entities.foreignDocument.id,
        entityType:
          "CONTACT",
        entityId:
          entities.foreignContact.id,
        attachedByOrganizationUserId:
          fixtures.administratorB
            .membership.id
      }
    });

  const foreignRemoval =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/contacts/${entities.contact.id}/attachments/${foreignAttachment.id}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    foreignRemoval.status ===
      404,
    "foreign EntityAttachments cannot be removed"
  );

  const readCountsBefore =
    await Promise.all([
      prisma.entityAttachment.count({
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
      prisma.workItemActivity.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.requestActivity.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      })
    ]);

  const repeatedWorkReadA =
    await apiRequest(
      baseUrl,
      "GET",
      `/work-items/${fixtures.overdueWorkItem.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const repeatedWorkReadB =
    await apiRequest(
      baseUrl,
      "GET",
      `/work-items/${fixtures.overdueWorkItem.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const repeatedDocumentRead =
    await apiRequest(
      baseUrl,
      "GET",
      `/documents/${entities.activeDocument.id}/attachments`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const readCountsAfter =
    await Promise.all([
      prisma.entityAttachment.count({
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
      prisma.workItemActivity.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      }),
      prisma.requestActivity.count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      })
    ]);

  check(
    repeatedWorkReadA.status ===
      200 &&
    repeatedWorkReadB.status ===
      200 &&
    repeatedDocumentRead.status ===
      200 &&
    JSON.stringify(
      repeatedWorkReadA.json.data
    ) ===
    JSON.stringify(
      repeatedWorkReadB.json.data
    ),
    "repeated identical attachment reads are deterministic"
  );

  check(
    JSON.stringify(
      readCountsBefore
    ) ===
    JSON.stringify(
      readCountsAfter
    ),
    "relationship and attachment reads create no records"
  );

  const workRemovalActivityBefore =
    await prisma.workItemActivity.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        workItemId:
          fixtures.overdueWorkItem.id,
        activityType:
          "ATTACHMENT_REMOVED"
      }
    });

  const requestRemovalActivityBefore =
    await prisma.requestActivity.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        requestId:
          fixtures.assignedRequest.id,
        activityType:
          "ATTACHMENT_REMOVED"
      }
    });

  const workRemoval =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/work-items/${fixtures.overdueWorkItem.id}/attachments/${attachments.workAttachmentId}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const requestRemoval =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/requests/${fixtures.assignedRequest.id}/attachments/${attachments.requestAttachmentId}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const contactRemoval =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/contacts/${entities.contact.id}/attachments/${attachments.contactAttachmentId}`,
      {
        token:
          fixtures.tokens
            .administratorA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  check(
    workRemoval.status ===
      200 &&
    requestRemoval.status ===
      200 &&
    contactRemoval.status ===
      200 &&
    workRemoval.json.data.removed ===
      true &&
    requestRemoval.json.data.removed ===
      true &&
    contactRemoval.json.data.removed ===
      true,
    "authorized attachment removal succeeds across supported modules"
  );

  const workRemovalActivityAfter =
    await prisma.workItemActivity.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        workItemId:
          fixtures.overdueWorkItem.id,
        activityType:
          "ATTACHMENT_REMOVED"
      }
    });

  const requestRemovalActivityAfter =
    await prisma.requestActivity.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        requestId:
          fixtures.assignedRequest.id,
        activityType:
          "ATTACHMENT_REMOVED"
      }
    });

  check(
    workRemovalActivityAfter -
      workRemovalActivityBefore ===
      1 &&
    requestRemovalActivityAfter -
      requestRemovalActivityBefore ===
      1,
    "Work Item and Request attachment removal activities remain compatible"
  );

  const removedAttachments =
    await prisma.entityAttachment.count({
      where: {
        id: {
          in: [
            attachments
              .workAttachmentId,
            attachments
              .requestAttachmentId,
            attachments
              .contactAttachmentId
          ]
        }
      }
    });

  const retainedDocuments =
    await prisma.document.count({
      where: {
        id: {
          in: [
            entities.activeDocument.id,
            entities.secondDocument.id
          ]
        }
      }
    });

  check(
    removedAttachments ===
      0 &&
    retainedDocuments ===
      2,
    "attachment removal does not delete Documents"
  );

  const removalAudits =
    await prisma.auditLog.groupBy({
      by: [
        "entityId"
      ],
      where: {
        organizationId:
          fixtures.organizationA.id,
        action:
          "ENTITY_ATTACHMENT_REMOVED",
        entityId: {
          in: [
            attachments
              .workAttachmentId,
            attachments
              .requestAttachmentId,
            attachments
              .contactAttachmentId
          ]
        }
      },
      _count: {
        _all: true
      }
    });

  check(
    removalAudits.length ===
      3 &&
    removalAudits.every(
      (audit) =>
        audit._count._all ===
          1
    ),
    "attachment removal is audited exactly once"
  );
}

async function testRelationshipCompatibility(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  entities:
    Awaited<
      ReturnType<
        typeof createRelationshipFixtures
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const checks = [
    {
      path:
        `/documents/${entities.activeDocument.id}`,
      message:
        "existing Document endpoint remains compatible"
    },
    {
      path:
        `/contacts/${entities.contact.id}`,
      message:
        "existing Contact endpoint remains compatible"
    },
    {
      path:
        `/work-items/${fixtures.overdueWorkItem.id}`,
      message:
        "existing Work Item endpoint remains compatible"
    },
    {
      path:
        `/requests/${fixtures.assignedRequest.id}`,
      message:
        "existing Request endpoint remains compatible"
    },
    {
      path:
        `/workflow-instances/${entities.workflowInstance.id}`,
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
        "/attention-items",
      message:
        "existing Attention endpoint remains compatible"
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
        "/dashboard/overview",
      message:
        "existing dashboard endpoint remains compatible"
    }
  ];

  for (const item of checks) {
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

  const entities =
    await createRelationshipFixtures(
      runtimeContext
    );

  const identity =
    await testRelationshipSecurityAndIdentity(
      runtimeContext,
      entities
    );

  await testRelationshipScopeAndLifecycle(
    runtimeContext,
    entities,
    identity
  );

  const attachments =
    await testSharedAttachmentCore(
      runtimeContext,
      entities
    );

  await testAttachmentSafetyAndRemoval(
    runtimeContext,
    entities,
    attachments
  );

  await testRelationshipCompatibility(
    runtimeContext,
    entities
  );

  console.log(
    "\nSPRINT 021 RUNTIME ACCEPTANCE: PASS"
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
