import {
  HealthScopeType
} from "../../../../packages/database/generated/client/enums.js";

import {
  loadCommandCentreApprovals
} from "./commandCentreApprovalAdapter.js";

import {
  attentionRecommendations,
  getCommandCentreAttention
} from "./commandCentreAttentionAdapter.js";

import {
  composeCommandCentrePriorities,
  composeCommandCentreRecommendations
} from "./commandCentreCompositionService.js";

import {
  getCommandCentreHealth,
  healthRecommendations
} from "./commandCentreHealthAdapter.js";

import {
  loadCommandCentreRequests,
  requestRecommendations
} from "./commandCentreRequestAdapter.js";

import {
  resolveCommandCentreScope,
  type CommandCentreActor
} from "./commandCentreScopeService.js";

import {
  loadCommandCentreSla,
  slaRecommendations
} from "./commandCentreSlaAdapter.js";

import {
  loadCommandCentreWork,
  workRecommendations
} from "./commandCentreWorkAdapter.js";

export type CommandCentreInput = {
  scope?: {
    scopeType:
      HealthScopeType;
    scopeId: string;
  };
  asOf?: Date;
  periodStart?: Date;
  priorityLimit?: number;
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

export async function getCommandCentre(
  actor: CommandCentreActor,
  input?: CommandCentreInput
) {
  const asOf =
    input?.asOf ??
    new Date();

  const periodStart =
    input?.periodStart ??
    new Date(
      asOf.getTime() -
      30 * 24 * 60 * 60 * 1000
    );

  if (
    periodStart > asOf
  ) {
    throw new Error(
      "Command Centre period start must not be after the reporting time."
    );
  }

  const priorityLimit =
    boundedLimit(
      input?.priorityLimit,
      10
    );

  const recommendationLimit =
    boundedLimit(
      input?.recommendationLimit,
      10
    );

  const resolution =
    await resolveCommandCentreScope(
      actor,
      input?.scope
    );

  const {
    scope,
    sourceAccess
  } = resolution;

  const [
    health,
    attention,
    work,
    requests,
    sla,
    approvals
  ] = await Promise.all([
    getCommandCentreHealth(
      actor.organizationId,
      scope,
      sourceAccess.health
    ),
    getCommandCentreAttention(
      actor.organizationId,
      scope,
      sourceAccess.attention,
      asOf,
      priorityLimit
    ),
    loadCommandCentreWork(
      actor.organizationId,
      scope,
      sourceAccess.work,
      {
        asOf,
        limit:
          priorityLimit
      }
    ),
    loadCommandCentreRequests(
      actor.organizationId,
      scope,
      sourceAccess.requests,
      {
        asOf,
        limit:
          priorityLimit
      }
    ),
    loadCommandCentreSla(
      actor.organizationId,
      scope,
      sourceAccess.sla,
      {
        asOf,
        periodStart,
        limit:
          priorityLimit
      }
    ),
    loadCommandCentreApprovals(
      sourceAccess.workflow
    )
  ]);

  const priorityItems =
    composeCommandCentrePriorities(
      [
        attention,
        work,
        requests,
        sla
      ],
      {
        limit:
          priorityLimit
      }
    );

  const recommendations =
    composeCommandCentreRecommendations(
      [
        healthRecommendations(
          health
        ),
        attentionRecommendations(
          attention
        ),
        workRecommendations(
          work
        ),
        requestRecommendations(
          requests
        ),
        slaRecommendations(
          sla
        )
      ],
      {
        limit:
          recommendationLimit
      }
    );

  return {
    generatedAt:
      asOf,
    reportingPeriod: {
      start:
        periodStart,
      end:
        asOf
    },
    scope: {
      type:
        scope.scopeType,
      id:
        scope.scopeId,
      name:
        scope.scopeName,
      audience:
        scope.audience
    },
    capabilities: {
      health,
      attention,
      work,
      requests,
      sla,
      approvals
    },
    priorityItems,
    recommendations,
    limits: {
      priorityItems:
        priorityLimit,
      recommendations:
        recommendationLimit
    }
  };
}
