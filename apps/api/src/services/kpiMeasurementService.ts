import {
  HealthScopeType,
  HealthStatus,
  KpiDataSourceType,
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  KPI_RULES_VERSION,
  calculateKpiStatus,
  compareKpiMeasurements,
  createKpiFingerprint,
  explainKpiStatus,
  isSupportedSystemKpiRule,
  manualKpiConfidence,
  normalizedDecimal,
  systemKpiConfidence
} from "./kpiCalculationService.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  runSystemKpiAdapter
} from "./kpiSystemAdapterService.js";

import {
  KpiServiceError,
  kpiDefinitionScopeData,
  resolveKpiScope,
  type KpiActor,
  type KpiScope
} from "./kpiScopeService.js";

const measurementInclude = {
  definition: {
    select: {
      id: true,
      code: true,
      name: true,
      categoryId: true,
      module: true,
      isActive: true
    }
  },
  branch: {
    select: {
      id: true,
      name: true
    }
  },
  department: {
    select: {
      id: true,
      name: true
    }
  },
  createdBy: {
    select: {
      id: true,
      userId: true
    }
  }
} satisfies Prisma.KpiMeasurementInclude;

const definitionEvaluationInclude = {
  category: {
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true
    }
  },
  branch: {
    select: {
      id: true,
      name: true,
      isActive: true
    }
  },
  department: {
    select: {
      id: true,
      name: true,
      isActive: true
    }
  },
  owner: {
    select: {
      id: true,
      userId: true,
      status: true
    }
  }
} satisfies Prisma.KpiDefinitionInclude;

export type KpiDefinitionForEvaluation =
  Prisma.KpiDefinitionGetPayload<{
    include:
      typeof definitionEvaluationInclude;
  }>;

export type CreateManualKpiMeasurementInput = {
  definitionId: string;
  measuredValue: string;
  sampleSize?: number;
  periodStart: Date;
  periodEnd: Date;
  evaluatedAt?: Date;
  explanation?: string;
  recommendedAction?:
    string | null;
  metadata?: Record<
    string,
    unknown
  >;
};

export type EvaluateSystemKpiInput = {
  definitionId: string;
  periodStart: Date;
  periodEnd: Date;
  evaluatedAt?: Date;
};

function definitionScopeId(
  organizationId: string,
  definition: {
    scopeType:
      HealthScopeType;
    branchId:
      string | null;
    departmentId:
      string | null;
  }
) {
  if (
    definition.scopeType ===
    HealthScopeType.BRANCH
  ) {
    return definition.branchId;
  }

  if (
    definition.scopeType ===
    HealthScopeType.DEPARTMENT
  ) {
    return definition.departmentId;
  }

  return organizationId;
}

function definitionScope(
  organizationId: string,
  definition: {
    scopeType:
      HealthScopeType;
    branchId:
      string | null;
    departmentId:
      string | null;
    branch:
      {
        name: string;
      } | null;
    department:
      {
        name: string;
      } | null;
  },
  organizationName: string
): KpiScope {
  const scopeId =
    definitionScopeId(
      organizationId,
      definition
    );

  if (!scopeId) {
    throw new KpiServiceError(
      "KPI_SCOPE_INVALID",
      "KPI definition scope is invalid."
    );
  }

  return {
    scopeType:
      definition.scopeType,
    scopeId,
    scopeName:
      definition.scopeType ===
        HealthScopeType.BRANCH
        ? definition.branch?.name ??
          "Branch"
        : definition.scopeType ===
            HealthScopeType.DEPARTMENT
          ? definition.department
              ?.name ??
            "Department"
          : organizationName
  };
}

export async function loadAuthorizedKpiDefinition(
  actor: KpiActor,
  definitionId: string
) {
  const definition =
    await prisma.kpiDefinition.findFirst({
      where: {
        id:
          definitionId,
        organizationId:
          actor.organizationId
      },
      include:
        definitionEvaluationInclude
    });

  if (!definition) {
    throw new KpiServiceError(
      "KPI_DEFINITION_NOT_FOUND",
      "KPI definition was not found."
    );
  }

  const scopeId =
    definitionScopeId(
      actor.organizationId,
      definition
    );

  if (!scopeId) {
    throw new KpiServiceError(
      "KPI_SCOPE_INVALID",
      "KPI definition scope is invalid."
    );
  }

  const resolved =
    await resolveKpiScope(
      actor,
      {
        scopeType:
          definition.scopeType,
        scopeId
      }
    );

  return {
    definition,
    scope:
      definitionScope(
        actor.organizationId,
        definition,
        resolved.membership
          .organization.name
      ),
    membership:
      resolved.membership
  };
}

