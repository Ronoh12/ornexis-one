import { prisma } from "../../../../packages/database/index.js";

export async function getAuditLogsForOrganization(
  organizationId: string
) {
  return prisma.auditLog.findMany({
    where: {
      organizationId
    },
    orderBy: {
      createdAt: "desc"
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
}