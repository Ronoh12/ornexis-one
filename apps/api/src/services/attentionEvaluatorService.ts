import {
  prisma
} from "../../../../packages/database/index.js";

import {
  evaluateRequestAttention
} from "./attentionRequestAdapter.js";

import {
  evaluateSlaAttention
} from "./attentionSlaAdapter.js";

import {
  evaluateWorkItemAttention
} from "./attentionWorkItemAdapter.js";

type EvaluationResult = {
  scanned: number;
  created: number;
  updated: number;
  resolved: number;
  unchanged: number;
  failed: number;
};

function combine(
  results: EvaluationResult[]
) {
  return results.reduce(
    (total, result) => ({
      scanned:
        total.scanned +
        result.scanned,
      created:
        total.created +
        result.created,
      updated:
        total.updated +
        result.updated,
      resolved:
        total.resolved +
        result.resolved,
      unchanged:
        total.unchanged +
        result.unchanged,
      failed:
        total.failed +
        result.failed
    }),
    {
      scanned: 0,
      created: 0,
      updated: 0,
      resolved: 0,
      unchanged: 0,
      failed: 0
    }
  );
}

export async function evaluateOrganizationAttention(
  organizationId: string,
  input?: {
    limit?: number;
    now?: Date;
  }
) {
  const workItems =
    await evaluateWorkItemAttention(
      organizationId,
      input
    );

  const sla =
    await evaluateSlaAttention(
      organizationId,
      input
    );

  const requests =
    await evaluateRequestAttention(
      organizationId,
      input
    );

  return {
    organizationId,
    evaluatedAt:
      input?.now ?? new Date(),
    ...combine([
      workItems,
      sla,
      requests
    ]),
    sources: {
      workItems,
      sla,
      requests
    }
  };
}

export async function evaluateAllOrganizationsAttention(
  input?: {
    limitPerOrganization?: number;
    now?: Date;
  }
) {
  const organizations =
    await prisma.organization.findMany({
      select: {
        id: true
      },
      orderBy: {
        id: "asc"
      }
    });

  const results = [];

  for (const organization of organizations) {
    results.push(
      await evaluateOrganizationAttention(
        organization.id,
        {
          ...(input?.limitPerOrganization !==
          undefined
            ? {
                limit:
                  input.limitPerOrganization
              }
            : {}),
          ...(input?.now !== undefined
            ? {
                now:
                  input.now
              }
            : {})
        }
      )
    );
  }

  const totals =
    combine(results);

  return {
    organizations:
      results.length,
    ...totals,
    results
  };
}