function measurementView(
  measurement:
    Prisma.KpiMeasurementGetPayload<{
      include:
        typeof measurementInclude;
    }>
) {
  return {
    id:
      measurement.id,
    organizationId:
      measurement.organizationId,
    kpiDefinitionId:
      measurement.kpiDefinitionId,
    definition:
      measurement.definition,
    scopeType:
      measurement.scopeType,
    scopeId:
      measurement.scopeType ===
        HealthScopeType.BRANCH
        ? measurement.branchId
        : measurement.scopeType ===
            HealthScopeType.DEPARTMENT
          ? measurement.departmentId
          : measurement.organizationId,
    branch:
      measurement.branch,
    department:
      measurement.department,
    measuredValue:
      normalizedDecimal(
        measurement.measuredValue
      ),
    target:
      normalizedDecimal(
        measurement.target
      ),
    warningThreshold:
      normalizedDecimal(
        measurement.warningThreshold
      ),
    criticalThreshold:
      normalizedDecimal(
        measurement.criticalThreshold
      ),
    unit:
      measurement.unit,
    direction:
      measurement.direction,
    status:
      measurement.status,
    sampleSize:
      measurement.sampleSize,
    confidence:
      measurement.confidence,
    periodStart:
      measurement.periodStart,
    periodEnd:
      measurement.periodEnd,
    evaluatedAt:
      measurement.evaluatedAt,
    dataSourceType:
      measurement.dataSourceType,
    calculationRuleCode:
      measurement
        .calculationRuleCode,
    rulesVersion:
      measurement.rulesVersion,
    fingerprint:
      measurement.fingerprint,
    explanation:
      measurement.explanation,
    recommendedAction:
      measurement
        .recommendedAction,
    metadata:
      measurement.metadata,
    createdBy:
      measurement.createdBy,
    createdAt:
      measurement.createdAt
  };
}

async function authorizeMeasurement(
  actor: KpiActor,
  measurement: {
    scopeType:
      HealthScopeType;
    branchId:
      string | null;
    departmentId:
      string | null;
  }
) {
  const scopeId =
    definitionScopeId(
      actor.organizationId,
      measurement
    );

  if (!scopeId) {
    throw new KpiServiceError(
      "KPI_SCOPE_INVALID",
      "KPI measurement scope is invalid."
    );
  }

  await resolveKpiScope(
    actor,
    {
      scopeType:
        measurement.scopeType,
      scopeId
    }
  );
}

async function previousMeasurement(
  current:
    Prisma.KpiMeasurementGetPayload<{
      include:
        typeof measurementInclude;
    }>
) {
  return prisma.kpiMeasurement.findFirst({
    where: {
      organizationId:
        current.organizationId,
      kpiDefinitionId:
        current.kpiDefinitionId,
      scopeType:
        current.scopeType,
      branchId:
        current.branchId,
      departmentId:
        current.departmentId,
      id: {
        not:
          current.id
      }
    },
    orderBy: [
      {
        periodEnd: "desc"
      },
      {
        evaluatedAt: "desc"
      },
      {
        createdAt: "desc"
      },
      {
        id: "asc"
      }
    ]
  });
}

function measurementWithMovement(
  measurement:
    Prisma.KpiMeasurementGetPayload<{
      include:
        typeof measurementInclude;
    }>,
  previous:
    | {
        measuredValue:
          Prisma.Decimal;
        unit: string;
        direction:
          typeof measurement.direction;
        calculationRuleCode:
          string | null;
        rulesVersion: string;
      }
    | null
) {
  return {
    ...measurementView(
      measurement
    ),
    movement:
      compareKpiMeasurements(
        measurement,
        previous
      )
  };
}

