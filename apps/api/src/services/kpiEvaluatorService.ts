import {
  KpiDataSourceType,
  KpiPeriodType
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  evaluateSystemKpi
} from "./kpiMeasurementService.js";

function periodStartFor(
  periodType:
    KpiPeriodType,
  periodEnd: Date
) {
  const start =
    new Date(
      periodEnd
    );

  switch (periodType) {
    case KpiPeriodType.DAILY:
      start.setUTCDate(
        start.getUTCDate() -
        1
      );
      return start;

    case KpiPeriodType.WEEKLY:
      start.setUTCDate(
        start.getUTCDate() -
        7
      );
      return start;

    case KpiPeriodType.MONTHLY:
      start.setUTCMonth(
        start.getUTCMonth() -
        1
      );
      return start;

    case KpiPeriodType.QUARTERLY:
      start.setUTCMonth(
        start.getUTCMonth() -
        3
      );
      return start;

    case KpiPeriodType.YEARLY:
      start.setUTCFullYear(
        start.getUTCFullYear() -
        1
      );
      return start;

    case KpiPeriodType.CUSTOM:
      return null;
  }
}

export async function evaluateAllSystemKpis(
  input?: {
    evaluatedAt?: Date;
    periodStart?: Date;
    periodEnd?: Date;
  }
) {
  const evaluatedAt =
    input?.evaluatedAt ??
    new Date();

  const periodEnd =
    input?.periodEnd ??
    evaluatedAt;

  if (
    periodEnd >
      evaluatedAt
  ) {
    throw new Error(
      "KPI period end must not be after evaluation time."
    );
  }

  const definitions =
    await prisma.kpiDefinition.findMany({
      where: {
        isActive: true,
        dataSourceType:
          KpiDataSourceType.SYSTEM
      },
      select: {
        id: true,
        organizationId: true,
        periodType: true
      },
      orderBy: [
        {
          organizationId: "asc"
        },
        {
          code: "asc"
        },
        {
          id: "asc"
        }
      ]
    });

  const organizationIds =
    Array.from(
      new Set(
        definitions.map(
          (definition) =>
            definition.organizationId
        )
      )
    );

  const administrators =
    await prisma.organizationUser.findMany({
      where: {
        organizationId: {
          in:
            organizationIds
        },
        status:
          "ACTIVE",
        role: {
          name:
            "Administrator",
          isSystemRole:
            true
        }
      },
      select: {
        id: true,
        userId: true,
        organizationId: true
      },
      orderBy: [
        {
          organizationId: "asc"
        },
        {
          id: "asc"
        }
      ]
    });

  const administratorByOrganization =
    new Map<
      string,
      typeof administrators[number]
    >();

  for (
    const administrator
    of administrators
  ) {
    if (
      !administratorByOrganization
        .has(
          administrator
            .organizationId
        )
    ) {
      administratorByOrganization.set(
        administrator.organizationId,
        administrator
      );
    }
  }

  let evaluated = 0;
  let created = 0;
  let existing = 0;
  let noEvidence = 0;
  let skipped = 0;
  let failed = 0;

  const failures: Array<{
    definitionId: string;
    organizationId: string;
    message: string;
  }> = [];

  for (
    const definition
    of definitions
  ) {
    const administrator =
      administratorByOrganization.get(
        definition.organizationId
      );

    if (!administrator) {
      failed += 1;

      failures.push({
        definitionId:
          definition.id,
        organizationId:
          definition.organizationId,
        message:
          "No active system Administrator membership exists."
      });

      continue;
    }

    const periodStart =
      input?.periodStart ??
      periodStartFor(
        definition.periodType,
        periodEnd
      );

    if (!periodStart) {
      skipped += 1;
      continue;
    }

    try {
      const result =
        await evaluateSystemKpi(
          {
            userId:
              administrator.userId,
            organizationId:
              administrator
                .organizationId,
            organizationUserId:
              administrator.id
          },
          {
            definitionId:
              definition.id,
            periodStart,
            periodEnd,
            evaluatedAt
          }
        );

      evaluated += 1;

      if (
        result.status ===
        "NO_EVIDENCE"
      ) {
        noEvidence += 1;
      } else if (
        result.created
      ) {
        created += 1;
      } else {
        existing += 1;
      }
    } catch (error) {
      failed += 1;

      failures.push({
        definitionId:
          definition.id,
        organizationId:
          definition.organizationId,
        message:
          error instanceof Error
            ? error.message
            : "KPI evaluation failed."
      });
    }
  }

  return {
    organizations:
      organizationIds.length,
    definitions:
      definitions.length,
    evaluated,
    created,
    existing,
    noEvidence,
    skipped,
    failed,
    failures
  };
}
