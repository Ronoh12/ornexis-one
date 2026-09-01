import {
  AttentionItemStatus,
  AttentionSeverity,
  AttentionSignalType,
  AttentionSourceType,
  SlaEventType,
  SlaInstanceStatus,
  SlaSourceType
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  attentionFingerprint,
  reconcileAttentionSignal,
  resolveAttentionItem
} from "./attentionReconciliationService.js";

type SourceContext = {
  title: string;
  responsibleOrganizationUserId:
    string | null;
  branchId: string | null;
  departmentId: string | null;
};

async function getSourceContext(
  organizationId: string,
  sourceType: SlaSourceType,
  sourceId: string
): Promise<SourceContext | null> {
  if (sourceType === SlaSourceType.WORK_ITEM) {
    const item =
      await prisma.workItem.findFirst({
        where: {
          id: sourceId,
          organizationId
        },
        select: {
          title: true,
          assigneeOrganizationUserId: true,
          ownerOrganizationUserId: true,
          branchId: true,
          departmentId: true
        }
      });

    if (!item) {
      return null;
    }

    return {
      title: item.title,
      responsibleOrganizationUserId:
        item.assigneeOrganizationUserId ??
        item.ownerOrganizationUserId,
      branchId: item.branchId,
      departmentId: item.departmentId
    };
  }

  const request =
    await prisma.request.findFirst({
      where: {
        id: sourceId,
        organizationId
      },
      select: {
        title: true,
        assignedToOrganizationUserId: true,
        branchId: true,
        departmentId: true
      }
    });

  if (!request) {
    return null;
  }

  return {
    title: request.title,
    responsibleOrganizationUserId:
      request.assignedToOrganizationUserId,
    branchId: request.branchId,
    departmentId: request.departmentId
  };
}

function signalForEvent(
  eventType: SlaEventType
) {
  if (eventType === SlaEventType.WARNING) {
    return {
      signalType:
        AttentionSignalType.SLA_WARNING,
      severity:
        AttentionSeverity.HIGH,
      titlePrefix:
        "SLA warning",
      summary:
        "is approaching its SLA target.",
      recommendedAction:
        "Review progress and act before the SLA target is breached."
    };
  }

  if (eventType === SlaEventType.BREACHED) {
    return {
      signalType:
        AttentionSignalType.SLA_BREACHED,
      severity:
        AttentionSeverity.CRITICAL,
      titlePrefix:
        "SLA breached",
      summary:
        "has breached its SLA target.",
      recommendedAction:
        "Take immediate corrective action and record the recovery plan."
    };
  }

  return {
    signalType:
      AttentionSignalType.SLA_ESCALATED,
    severity:
      AttentionSeverity.CRITICAL,
    titlePrefix:
      "SLA escalated",
    summary:
      "has reached its escalation threshold.",
    recommendedAction:
      "Escalate ownership and resolve the underlying work urgently."
  };
}

const slaSignals = [
  AttentionSignalType.SLA_WARNING,
  AttentionSignalType.SLA_BREACHED,
  AttentionSignalType.SLA_ESCALATED
];

export async function evaluateSlaAttention(
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

  const events =
    await prisma.slaEvent.findMany({
      where: {
        organizationId,
        eventType: {
          in: [
            SlaEventType.WARNING,
            SlaEventType.BREACHED,
            SlaEventType.ESCALATED
          ]
        },
        slaInstance: {
          status: {
            in: [
              SlaInstanceStatus.ACTIVE,
              SlaInstanceStatus.BREACHED
            ]
          }
        }
      },
      include: {
        slaInstance: true
      },
      orderBy: {
        occurredAt: "asc"
      },
      take: limit
    });

  for (const event of events) {
    result.scanned += 1;

    try {
      const context =
        await getSourceContext(
          organizationId,
          event.slaInstance.sourceType,
          event.slaInstance.sourceId
        );

      if (!context) {
        result.failed += 1;
        continue;
      }

      const definition =
        signalForEvent(event.eventType);

      const outcome =
        await reconcileAttentionSignal({
          organizationId,
          signalType:
            definition.signalType,
          sourceType:
            AttentionSourceType.SLA_INSTANCE,
          sourceId:
            event.slaInstance.id,
          title:
            `${definition.titlePrefix}: ${context.title}`,
          summary:
            `"${context.title}" ${definition.summary}`,
          recommendedAction:
            definition.recommendedAction,
          severity:
            definition.severity,
          responsibleOrganizationUserId:
            context.responsibleOrganizationUserId,
          branchId:
            context.branchId,
          departmentId:
            context.departmentId,
          dueAt:
            event.slaInstance.targetAt,
          detectedAt:
            event.occurredAt,
          fingerprint:
            attentionFingerprint(
              definition.signalType,
              AttentionSourceType.SLA_INSTANCE,
              event.slaInstance.id,
              event.id
            ),
          metadata: {
            slaEventId:
              event.id,
            slaEventType:
              event.eventType,
            slaInstanceStatus:
              event.slaInstance.status,
            targetAt:
              event.slaInstance.targetAt.toISOString()
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
        signalType: {
          in: slaSignals
        },
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
      const instance =
        await prisma.slaInstance.findFirst({
          where: {
            id: attentionItem.sourceId,
            organizationId
          },
          select: {
            status: true
          }
        });

      const terminal =
        !instance ||
        instance.status ===
          SlaInstanceStatus.SATISFIED ||
        instance.status ===
          SlaInstanceStatus.CANCELLED;

      if (terminal) {
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
