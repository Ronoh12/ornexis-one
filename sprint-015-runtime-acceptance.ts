import "dotenv/config";
import bcrypt from "bcryptjs";
import app from "./apps/api/src/app.js";
import { prisma } from "./packages/database/index.js";
import { createNotification } from "./apps/api/src/services/notificationService.js";

type JsonRecord = Record<string, any>;

const runId = `s015-${Date.now()}`;
const organizationIds: string[] = [];
const userIds: string[] = [];
const roleIds: string[] = [];
let server: ReturnType<typeof app.listen> | undefined;
let baseUrl = "";

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

async function request(
  method: string,
  path: string,
  options: { token?: string; organizationId?: string; body?: unknown } = {}
) {
  const headers: Record<string, string> = {};
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.organizationId) headers["x-organization-id"] = options.organizationId;
  if (options.body !== undefined) headers["content-type"] = "application/json";

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
  });
  const text = await response.text();
  let json: JsonRecord = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { text }; }
  return { status: response.status, json };
}

async function login(email: string, password: string) {
  const response = await request("POST", "/auth/login", {
    body: { email, password }
  });
  check(response.status === 200, `authenticated login works for ${email}`);
  const token = response.json?.data?.accessToken;
  check(typeof token === "string" && token.length > 0, "login returns an access token");
  return token as string;
}

async function cleanup() {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  }
  if (organizationIds.length) {
    const orgWhere = { organizationId: { in: organizationIds } };
    await prisma.notification.deleteMany({ where: orgWhere });
    await prisma.slaEvent.deleteMany({ where: orgWhere });
    await prisma.slaInstance.deleteMany({ where: orgWhere });
    await prisma.slaTarget.deleteMany({ where: orgWhere });
    await prisma.slaPolicy.deleteMany({ where: orgWhere });
    await prisma.workItemActivity.deleteMany({ where: orgWhere });
    await prisma.workItemComment.deleteMany({ where: orgWhere });
    await prisma.workItem.deleteMany({ where: orgWhere });
    await prisma.auditLog.deleteMany({ where: orgWhere });
    await prisma.organizationUser.deleteMany({ where: orgWhere });
  }
  if (roleIds.length) {
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: roleIds } } });
    await prisma.role.deleteMany({ where: { id: { in: roleIds } } });
  }
  if (userIds.length) {
    await prisma.refreshSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.invitationToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
  if (organizationIds.length) {
    await prisma.organization.deleteMany({ where: { id: { in: organizationIds } } });
  }
}

async function createOrganization(label: string) {
  const org = await prisma.organization.create({
    data: {
      name: `Sprint 015 ${label} ${runId}`,
      slug: `${runId}-${label.toLowerCase()}`,
      organizationType: "ACCEPTANCE_TEST",
      country: "DE",
      currency: "EUR",
      timezone: "UTC",
      status: "ACTIVE"
    }
  });
  organizationIds.push(org.id);
  return org;
}

async function createRole(organizationId: string, name: string, codes: string[]) {
  const role = await prisma.role.create({
    data: { organizationId, name: `${name} ${runId}`, isSystemRole: false }
  });
  roleIds.push(role.id);
  const permissions = await prisma.permission.findMany({ where: { code: { in: codes } } });
  check(permissions.length === codes.length, `${name} permissions are available`);
  if (permissions.length) {
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id }))
    });
  }
  return role;
}

async function createMember(
  organizationId: string,
  roleId: string,
  label: string,
  passwordHash: string
) {
  const user = await prisma.user.create({
    data: {
      firstName: "Sprint015",
      lastName: label,
      email: `${runId}-${label.toLowerCase()}@acceptance.invalid`,
      passwordHash,
      status: "ACTIVE"
    }
  });
  userIds.push(user.id);
  const membership = await prisma.organizationUser.create({
    data: {
      organizationId,
      userId: user.id,
      roleId,
      status: "ACTIVE",
      joinedAt: new Date()
    }
  });
  return { user, membership };
}

async function createWorkItem(
  organizationId: string,
  membershipId: string,
  label: string
) {
  return prisma.workItem.create({
    data: {
      organizationId,
      createdByOrganizationUserId: membershipId,
      assigneeOrganizationUserId: membershipId,
      title: `Sprint 015 ${label} ${runId}`,
      status: "OPEN",
      priority: "HIGH"
    }
  });
}

