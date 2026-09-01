import {
  AttentionItemStatus,
  AttentionSeverity,
  AttentionSignalType,
  AttentionSourceType,
  WorkItemPriority
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  attentionFingerprint,
  reconcileAttentionSignal,
  resolveAttentionItem
} from "./attentionReconciliationService.js";

function severityForPriority(
  priority: WorkItemPriority
) {
  if (
    priority === WorkItemPriority.URGENT ||
    priority === WorkItemPriority.CRITICAL
  ) {
    return AttentionSeverity.CRITICAL;
  }

  if (priority === WorkItemPriority.HIGH) {
    return AttentionSeverity.HIGH;
  }

  if (priority === WorkItemPriority.LOW) {
    return AttentionSeverity.LOW;
  }

  return AttentionSeverity.MEDIUM;
}

function fingerprintForWorkItem(
  id: string,
  dueAt: Date
) {
  return attentionFingerprint(
    AttentionSignalType.WORK_ITEM_OVERDUE,
    AttentionSourceType.WORK_ITEM,
    id,
    dueAt.toISOString()
  );
}

export async function evaluateWorkItemAttention(
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

  const overdueItems =
    await prisma.workItem.findMany({
      where: {
        organizationId,
        dueAt: {
          lte: now
        },
        status: {
          notIn: [
            "COMPLETED",
            "CANCELLED"
          ]
        }
      },
      orderBy: {
        dueAt: "asc"
      },
      take: limit,
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        dueAt: true,
        branchId: true,
        departmentId: true,
        assigneeOrganizationUserId: true,
        ownerOrganizationUserId: true
      }
    });

  for (const item of overdueItems) {
    result.scanned += 1;

    try {
      if (!item.dueAt) {
        result.unchanged += 1;
        continue;
      }

      const outcome =
        await reconcileAttentionSignal({
          organizationId,
          signalType:
            AttentionSignalType.WORK_ITEM_OVERDUE,
          sourceType:
            AttentionSourceType.WORK_ITEM,
          sourceId:
            item.id,
          title:
            `Overdue work: ${item.title}`,
          summary:
            `"${item.title}" passed its due date and still requires action.`,
          recommendedAction:
            "Review the work item, update responsibility and complete or reschedule it.",
          severity:
            severityForPriority(item.priority),
          responsibleOrganizationUserId:
            item.assigneeOrganizationUserId ??
            item.ownerOrganizationUserId,
          branchId:
            item.branchId,
          departmentId:
            item.departmentId,
          dueAt:
            item.dueAt,
          detectedAt:
            now,
          fingerprint:
            fingerprintForWorkItem(
              item.id,
              item.dueAt
            ),
          metadata: {
            workItemStatus:
              item.status,
            workItemPriority:
              item.priority
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
          AttentionSignalType.WORK_ITEM_OVERDUE,
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
      const source =
        await prisma.workItem.findFirst({
          where: {
            id:
              attentionItem.sourceId,
            organizationId
          },
          select: {
            id: true,
            dueAt: true,
            status: true
          }
        });

      const remainsOverdue =
        source !== null &&
        source.dueAt !== null &&
        source.dueAt <= now &&
        source.status !== "COMPLETED" &&
        source.status !== "CANCELLED" &&
        attentionItem.fingerprint ===
          fingerprintForWorkItem(
            source.id,
            source.dueAt
          );

      if (!remainsOverdue) {
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
