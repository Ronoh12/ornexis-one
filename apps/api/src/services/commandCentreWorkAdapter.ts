import {
  Prisma,
  WorkItemPriority,
  WorkItemStatus
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

const activeStatuses = [
  WorkItemStatus.OPEN,
  WorkItemStatus.IN_PROGRESS,
  WorkItemStatus.BLOCKED
];

const priorityRank: Record<
  WorkItemPriority,
  number
> = {
  [WorkItemPriority.LOW]: 1,
  [WorkItemPriority.NORMAL]: 2,
  [WorkItemPriority.HIGH]: 3,
  [WorkItemPriority.URGENT]: 4,
  [WorkItemPriority.CRITICAL]: 5
};

function severityForPriority(
  priority: WorkItemPriority
): CommandPriorityItem["severity"] {
  if (
    priority ===
      WorkItemPriority.CRITICAL ||
    priority ===
      WorkItemPriority.URGENT
  ) {
    return "CRITICAL";
  }

  if (
    priority ===
    WorkItemPriority.HIGH
  ) {
    return "HIGH";
  }

  if (
    priority ===
    WorkItemPriority.NORMAL
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function startOfUtcDay(
  value: Date
) {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate()
    )
  );
}

function addUtcDays(
  value: Date,
  days: number
) {
  return new Date(
    value.getTime() +
    days * 24 * 60 * 60 * 1000
  );
}

function workReason(
  item: {
    status: WorkItemStatus;
    priority: WorkItemPriority;
    dueAt: Date | null;
  },
  asOf: Date
) {
  if (
    item.dueAt &&
    item.dueAt < asOf
  ) {
    return "Work Item is overdue.";
  }

  if (
    item.status ===
    WorkItemStatus.BLOCKED
  ) {
    return "Work Item is blocked.";
  }

  if (
    item.priority ===
      WorkItemPriority.CRITICAL ||
    item.priority ===
      WorkItemPriority.URGENT
  ) {
    return "Work Item has urgent operational priority.";
  }

  if (
    item.priority ===
    WorkItemPriority.HIGH
  ) {
    return "Work Item has high operational priority.";
  }

  return "Work Item requires active follow-up.";
}

function workRecommendation(
  item: {
    status: WorkItemStatus;
    dueAt: Date | null;
    ownerOrganizationUserId:
      string | null;
    assigneeOrganizationUserId:
      string | null;
  },
  asOf: Date
) {
  if (
    !item.ownerOrganizationUserId &&
    !item.assigneeOrganizationUserId
  ) {
    return "Assign an owner or responsible assignee.";
  }

  if (
    item.status ===
    WorkItemStatus.BLOCKED
  ) {
    return "Remove the blocking condition or agree an escalation path.";
  }

  if (
    item.dueAt &&
    item.dueAt < asOf
  ) {
    return "Confirm recovery ownership and agree a revised completion plan.";
  }

  return "Review progress and confirm the next accountable action.";
}

export type CommandCentreWorkSummary = {
  totalActive: number;
  open: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  dueToday: number;
  dueWithinSevenDays: number;
  unassigned: number;
  highPriority: number;
  criticalPriority: number;
  priorityItems:
    CommandPriorityItem[];
};

export async function loadCommandCentreWork(
  organizationId: string,
  scope: CommandCentreScope,
  permitted: boolean,
  input?: {
    asOf?: Date;
    limit?: number;
  }
): Promise<
  CommandCapability<
    CommandCentreWorkSummary
  >
> {
  if (!permitted) {
    return {
      status: "FORBIDDEN",
      reason:
        "Work details require work_items.view permission.",
      data: null
    };
  }

  const asOf =
    input?.asOf ??
    new Date();

  const limit =
    Math.min(
      Math.max(
        input?.limit ?? 10,
        1
      ),
      25
    );

  const scopeFilter =
    structuralScopeFilter(
      scope
    );

  const baseWhere:
    Prisma.WorkItemWhereInput = {
    organizationId,
    ...scopeFilter,
    status: {
      in: activeStatuses
    }
  };

  const todayStart =
    startOfUtcDay(
      asOf
    );

  const tomorrowStart =
    addUtcDays(
      todayStart,
      1
    );

  const sevenDaysFromNow =
    addUtcDays(
      asOf,
      7
    );

  const [
    totalActive,
    open,
    inProgress,
    blocked,
    overdue,
    dueToday,
    dueWithinSevenDays,
    unassigned,
    highPriority,
    criticalPriority,
    candidates
  ] = await Promise.all([
    prisma.workItem.count({
      where: baseWhere
    }),
    prisma.workItem.count({
      where: {
        ...baseWhere,
        status:
          WorkItemStatus.OPEN
      }
    }),
    prisma.workItem.count({
      where: {
        ...baseWhere,
        status:
          WorkItemStatus.IN_PROGRESS
      }
    }),
    prisma.workItem.count({
      where: {
        ...baseWhere,
        status:
          WorkItemStatus.BLOCKED
      }
    }),
    prisma.workItem.count({
      where: {
        ...baseWhere,
        dueAt: {
          not: null,
          lt: asOf
        }
      }
    }),
    prisma.workItem.count({
      where: {
        ...baseWhere,
        dueAt: {
          gte: todayStart,
          lt: tomorrowStart
        }
      }
    }),
    prisma.workItem.count({
      where: {
        ...baseWhere,
        dueAt: {
          gte: asOf,
          lte:
            sevenDaysFromNow
        }
      }
    }),
    prisma.workItem.count({
      where: {
        ...baseWhere,
        ownerOrganizationUserId:
          null,
        assigneeOrganizationUserId:
          null
      }
    }),
    prisma.workItem.count({
      where: {
        ...baseWhere,
        priority: {
          in: [
            WorkItemPriority.HIGH,
            WorkItemPriority.URGENT
          ]
        }
      }
    }),
    prisma.workItem.count({
      where: {
        ...baseWhere,
        priority:
          WorkItemPriority.CRITICAL
      }
    }),
    prisma.workItem.findMany({
      where: {
        ...baseWhere,
        OR: [
          {
            status:
              WorkItemStatus.BLOCKED
          },
          {
            dueAt: {
              not: null,
              lt: asOf
            }
          },
          {
            priority: {
              in: [
                WorkItemPriority.HIGH,
                WorkItemPriority.URGENT,
                WorkItemPriority.CRITICAL
              ]
            }
          },
          {
            ownerOrganizationUserId:
              null,
            assigneeOrganizationUserId:
              null
          }
        ]
      },
      orderBy: [
        {
          dueAt: "asc"
        },
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ],
      take: 100,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueAt: true,
        ownerOrganizationUserId:
          true,
        assigneeOrganizationUserId:
          true,
        createdAt: true
      }
    })
  ]);

  if (
    totalActive === 0
  ) {
    return {
      status: "NO_DATA",
      reason:
        "No active Work Items exist for the authorized scope.",
      data: {
        totalActive,
        open,
        inProgress,
        blocked,
        overdue,
        dueToday,
        dueWithinSevenDays,
        unassigned,
        highPriority,
        criticalPriority,
        priorityItems: []
      }
    };
  }

  const priorityItems =
    candidates
      .sort(
        (left, right) => {
          const leftOverdue =
            left.dueAt &&
            left.dueAt < asOf
              ? 1
              : 0;

          const rightOverdue =
            right.dueAt &&
            right.dueAt < asOf
              ? 1
              : 0;

          if (
            leftOverdue !==
            rightOverdue
          ) {
            return (
              rightOverdue -
              leftOverdue
            );
          }

          const leftBlocked =
            left.status ===
              WorkItemStatus.BLOCKED
              ? 1
              : 0;

          const rightBlocked =
            right.status ===
              WorkItemStatus.BLOCKED
              ? 1
              : 0;

          if (
            leftBlocked !==
            rightBlocked
          ) {
            return (
              rightBlocked -
              leftBlocked
            );
          }

          const priorityDifference =
            priorityRank[
              right.priority
            ] -
            priorityRank[
              left.priority
            ];

          if (
            priorityDifference !== 0
          ) {
            return priorityDifference;
          }

          const leftDue =
            left.dueAt?.getTime() ??
            Number.MAX_SAFE_INTEGER;

          const rightDue =
            right.dueAt?.getTime() ??
            Number.MAX_SAFE_INTEGER;

          if (
            leftDue !==
            rightDue
          ) {
            return (
              leftDue -
              rightDue
            );
          }

          return left.id.localeCompare(
            right.id
          );
        }
      )
      .slice(
        0,
        limit
      )
      .map(
        (
          item
        ): CommandPriorityItem => ({
          sourceCapability:
            "WORK",
          sourceType:
            "WORK_ITEM",
          sourceId:
            item.id,
          title:
            item.title,
          summary:
            item.description ??
            workReason(
              item,
              asOf
            ),
          severity:
            severityForPriority(
              item.priority
            ),
          severityRank:
            priorityRank[
              item.priority
            ],
          breached:
            false,
          overdue:
            item.dueAt !== null &&
            item.dueAt < asOf,
          blocked:
            item.status ===
            WorkItemStatus.BLOCKED,
          sourceTimestamp:
            item.createdAt,
          dueAt:
            item.dueAt,
          recommendedAction:
            workRecommendation(
              item,
              asOf
            ),
          reason:
            workReason(
              item,
              asOf
            ),
          drillDownAvailable:
            true
        })
      );

  return {
    status: "AVAILABLE",
    reason:
      "Authorized active Work Item summary loaded.",
    data: {
      totalActive,
      open,
      inProgress,
      blocked,
      overdue,
      dueToday,
      dueWithinSevenDays,
      unassigned,
      highPriority,
      criticalPriority,
      priorityItems
    }
  };
}

export function workRecommendations(
  work:
    CommandCapability<
      CommandCentreWorkSummary
    >
): CommandRecommendation[] {
  if (
    work.status !==
      "AVAILABLE" ||
    !work.data
  ) {
    return [];
  }

  return work.data
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
              "WORK",
            sourceType:
              item.sourceType,
            sourceId:
              item.sourceId
          }
        ]
      })
    );
}