export async function listKpiMeasurements(
  actor: KpiActor,
  input?: {
    scope?: {
      scopeType:
        HealthScopeType;
      scopeId: string;
    };
    definitionId?: string;
    status?: HealthStatus;
    dataSourceType?:
      KpiDataSourceType;
    periodStart?: Date;
    periodEnd?: Date;
    limit?: number;
  }
) {
  const resolved =
    await resolveKpiScope(
      actor,
      input?.scope
    );

  const measurements =
    await prisma.kpiMeasurement.findMany({
      where: {
        organizationId:
          actor.organizationId,
        ...kpiDefinitionScopeData(
          resolved.scope
        ),
        ...(input?.definitionId
          ? {
              kpiDefinitionId:
                input.definitionId
            }
          : {}),
        ...(input?.status
          ? {
              status:
                input.status
            }
          : {}),
        ...(input?.dataSourceType
          ? {
              dataSourceType:
                input.dataSourceType
            }
          : {}),
        ...(
          input?.periodStart ||
          input?.periodEnd
            ? {
                periodEnd: {
                  ...(input.periodStart
                    ? {
                        gte:
                          input.periodStart
                      }
                    : {}),
                  ...(input.periodEnd
                    ? {
                        lte:
                          input.periodEnd
                      }
                    : {})
                }
              }
            : {}
        )
      },
      include:
        measurementInclude,
      orderBy: [
        {
          periodEnd: "desc"
        },
        {
          evaluatedAt: "desc"
        },
        {
          createdAt: "desc"
        },
        {
          id: "asc"
        }
      ],
      take:
        input?.limit ??
        100
    });

  return {
    scope:
      resolved.scope,
    measurements:
      measurements.map(
        measurementView
      )
  };
}

export async function getKpiMeasurement(
  actor: KpiActor,
  measurementId: string
) {
  const measurement =
    await prisma.kpiMeasurement.findFirst({
      where: {
        id:
          measurementId,
        organizationId:
          actor.organizationId
      },
      include:
        measurementInclude
    });

  if (!measurement) {
    throw new KpiServiceError(
      "KPI_MEASUREMENT_NOT_FOUND",
      "KPI measurement was not found."
    );
  }

  await authorizeMeasurement(
    actor,
    measurement
  );

  const previous =
    await previousMeasurement(
      measurement
    );

  return measurementWithMovement(
    measurement,
    previous
  );
}

export async function getLatestKpiMeasurement(
  actor: KpiActor,
  definitionId: string
) {
  const authorized =
    await loadAuthorizedKpiDefinition(
      actor,
      definitionId
    );

  const measurement =
    await prisma.kpiMeasurement.findFirst({
      where: {
        organizationId:
          actor.organizationId,
        kpiDefinitionId:
          definitionId,
        ...kpiDefinitionScopeData(
          authorized.scope
        )
      },
      include:
        measurementInclude,
      orderBy: [
        {
          periodEnd: "desc"
        },
        {
          evaluatedAt: "desc"
        },
        {
          createdAt: "desc"
        },
        {
          id: "asc"
        }
      ]
    });

  if (!measurement) {
    return {
      definitionId,
      scope:
        authorized.scope,
      status:
        "NO_DATA" as const,
      reason:
        "No KPI measurement exists for this definition.",
      measurement: null
    };
  }

  const previous =
    await previousMeasurement(
      measurement
    );

  return {
    definitionId,
    scope:
      authorized.scope,
    status:
      "AVAILABLE" as const,
    reason:
      "Latest authorized KPI measurement loaded.",
    measurement:
      measurementWithMovement(
        measurement,
        previous
      )
  };
}

function validateMeasurementPeriod(
  periodStart: Date,
  periodEnd: Date,
  evaluatedAt: Date
) {
  if (
    periodStart >=
      periodEnd
  ) {
    throw new KpiServiceError(
      "KPI_PERIOD_INVALID",
      "KPI period start must be before period end."
    );
  }

  if (
    periodEnd >
      evaluatedAt
  ) {
    throw new KpiServiceError(
      "KPI_PERIOD_INVALID",
      "KPI period end must not be after evaluation time."
    );
  }
}

function validateDefinitionEffectiveForPeriod(
  definition:
    KpiDefinitionForEvaluation,
  periodStart: Date,
  periodEnd: Date
) {
  if (!definition.isActive) {
    throw new KpiServiceError(
      "KPI_DEFINITION_INACTIVE",
      "An active KPI definition is required."
    );
  }

  if (
    definition.effectiveStart &&
    definition.effectiveStart >
      periodEnd
  ) {
    throw new KpiServiceError(
      "KPI_DEFINITION_NOT_EFFECTIVE",
      "The KPI definition is not effective for this period."
    );
  }

  if (
    definition.effectiveEnd &&
    definition.effectiveEnd <=
      periodStart
  ) {
    throw new KpiServiceError(
      "KPI_DEFINITION_NOT_EFFECTIVE",
      "The KPI definition is not effective for this period."
    );
  }
}

