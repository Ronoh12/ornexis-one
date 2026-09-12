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
  HealthScopeType,
  IntegrationClientStatus,
  IntegrationCredentialStatus,
  WebhookAttemptResult,
  WebhookDeliveryStatus,
  WebhookEndpointStatus,
  WebhookSubscriptionStatus
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

import {
  activateIntegrationClient,
  createIntegrationClient,
  createIntegrationCredential,
  replaceIntegrationScopes,
  revokeIntegrationClient,
  revokeIntegrationCredential,
  suspendIntegrationClient
} from "./apps/api/src/services/integrationClientService.js";

import {
  publishIntegrationEvent
} from "./apps/api/src/services/integrationEventService.js";

import {
  processWebhookDeliveries
} from "./apps/api/src/services/webhookDeliveryService.js";

import {
  createWebhookEndpoint,
  disableWebhookEndpoint,
  replaceWebhookSubscriptions,
  rotateWebhookEndpointSecret
} from "./apps/api/src/services/webhookConfigurationService.js";

import {
  createWebhookSignature,
  decryptWebhookSecret,
  hashIntegrationCredential,
  verifyWebhookSignature
} from "./apps/api/src/services/integrationSecurityService.js";

import {
  validateWebhookDestination
} from "./apps/api/src/services/webhookDestinationSecurityService.js";

import type {
  IntegrationActor,
  WebhookTransportRequest
} from "./apps/api/src/services/integrationTypes.js";

process.env.INTEGRATION_SECRET_ENCRYPTION_KEY ??=
  "a4".repeat(
    32
  );

process.env.INTEGRATION_SECRET_KEY_VERSION ??=
  "acceptance-v1";

