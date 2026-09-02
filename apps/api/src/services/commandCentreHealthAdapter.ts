import {
  HealthScopeType,
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import type {
  CommandCentreScope
} from "./commandCentreScopeService.js";

import type {
  CommandCapability,
  CommandRecommendation
} from "./commandCentreTypes.js";

function healthScopeWhere(
  organizationId: string,
  scope: CommandCentreScope
): Prisma.HealthSnapshotWhereInput {
  if (
    scope.scopeType ===
    HealthScopeType.BRANCH
  ) {
    return {
      organizationId,
      scopeType:
        HealthScopeType.BRANCH,
      branchId:
        scope.scopeId
    };
  }

  if (
    scope.scopeType ===
    HealthScopeType.DEPARTMENT
  ) {
    return {
      organizationId,
      scopeType:
        HealthScopeType.DEPARTMENT,
      departmentId:
        scope.scopeId
    };
  }

  return {
    organizationId,
    scopeType:
      HealthScopeType.ORGANIZATION,
    branchId: null,
    departmentId: null
  };
}

export async function getCommandCentreHealth(
  organizationId: string,
  scope: CommandCentreScope,
  permitted: boolean
): Promise<
  CommandCapability<{
    current: {
      snapshotId: string;
      score: number;
      status: string;
      confidence: number;
      evaluatedAt: Date;
      periodStart: Date;
      periodEnd: Date;
      rulesVersion: string;
      summary: string;
      contributions: Array<{
        indicatorCode: string;
        indicatorScore: number;
        weight: string;
        weightedContribution: string;
        confidence: number;
        explanation: string;
        recommendedAction:
          string | null;
      }>;
    };
    movement: {
      available: boolean;
      previousScore: number | null;
      currentScore: number;
      scoreChange: number | null;
      direction:
        | "IMPROVING"
        | "STABLE"
        | "DECLINING"
        | "UNAVAILABLE";
      previousStatus:
        string | null;
      currentStatus: string;
      previousEvaluatedAt:
        Date | null;
      currentEvaluatedAt: Date;
    };
  }>
> {
  if (!permitted) {
    return {
      status: "FORBIDDEN",
      reason:
        "health.view permission is required for Health details.",
      data: null
    };
  }

  const snapshots =
    await prisma.healthSnapshot.findMany({
      where:
        healthScopeWhere(
          organizationId,
          scope
        ),
      orderBy: [
        {
          evaluatedAt: "desc"
        },
        {
          id: "desc"
        }
      ],
      take: 2,
      include: {
        contributions: {
          orderBy: {
            indicatorCode: "asc"
          }
        }
      }
    });

  const current =
    snapshots[0];

  if (!current) {
    return {
      status: "NO_DATA",
      reason:
        "No Health snapshot exists for this scope.",
      data: null
    };
  }

  const previous =
    snapshots[1];

  const scoreChange =
    previous
      ? current.score -
        previous.score
      : null;

  const direction =
    scoreChange === null
      ? "UNAVAILABLE"
      : scoreChange > 0
        ? "IMPROVING"
        : scoreChange < 0
          ? "DECLINING"
          : "STABLE";

  return {
    status: "AVAILABLE",
    reason:
      "Latest authorized Health snapshot and comparable movement loaded.",
    data: {
      current: {
        snapshotId:
          current.id,
        score:
          current.score,
        status:
          current.status,
        confidence:
          current.confidence,
        evaluatedAt:
          current.evaluatedAt,
        periodStart:
          current.periodStart,
        periodEnd:
          current.periodEnd,
        rulesVersion:
          current.rulesVersion,
        summary:
          current.summary,
        contributions:
          current.contributions.map(
            (contribution) => ({
              indicatorCode:
                contribution.indicatorCode,
              indicatorScore:
                contribution.indicatorScore,
              weight:
                contribution.weight.toString(),
              weightedContribution:
                contribution.weightedContribution
                  .toString(),
              confidence:
                contribution.confidence,
              explanation:
                contribution.explanation,
              recommendedAction:
                contribution
                  .recommendedAction
            })
          )
      },
      movement: {
        available:
          Boolean(previous),
        previousScore:
          previous?.score ?? null,
        currentScore:
          current.score,
        scoreChange,
        direction,
        previousStatus:
          previous?.status ?? null,
        currentStatus:
          current.status,
        previousEvaluatedAt:
          previous?.evaluatedAt ??
          null,
        currentEvaluatedAt:
          current.evaluatedAt
      }
    }
  };
}

export function healthRecommendations(
  health:
    Awaited<
      ReturnType<
        typeof getCommandCentreHealth
      >
    >
): CommandRecommendation[] {
  if (
    health.status !==
      "AVAILABLE" ||
    !health.data
  ) {
    return [];
  }

  return health.data.current
    .contributions
    .filter(
      (contribution) =>
        contribution
          .recommendedAction !==
        null
    )
    .map(
      (contribution) => ({
        text:
          contribution
            .recommendedAction!,
        sources: [
          {
            capability:
              "HEALTH",
            sourceType:
              "HEALTH_CONTRIBUTION",
            sourceId:
              contribution.indicatorCode
          }
        ]
      })
    );
}
