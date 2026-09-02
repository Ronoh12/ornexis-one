import {
  Prisma,
  RequestPriority,
  RequestStatus
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
  RequestStatus.SUBMITTED,
  RequestStatus.IN_REVIEW,
  RequestStatus.APPROVED,
  RequestStatus.IN_FULFILMENT
];

const priorityRank: Record<
  RequestPriority,
  number
> = {
  [RequestPriority.LOW]: 1,
  [RequestPriority.NORMAL]: 2,
  [RequestPriority.HIGH]: 3,
  [RequestPriority.URGENT]: 4,
  [RequestPriority.CRITICAL]: 5
};

function severityForPriority(
  priority: RequestPriority
): CommandPriorityItem["severity"] {
  if (
    priority ===
      RequestPriority.CRITICAL ||
    priority ===
      RequestPriority.URGENT
  ) {
    return "CRITICAL";
  }

  if (
    priority ===
    RequestPriority.HIGH
  ) {
    return "HIGH";
  }

  if (
    priority ===
    RequestPriority.NORMAL
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function addDays(
  value: Date,
  days: number
) {
  return new Date(
    value.getTime() +
    days * 24 * 60 * 60 * 1000
  );
}

function requestReason(
  request: {
    dueAt: Date | null;
    priority: RequestPriority;
    assignedToOrganizationUserId:
      string | null;
  },
  asOf: Date
) {
  if (
    request.dueAt &&
    request.dueAt < asOf
  ) {
    return "Request is overdue.";
  }

  if (
    !request
      .assignedToOrganizationUserId
  ) {
    return "Request has no assigned owner.";
  }

  if (
    request.priority ===
      RequestPriority.CRITICAL ||
    request.priority ===
      RequestPriority.URGENT
  ) {
    return "Request has urgent operational priority.";
  }

  if (
    request.priority ===
    RequestPriority.HIGH
  ) {
    return "Request has high operational priority.";
  }

  return "Request requires active follow-up.";
}

function requestRecommendation(
  request: {
    dueAt: Date | null;
    assignedToOrganizationUserId:
      string | null;
  },
  asOf: Date
) {
  if (
    !request
      .assignedToOrganizationUserId
  ) {
    return "Assign a responsible organization member to progress this Request.";
  }

  if (
    request.dueAt &&
    request.dueAt < asOf
  ) {
    return "Review the overdue Request and agree an accountable recovery date.";
  }

  return "Confirm the next action and expected completion date.";
}

export type CommandCentreRequestSummary = {
  totalActive: number;
  submitted: number;
  inReview: number;
  approved: number;
  inFulfilment: number;
  unassigned: number;
  overdue: number;
  dueWithinSevenDays: number;
  highPriority: number;
  criticalPriority: number;
  priorityItems:
    CommandPriorityItem[];
};

export async function loadCommandCentreRequests(
  organizationId: string,
  scope: CommandCentreScope,
  permitted: boolean,
  input?: {
    asOf?: Date;
    limit?: number;
  }
): Promise<
  CommandCapability<
    CommandCentreRequestSummary
  >
> {
  if (!permitted) {
    return {
      status: "FORBIDDEN",
      reason:
        "Request details require requests.view permission.",
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

  const sevenDaysFromNow =
    addDays(
      asOf,
      7
    );

  const scopeFilter =
    structuralScopeFilter(
      scope
    );

  const baseWhere:
    Prisma.RequestWhereInput = {
    organizationId,
    ...scopeFilter,
    status: {
      in: activeStatuses
    }
  };

  const [
    totalActive,
    submitted,
    inReview,
    approved,
    inFulfilment,
    unassigned,
    overdue,
    dueWithinSevenDays,
    highPriority,
    criticalPriority,
    candidates
  ] = await Promise.all([
    prisma.request.count({
      where: baseWhere
    }),
    prisma.request.count({
      where: {
        ...baseWhere,
        status:
          RequestStatus.SUBMITTED
      }
    }),
    prisma.request.count({
      where: {
        ...baseWhere,
        status:
          RequestStatus.IN_REVIEW
      }
    }),
    prisma.request.count({
      where: {
        ...baseWhere,
        status:
          RequestStatus.APPROVED
      }
    }),
    prisma.request.count({
      where: {
        ...baseWhere,
        status:
          RequestStatus.IN_FULFILMENT
      }
    }),
    prisma.request.count({
      where: {
        ...baseWhere,
        assignedToOrganizationUserId:
          null
      }
    }),
    prisma.request.count({
      where: {
        ...baseWhere,
        dueAt: {
          not: null,
          lt: asOf
        }
      }
    }),
    prisma.request.count({
      where: {
        ...baseWhere,
        dueAt: {
          gte: asOf,
          lte:
            sevenDaysFromNow
        }
      }
    }),
    prisma.request.count({
      where: {
        ...baseWhere,
        priority: {
          in: [
            RequestPriority.HIGH,
            RequestPriority.URGENT
          ]
        }
      }
    }),
    prisma.request.count({
      where: {
        ...baseWhere,
        priority:
          RequestPriority.CRITICAL
      }
    }),
    prisma.request.findMany({
      where: {
        ...baseWhere,
        OR: [
          {
            assignedToOrganizationUserId:
              null
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
                RequestPriority.HIGH,
                RequestPriority.URGENT,
                RequestPriority.CRITICAL
              ]
            }
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
        requestNumber: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        dueAt: true,
        assignedToOrganizationUserId:
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
        "No active Requests exist for the authorized scope.",
      data: {
        totalActive,
        submitted,
        inReview,
        approved,
        inFulfilment,
        unassigned,
        overdue,
        dueWithinSevenDays,
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

          const leftUnassigned =
            left
              .assignedToOrganizationUserId
              ? 0
              : 1;

          const rightUnassigned =
            right
              .assignedToOrganizationUserId
              ? 0
              : 1;

          if (
            leftUnassigned !==
            rightUnassigned
          ) {
            return (
              rightUnassigned -
              leftUnassigned
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
          request
        ): CommandPriorityItem => ({
          sourceCapability:
            "REQUESTS",
          sourceType:
            "REQUEST",
          sourceId:
            request.id,
          title:
            request.requestNumber
              ? `${request.requestNumber}: ${request.title}`
              : request.title,
          summary:
            request.description ??
            requestReason(
              request,
              asOf
            ),
          severity:
            severityForPriority(
              request.priority
            ),
          severityRank:
            priorityRank[
              request.priority
            ],
          breached:
            false,
          overdue:
            request.dueAt !== null &&
            request.dueAt < asOf,
          blocked:
            false,
          sourceTimestamp:
            request.createdAt,
          dueAt:
            request.dueAt,
          recommendedAction:
            requestRecommendation(
              request,
              asOf
            ),
          reason:
            requestReason(
              request,
              asOf
            ),
          drillDownAvailable:
            true
        })
      );

  return {
    status: "AVAILABLE",
    reason:
      "Authorized active Request summary loaded.",
    data: {
      totalActive,
      submitted,
      inReview,
      approved,
      inFulfilment,
      unassigned,
      overdue,
      dueWithinSevenDays,
      highPriority,
      criticalPriority,
      priorityItems
    }
  };
}

export function requestRecommendations(
  requests:
    CommandCapability<
      CommandCentreRequestSummary
    >
): CommandRecommendation[] {
  if (
    requests.status !==
      "AVAILABLE" ||
    !requests.data
  ) {
    return [];
  }

  return requests.data
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
              "REQUESTS",
            sourceType:
              item.sourceType,
            sourceId:
              item.sourceId
          }
        ]
      })
    );
}
