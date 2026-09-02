import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

export const HEALTH_RULES_VERSION =
  "sprint-017-v1";

export const DEFAULT_HEALTH_DEFINITIONS = [
  {
    code: "WORK_EXECUTION",
    name: "Work Execution",
    description:
      "Measures the proportion of active Work Items that are not overdue.",
    weight: "30",
    configuration: {
      source: "WORK_ITEM",
      method: "ACTIVE_NOT_OVERDUE_RATIO",
      recommendedAction:
        "Review overdue Work Items, confirm ownership and agree recovery dates."
    }
  },
  {
    code: "SLA_RELIABILITY",
    name: "SLA Reliability",
    description:
      "Measures the proportion of relevant SLA instances that were not breached.",
    weight: "30",
    configuration: {
      source: "SLA_INSTANCE",
      method: "NON_BREACHED_RATIO",
      recommendedAction:
        "Review breached SLA instances and address recurring delivery delays."
    }
  },
  {
    code: "REQUEST_OWNERSHIP",
    name: "Request Ownership",
    description:
      "Measures the proportion of active Requests that have an assigned owner.",
    weight: "20",
    configuration: {
      source: "REQUEST",
      method: "ASSIGNED_ACTIVE_RATIO",
      recommendedAction:
        "Assign unowned Requests and confirm responsibility for progressing them."
    }
  },
  {
    code: "ATTENTION_PRESSURE",
    name: "Attention Pressure",
    description:
      "Measures operational pressure from unresolved high and critical Attention items.",
    weight: "20",
    configuration: {
      source: "ATTENTION_ITEM",
      method: "ACTIVE_HIGH_CRITICAL_PRESSURE",
      recommendedAction:
        "Review unresolved high and critical Attention Centre items."
    }
  }
] as const;

export async function ensureDefaultHealthDefinitions(
  organizationId: string
) {
  const definitions = [];

  for (
    const definition
    of DEFAULT_HEALTH_DEFINITIONS
  ) {
    const saved =
      await prisma.healthIndicatorDefinition.upsert({
        where: {
          organizationId_code: {
            organizationId,
            code:
              definition.code
          }
        },
        update: {},
        create: {
          organizationId,
          code:
            definition.code,
          name:
            definition.name,
          description:
            definition.description,
          weight:
            new Prisma.Decimal(
              definition.weight
            ),
          isActive: true,
          configuration:
            definition.configuration
        }
      });

    definitions.push(saved);
  }

  return definitions;
}

export async function ensureAllDefaultHealthDefinitions() {
  const organizations =
    await prisma.organization.findMany({
      select: {
        id: true
      },
      orderBy: {
        id: "asc"
      }
    });

  let createdOrExisting = 0;

  for (const organization of organizations) {
    const definitions =
      await ensureDefaultHealthDefinitions(
        organization.id
      );

    createdOrExisting +=
      definitions.length;
  }

  return {
    organizations:
      organizations.length,
    definitions:
      createdOrExisting
  };
}
