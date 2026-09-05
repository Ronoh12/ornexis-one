import {
  getCommandCentre
} from "./commandCentreService.js";

import type {
  CommandCentreActor
} from "./commandCentreScopeService.js";

import {
  composeDailyBriefCapabilities,
  composeDailyBriefChanges,
  composeDailyBriefHeadline,
  composeDailyBriefOverview,
  DAILY_BRIEF_COMPOSITION_VERSION
} from "./dailyBriefCompositionService.js";

import type {
  DailyBriefResult
} from "./dailyBriefTypes.js";

import type {
  HealthScopeType
} from "../../../../packages/database/generated/client/enums.js";

export type DailyBriefInput = {
  scope?: {
    scopeType:
      HealthScopeType;
    scopeId: string;
  };
  asOf?: Date;
  periodStart?: Date;
  focusLimit?: number;
  recommendationLimit?: number;
};

function boundedLimit(
  value: number | undefined,
  fallback: number
) {
  return Math.min(
    Math.max(
      value ?? fallback,
      1
    ),
    25
  );
}

export async function getDailyBrief(
  actor: CommandCentreActor,
  input?: DailyBriefInput
): Promise<DailyBriefResult> {
  const focusLimit =
    boundedLimit(
      input?.focusLimit,
      10
    );

  const recommendationLimit =
    boundedLimit(
      input?.recommendationLimit,
      10
    );

  const command =
    await getCommandCentre(
      actor,
      {
        ...(input?.scope
          ? {
              scope:
                input.scope
            }
          : {}),
        ...(input?.asOf
          ? {
              asOf:
                input.asOf
            }
          : {}),
        ...(input?.periodStart
          ? {
              periodStart:
                input.periodStart
            }
          : {}),
        priorityLimit:
          focusLimit,
        recommendationLimit
      }
    );

  const headline =
    composeDailyBriefHeadline(
      command
    );

  const overview =
    composeDailyBriefOverview(
      command
    );

  const changes =
    composeDailyBriefChanges(
      command
    );

  const capabilities =
    composeDailyBriefCapabilities(
      command
    );

  return {
    generatedAt:
      command.generatedAt,
    reportingPeriod: {
      start:
        command.reportingPeriod
          .start,
      end:
        command.reportingPeriod
          .end
    },
    scope: {
      type:
        command.scope.type,
      id:
        command.scope.id,
      name:
        command.scope.name
    },
    audience:
      command.scope.audience,
    headline,
    overview,
    changes,
    focusToday:
      command.priorityItems,
    capabilities,
    recommendations:
      command.recommendations,
    provenance: {
      compositionVersion:
        DAILY_BRIEF_COMPOSITION_VERSION,
      commandCentreGeneratedAt:
        command.generatedAt,
      reportingTime:
        command.generatedAt,
      reportingPeriod: {
        start:
          command.reportingPeriod
            .start,
        end:
          command.reportingPeriod
            .end
      },
      scope: {
        type:
          command.scope.type,
        id:
          command.scope.id
      },
      audience:
        command.scope.audience,
      sourceStatuses: {
        health:
          command.capabilities
            .health.status,
        attention:
          command.capabilities
            .attention.status,
        work:
          command.capabilities
            .work.status,
        requests:
          command.capabilities
            .requests.status,
        sla:
          command.capabilities
            .sla.status,
        approvals:
          command.capabilities
            .approvals.status
      }
    },
    limits: {
      focusItems:
        focusLimit,
      recommendations:
        recommendationLimit
    }
  };
}