function validateMeasuredValue(
  definition:
    KpiDefinitionForEvaluation,
  measuredValue: string
) {
  const value =
    new Prisma.Decimal(
      measuredValue
    );

  if (
    definition.unit ===
      "PERCENTAGE" &&
    (
      value.lessThan(0) ||
      value.greaterThan(100)
    )
  ) {
    throw new KpiServiceError(
      "KPI_MEASURED_VALUE_INVALID",
      "A percentage KPI value must be between 0 and 100."
    );
  }

  return value;
}

function sourcePermissionForRule(
  rule: string
) {
  switch (rule) {
    case "WORK_ON_TIME_RATE":
      return "work_items.view";

    case "REQUEST_ASSIGNMENT_RATE":
      return "requests.view";

    case "SLA_COMPLIANCE_RATE":
      return "sla.view";

    case "ATTENTION_RESOLUTION_RATE":
      return "attention.view";

    default:
      return null;
  }
}

function requireSystemSourcePermission(
  permissions: Set<string>,
  rule: string
) {
  const permission =
    sourcePermissionForRule(
      rule
    );

  if (
    !permission ||
    !permissions.has(
      permission
    )
  ) {
    throw new KpiServiceError(
      "KPI_SOURCE_FORBIDDEN",
      "The KPI source module is not authorized."
    );
  }
}

type PreparedMeasurement = {
  actor: KpiActor;
  definition:
    KpiDefinitionForEvaluation;
  scope: KpiScope;
  measuredValue:
    Prisma.Decimal;
  status: HealthStatus;
  sampleSize: number;
  confidence: number;
  periodStart: Date;
  periodEnd: Date;
  evaluatedAt: Date;
  explanation: string;
  recommendedAction:
    string | null;
  metadata: Record<
    string,
    unknown
  >;
  createdByOrganizationUserId:
    string | null;
};

async function persistKpiMeasurement(
  prepared: PreparedMeasurement
) {
  const normalizedValue =
    normalizedDecimal(
      prepared.measuredValue
    );

  const target =
    normalizedDecimal(
      prepared.definition.target
    );

  const warningThreshold =
    normalizedDecimal(
      prepared.definition
        .warningThreshold
    );

  const criticalThreshold =
    normalizedDecimal(
      prepared.definition
        .criticalThreshold
    );

  const fingerprint =
    createKpiFingerprint({
      organizationId:
        prepared.actor
          .organizationId,
      definitionId:
        prepared.definition.id,
      scopeType:
        prepared.scope.scopeType,
      scopeId:
        prepared.scope.scopeId,
      periodStart:
        prepared.periodStart,
      periodEnd:
        prepared.periodEnd,
      evaluatedAt:
        prepared.evaluatedAt,
      dataSourceType:
        prepared.definition
          .dataSourceType,
      calculationRuleCode:
        prepared.definition
          .calculationRuleCode,
      rulesVersion:
        KPI_RULES_VERSION,
      measuredValue:
        normalizedValue,
      target,
      warningThreshold,
      criticalThreshold,
      unit:
        prepared.definition.unit,
      direction:
        prepared.definition
          .direction,
      status:
        prepared.status,
      sampleSize:
        prepared.sampleSize,
      confidence:
        prepared.confidence,
      metadata:
        prepared.metadata
    });

  try {
    const measurement =
      await prisma.kpiMeasurement.create({
        data: {
          organizationId:
            prepared.actor
              .organizationId,
          kpiDefinitionId:
            prepared.definition.id,
          ...kpiDefinitionScopeData(
            prepared.scope
          ),
          measuredValue:
            prepared.measuredValue,
          target:
            prepared.definition.target,
          warningThreshold:
            prepared.definition
              .warningThreshold,
          criticalThreshold:
            prepared.definition
              .criticalThreshold,
          unit:
            prepared.definition.unit,
          direction:
            prepared.definition
              .direction,
          status:
            prepared.status,
          sampleSize:
            prepared.sampleSize,
          confidence:
            prepared.confidence,
          periodStart:
            prepared.periodStart,
          periodEnd:
            prepared.periodEnd,
          evaluatedAt:
            prepared.evaluatedAt,
          dataSourceType:
            prepared.definition
              .dataSourceType,
          calculationRuleCode:
            prepared.definition
              .calculationRuleCode,
          rulesVersion:
            KPI_RULES_VERSION,
          fingerprint,
          explanation:
            prepared.explanation,
          recommendedAction:
            prepared
              .recommendedAction,
          metadata:
            prepared.metadata as
              Prisma.InputJsonValue,
          ...(prepared
            .createdByOrganizationUserId
          ? {
              createdByOrganizationUserId:
                prepared
                  .createdByOrganizationUserId
            }
          : {})
        },
        include:
          measurementInclude
      });

    return {
      created: true,
      measurement
    };
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing =
        await prisma.kpiMeasurement.findFirst({
          where: {
            organizationId:
              prepared.actor
                .organizationId,
            fingerprint
          },
          include:
            measurementInclude
        });

      if (existing) {
        return {
          created: false,
          measurement:
            existing
        };
      }
    }

    throw error;
  }
}

