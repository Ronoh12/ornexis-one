import {
  createHash
} from "node:crypto";

import {
  HealthScopeType,
  HealthStatus,
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  ensureDefaultHealthDefinitions,
  HEALTH_RULES_VERSION
} from "./healthDefinitionService.js";

import {
  evaluateHealthIndicators,
  type HealthEvaluationScope
} from "./healthIndicatorService.js";

function rounded(
  value: number
) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
}

function statusForScore(
  score: number
) {
  if (score >= 85) {
    return HealthStatus.HEALTHY;
  }

  if (score >= 70) {
    return HealthStatus.WATCH;
  }

  if (score >= 50) {
    return HealthStatus.AT_RISK;
  }

  return HealthStatus.CRITICAL;
}

async function validateScopeOwnership(
  organizationId: string,
  scope: HealthEvaluationScope
) {
  const organization =
    await prisma.organization.findUnique({
      where: {
        id: organizationId
      },
      select: {
        id: true
      }
    });

  if (!organization) {
    throw new Error(
      "Organization was not found."
    );
  }

  if (
    scope.scopeType ===
    HealthScopeType.BRANCH
  ) {
    const branch =
      await prisma.branch.findFirst({
        where: {
          id:
            scope.branchId ?? "",
          organizationId
        },
        select: {
          id: true
        }
      });

    if (!branch) {
      throw new Error(
        "Branch was not found in this organization."
      );
    }
  }

  if (
    scope.scopeType ===
    HealthScopeType.DEPARTMENT
  ) {
    const department =
      await prisma.department.findFirst({
        where: {
          id:
            scope.departmentId ?? "",
          organizationId
        },
        select: {
          id: true
        }
      });

    if (!department) {
      throw new Error(
        "Department was not found in this organization."
      );
    }
  }
}

function scopeKey(
  scope: HealthEvaluationScope
) {
  if (
    scope.scopeType ===
    HealthScopeType.BRANCH
  ) {
    return `BRANCH:${scope.branchId}`;
  }

  if (
    scope.scopeType ===
    HealthScopeType.DEPARTMENT
  ) {
    return `DEPARTMENT:${scope.departmentId}`;
  }

  return "ORGANIZATION";
}

function snapshotFingerprint(
  organizationId: string,
  scope: HealthEvaluationScope,
  periodStart: Date,
  periodEnd: Date,
  definitionsVersion: string
) {
  return createHash("sha256")
    .update(
      [
        organizationId,
        scopeKey(scope),
        periodStart.toISOString(),
        periodEnd.toISOString(),
        HEALTH_RULES_VERSION,
        definitionsVersion
      ].join("|")
    )
    .digest("hex");
}

function snapshotSummary(
  score: number,
  status: HealthStatus,
  confidence: number,
  availableIndicators: number,
  totalIndicators: number
) {
  if (availableIndicators === 0) {
    return (
      "Health could not be established because no supported " +
      "operational evidence was available."
    );
  }

  return (
    `Health is ${status} with a score of ${score}/100 ` +
    `and confidence of ${confidence}/100. ` +
    `${availableIndicators} of ${totalIndicators} active ` +
    "indicators contained evidence."
  );
}

