import {
  Prisma,
  SlaEventType,
  SlaInstanceStatus,
  SlaSourceType
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

type SlaSourceContext = {
  title: string;
  sourceType: SlaSourceType;
};

function sourceKey(
  sourceType: SlaSourceType,
  sourceId: string
) {
  return `${sourceType}:${sourceId}`;
}

async function scopedSourceContext(
  organizationId: string,
  scope: CommandCentreScope
) {
  const scopeFilter =
    structuralScopeFilter(
      scope
    );

  const [
    workItems,
    requests
  ] = await Promise.all([
    prisma.workItem.findMany({
      where: {
        organizationId,
        ...scopeFilter
      },
      select: {
        id: true,
        title: true
      }
    }),
    prisma.request.findMany({
      where: {
        organizationId,
        ...scopeFilter
      },
      select: {
        id: true,
        title: true,
        requestNumber: true
      }
    })
  ]);

  const contexts =
    new Map<
      string,
      SlaSourceContext
    >();

  for (
    const workItem
    of workItems
  ) {
    contexts.set(
      sourceKey(
        SlaSourceType.WORK_ITEM,
        workItem.id
      ),
      {
        title:
          workItem.title,
        sourceType:
          SlaSourceType.WORK_ITEM
      }
    );
  }

  for (
    const request
    of requests
  ) {
    contexts.set(
      sourceKey(
        SlaSourceType.REQUEST,
        request.id
      ),
      {
        title:
          request.requestNumber
            ? `${request.requestNumber}: ${request.title}`
            : request.title,
        sourceType:
          SlaSourceType.REQUEST
      }
    );
  }

  return {
    contexts,
    workItemIds:
      workItems.map(
        (item) =>
          item.id
      ),
    requestIds:
      requests.map(
        (request) =>
          request.id
      )
  };
}

function slaSeverity(
  eventTypes: SlaEventType[],
  status: SlaInstanceStatus
): CommandPriorityItem["severity"] {
  if (
    status ===
      SlaInstanceStatus.BREACHED ||
    eventTypes.includes(
      SlaEventType.BREACHED
    ) ||
    eventTypes.includes(
      SlaEventType.ESCALATED
    )
  ) {
    return "CRITICAL";
  }

  if (
    eventTypes.includes(
      SlaEventType.WARNING
    )
  ) {
    return "HIGH";
  }

  return "MEDIUM";
}

function slaSeverityRank(
  eventTypes: SlaEventType[],
  status: SlaInstanceStatus
) {
  if (
    status ===
      SlaInstanceStatus.BREACHED ||
    eventTypes.includes(
      SlaEventType.BREACHED
    ) ||
    eventTypes.includes(
      SlaEventType.ESCALATED
    )
  ) {
    return 5;
  }

  if (
    eventTypes.includes(
      SlaEventType.WARNING
    )
  ) {
    return 4;
  }

  return 2;
}

function slaReason(
  eventTypes: SlaEventType[],
  status: SlaInstanceStatus
) {
  if (
    eventTypes.includes(
      SlaEventType.ESCALATED
    )
  ) {
    return "SLA has reached an escalation threshold.";
  }

  if (
    status ===
      SlaInstanceStatus.BREACHED ||
    eventTypes.includes(
      SlaEventType.BREACHED
    )
  ) {
    return "SLA target has been breached.";
  }

  if (
    eventTypes.includes(
      SlaEventType.WARNING
    )
  ) {
    return "SLA is approaching its target.";
  }

  return "SLA requires active monitoring.";
}

function slaRecommendation(
  eventTypes: SlaEventType[],
  status: SlaInstanceStatus
) {
  if (
    eventTypes.includes(
      SlaEventType.ESCALATED
    )
  ) {
    return "Escalate accountable ownership and resolve the underlying condition urgently.";
  }

  if (
    status ===
      SlaInstanceStatus.BREACHED ||
    eventTypes.includes(
      SlaEventType.BREACHED
    )
  ) {
    return "Take corrective action and record an accountable recovery plan.";
  }

  return "Review progress and act before the SLA target is breached.";
}

export type CommandCentreSlaSummary = {
  active: number;
  warning: number;
  breached: number;
  escalated: number;
  satisfiedDuringPeriod: number;
  cancelledDuringPeriod: number;
  priorityItems:
    CommandPriorityItem[];
};

export async function loadCommandCentreSla(
  organizationId: string,
  scope: CommandCentreScope,
  permitted: boolean,
  input?: {
    asOf?: Date;
    periodStart?: Date;
    limit?: number;
  }
): Promise<
  CommandCapability<
    CommandCentreSlaSummary
  >
> {
  if (!permitted) {
    return {
      status: "FORBIDDEN",
      reason:
        "SLA details require sla.view permission.",
      data: null
    };
  }

  const asOf =
    input?.asOf ??
    new Date();

  const periodStart =
    input?.periodStart ??
    new Date(
      asOf.getTime() -
      30 * 24 * 60 * 60 * 1000
    );

  const limit =
    Math.min(
      Math.max(
        input?.limit ?? 10,
        1
      ),
      25
    );

  const sources =
    await scopedSourceContext(
      organizationId,
      scope
    );

  const sourceWhere:
    Prisma.SlaInstanceWhereInput = {
    organizationId,
    OR: [
      {
        sourceType:
          SlaSourceType.WORK_ITEM,
        sourceId: {
          in:
            sources.workItemIds
        }
      },
      {
        sourceType:
          SlaSourceType.REQUEST,
        sourceId: {
          in:
            sources.requestIds
        }
      }
    ]
  };

  if (
    sources.workItemIds.length === 0 &&
    sources.requestIds.length === 0
  ) {
    return {
      status: "NO_DATA",
      reason:
        "No SLA-capable sources exist for the authorized scope.",
      data: {
        active: 0,
        warning: 0,
        breached: 0,
        escalated: 0,
        satisfiedDuringPeriod: 0,
        cancelledDuringPeriod: 0,
        priorityItems: []
      }
    };
  }

  const [
    active,
    warning,
    breached,
    escalated,
    satisfiedDuringPeriod,
    cancelledDuringPeriod,
    candidates
  ] = await Promise.all([
    prisma.slaInstance.count({
      where: {
        ...sourceWhere,
        status:
          SlaInstanceStatus.ACTIVE
      }
    }),
    prisma.slaInstance.count({
      where: {
        ...sourceWhere,
        status: {
          in: [
            SlaInstanceStatus.ACTIVE,
            SlaInstanceStatus.BREACHED
          ]
        },
        events: {
          some: {
            eventType:
              SlaEventType.WARNING
          }
        }
      }
    }),
    prisma.slaInstance.count({
      where: {
        ...sourceWhere,
        status:
          SlaInstanceStatus.BREACHED
      }
    }),
    prisma.slaInstance.count({
      where: {
        ...sourceWhere,
        status: {
          in: [
            SlaInstanceStatus.ACTIVE,
            SlaInstanceStatus.BREACHED
          ]
        },
        events: {
          some: {
            eventType:
              SlaEventType.ESCALATED
          }
        }
      }
    }),
    prisma.slaInstance.count({
      where: {
        ...sourceWhere,
        status:
          SlaInstanceStatus.SATISFIED,
        satisfiedAt: {
          gte:
            periodStart,
          lte:
            asOf
        }
      }
    }),
    prisma.slaInstance.count({
      where: {
        ...sourceWhere,
        status:
          SlaInstanceStatus.CANCELLED,
        cancelledAt: {
          gte:
            periodStart,
          lte:
            asOf
        }
      }
    }),
    prisma.slaInstance.findMany({
      where: {
        ...sourceWhere,
        status: {
          in: [
            SlaInstanceStatus.ACTIVE,
            SlaInstanceStatus.BREACHED
          ]
        },
        OR: [
          {
            status:
              SlaInstanceStatus.BREACHED
          },
          {
            events: {
              some: {
                eventType: {
                  in: [
                    SlaEventType.WARNING,
                    SlaEventType.BREACHED,
                    SlaEventType.ESCALATED
                  ]
                }
              }
            }
          }
        ]
      },
      include: {
        events: {
          where: {
            eventType: {
              in: [
                SlaEventType.WARNING,
                SlaEventType.BREACHED,
                SlaEventType.ESCALATED
              ]
            }
          },
          orderBy: {
            occurredAt: "desc"
          }
        }
      },
      orderBy: [
        {
          targetAt: "asc"
        },
        {
          createdAt: "asc"
        },
        {
          id: "asc"
        }
      ],
      take: 100
    })
  ]);

  const priorityItems =
    candidates
      .map(
        (instance) => {
          const eventTypes =
            instance.events.map(
              (event) =>
                event.eventType
            );

          const context =
            sources.contexts.get(
              sourceKey(
                instance.sourceType,
                instance.sourceId
              )
            );

          const sourceTitle =
            context?.title ??
            "Authorized SLA source";

          const reason =
            slaReason(
              eventTypes,
              instance.status
            );

          const latestEvent =
            instance.events[0];

          return {
            sourceCapability:
              "SLA",
            sourceType:
              "SLA_INSTANCE",
            sourceId:
              instance.id,
            title:
              `SLA: ${sourceTitle}`,
            summary:
              reason,
            severity:
              slaSeverity(
                eventTypes,
                instance.status
              ),
            severityRank:
              slaSeverityRank(
                eventTypes,
                instance.status
              ),
            breached:
              instance.status ===
                SlaInstanceStatus.BREACHED ||
              eventTypes.includes(
                SlaEventType.BREACHED
              ),
            overdue:
              instance.targetAt <
              asOf,
            blocked:
              false,
            sourceTimestamp:
              latestEvent?.occurredAt ??
              instance.createdAt,
            dueAt:
              instance.targetAt,
            recommendedAction:
              slaRecommendation(
                eventTypes,
                instance.status
              ),
            reason,
            drillDownAvailable:
              true
          } satisfies
            CommandPriorityItem;
        }
      )
      .sort(
        (left, right) => {
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
            left.breached !==
            right.breached
          ) {
            return left.breached
              ? -1
              : 1;
          }

          const dueDifference =
            (
              left.dueAt?.getTime() ??
              Number.MAX_SAFE_INTEGER
            ) -
            (
              right.dueAt?.getTime() ??
              Number.MAX_SAFE_INTEGER
            );

          if (
            dueDifference !== 0
          ) {
            return dueDifference;
          }

          return left.sourceId
            .localeCompare(
              right.sourceId
            );
        }
      )
      .slice(
        0,
        limit
      );

  const hasData =
    active > 0 ||
    warning > 0 ||
    breached > 0 ||
    escalated > 0 ||
    satisfiedDuringPeriod > 0 ||
    cancelledDuringPeriod > 0;

  return {
    status:
      hasData
        ? "AVAILABLE"
        : "NO_DATA",
    reason:
      hasData
        ? "Authorized scoped SLA summary loaded."
        : "No SLA instances exist for the authorized scope and reporting period.",
    data: {
      active,
      warning,
      breached,
      escalated,
      satisfiedDuringPeriod,
      cancelledDuringPeriod,
      priorityItems
    }
  };
}

export function slaRecommendations(
  sla:
    CommandCapability<
      CommandCentreSlaSummary
    >
): CommandRecommendation[] {
  if (
    sla.status !==
      "AVAILABLE" ||
    !sla.data
  ) {
    return [];
  }

  return sla.data
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
              "SLA",
            sourceType:
              item.sourceType,
            sourceId:
              item.sourceId
          }
        ]
      })
    );
}