async function main() {
  const password = `S015-${runId}!`;
  const passwordHash = await bcrypt.hash(password, 4);

  const orgA = await createOrganization("A");
  const orgB = await createOrganization("B");
  const adminCodes = ["sla.view", "sla.manage", "sla.evaluate"];
  const adminRoleA = await createRole(orgA.id, "Admin A", adminCodes);
  const viewerRoleA = await createRole(orgA.id, "Viewer A", ["sla.view"]);
  const emptyRoleA = await createRole(orgA.id, "No SLA A", []);
  const adminRoleB = await createRole(orgB.id, "Admin B", adminCodes);

  const adminA = await createMember(orgA.id, adminRoleA.id, "AdminA", passwordHash);
  const viewerA = await createMember(orgA.id, viewerRoleA.id, "ViewerA", passwordHash);
  const emptyA = await createMember(orgA.id, emptyRoleA.id, "EmptyA", passwordHash);
  const adminB = await createMember(orgB.id, adminRoleB.id, "AdminB", passwordHash);

  const activeItem = await createWorkItem(orgA.id, adminA.membership.id, "Active");
  const satisfiedItem = await createWorkItem(orgA.id, adminA.membership.id, "Satisfied");
  const cancelledItem = await createWorkItem(orgA.id, adminA.membership.id, "Cancelled");
  const foreignItem = await createWorkItem(orgB.id, adminB.membership.id, "Foreign");

  server = app.listen(0);
  await new Promise<void>((resolve) => server!.once("listening", resolve));
  const address = server.address();
  check(address !== null && typeof address === "object", "acceptance API server started");
  baseUrl = `http://127.0.0.1:${(address as any).port}`;

  const tokenA = await login(adminA.user.email, password);
  const viewerToken = await login(viewerA.user.email, password);
  const emptyToken = await login(emptyA.user.email, password);
  const tokenB = await login(adminB.user.email, password);

  check((await request("GET", "/sla/policies")).status === 401, "unauthenticated SLA access is rejected");
  check((await request("GET", "/sla/policies", { token: tokenA })).status === 400, "organization header is required");
  check((await request("GET", "/sla/policies", { token: tokenA, organizationId: orgB.id })).status === 403, "foreign organization membership is rejected");
  check((await request("GET", "/sla/policies", { token: emptyToken, organizationId: orgA.id })).status === 403, "sla.view permission is enforced");
  check((await request("GET", "/sla/policies", { token: viewerToken, organizationId: orgA.id })).status === 200, "sla.view permits policy listing");
  check((await request("POST", "/sla/policies", {
    token: viewerToken, organizationId: orgA.id,
    body: { name: "Denied", code: `DENIED-${runId}` }
  })).status === 403, "sla.manage permission is enforced");

  const policyResponse = await request("POST", "/sla/policies", {
    token: tokenA,
    organizationId: orgA.id,
    body: { name: `Runtime policy ${runId}`, code: `RUNTIME-${runId}` }
  });
  check(policyResponse.status === 201, "administrator creates an SLA policy through the API");
  const policy = policyResponse.json.data;

  const targetResponse = await request("POST", `/sla/policies/${policy.id}/targets`, {
    token: tokenA,
    organizationId: orgA.id,
    body: {
      name: "One-minute completion",
      targetType: "COMPLETION",
      durationMinutes: 1,
      warningMinutesBefore: 1,
      escalationMinutesAfter: 1,
      notifyOnWarning: true,
      notifyOnBreach: true,
      notifyOnEscalation: true
    }
  });
  check(targetResponse.status === 201, "administrator creates an SLA target through the API");
  const target = targetResponse.json.data;

  check((await request("GET", `/sla/policies/${policy.id}`, {
    token: tokenB, organizationId: orgB.id
  })).status === 404, "foreign tenant cannot read another tenant policy");

  const foreignSource = await request("POST", "/sla/instances", {
    token: tokenA,
    organizationId: orgA.id,
    body: {
      slaPolicyId: policy.id,
      slaTargetId: target.id,
      sourceType: "WORK_ITEM",
      sourceId: foreignItem.id
    }
  });
  check(foreignSource.status === 404, "cross-tenant SLA source attachment is rejected");

  const startedAt = new Date(Date.now() - 3 * 60_000);
  const instanceResponse = await request("POST", "/sla/instances", {
    token: tokenA,
    organizationId: orgA.id,
    body: {
      slaPolicyId: policy.id,
      slaTargetId: target.id,
      sourceType: "WORK_ITEM",
      sourceId: activeItem.id,
      startedAt: startedAt.toISOString()
    }
  });
  check(instanceResponse.status === 201, "authenticated API creates an SLA instance");
  const instance = instanceResponse.json.data;
  check(new Date(instance.targetAt).getTime() - new Date(instance.startedAt).getTime() === 60_000,
    "targetAt is deterministic from durationMinutes");

  check((await request("GET", `/sla/instances/${instance.id}`, {
    token: tokenB, organizationId: orgB.id
  })).status === 404, "foreign tenant cannot read another tenant instance");

  check((await request("POST", "/sla/evaluate", {
    token: viewerToken, organizationId: orgA.id, body: {}
  })).status === 403, "sla.evaluate permission is enforced");

  const firstEvaluation = await request("POST", "/sla/evaluate", {
    token: tokenA, organizationId: orgA.id, body: { limit: 100 }
  });
  check(firstEvaluation.status === 200, "protected evaluator endpoint executes");
  check(firstEvaluation.json.data.warned === 1, "warning is produced once");
  check(firstEvaluation.json.data.breached === 1, "breach is produced once");
  check(firstEvaluation.json.data.escalated === 1, "escalation is produced once");

  const secondEvaluation = await request("POST", "/sla/evaluate", {
    token: tokenA, organizationId: orgA.id, body: { limit: 100 }
  });
  check(secondEvaluation.status === 200, "repeated evaluator execution succeeds");
  check(secondEvaluation.json.data.warned === 0 &&
        secondEvaluation.json.data.breached === 0 &&
        secondEvaluation.json.data.escalated === 0,
    "repeated evaluation is idempotent");

  const eventCounts = await prisma.slaEvent.groupBy({
    by: ["eventType"], where: { organizationId: orgA.id, slaInstanceId: instance.id },
    _count: { _all: true }
  });
  const counts = Object.fromEntries(eventCounts.map((row) => [row.eventType, row._count._all]));
  check(counts.STARTED === 1 && counts.WARNING === 1 && counts.BREACHED === 1 && counts.ESCALATED === 1,
    "durable SLA lifecycle contains exactly one event of each expected type");

  const notificationCounts = await prisma.notification.groupBy({
    by: ["type"], where: { organizationId: orgA.id, sourceId: activeItem.id },
    _count: { _all: true }
  });
  const notices = Object.fromEntries(notificationCounts.map((row) => [row.type, row._count._all]));
  check(notices.SLA_WARNING === 1 && notices.SLA_BREACHED === 1 && notices.SLA_ESCALATED === 1,
    "Sprint 014 notification infrastructure records warning, breach and escalation once");

  const makeInstance = async (sourceId: string) => {
    const response = await request("POST", "/sla/instances", {
      token: tokenA, organizationId: orgA.id,
      body: { slaPolicyId: policy.id, slaTargetId: target.id, sourceType: "WORK_ITEM", sourceId }
    });
    check(response.status === 201, `SLA instance created for source ${sourceId}`);
    return response.json.data;
  };

  const satisfiedInstance = await makeInstance(satisfiedItem.id);
  await prisma.workItem.update({
    where: { id: satisfiedItem.id },
    data: { status: "COMPLETED", completedAt: new Date(), completedByOrganizationUserId: adminA.membership.id }
  });
  await request("POST", "/sla/evaluate", { token: tokenA, organizationId: orgA.id, body: {} });
  const satisfiedRecord = await prisma.slaInstance.findUnique({ where: { id: satisfiedInstance.id } });
  check(satisfiedRecord?.status === "SATISFIED" && satisfiedRecord.satisfiedAt !== null,
    "completed source satisfies its active SLA");

  const cancelledInstance = await makeInstance(cancelledItem.id);
  await prisma.workItem.update({
    where: { id: cancelledItem.id },
    data: { status: "CANCELLED", cancelledAt: new Date() }
  });
  await request("POST", "/sla/evaluate", { token: tokenA, organizationId: orgA.id, body: {} });
  const cancelledRecord = await prisma.slaInstance.findUnique({ where: { id: cancelledInstance.id } });
  check(cancelledRecord?.status === "CANCELLED" && cancelledRecord.cancelledAt !== null,
    "cancelled source cancels its active SLA");
  const terminalEventsBefore = await prisma.slaEvent.count({
    where: { organizationId: orgA.id, slaInstanceId: cancelledInstance.id }
  });
  await request("POST", "/sla/evaluate", { token: tokenA, organizationId: orgA.id, body: {} });
  const terminalEventsAfter = await prisma.slaEvent.count({
    where: { organizationId: orgA.id, slaInstanceId: cancelledInstance.id }
  });
  check(terminalEventsAfter === terminalEventsBefore, "terminal SLA instances are not reprocessed");

  let foreignRecipientRejected = false;
  try {
    await createNotification({
      organizationId: orgA.id,
      recipientOrganizationUserId: adminB.membership.id,
      type: "SLA_ACCEPTANCE_FOREIGN",
      title: "Must fail",
      message: "Cross-tenant recipient test"
    });
  } catch {
    foreignRecipientRejected = true;
  }
  check(foreignRecipientRejected, "foreign notification recipient is rejected");

  console.log("\nSPRINT 015 RUNTIME ACCEPTANCE: PASS");
}

main()
  .catch((error) => {
    console.error("\nSPRINT 015 RUNTIME ACCEPTANCE: FAIL");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
      console.log("PASS: Acceptance fixtures cleaned up.");
    } catch (error) {
      console.error("FAIL: Acceptance cleanup failed.", error);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  });