export async function evaluateOrganizationHealth(
  organizationId: string,
  scope: HealthEvaluationScope,
  input?: {
    now?: Date;
    periodStart?: Date;
    periodEnd?: Date;
  }
) {
  await validateScopeOwnership(
    organizationId,
    scope
  );

  await ensureDefaultHealthDefinitions(
    organizationId
  );

  const definitions =
    await prisma.healthIndicatorDefinition.findMany({
      where: {
        organizationId,
        isActive: true
      },
      orderBy: {
        code: "asc"
      }
    });

  if (definitions.length === 0) {
    throw new Error(
      "No active Health Indicator definitions are configured."
    );
  }

  const evaluation =
    await evaluateHealthIndicators(
      organizationId,
      scope,
      input
    );

  const resultByCode =
    new Map(
      evaluation.results.map(
        (result) => [
          result.code,
          result
        ]
      )
    );

  const prepared =
    definitions.map(
      (definition) => {
        const result =
          resultByCode.get(
            definition.code
          );

        if (!result) {
          throw new Error(
            `Unsupported active Health Indicator: ${definition.code}.`
          );
        }

        const weight =
          Number(
            definition.weight.toString()
          );

        const hasEvidence =
          result.measuredValue !== null &&
          result.confidence > 0;

        return {
          definition,
          result,
          weight,
          hasEvidence,
          weightedContribution:
            hasEvidence
              ? (
                  result.score *
                  weight
                ) / 100
              : 0
        };
      }
    );

  const totalConfiguredWeight =
    prepared.reduce(
      (total, item) =>
        total + item.weight,
      0
    );

  if (totalConfiguredWeight <= 0) {
    throw new Error(
      "Active Health Indicator weights must total more than zero."
    );
  }

  const evidenceWeight =
    prepared.reduce(
      (total, item) =>
        total +
        (
          item.hasEvidence
            ? item.weight
            : 0
        ),
      0
    );

  const weightedEvidence =
    prepared.reduce(
      (total, item) =>
        total +
        item.weightedContribution,
      0
    );

  const score =
    evidenceWeight === 0
      ? 0
      : rounded(
          (
            weightedEvidence /
            evidenceWeight
          ) * 100
        );

  const confidence =
    rounded(
      prepared.reduce(
        (total, item) =>
          total +
          (
            item.result.confidence *
            item.weight
          ),
        0
      ) /
      totalConfiguredWeight
    );

  const status =
    statusForScore(score);

  const availableIndicators =
    prepared.filter(
      (item) =>
        item.hasEvidence
    ).length;

  const definitionsVersion =
    definitions
      .map(
        (definition) =>
          [
            definition.id,
            definition.updatedAt.toISOString(),
            definition.weight.toString(),
            definition.isActive
          ].join(":")
      )
      .join("|");

  const fingerprint =
    snapshotFingerprint(
      organizationId,
      scope,
      evaluation.periodStart,
      evaluation.periodEnd,
      definitionsVersion
    );

  const existing =
    await prisma.healthSnapshot.findUnique({
      where: {
        organizationId_fingerprint: {
          organizationId,
          fingerprint
        }
      },
      include: {
        contributions: {
          orderBy: {
            indicatorCode: "asc"
          }
        }
      }
    });

  if (existing) {
    return {
      outcome: "existing" as const,
      snapshot:
        existing
    };
  }

  const summary =
    snapshotSummary(
      score,
      status,
      confidence,
      availableIndicators,
      definitions.length
    );

  try {
    const snapshot =
      await prisma.$transaction(
        async (transaction) => {
          const created =
            await transaction.healthSnapshot.create({
              data: {
                organizationId,
                scopeType:
                  scope.scopeType,
                branchId:
                  scope.scopeType ===
                    HealthScopeType.BRANCH
                    ? scope.branchId ?? null
                    : null,
                departmentId:
                  scope.scopeType ===
                    HealthScopeType.DEPARTMENT
                    ? scope.departmentId ?? null
                    : null,
                score,
                status,
                confidence,
                evaluatedAt:
                  evaluation.now,
                periodStart:
                  evaluation.periodStart,
                periodEnd:
                  evaluation.periodEnd,
                rulesVersion:
                  HEALTH_RULES_VERSION,
                fingerprint,
                summary
              }
            });

          await transaction.healthContribution.createMany({
            data:
              prepared.map(
                (item) => ({
                  organizationId,
                  healthSnapshotId:
                    created.id,
                  healthIndicatorDefinitionId:
                    item.definition.id,
                  indicatorCode:
                    item.definition.code,
                  measuredValue:
                    item.result.measuredValue ===
                      null
                      ? null
                      : new Prisma.Decimal(
                          item.result.measuredValue
                        ),
                  sampleSize:
                    item.result.sampleSize,
                  indicatorScore:
                    item.result.score,
                  weight:
                    item.definition.weight,
                  weightedContribution:
                    new Prisma.Decimal(
                      item.weightedContribution
                    ),
                  confidence:
                    item.result.confidence,
                  explanation:
                    item.result.explanation,
                  recommendedAction:
                    item.result
                      .recommendedAction,
                  metadata:
                    item.result.metadata as
                      Prisma.InputJsonValue
                })
              )
          });

          const complete =
            await transaction.healthSnapshot.findUnique({
              where: {
                id:
                  created.id
              },
              include: {
                contributions: {
                  orderBy: {
                    indicatorCode:
                      "asc"
                  }
                }
              }
            });

          if (!complete) {
            throw new Error(
              "Created Health snapshot could not be loaded."
            );
          }

          return complete;
        }
      );

    return {
      outcome: "created" as const,
      snapshot
    };
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced =
        await prisma.healthSnapshot.findUnique({
          where: {
            organizationId_fingerprint: {
              organizationId,
              fingerprint
            }
          },
          include: {
            contributions: {
              orderBy: {
                indicatorCode: "asc"
              }
            }
          }
        });

      if (raced) {
        return {
          outcome: "existing" as const,
          snapshot:
            raced
        };
      }
    }

    throw error;
  }
}
