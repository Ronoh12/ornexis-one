import { prisma } from "../../../../packages/database/index.js";

export type CreateAuditLogInput = {
  organizationId?: string;
  userId?: string;

  action: string;

  entityType: string;
  entityId?: string;

  oldValues?: unknown;
  newValues?: unknown;

  ipAddress?: string;
  userAgent?: string;
};

export async function createAuditLog(
  data: CreateAuditLogInput
) {
  return prisma.auditLog.create({
    data: {
      action: data.action,
      entityType: data.entityType,

      ...(data.organizationId !== undefined
        ? { organizationId: data.organizationId }
        : {}),

      ...(data.userId !== undefined
        ? { userId: data.userId }
        : {}),

      ...(data.entityId !== undefined
        ? { entityId: data.entityId }
        : {}),

      ...(data.oldValues !== undefined
        ? { oldValues: data.oldValues as object }
        : {}),

      ...(data.newValues !== undefined
        ? { newValues: data.newValues as object }
        : {}),

      ...(data.ipAddress !== undefined
        ? { ipAddress: data.ipAddress }
        : {}),

      ...(data.userAgent !== undefined
        ? { userAgent: data.userAgent }
        : {})
    }
  });
}