const runId =
  `s024-${Date.now()}`;

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

    await prisma.webhookDeliveryAttempt.deleteMany({
      where: organizationWhere
    });

    await prisma.webhookDelivery.deleteMany({
      where: organizationWhere
    });

    await prisma.integrationEvent.deleteMany({
      where: organizationWhere
    });

    await prisma.webhookSubscription.deleteMany({
      where: organizationWhere
    });

    await prisma.webhookEndpoint.deleteMany({
      where: organizationWhere
    });

    await prisma.integrationClientPermission.deleteMany({
      where: organizationWhere
    });

    await prisma.integrationCredential.deleteMany({
      where: organizationWhere
    });

    await prisma.integrationClient.deleteMany({
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
          `Sprint 024 ${label} ${runId}`,
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

async function integrationApiRequest(
  baseUrl: string,
  path: string,
  credential?: string
) {
  const response =
    await fetch(
      `${baseUrl}${path}`,
      {
        method:
          "GET",
        headers:
          credential
            ? {
                authorization:
                  `OrnexisIntegration ${credential}`
              }
            : {}
      }
    );

  const responseText =
    await response.text();

  let json:
    Record<string, any> = {};

  try {
    json =
      responseText
        ? JSON.parse(
            responseText
          )
        : {};
  } catch {
    json = {
      text:
        responseText
    };
  }

  return {
    status:
      response.status,
    json,
    text:
      responseText,
    headers:
      Object.fromEntries(
        response.headers.entries()
      )
  };
}

const publicWebhookResolver =
  async () => [
    {
      address:
        "93.184.216.34",
      family:
        4
    }
  ];

async function createBaseFixtures() {
  const allIntegrationPermissions = [
    "relationships.view",
    "relationships.manage",
    "audit_logs.view",
    "audit_logs.export",
    "integrations.view",
    "integrations.manage",
    "integrations.credentials",
    "integrations.webhooks",
    "integrations.deliveries",
    "integrations.publish",
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
      allIntegrationPermissions,
      true
    );

  const scopedViewerRoleA =
    await createRole(
      organizationA.id,
      `Integration Viewer ${runId}`,
      allIntegrationPermissions
    );

  const emptyRoleA =
    await createRole(
      organizationA.id,
      `No Integration ${runId}`,
      []
    );

  const integrationOnlyRoleA =
    await createRole(
      organizationA.id,
      `Integration View Only ${runId}`,
      [
        "integrations.view"
      ]
    );

  const administratorRoleB =
    await createRole(
      organizationB.id,
      "Administrator",
      allIntegrationPermissions,
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
      integrationOnlyRoleA.id,
      "UnassignedA"
    );

  const limitedBranchA =
    await createMember(
      organizationA.id,
      integrationOnlyRoleA.id,
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




async function testIntegrationSecurityAndClients(
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

  const administratorAuth = {
    token:
      fixtures.tokens.administratorA,
    organizationId:
      fixtures.organizationA.id
  };

  const unauthenticated =
    await apiRequest(
      baseUrl,
      "GET",
      "/integrations/clients"
    );

  const missingOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      "/integrations/clients",
      {
        token:
          fixtures.tokens.administratorA
      }
    );

  const foreignOrganization =
    await apiRequest(
      baseUrl,
      "GET",
      "/integrations/clients",
      {
        token:
          fixtures.tokens.administratorA,
        organizationId:
          fixtures.organizationB.id
      }
    );

  const missingPermission =
    await apiRequest(
      baseUrl,
      "GET",
      "/integrations/clients",
      {
        token:
          fixtures.tokens.emptyA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const viewOnlyList =
    await apiRequest(
      baseUrl,
      "GET",
      "/integrations/clients",
      {
        token:
          fixtures.tokens.unassignedA,
        organizationId:
          fixtures.organizationA.id
      }
    );

  const viewOnlyCreate =
    await apiRequest(
      baseUrl,
      "POST",
      "/integrations/clients",
      {
        token:
          fixtures.tokens.unassignedA,
        organizationId:
          fixtures.organizationA.id,
        body: {
          code:
            `DENIED_${runId}`,
          name:
            `Denied ${runId}`
        }
      }
    );

  check(
    unauthenticated.status ===
      401 &&
    missingOrganization.status ===
      400 &&
    foreignOrganization.status ===
      403 &&
    missingPermission.status ===
      403 &&
    viewOnlyList.status ===
      200 &&
    viewOnlyCreate.status ===
      403,
    "integration authentication, organization context and RBAC are enforced"
  );

  const actor:
    IntegrationActor = {
      userId:
        fixtures.administratorA
          .user.id,
      organizationId:
        fixtures.organizationA.id,
      organizationUserId:
        fixtures.administratorA
          .membership.id
    };

  const foreignActor:
    IntegrationActor = {
      userId:
        fixtures.administratorB
          .user.id,
      organizationId:
        fixtures.organizationB.id,
      organizationUserId:
        fixtures.administratorB
          .membership.id
    };

  const securityClient =
    await createIntegrationClient(
      actor,
      {
        code:
          ` security client ${runId} `,
        name:
          `Security Client ${runId}`,
        description:
          "Sprint 024 lifecycle acceptance client.",
        externalSystemId:
          `external-security-${runId}`,
        metadata: {
          environment:
            "acceptance"
        }
      },
      {
        requestId:
          `client-security-${runId}`
      }
    );

  check(
    securityClient.code ===
      `SECURITY_CLIENT_${runId.toUpperCase()}` &&
    securityClient.status ===
      IntegrationClientStatus.ACTIVE &&
    securityClient.organizationId ===
      fixtures.organizationA.id,
    "integration client identity is normalized and tenant-owned"
  );

  let duplicateRejected =
    false;

  try {
    await createIntegrationClient(
      actor,
      {
        code:
          securityClient.code
            .toLowerCase(),
        name:
          `Duplicate ${runId}`
      }
    );
  } catch {
    duplicateRejected =
      true;
  }

  let foreignClientHidden =
    false;

  try {
    await createIntegrationCredential(
      foreignActor,
      securityClient.id,
      {
        name:
          `Foreign credential ${runId}`
      }
    );
  } catch {
    foreignClientHidden =
      true;
  }

  check(
    duplicateRejected &&
    foreignClientHidden,
    "client uniqueness and cross-tenant non-disclosure are enforced"
  );

  const publishPermission =
    await prisma.permission.findUnique({
      where: {
        code:
          "integrations.publish"
      },
      select: {
        id: true,
        integrationAssignable:
          true
      }
    });

  const viewPermission =
    await prisma.permission.findUnique({
      where: {
        code:
          "integrations.view"
      },
      select: {
        id: true,
        integrationAssignable:
          true
      }
    });

  check(
    publishPermission !==
      null &&
    publishPermission
      .integrationAssignable ===
      true &&
    viewPermission !==
      null &&
    viewPermission
      .integrationAssignable ===
      false,
    "only explicitly integration-assignable permissions may become machine scopes"
  );

  let unsafeScopeRejected =
    false;

  try {
    await replaceIntegrationScopes(
      actor,
      securityClient.id,
      {
        permissionIds: [
          viewPermission!.id
        ]
      }
    );
  } catch {
    unsafeScopeRejected =
      true;
  }

  const assignedScopes =
    await replaceIntegrationScopes(
      actor,
      securityClient.id,
      {
        permissionIds: [
          publishPermission!.id
        ]
      },
      {
        requestId:
          `scope-security-${runId}`
      }
    );

  check(
    unsafeScopeRejected &&
    assignedScopes.length ===
      1 &&
    assignedScopes[0]
      ?.permission.code ===
      "integrations.publish",
    "integration scope assignment rejects ordinary human permissions"
  );

  const issuedCredential =
    await createIntegrationCredential(
      actor,
      securityClient.id,
      {
        name:
          `Security Credential ${runId}`,
        expiresAt:
          new Date(
            Date.now() +
            24 * 60 * 60 * 1000
          )
      },
      {
        requestId:
          `credential-security-${runId}`
      }
    );

  const storedCredential =
    await prisma.integrationCredential
      .findUnique({
        where: {
          id:
            issuedCredential.id
        },
        select: {
          credentialHash:
            true,
          prefix:
            true,
          status:
            true
        }
      });

  check(
    issuedCredential.credential
      .startsWith(
        "ornx_"
      ) &&
    storedCredential !==
      null &&
    storedCredential.credentialHash ===
      hashIntegrationCredential(
        issuedCredential.credential
      ) &&
    storedCredential.credentialHash !==
      issuedCredential.credential &&
    storedCredential.prefix ===
      issuedCredential.prefix &&
    JSON.stringify(
      storedCredential
    ).includes(
      issuedCredential.credential
    ) ===
      false,
    "integration credential is disclosed once and persisted only as a hash"
  );

  const malformedCredential =
    await integrationApiRequest(
      baseUrl,
      "/integration-api/me",
      "invalid"
    );

  const authenticatedMachine =
    await integrationApiRequest(
      baseUrl,
      "/integration-api/me",
      issuedCredential.credential
    );

  check(
    malformedCredential.status ===
      401 &&
    authenticatedMachine.status ===
      200 &&
    authenticatedMachine.json
      .data.integrationClientId ===
      securityClient.id &&
    authenticatedMachine.json
      .data.organizationId ===
      fixtures.organizationA.id &&
    authenticatedMachine.json
      .data.scopes.includes(
        "integrations.publish"
      ),
    "dedicated machine authentication resolves tenant, client and explicit scopes"
  );

  await suspendIntegrationClient(
    actor,
    securityClient.id,
    {
      requestId:
        `suspend-${runId}`
    }
  );

  const suspendedMachine =
    await integrationApiRequest(
      baseUrl,
      "/integration-api/me",
      issuedCredential.credential
    );

  await activateIntegrationClient(
    actor,
    securityClient.id,
    {
      requestId:
        `activate-${runId}`
    }
  );

  const reactivatedMachine =
    await integrationApiRequest(
      baseUrl,
      "/integration-api/me",
      issuedCredential.credential
    );

  await revokeIntegrationCredential(
    actor,
    issuedCredential.id,
    {
      requestId:
        `revoke-credential-${runId}`
    }
  );

  const revokedCredentialMachine =
    await integrationApiRequest(
      baseUrl,
      "/integration-api/me",
      issuedCredential.credential
    );

  check(
    suspendedMachine.status ===
      401 &&
    reactivatedMachine.status ===
      200 &&
    revokedCredentialMachine.status ===
      401,
    "client suspension and credential revocation immediately block machine access"
  );

  const coreClient =
    await createIntegrationClient(
      actor,
      {
        code:
          `CORE_${runId}`,
        name:
          `Core Integration ${runId}`,
        description:
          "Active client used for webhook acceptance.",
        externalSystemId:
          `external-core-${runId}`
      },
      {
        requestId:
          `client-core-${runId}`
      }
    );

  await replaceIntegrationScopes(
    actor,
    coreClient.id,
    {
      permissionIds: [
        publishPermission!.id
      ]
    }
  );

  const coreCredential =
    await createIntegrationCredential(
      actor,
      coreClient.id,
      {
        name:
          `Core Credential ${runId}`
      }
    );

  const coreMachine =
    await integrationApiRequest(
      baseUrl,
      "/integration-api/me",
      coreCredential.credential
    );

  check(
    coreMachine.status ===
      200 &&
    coreMachine.json
      .data.clientCode ===
      coreClient.code,
    "active integration client remains available for webhook acceptance"
  );

  const terminalClient =
    await createIntegrationClient(
      actor,
      {
        code:
          `TERMINAL_${runId}`,
        name:
          `Terminal Client ${runId}`
      }
    );

  await replaceIntegrationScopes(
    actor,
    terminalClient.id,
    {
      permissionIds: [
        publishPermission!.id
      ]
    }
  );

  const terminalCredential =
    await createIntegrationCredential(
      actor,
      terminalClient.id,
      {
        name:
          `Terminal Credential ${runId}`
      }
    );

  await revokeIntegrationClient(
    actor,
    terminalClient.id,
    {
      requestId:
        `revoke-client-${runId}`
    }
  );

  const revokedClientMachine =
    await integrationApiRequest(
      baseUrl,
      "/integration-api/me",
      terminalCredential.credential
    );

  const terminalState =
    await prisma.integrationClient
      .findUnique({
        where: {
          id:
            terminalClient.id
        },
        select: {
          status:
            true,
          revokedAt:
            true,
          credentials: {
            select: {
              status:
                true,
              revokedAt:
                true
            }
          }
        }
      });

  check(
    revokedClientMachine.status ===
      401 &&
    terminalState?.status ===
      IntegrationClientStatus.REVOKED &&
    terminalState.revokedAt !==
      null &&
    terminalState.credentials.every(
      (
        credential
      ) =>
        credential.status ===
          IntegrationCredentialStatus.REVOKED &&
        credential.revokedAt !==
          null
    ),
    "client revocation is terminal and revokes its active credentials"
  );

  const securityAuditCount =
    await prisma.auditLog.count({
      where: {
        organizationId:
          fixtures.organizationA.id,
        category:
          AuditEventCategory.INTEGRATION,
        entityType: {
          in: [
            "INTEGRATION_CLIENT",
            "INTEGRATION_CREDENTIAL"
          ]
        }
      }
    });

  check(
    securityAuditCount >
      0,
    "integration client, credential and scope lifecycle is audited"
  );

  return {
    actor,
    administratorAuth,
    coreClient,
    coreCredential,
    publishPermission:
      publishPermission!,
    securityClient
  };
}

async function testWebhookPublicationAndDelivery(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  security:
    Awaited<
      ReturnType<
        typeof testIntegrationSecurityAndClients
      >
    >
) {
  const {
    fixtures
  } = context;

  const {
    actor,
    coreClient
  } = security;

  await validateWebhookDestination(
    "https://hooks.example.com/ornexis",
    publicWebhookResolver
  );

  const unsafeDestinations = [
    "http://hooks.example.com/event",
    "https://localhost/event",
    "https://127.0.0.1/event",
    "https://[::1]/event",
    "https://10.0.0.5/event",
    "https://169.254.169.254/latest/meta-data"
  ];

  for (
    const destination
    of unsafeDestinations
  ) {
    let rejected =
      false;

    try {
      await validateWebhookDestination(
        destination,
        async () => [
          {
            address:
              "10.0.0.5",
            family:
              4
          }
        ]
      );
    } catch {
      rejected =
        true;
    }

    check(
      rejected,
      `unsafe webhook destination is rejected: ${destination}`
    );
  }

  const endpoint =
    await createWebhookEndpoint(
      actor,
      {
        integrationClientId:
          coreClient.id,
        name:
          `Acceptance Webhook ${runId}`,
        url:
          "https://hooks.example.com/ornexis",
        description:
          "Sprint 024 successful delivery endpoint."
      },
      {
        requestId:
          `endpoint-${runId}`,
        correlationId:
          `correlation-${runId}`
      },
      publicWebhookResolver
    );

  const storedEndpoint =
    await prisma.webhookEndpoint
      .findUnique({
        where: {
          id:
            endpoint.id
        }
      });

  check(
    endpoint.status ===
      WebhookEndpointStatus.ACTIVE &&
    endpoint.signingSecret.length >
      20 &&
    storedEndpoint !==
      null &&
    storedEndpoint.encryptedSecret !==
      endpoint.signingSecret &&
    storedEndpoint.secretIv !==
      endpoint.signingSecret &&
    storedEndpoint.secretAuthTag !==
      endpoint.signingSecret &&
    decryptWebhookSecret({
      encryptedSecret:
        storedEndpoint.encryptedSecret,
      secretIv:
        storedEndpoint.secretIv,
      secretAuthTag:
        storedEndpoint.secretAuthTag,
      secretKeyVersion:
        storedEndpoint.secretKeyVersion
    }) ===
      endpoint.signingSecret,
    "webhook signing secret is disclosed once and encrypted at rest"
  );

  const endpointResponseText =
    JSON.stringify(
      endpoint
    );

  check(
    endpointResponseText.includes(
      storedEndpoint.encryptedSecret
    ) ===
      false &&
    endpointResponseText.includes(
      storedEndpoint.secretIv
    ) ===
      false &&
    endpointResponseText.includes(
      storedEndpoint.secretAuthTag
    ) ===
      false,
    "webhook API-safe result excludes encrypted secret internals"
  );

  let unregisteredSubscriptionRejected =
    false;

  try {
    await replaceWebhookSubscriptions(
      actor,
      endpoint.id,
      {
        eventTypes: [
          "unknown.event"
        ]
      }
    );
  } catch {
    unregisteredSubscriptionRejected =
      true;
  }

  const subscriptions =
    await replaceWebhookSubscriptions(
      actor,
      endpoint.id,
      {
        eventTypes: [
          "work_item.created",
          "work_item.created"
        ]
      },
      {
        requestId:
          `subscription-${runId}`
      }
    );

  check(
    unregisteredSubscriptionRejected &&
    subscriptions.filter(
      (
        subscription
      ) =>
        subscription.status ===
          WebhookSubscriptionStatus.ACTIVE
    ).length ===
      1 &&
    subscriptions[0]
      ?.eventType ===
      "work_item.created",
    "webhook subscriptions accept only registered events and deduplicate identity"
  );

  const eventInput = {
    eventType:
      "work_item.created",
    entityType:
      "WORK_ITEM",
    entityId:
      fixtures.overdueWorkItem.id,
    payload: {
      id:
        fixtures.overdueWorkItem.id,
      title:
        fixtures.overdueWorkItem.title,
      status:
        fixtures.overdueWorkItem.status,
      password:
        "must-never-leave",
      nested: {
        apiKey:
          "also-secret",
        safe:
          "visible"
      }
    },
    idempotencyKey:
      `work-item-created-${runId}`
  };

  const concurrentPublication =
    await Promise.all([
      publishIntegrationEvent(
        actor,
        eventInput,
        {
          requestId:
            `publish-a-${runId}`,
          correlationId:
            `publication-${runId}`
        }
      ),
      publishIntegrationEvent(
        actor,
        eventInput,
        {
          requestId:
            `publish-b-${runId}`,
          correlationId:
            `publication-${runId}`
        }
      )
    ]);

  const eventId =
    concurrentPublication[0]
      .event.id;

  const storedEvents =
    await prisma.integrationEvent
      .findMany({
        where: {
          organizationId:
            fixtures.organizationA.id,
          eventType:
            "work_item.created",
          idempotencyKey:
            eventInput.idempotencyKey
        }
      });

  const storedDeliveries =
    await prisma.webhookDelivery
      .findMany({
        where: {
          organizationId:
            fixtures.organizationA.id,
          integrationEventId:
            eventId,
          webhookEndpointId:
            endpoint.id
        }
      });

  const storedPayload =
    storedEvents[0]
      ?.payload as
      Record<string, any>;

  check(
    concurrentPublication.every(
      (
        publication
      ) =>
        publication.event.id ===
          eventId
    ) &&
    concurrentPublication.some(
      (
        publication
      ) =>
        publication.idempotent ===
          true
    ) &&
    storedEvents.length ===
      1 &&
    storedDeliveries.length ===
      1 &&
    storedPayload.password ===
      auditRedactionMarker &&
    storedPayload.nested.apiKey ===
      auditRedactionMarker &&
    storedPayload.nested.safe ===
      "visible",
    "concurrent idempotent publication creates one redacted event and one delivery"
  );

  let idempotencyConflictRejected =
    false;

  try {
    await publishIntegrationEvent(
      actor,
      {
        ...eventInput,
        payload: {
          changed:
            true
        }
      }
    );
  } catch {
    idempotencyConflictRejected =
      true;
  }

  let mismatchedEntityRejected =
    false;

  try {
    await publishIntegrationEvent(
      actor,
      {
        eventType:
          "work_item.created",
        entityType:
          "CONTACT",
        entityId:
          fixtures.overdueWorkItem.id,
        payload: {
          invalid:
            true
        }
      }
    );
  } catch {
    mismatchedEntityRejected =
      true;
  }

  check(
    idempotencyConflictRejected &&
    mismatchedEntityRejected,
    "event identity conflicts and registered entity mismatches are rejected"
  );

  const capturedRequests:
    WebhookTransportRequest[] = [];

  const successfulTransport =
    async (
      request:
        WebhookTransportRequest
    ) => {
      capturedRequests.push(
        request
      );

      return {
        status:
          202,
        body:
          "accepted"
      };
    };

  const workerNow =
    new Date(
      Date.now() +
      2_000
    );

  const concurrentWorkers =
    await Promise.all([
      processWebhookDeliveries({
        workerId:
          `worker-a-${runId}`,
        batchSize:
          20,
        now:
          workerNow,
        transport:
          successfulTransport
      }),
      processWebhookDeliveries({
        workerId:
          `worker-b-${runId}`,
        batchSize:
          20,
        now:
          workerNow,
        transport:
          successfulTransport
      })
    ]);

  const delivered =
    await prisma.webhookDelivery
      .findUniqueOrThrow({
        where: {
          id:
            storedDeliveries[0]!.id
        },
        include: {
          attempts: {
            orderBy: {
              attemptNumber:
                "asc"
            }
          }
        }
      });

  const captured =
    capturedRequests[0];

  check(
    concurrentWorkers.reduce(
      (
        total,
        worker
      ) =>
        total +
        worker.claimed,
      0
    ) ===
      1 &&
    capturedRequests.length ===
      1 &&
    delivered.status ===
      WebhookDeliveryStatus.DELIVERED &&
    delivered.attemptCount ===
      1 &&
    delivered.attempts.length ===
      1 &&
    delivered.attempts[0]
      ?.result ===
      WebhookAttemptResult.DELIVERED &&
    delivered.attempts[0]
      ?.httpStatus ===
      202 &&
    delivered.leaseOwner ===
      null &&
    delivered.leaseExpiresAt ===
      null,
    "concurrent workers claim once and preserve successful delivery history"
  );

  check(
    captured !==
      undefined &&
    captured.headers[
      "x-ornexis-event-id"
    ] ===
      eventId &&
    captured.headers[
      "x-ornexis-delivery-id"
    ] ===
      delivered.id &&
    captured.headers[
      "x-ornexis-event-type"
    ] ===
      "work_item.created" &&
    verifyWebhookSignature(
      endpoint.signingSecret,
      captured.headers[
        "x-ornexis-timestamp"
      ]!,
      captured.body,
      captured.headers[
        "x-ornexis-signature"
      ]!
    ),
    "webhook request carries verifiable event, delivery, timestamp and HMAC headers"
  );

  const deliveredBody =
    JSON.parse(
      captured!.body
    );

  check(
    deliveredBody.id ===
      eventId &&
    deliveredBody.entity.id ===
      fixtures.overdueWorkItem.id &&
    deliveredBody.payload.password ===
      auditRedactionMarker &&
    deliveredBody.payload.nested.apiKey ===
      auditRedactionMarker &&
    JSON.stringify(
      deliveredBody
    ).includes(
      "must-never-leave"
    ) ===
      false &&
    JSON.stringify(
      deliveredBody
    ).includes(
      "also-secret"
    ) ===
      false,
    "delivered webhook payload exposes only the stored redacted event"
  );

  const deliveryAudit =
    await prisma.auditLog
      .count({
        where: {
          organizationId:
            fixtures.organizationA.id,
          action:
            "WEBHOOK_DELIVERY_SUCCEEDED",
          entityId:
            delivered.id
        }
      });

  check(
    deliveryAudit ===
      1,
    "successful webhook delivery is audited exactly once"
  );

  return {
    endpoint,
    eventId,
    delivered
  };
}

async function testWebhookRetryAndLifecycle(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  security:
    Awaited<
      ReturnType<
        typeof testIntegrationSecurityAndClients
      >
    >,
  successful:
    Awaited<
      ReturnType<
        typeof testWebhookPublicationAndDelivery
      >
    >
) {
  const {
    fixtures
  } = context;

  const {
    actor,
    coreClient
  } = security;

  const originalStoredEndpoint =
    await prisma.webhookEndpoint
      .findUniqueOrThrow({
        where: {
          id:
            successful.endpoint.id
        }
      });

  const rotated =
    await rotateWebhookEndpointSecret(
      actor,
      successful.endpoint.id,
      {
        requestId:
          `rotate-${runId}`
      }
    );

  const rotatedStoredEndpoint =
    await prisma.webhookEndpoint
      .findUniqueOrThrow({
        where: {
          id:
            successful.endpoint.id
        }
      });

  check(
    rotated.signingSecret !==
      successful.endpoint
        .signingSecret &&
    rotatedStoredEndpoint
      .encryptedSecret !==
      originalStoredEndpoint
        .encryptedSecret &&
    decryptWebhookSecret({
      encryptedSecret:
        rotatedStoredEndpoint
          .encryptedSecret,
      secretIv:
        rotatedStoredEndpoint
          .secretIv,
      secretAuthTag:
        rotatedStoredEndpoint
          .secretAuthTag,
      secretKeyVersion:
        rotatedStoredEndpoint
          .secretKeyVersion
    }) ===
      rotated.signingSecret,
    "webhook secret rotation replaces encrypted material and discloses the new secret once"
  );

  await disableWebhookEndpoint(
    actor,
    successful.endpoint.id,
    {
      requestId:
        `disable-success-${runId}`
    }
  );

  const disabledEndpoint =
    await prisma.webhookEndpoint
      .findUniqueOrThrow({
        where: {
          id:
            successful.endpoint.id
        }
      });

  check(
    disabledEndpoint.status ===
      WebhookEndpointStatus.DISABLED &&
    disabledEndpoint.disabledAt !==
      null,
    "webhook endpoint disablement preserves configuration history"
  );

  const retryEndpoint =
    await createWebhookEndpoint(
      actor,
      {
        integrationClientId:
          coreClient.id,
        name:
          `Retry Webhook ${runId}`,
        url:
          "https://retry.example.com/ornexis",
        description:
          "Sprint 024 retry and dead-letter endpoint."
      },
      {
        requestId:
          `retry-endpoint-${runId}`
      },
      publicWebhookResolver
    );

  await replaceWebhookSubscriptions(
    actor,
    retryEndpoint.id,
    {
      eventTypes: [
        "work_item.updated"
      ]
    }
  );

  const retryPublication =
    await publishIntegrationEvent(
      actor,
      {
        eventType:
          "work_item.updated",
        entityType:
          "WORK_ITEM",
        entityId:
          fixtures.blockedWorkItem.id,
        payload: {
          id:
            fixtures.blockedWorkItem.id,
          status:
            fixtures.blockedWorkItem.status,
          authorization:
            "Bearer must-be-redacted"
        },
        idempotencyKey:
          `retry-event-${runId}`
      },
      {
        requestId:
          `retry-publication-${runId}`,
        correlationId:
          `retry-correlation-${runId}`
      }
    );

  const retryDelivery =
    await prisma.webhookDelivery
      .findFirstOrThrow({
        where: {
          organizationId:
            fixtures.organizationA.id,
          integrationEventId:
            retryPublication.event.id,
          webhookEndpointId:
            retryEndpoint.id
        }
      });

  const disabledEndpointDeliveryCount =
    await prisma.webhookDelivery
      .count({
        where: {
          integrationEventId:
            retryPublication.event.id,
          webhookEndpointId:
            successful.endpoint.id
        }
      });

  check(
    disabledEndpointDeliveryCount ===
      0,
    "disabled webhook endpoints receive no new deliveries"
  );

  const failedRequests:
    WebhookTransportRequest[] = [];

  const failingTransport =
    async (
      request:
        WebhookTransportRequest
    ) => {
      failedRequests.push(
        request
      );

      return {
        status:
          503,
        body:
          "provider unavailable"
      };
    };

  for (
    let attempt = 1;
    attempt <= 6;
    attempt += 1
  ) {
    const before =
      await prisma.webhookDelivery
        .findUniqueOrThrow({
          where: {
            id:
              retryDelivery.id
          }
        });

    const processingTime =
      new Date(
        Math.max(
          Date.now(),
          before.nextAttemptAt
            ?.getTime() ??
            Date.now()
        ) +
        1_000
      );

    const workerResult =
      await processWebhookDeliveries({
        workerId:
          `retry-worker-${attempt}-${runId}`,
        batchSize:
          1,
        now:
          processingTime,
        transport:
          failingTransport
      });

    check(
      workerResult.claimed ===
        1 &&
      workerResult.processed ===
        1,
      `retry worker processes attempt ${attempt}`
    );

    const after =
      await prisma.webhookDelivery
        .findUniqueOrThrow({
          where: {
            id:
              retryDelivery.id
          }
        });

    if (
      attempt <
        6
    ) {
      check(
        after.status ===
          WebhookDeliveryStatus.FAILED &&
        after.attemptCount ===
          attempt &&
        after.nextAttemptAt !==
          null &&
        after.terminalAt ===
          null,
        `failed webhook attempt ${attempt} is scheduled for retry`
      );
    } else {
      check(
        after.status ===
          WebhookDeliveryStatus.DEAD_LETTER &&
        after.attemptCount ===
          6 &&
        after.nextAttemptAt ===
          null &&
        after.terminalAt !==
          null &&
        after.leaseOwner ===
          null &&
        after.leaseExpiresAt ===
          null,
        "retry exhaustion moves delivery to terminal dead-letter state"
      );
    }
  }

  const terminalDelivery =
    await prisma.webhookDelivery
      .findUniqueOrThrow({
        where: {
          id:
            retryDelivery.id
        },
        include: {
          attempts: {
            orderBy: {
              attemptNumber:
                "asc"
            }
          }
        }
      });

  check(
    terminalDelivery.attempts.length ===
      6 &&
    terminalDelivery.attempts.every(
      (
        attempt,
        index
      ) =>
        attempt.attemptNumber ===
          index +
            1 &&
        attempt.result ===
          WebhookAttemptResult.HTTP_FAILURE &&
        attempt.httpStatus ===
          503 &&
        attempt.completedAt >=
          attempt.startedAt
    ),
    "delivery attempts are append-oriented, sequential and preserve failure evidence"
  );

  const requestTimestamps =
    failedRequests.map(
      (
        request
      ) =>
        request.headers[
          "x-ornexis-timestamp"
        ]
    );

  const requestSignatures =
    failedRequests.map(
      (
        request
      ) =>
        request.headers[
          "x-ornexis-signature"
        ]
    );

  check(
    failedRequests.length ===
      6 &&
    new Set(
      requestTimestamps
    ).size ===
      6 &&
    new Set(
      requestSignatures
    ).size ===
      6 &&
    failedRequests.every(
      (
        request
      ) =>
        verifyWebhookSignature(
          retryEndpoint.signingSecret,
          request.headers[
            "x-ornexis-timestamp"
          ]!,
          request.body,
          request.headers[
            "x-ornexis-signature"
          ]!
        )
    ),
    "every retry receives a fresh timestamp and independently verifiable signature"
  );

  const failedPayload =
    JSON.parse(
      failedRequests[0]!.body
    );

  check(
    failedPayload.payload
      .authorization ===
      auditRedactionMarker &&
    JSON.stringify(
      failedPayload
    ).includes(
      "must-be-redacted"
    ) ===
      false,
    "retry payloads preserve sensitive-value redaction"
  );

  const beforeTerminalRerun = {
    attemptCount:
      terminalDelivery.attemptCount,
    attemptRecords:
      terminalDelivery
        .attempts.length
  };

  const terminalRerun =
    await processWebhookDeliveries({
      workerId:
        `terminal-rerun-${runId}`,
      batchSize:
        20,
      now:
        new Date(
          Date.now() +
          365 * 24 * 60 * 60 * 1000
        ),
      transport:
        failingTransport
    });

  const afterTerminalRerun =
    await prisma.webhookDelivery
      .findUniqueOrThrow({
        where: {
          id:
            retryDelivery.id
        },
        include: {
          attempts:
            true
        }
      });

  check(
    terminalRerun.claimed ===
      0 &&
    afterTerminalRerun
      .attemptCount ===
      beforeTerminalRerun
        .attemptCount &&
    afterTerminalRerun
      .attempts.length ===
      beforeTerminalRerun
        .attemptRecords,
    "terminal deliveries are not retried or mutated"
  );

  const terminalAudits =
    await prisma.auditLog
      .findMany({
        where: {
          organizationId:
            fixtures.organizationA.id,
          entityId:
            retryDelivery.id,
          category:
            AuditEventCategory.INTEGRATION
        }
      });

  check(
    terminalAudits.length ===
      1 &&
    terminalAudits[0]
      ?.result ===
      AuditEventResult.FAILURE,
    "terminal webhook failure is audited exactly once"
  );

  const historicalSuccess =
    await prisma.webhookDelivery
      .findUniqueOrThrow({
        where: {
          id:
            successful.delivered.id
        },
        include: {
          attempts:
            true
        }
      });

  check(
    historicalSuccess.status ===
      WebhookDeliveryStatus.DELIVERED &&
    historicalSuccess.attempts.length ===
      1,
    "endpoint rotation and disablement preserve historical delivery evidence"
  );

  return {
    retryEndpoint,
    retryPublication,
    terminalDelivery
  };
}

async function testIntegrationObservabilityAndCompatibility(
  context:
    Awaited<
      ReturnType<
        typeof prepareAcceptance
      >
    >,
  security:
    Awaited<
      ReturnType<
        typeof testIntegrationSecurityAndClients
      >
    >,
  successful:
    Awaited<
      ReturnType<
        typeof testWebhookPublicationAndDelivery
      >
    >,
  retry:
    Awaited<
      ReturnType<
        typeof testWebhookRetryAndLifecycle
      >
    >
) {
  const {
    fixtures,
    baseUrl
  } = context;

  const auth =
    security.administratorAuth;

  const eventList =
    await apiRequest(
      baseUrl,
      "GET",
      "/integrations/events?eventType=work_item.created&limit=1",
      auth
    );

  const deliveryList =
    await apiRequest(
      baseUrl,
      "GET",
      `/integrations/deliveries?status=DEAD_LETTER&webhookEndpointId=${
        retry.retryEndpoint.id
      }&limit=10`,
      auth
    );

  const eventDetail =
    await apiRequest(
      baseUrl,
      "GET",
      `/integrations/events/${
        successful.eventId
      }`,
      auth
    );

  const deliveryDetail =
    await apiRequest(
      baseUrl,
      "GET",
      `/integrations/deliveries/${
        retry.terminalDelivery.id
      }`,
      auth
    );

  const attempts =
    await apiRequest(
      baseUrl,
      "GET",
      `/integrations/deliveries/${
        retry.terminalDelivery.id
      }/attempts`,
      auth
    );

  check(
    eventList.status ===
      200 &&
    eventList.json.data.items.length ===
      1 &&
    eventList.json.data.items[0]
      .id ===
      successful.eventId &&
    eventDetail.status ===
      200 &&
    eventDetail.json.data.id ===
      successful.eventId,
    "bounded integration event listing, filtering and retrieval work"
  );

  check(
    deliveryList.status ===
      200 &&
    deliveryList.json.data.items.length ===
      1 &&
    deliveryList.json.data.items[0]
      .id ===
      retry.terminalDelivery.id &&
    deliveryDetail.status ===
      200 &&
    deliveryDetail.json.data.status ===
      WebhookDeliveryStatus.DEAD_LETTER &&
    attempts.status ===
      200 &&
    attempts.json.data.length ===
      6,
    "delivery status filtering, retrieval and ordered attempt history work"
  );

  const invalidQueries = [
    "/integrations/events?unknown=true",
    "/integrations/events?limit=0",
    "/integrations/events?limit=201",
    "/integrations/events?cursor=malformed",
    "/integrations/events?createdFrom=invalid",
    "/integrations/deliveries?status=UNKNOWN",
    "/integrations/deliveries?webhookEndpointId=invalid",
    "/integrations/deliveries?limit=201"
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
      `invalid integration query is rejected: ${path}`
    );
  }

  const foreignEvent =
    await publishIntegrationEvent(
      {
        userId:
          fixtures.administratorB
            .user.id,
        organizationId:
          fixtures.organizationB.id,
        organizationUserId:
          fixtures.administratorB
            .membership.id
      },
      {
        eventType:
          "work_item.created",
        entityType:
          "WORK_ITEM",
        entityId:
          fixtures.organizationB.id,
        payload: {
          tenant:
            "B"
        },
        idempotencyKey:
          `foreign-${runId}`
      }
    );

  const foreignEventFromA =
    await apiRequest(
      baseUrl,
      "GET",
      `/integrations/events/${
        foreignEvent.event.id
      }`,
      auth
    );

  const missingEvent =
    await apiRequest(
      baseUrl,
      "GET",
      "/integrations/events/00000000-0000-4000-8000-000000000000",
      auth
    );

  check(
    foreignEventFromA.status ===
      404 &&
    missingEvent.status ===
      404 &&
    foreignEventFromA.json.message ===
      missingEvent.json.message,
    "foreign and missing integration events are equally non-disclosing"
  );

  const endpointList =
    await apiRequest(
      baseUrl,
      "GET",
      "/integrations/webhook-endpoints?limit=20",
      auth
    );

  const clientList =
    await apiRequest(
      baseUrl,
      "GET",
      "/integrations/clients?limit=20",
      auth
    );

  const operationalJson =
    JSON.stringify({
      endpointList:
        endpointList.json,
      clientList:
        clientList.json,
      eventList:
        eventList.json,
      deliveryList:
        deliveryList.json
    });

  check(
    endpointList.status ===
      200 &&
    clientList.status ===
      200 &&
    operationalJson.includes(
      "encryptedSecret"
    ) ===
      false &&
    operationalJson.includes(
      "secretIv"
    ) ===
      false &&
    operationalJson.includes(
      "secretAuthTag"
    ) ===
      false &&
    operationalJson.includes(
      "credentialHash"
    ) ===
      false &&
    operationalJson.includes(
      security.coreCredential
        .credential
    ) ===
      false,
    "integration operational responses expose no stored secret or credential material"
  );

  const eventsBeforeReads =
    await prisma.integrationEvent.count({
      where: {
        organizationId:
          fixtures.organizationA.id
      }
    });

  const deliveriesBeforeReads =
    await prisma.webhookDelivery.count({
      where: {
        organizationId:
          fixtures.organizationA.id
      }
    });

  const attemptsBeforeReads =
    await prisma.webhookDeliveryAttempt
      .count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      });

  await apiRequest(
    baseUrl,
    "GET",
    "/integrations/events?limit=20",
    auth
  );

  await apiRequest(
    baseUrl,
    "GET",
    "/integrations/deliveries?limit=20",
    auth
  );

  await apiRequest(
    baseUrl,
    "GET",
    `/integrations/deliveries/${
      retry.terminalDelivery.id
    }/attempts`,
    auth
  );

  const eventsAfterReads =
    await prisma.integrationEvent.count({
      where: {
        organizationId:
          fixtures.organizationA.id
      }
    });

  const deliveriesAfterReads =
    await prisma.webhookDelivery.count({
      where: {
        organizationId:
          fixtures.organizationA.id
      }
    });

  const attemptsAfterReads =
    await prisma.webhookDeliveryAttempt
      .count({
        where: {
          organizationId:
            fixtures.organizationA.id
        }
      });

  check(
    eventsBeforeReads ===
      eventsAfterReads &&
    deliveriesBeforeReads ===
      deliveriesAfterReads &&
    attemptsBeforeReads ===
      attemptsAfterReads,
    "integration event and delivery reads create no records"
  );

  const eventUpdate =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/integrations/events/${
        successful.eventId
      }`,
      {
        ...auth,
        body: {
          payload: {
            changed:
              true
          }
        }
      }
    );

  const eventDelete =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/integrations/events/${
        successful.eventId
      }`,
      auth
    );

  const deliveryUpdate =
    await apiRequest(
      baseUrl,
      "PATCH",
      `/integrations/deliveries/${
        retry.terminalDelivery.id
      }`,
      {
        ...auth,
        body: {
          status:
            "PENDING"
        }
      }
    );

  const deliveryDelete =
    await apiRequest(
      baseUrl,
      "DELETE",
      `/integrations/deliveries/${
        retry.terminalDelivery.id
      }`,
      auth
    );

  check(
    eventUpdate.status ===
      404 &&
    eventDelete.status ===
      404 &&
    deliveryUpdate.status ===
      404 &&
    deliveryDelete.status ===
      404,
    "integration history exposes no update or delete API operations"
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
        "/audit-logs?limit=1",
      message:
        "existing comprehensive audit endpoint remains compatible"
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
        auth
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

  const security =
    await testIntegrationSecurityAndClients(
      runtimeContext
    );

  const successful =
    await testWebhookPublicationAndDelivery(
      runtimeContext,
      security
    );

  const retry =
    await testWebhookRetryAndLifecycle(
      runtimeContext,
      security,
      successful
    );

  await testIntegrationObservabilityAndCompatibility(
    runtimeContext,
    security,
    successful,
    retry
  );

  console.log(
    "\nSPRINT 024 RUNTIME ACCEPTANCE: PASS"
  );
}

main()
  .catch(
    (
      error
    ) => {
      console.error(
        error
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      try {
        if (
          runtimeContext
        ) {
          runtimeContext.server
            .closeAllConnections();

          await new Promise<void>(
            (
              resolve
            ) =>
              runtimeContext!
                .server
                .close(
                  () =>
                    resolve()
                )
          );
        }

        await cleanup();

        console.log(
          "PASS: Acceptance fixtures cleaned up."
        );
      } catch (
        error
      ) {
        console.error(
          "FAIL: Acceptance cleanup failed.",
          error
        );

        process.exitCode =
          1;
      } finally {
        await prisma.$disconnect();
      }
    }
  );
