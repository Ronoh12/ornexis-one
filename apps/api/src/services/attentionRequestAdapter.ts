import {
  AttentionItemStatus,
  AttentionSeverity,
  AttentionSignalType,
  AttentionSourceType
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  attentionFingerprint,
  reconcileAttentionSignal,
  resolveAttentionItem
} from "./attentionReconciliationService.js";

function requestFingerprint(
  id: string,
  updatedAt: Date
) {
  return attentionFingerprint(
    AttentionSignalType.REQUEST_UNASSIGNED,
    AttentionSourceType.REQUEST,
    id,
    updatedAt.toISOString()
  );
}

export async function evaluateRequestAttention(
  organizationId: string,
  input?: {
    limit?: number;
    now?: Date;
  }
) {
  const now = input?.now ?? new Date();
  const limit = input?.limit ?? 100;

  const result = {
    scanned: 0,
    created: 0,
    updated: 0,
    resolved: 0,
    unchanged: 0,
    failed: 0
  };

  const requests =
    await prisma.request.findMany({
      where: {
        organizationId,
        assignedToOrganizationUserId:
          null,
        status: {
          notIn: [
            "DRAFT",
            "REJECTED",
            "COMPLETED",
            "CANCELLED"
          ]
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      take: limit,
      select: {
        id: true,
        title: true,
        requestNumber: true,
        status: true,
        priority: true,
        dueAt: true,
        branchId: true,
        departmentId: true,
        updatedAt: true
      }
    });

  for (const request of requests) {
    result.scanned += 1;

    try {
      const overdue =
        request.dueAt !== null &&
        request.dueAt <= now;

      const outcome =
        await reconcileAttentionSignal({
          organizationId,
          signalType:
            AttentionSignalType.REQUEST_UNASSIGNED,
          sourceType:
            AttentionSourceType.REQUEST,
          sourceId:
            request.id,
          title:
            `Unassigned request: ${request.title}`,
          summary:
            overdue
              ? `"${request.title}" is unassigned and overdue.`
              : `"${request.title}" is active but has no assignee.`,
          recommendedAction:
            "Assign an active organization member to review and progress this request.",
          severity:
            overdue
              ? AttentionSeverity.HIGH
              : AttentionSeverity.MEDIUM,
          responsibleOrganizationUserId:
            null,
          branchId:
            request.branchId,
          departmentId:
            request.departmentId,
          dueAt:
            request.dueAt,
          detectedAt:
            now,
          fingerprint:
            requestFingerprint(
              request.id,
              request.updatedAt
            ),
          metadata: {
            requestNumber:
              request.requestNumber,
            requestStatus:
              request.status,
            requestPriority:
              request.priority
          }
        });

      result[outcome] += 1;
    } catch {
      result.failed += 1;
    }
  }

  const existingItems =
    await prisma.attentionItem.findMany({
      where: {
        organizationId,
        signalType:
          AttentionSignalType.REQUEST_UNASSIGNED,
        status: {
          in: [
            AttentionItemStatus.OPEN,
            AttentionItemStatus.ACKNOWLEDGED
          ]
        }
      },
      orderBy: {
        detectedAt: "asc"
      },
      take: limit
    });

  for (const attentionItem of existingItems) {
    try {
      const request =
        await prisma.request.findFirst({
          where: {
            id: attentionItem.sourceId,
            organizationId
          },
          select: {
            status: true,
            assignedToOrganizationUserId:
              true,
            updatedAt: true
          }
        });

      const remainsEligible =
        request !== null &&
        request.assignedToOrganizationUserId ===
          null &&
        ![
          "DRAFT",
          "REJECTED",
          "COMPLETED",
          "CANCELLED"
        ].includes(request.status) &&
        attentionItem.fingerprint ===
          requestFingerprint(
            attentionItem.sourceId,
            request.updatedAt
          );

      if (!remainsEligible) {
        const resolved =
          await resolveAttentionItem(
            organizationId,
            attentionItem.id,
            now
          );

        if (resolved) {
          result.resolved += 1;
        }
      }
    } catch {
      result.failed += 1;
    }
  }

  return result;
}
