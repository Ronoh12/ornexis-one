import {
  AttentionItemStatus,
  AttentionSeverity,
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  structuralScopeFilter,
  type CommandCentreScope
} from "./commandCentreScopeService.js";

import type {
  CommandCapability,
  CommandPriorityItem,
  CommandRecommendation
} from "./commandCentreTypes.js";

const severityRank = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
} as const;

function activeAttentionWhere(
  organizationId: string,
  scope: CommandCentreScope
): Prisma.AttentionItemWhereInput {
  return {
    organizationId,
    ...structuralScopeFilter(
      scope
    ),
    status: {
      in: [
        AttentionItemStatus.OPEN,
        AttentionItemStatus.ACKNOWLEDGED
      ]
    }
  };
}

function comparePriority(
  left: CommandPriorityItem,
  right: CommandPriorityItem
) {
  if (
    left.severityRank !==
    right.severityRank
  ) {
    return (
      right.severityRank -
      left.severityRank
    );
  }

  if (
    left.overdue !==
    right.overdue
  ) {
    return left.overdue
      ? -1
      : 1;
  }

  const leftDue =
    left.dueAt?.getTime() ??
    Number.POSITIVE_INFINITY;

  const rightDue =
    right.dueAt?.getTime() ??
    Number.POSITIVE_INFINITY;

  if (leftDue !== rightDue) {
    return leftDue - rightDue;
  }

  const timestampDifference =
    left.sourceTimestamp.getTime() -
    right.sourceTimestamp.getTime();

  if (timestampDifference !== 0) {
    return timestampDifference;
  }

  return left.sourceId.localeCompare(
    right.sourceId
  );
}

export async function getCommandCentreAttention(
  organizationId: string,
  scope: CommandCentreScope,
  permitted: boolean,
  asOf: Date,
  priorityLimit: number
): Promise<
  CommandCapability<{
    summary: {
      totalActive: number;
      open: number;
      acknowledged: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      overdue: number;
    };
    priorityItems:
      CommandPriorityItem[];
    explanation: string;
  }>
> {
  if (!permitted) {
    return {
      status: "FORBIDDEN",
      reason:
        "attention.view permission is required for Attention details.",
      data: null
    };
  }

  const where =
    activeAttentionWhere(
      organizationId,
      scope
    );

  const [
    totalActive,
    open,
    acknowledged,
    critical,
    high,
    medium,
    low,
    overdue,
    sourceItems
  ] = await Promise.all([
    prisma.attentionItem.count({
      where
    }),
    prisma.attentionItem.count({
      where: {
        ...where,
        status:
          AttentionItemStatus.OPEN
      }
    }),
    prisma.attentionItem.count({
      where: {
        ...where,
        status:
          AttentionItemStatus.ACKNOWLEDGED
      }
    }),
    prisma.attentionItem.count({
      where: {
        ...where,
        severity:
          AttentionSeverity.CRITICAL
      }
    }),
    prisma.attentionItem.count({
      where: {
        ...where,
        severity:
          AttentionSeverity.HIGH
      }
    }),
    prisma.attentionItem.count({
      where: {
        ...where,
        severity:
          AttentionSeverity.MEDIUM
      }
    }),
    prisma.attentionItem.count({
      where: {
        ...where,
        severity:
          AttentionSeverity.LOW
      }
    }),
    prisma.attentionItem.count({
      where: {
        ...where,
        dueAt: {
          lt: asOf
        }
      }
    }),
    prisma.attentionItem.findMany({
      where,
      orderBy: [
        {
          severity: "desc"
        },
        {
          dueAt: "asc"
        },
        {
          detectedAt: "asc"
        },
        {
          id: "asc"
        }
      ],
      take:
        Math.min(
          200,
          Math.max(
            50,
            priorityLimit * 5
          )
        ),
      select: {
        id: true,
        signalType: true,
        title: true,
        summary: true,
        recommendedAction: true,
        severity: true,
        dueAt: true,
        detectedAt: true
      }
    })
  ]);

  if (totalActive === 0) {
    return {
      status: "NO_DATA",
      reason:
        "No active Attention items exist for this scope.",
      data: null
    };
  }

  const priorityItems =
    sourceItems
      .map(
        (
          item
        ): CommandPriorityItem => ({
          sourceCapability:
            "ATTENTION",
          sourceType:
            item.signalType,
          sourceId:
            item.id,
          title:
            item.title,
          summary:
            item.summary,
          severity:
            item.severity,
          dueAt:
            item.dueAt,
          recommendedAction:
            item.recommendedAction,
          reason:
            item.dueAt &&
            item.dueAt < asOf
              ? "Active Attention item is overdue."
              : `${item.severity} active Attention item.`,
          drillDownAvailable:
            true,
          severityRank:
            severityRank[
              item.severity
            ],
          breached: false,
          overdue:
            Boolean(
              item.dueAt &&
              item.dueAt < asOf
            ),
          blocked: false,
          sourceTimestamp:
            item.detectedAt
        })
      )
      .sort(
        comparePriority
      )
      .slice(
        0,
        priorityLimit
      );

  return {
    status: "AVAILABLE",
    reason:
      "Authorized active Attention items summarized.",
    data: {
      summary: {
        totalActive,
        open,
        acknowledged,
        critical,
        high,
        medium,
        low,
        overdue
      },
      priorityItems,
      explanation:
        "Resolved and dismissed Attention items are excluded."
    }
  };
}

export function attentionRecommendations(
  attention:
    Awaited<
      ReturnType<
        typeof getCommandCentreAttention
      >
    >
): CommandRecommendation[] {
  if (
    attention.status !==
      "AVAILABLE" ||
    !attention.data
  ) {
    return [];
  }

  return attention.data
    .priorityItems
    .filter(
      (item) =>
        item.recommendedAction !==
        null
    )
    .map(
      (item) => ({
        text:
          item.recommendedAction!,
        sources: [
          {
            capability:
              "ATTENTION",
            sourceType:
              item.sourceType,
            sourceId:
              item.sourceId
          }
        ]
      })
    );
}
