import type {
  getCommandCentre
} from "./commandCentreService.js";

import type {
  CommandPriorityItem
} from "./commandCentreTypes.js";

import type {
  DailyBriefCapabilitySummary,
  DailyBriefChange,
  DailyBriefHeadline
} from "./dailyBriefTypes.js";

type CommandCentreResult =
  Awaited<
    ReturnType<
      typeof getCommandCentre
    >
  >;

export const DAILY_BRIEF_COMPOSITION_VERSION =
  "sprint-019-v1";

function headlineSource(
  item: CommandPriorityItem
) {
  return {
    capability:
      item.sourceCapability,
    sourceType:
      item.sourceType,
    sourceId:
      item.sourceId
  };
}

export function composeDailyBriefHeadline(
  command:
    CommandCentreResult
): DailyBriefHeadline {
  const critical =
    command.priorityItems.find(
      (item) =>
        item.breached ||
        item.severity ===
          "CRITICAL"
    );

  if (critical) {
    return {
      tone: "CRITICAL",
      text:
        critical.title,
      reason:
        critical.reason,
      source:
        headlineSource(
          critical
        )
    };
  }

  const overdue =
    command.priorityItems.find(
      (item) =>
        item.overdue
    );

  if (overdue) {
    return {
      tone: "ACTION",
      text:
        overdue.title,
      reason:
        overdue.reason,
      source:
        headlineSource(
          overdue
        )
    };
  }

  const blocked =
    command.priorityItems.find(
      (item) =>
        item.blocked
    );

  if (blocked) {
    return {
      tone: "ACTION",
      text:
        blocked.title,
      reason:
        blocked.reason,
      source:
        headlineSource(
          blocked
        )
    };
  }

  const health =
    command.capabilities.health;

  if (
    health.status ===
      "AVAILABLE" &&
    health.data?.movement.direction ===
      "DECLINING"
  ) {
    return {
      tone: "WATCH",
      text:
        `${command.scope.name} Health is declining`,
      reason:
        health.data.movement
          .scoreChange === null
          ? "Comparable Health evidence indicates a decline."
          : `Health changed by ${health.data.movement.scoreChange} points.`,
      source: {
        capability:
          "HEALTH",
        sourceType:
          "HEALTH_SNAPSHOT",
        sourceId:
          health.data.current
            .snapshotId
      }
    };
  }

  const high =
    command.priorityItems.find(
      (item) =>
        item.severity ===
        "HIGH"
    );

  if (high) {
    return {
      tone: "WATCH",
      text:
        high.title,
      reason:
        high.reason,
      source:
        headlineSource(
          high
        )
    };
  }

  if (
    command.priorityItems.length >
    0
  ) {
    const first =
      command.priorityItems[0]!;

    return {
      tone: "ACTION",
      text:
        first.title,
      reason:
        first.reason,
      source:
        headlineSource(
          first
        )
    };
  }

  const available =
    Object.values(
      command.capabilities
    ).some(
      (capability) =>
        capability.status ===
        "AVAILABLE"
    );

  if (available) {
    return {
      tone: "STABLE",
      text:
        `No urgent authorized action for ${command.scope.name}`,
      reason:
        "Available operational intelligence contains no prioritized condition.",
      source: null
    };
  }

  return {
    tone: "NO_DATA",
    text:
      `No authorized Daily Brief evidence for ${command.scope.name}`,
    reason:
      "No source capability returned available operational evidence.",
    source: null
  };
}

export function composeDailyBriefOverview(
  command:
    CommandCentreResult
) {
  const statements:
    string[] = [];

  const health =
    command.capabilities.health;

  if (
    health.status ===
      "AVAILABLE" &&
    health.data
  ) {
    statements.push(
      `Health is ${health.data.current.status} at ${health.data.current.score}/100 with confidence ${health.data.current.confidence}/100.`
    );
  } else if (
    health.status ===
    "NO_DATA"
  ) {
    statements.push(
      "Health evidence is not available."
    );
  }

  const attention =
    command.capabilities.attention;

  if (
    attention.status ===
      "AVAILABLE" &&
    attention.data
  ) {
    statements.push(
      `${attention.data.summary.totalActive} active Attention Item${attention.data.summary.totalActive === 1 ? "" : "s"}, including ${attention.data.summary.critical} critical.`
    );
  }

  const work =
    command.capabilities.work;

  if (
    work.status ===
      "AVAILABLE" &&
    work.data
  ) {
    statements.push(
      `${work.data.totalActive} active Work Item${work.data.totalActive === 1 ? "" : "s"}; ${work.data.overdue} overdue and ${work.data.blocked} blocked.`
    );
  }

  const requests =
    command.capabilities.requests;

  if (
    requests.status ===
      "AVAILABLE" &&
    requests.data
  ) {
    statements.push(
      `${requests.data.totalActive} active Request${requests.data.totalActive === 1 ? "" : "s"}; ${requests.data.unassigned} unassigned.`
    );
  }

  const sla =
    command.capabilities.sla;

  if (
    sla.status ===
      "AVAILABLE" &&
    sla.data
  ) {
    statements.push(
      `${sla.data.breached} breached and ${sla.data.escalated} escalated SLA instance${sla.data.breached + sla.data.escalated === 1 ? "" : "s"}.`
    );
  }

  if (
    statements.length === 0
  ) {
    return `No authorized operational evidence is available for the ${command.scope.audience.toLowerCase()} view of ${command.scope.name}.`;
  }

  const audienceIntroduction =
    command.scope.audience ===
      "EXECUTIVE"
      ? `Organization brief for ${command.scope.name}.`
      : command.scope.audience ===
          "BRANCH"
        ? `Branch brief for ${command.scope.name}.`
        : `Department brief for ${command.scope.name}.`;

  return [
    audienceIntroduction,
    ...statements
  ].join(" ");
}