export async function createManualKpiMeasurement(
  actor: KpiActor,
  input:
    CreateManualKpiMeasurementInput
) {
  const authorized =
    await loadAuthorizedKpiDefinition(
      actor,
      input.definitionId
    );

  if (
    authorized.definition
      .dataSourceType !==
    KpiDataSourceType.MANUAL
  ) {
    throw new KpiServiceError(
      "KPI_MANUAL_SOURCE_REQUIRED",
      "Manual measurements require a MANUAL KPI definition."
    );
  }

  const evaluatedAt =
    input.evaluatedAt ??
    new Date();

  validateMeasurementPeriod(
    input.periodStart,
    input.periodEnd,
    evaluatedAt
  );

  validateDefinitionEffectiveForPeriod(
    authorized.definition,
    input.periodStart,
    input.periodEnd
  );

  const sampleSize =
    input.sampleSize ??
    1;

  if (
    !Number.isInteger(
      sampleSize
    ) ||
    sampleSize < 0
  ) {
    throw new KpiServiceError(
      "KPI_SAMPLE_SIZE_INVALID",
      "KPI sample size must be a non-negative integer."
    );
  }

  const measuredValue =
    validateMeasuredValue(
      authorized.definition,
      input.measuredValue
    );

  const status =
    calculateKpiStatus(
      authorized.definition
        .direction,
      measuredValue,
      authorized.definition.target,
      authorized.definition
        .warningThreshold,
      authorized.definition
        .criticalThreshold
    );

  const normalizedValue =
    normalizedDecimal(
      measuredValue
    );

  const explanation =
    input.explanation
      ?.trim() ||
    explainKpiStatus({
      measuredValue:
        normalizedValue,
      target:
        normalizedDecimal(
          authorized.definition
            .target
        ),
      warningThreshold:
        normalizedDecimal(
          authorized.definition
            .warningThreshold
        ),
      criticalThreshold:
        normalizedDecimal(
          authorized.definition
            .criticalThreshold
        ),
      direction:
        authorized.definition
          .direction,
      status
    });

  const persisted =
    await persistKpiMeasurement({
      actor,
      definition:
        authorized.definition,
      scope:
        authorized.scope,
      measuredValue,
      status,
      sampleSize,
      confidence:
        manualKpiConfidence(),
      periodStart:
        input.periodStart,
      periodEnd:
        input.periodEnd,
      evaluatedAt,
      explanation,
      recommendedAction:
        input.recommendedAction ??
        null,
      metadata:
        input.metadata ??
        {
          source:
            "MANUAL"
        },
      createdByOrganizationUserId:
        actor.organizationUserId
    });

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "KPI_MANUAL_MEASUREMENT_SUBMITTED",
    entityType:
      "KPI_MEASUREMENT",
    entityId:
      persisted.measurement.id,
    newValues: {
      definitionId:
        authorized.definition.id,
      scopeType:
        authorized.scope.scopeType,
      scopeId:
        authorized.scope.scopeId,
      measuredValue:
        normalizedValue,
      status,
      sampleSize,
      confidence:
        manualKpiConfidence(),
      periodStart:
        input.periodStart,
      periodEnd:
        input.periodEnd,
      created:
        persisted.created
    }
  });

  return {
    created:
      persisted.created,
    measurement:
      measurementView(
        persisted.measurement
      )
  };
}