export function composeDailyBriefChanges(
  command:
    CommandCentreResult
): DailyBriefChange[] {
  const health =
    command.capabilities.health;

  if (
    health.status ===
    "FORBIDDEN"
  ) {
    return [
      {
        capability:
          "HEALTH",
        status:
          "FORBIDDEN",
        summary:
          "Health movement is restricted.",
        currentValue:
          null,
        previousValue:
          null,
        difference:
          null
      }
    ];
  }

  if (
    health.status ===
      "NO_DATA" ||
    !health.data
  ) {
    return [
      {
        capability:
          "HEALTH",
        status:
          "NO_DATA",
        summary:
          "Health movement cannot be calculated because no authorized Health snapshot is available.",
        currentValue:
          null,
        previousValue:
          null,
        difference:
          null
      }
    ];
  }

  const movement =
    health.data.movement;

  if (
    !movement.available
  ) {
    return [
      {
        capability:
          "HEALTH",
        status:
          "UNAVAILABLE",
        summary:
          "Health movement requires a comparable previous snapshot.",
        currentValue:
          movement.currentScore,
        previousValue:
          null,
        difference:
          null
      }
    ];
  }

  return [
    {
      capability:
        "HEALTH",
      status:
        movement.direction,
      summary:
        movement.scoreChange ===
          null
          ? `Health movement is ${movement.direction.toLowerCase()}.`
          : `Health moved from ${movement.previousScore} to ${movement.currentScore}, a change of ${movement.scoreChange} points.`,
      currentValue:
        movement.currentScore,
      previousValue:
        movement.previousScore,
      difference:
        movement.scoreChange
    }
  ];
}

function unavailableSummary(
  capability: string,
  status: string
) {
  if (
    status ===
    "FORBIDDEN"
  ) {
    return `${capability} details are restricted.`;
  }

  if (
    status ===
    "NO_DATA"
  ) {
    return `${capability} evidence is not available.`;
  }

  return `${capability} capability is currently unavailable.`;
}

export function composeDailyBriefCapabilities(
  command:
    CommandCentreResult
): DailyBriefCapabilitySummary[] {
  const {
    health,
    attention,
    work,
    requests,
    sla,
    approvals
  } = command.capabilities;

  return [
    {
      capability:
        "HEALTH",
      status:
        health.status,
      summary:
        health.status ===
          "AVAILABLE" &&
        health.data
          ? `Health is ${health.data.current.status} at ${health.data.current.score}/100.`
          : unavailableSummary(
              "Health",
              health.status
            ),
      metrics:
        health.status ===
          "AVAILABLE" &&
        health.data
          ? {
              score:
                health.data.current.score,
              status:
                health.data.current.status,
              confidence:
                health.data.current.confidence,
              movement:
                health.data.movement.direction,
              scoreChange:
                health.data.movement.scoreChange
            }
          : null
    },
    {
      capability:
        "ATTENTION",
      status:
        attention.status,
      summary:
        attention.status ===
          "AVAILABLE" &&
        attention.data
          ? `${attention.data.summary.totalActive} active Attention Items require consideration.`
          : unavailableSummary(
              "Attention",
              attention.status
            ),
      metrics:
        attention.status ===
          "AVAILABLE" &&
        attention.data
          ? {
              active:
                attention.data.summary.totalActive,
              critical:
                attention.data.summary.critical,
              high:
                attention.data.summary.high,
              overdue:
                attention.data.summary.overdue
            }
          : null
    },
    {
      capability:
        "WORK",
      status:
        work.status,
      summary:
        work.status ===
          "AVAILABLE" &&
        work.data
          ? `${work.data.totalActive} active Work Items are in scope.`
          : unavailableSummary(
              "Work",
              work.status
            ),
      metrics:
        work.status ===
          "AVAILABLE" &&
        work.data
          ? {
              active:
                work.data.totalActive,
              dueToday:
                work.data.dueToday,
              overdue:
                work.data.overdue,
              blocked:
                work.data.blocked,
              unassigned:
                work.data.unassigned
            }
          : null
    },
    {
      capability:
        "REQUESTS",
      status:
        requests.status,
      summary:
        requests.status ===
          "AVAILABLE" &&
        requests.data
          ? `${requests.data.totalActive} active Requests are in scope.`
          : unavailableSummary(
              "Request",
              requests.status
            ),
      metrics:
        requests.status ===
          "AVAILABLE" &&
        requests.data
          ? {
              active:
                requests.data.totalActive,
              unassigned:
                requests.data.unassigned,
              overdue:
                requests.data.overdue,
              dueWithinSevenDays:
                requests.data.dueWithinSevenDays
            }
          : null
    },
    {
      capability:
        "SLA",
      status:
        sla.status,
      summary:
        sla.status ===
          "AVAILABLE" &&
        sla.data
          ? `${sla.data.breached} breached SLA instances are in scope.`
          : unavailableSummary(
              "SLA",
              sla.status
            ),
      metrics:
        sla.status ===
          "AVAILABLE" &&
        sla.data
          ? {
              active:
                sla.data.active,
              warning:
                sla.data.warning,
              breached:
                sla.data.breached,
              escalated:
                sla.data.escalated,
              satisfiedDuringPeriod:
                sla.data.satisfiedDuringPeriod
            }
          : null
    },
    {
      capability:
        "APPROVALS",
      status:
        approvals.status,
      summary:
        unavailableSummary(
          "Approval",
          approvals.status
        ),
      metrics: null
    }
  ];
}