export async function evaluateSystemKpi(
  actor: KpiActor,
  input:
    EvaluateSystemKpiInput
) {
  const authorized =
    await loadAuthorizedKpiDefinition(
      actor,
      input.definitionId
    );

  if (
    authorized.definition
      .dataSourceType !==
    KpiDataSourceType.SYSTEM
  ) {
    throw new KpiServiceError(
      "KPI_SYSTEM_SOURCE_REQUIRED",
      "System evaluation requires a SYSTEM KPI definition."
    );
  }

  const rule =
    authorized.definition
      .calculationRuleCode;

  if (
    !rule ||
    !isSupportedSystemKpiRule(
      rule
    )
  ) {
    throw new KpiServiceError(
      "KPI_CALCULATION_RULE_UNSUPPORTED",
      "The KPI calculation rule is not registered."
    );
  }

  requireSystemSourcePermission(
    authorized.membership
      .permissions,
    rule
  );

  const evaluatedAt =
    input.evaluatedAt ??
    new Date();

  validateMeasurementPeriod(
    input.periodStart,
    input.periodEnd,
    evaluatedAt
  );

  validateDefinitionEffectiveForPeriod(
    authorized.definition,
    input.periodStart,
    input.periodEnd
  );

  const calculation =
    await runSystemKpiAdapter(
      rule,
      {
        organizationId:
          actor.organizationId,
        scope:
          authorized.scope,
        periodStart:
          input.periodStart,
        periodEnd:
          input.periodEnd,
        evaluatedAt
      }
    );

  if (
    calculation.measuredValue ===
    null
  ) {
    await createAuditLog({
      organizationId:
        actor.organizationId,
      userId:
        actor.userId,
      action:
        "KPI_SYSTEM_EVALUATED_NO_EVIDENCE",
      entityType:
        "KPI_DEFINITION",
      entityId:
        authorized.definition.id,
      newValues: {
        scopeType:
          authorized.scope.scopeType,
        scopeId:
          authorized.scope.scopeId,
        calculationRuleCode:
          rule,
        periodStart:
          input.periodStart,
        periodEnd:
          input.periodEnd,
        evaluatedAt,
        sampleSize: 0
      }
    });

    return {
      created: false,
      status:
        "NO_EVIDENCE" as const,
      reason:
        calculation.explanation,
      scope:
        authorized.scope,
      measurement: null,
      evidence:
        calculation.metadata
    };
  }

  const measuredValue =
    validateMeasuredValue(
      authorized.definition,
      calculation.measuredValue
    );

  const status =
    calculateKpiStatus(
      authorized.definition
        .direction,
      measuredValue,
      authorized.definition.target,
      authorized.definition
        .warningThreshold,
      authorized.definition
        .criticalThreshold
    );

  const confidence =
    systemKpiConfidence(
      calculation.sampleSize
    );

  const persisted =
    await persistKpiMeasurement({
      actor,
      definition:
        authorized.definition,
      scope:
        authorized.scope,
      measuredValue,
      status,
      sampleSize:
        calculation.sampleSize,
      confidence,
      periodStart:
        input.periodStart,
      periodEnd:
        input.periodEnd,
      evaluatedAt,
      explanation:
        calculation.explanation,
      recommendedAction:
        calculation
          .recommendedAction ??
        null,
      metadata:
        calculation.metadata,
      createdByOrganizationUserId:
        null
    });

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "KPI_SYSTEM_EVALUATED",
    entityType:
      "KPI_MEASUREMENT",
    entityId:
      persisted.measurement.id,
    newValues: {
      definitionId:
        authorized.definition.id,
      scopeType:
        authorized.scope.scopeType,
      scopeId:
        authorized.scope.scopeId,
      calculationRuleCode:
        rule,
      measuredValue:
        normalizedDecimal(
          measuredValue
        ),
      status,
      sampleSize:
        calculation.sampleSize,
      confidence,
      periodStart:
        input.periodStart,
      periodEnd:
        input.periodEnd,
      evaluatedAt,
      created:
        persisted.created
    }
  });

  return {
    created:
      persisted.created,
    status:
      "AVAILABLE" as const,
    reason:
      "System KPI measurement evaluated.",
    scope:
      authorized.scope,
    measurement:
      measurementView(
        persisted.measurement
      )
  };
}
