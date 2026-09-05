import {
  HealthScopeType,
  KpiDataSourceType,
  KpiDefinitionOrigin,
  KpiDirection,
  KpiPeriodType,
  KpiUnit,
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  normalizedDecimal,
  validateKpiDataSource,
  validateThresholdOrder
} from "./kpiCalculationService.js";

import {
  KpiServiceError,
  kpiDefinitionScopeData,
  resolveKpiScope,
  requireActiveKpiScope,
  type KpiActor
} from "./kpiScopeService.js";

export type CreateKpiDefinitionInput = {
  categoryId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  module?: string | null;
  origin?: KpiDefinitionOrigin;
  dataSourceType:
    KpiDataSourceType;
  calculationRuleCode?:
    string | null;
  scope: {
    scopeType:
      HealthScopeType;
    scopeId: string;
  };
  ownerOrganizationUserId?:
    string | null;
  unit: KpiUnit;
  direction: KpiDirection;
  target: string;
  warningThreshold: string;
  criticalThreshold: string;
  weight?: string;
  periodType: KpiPeriodType;
  effectiveStart?: Date | null;
  effectiveEnd?: Date | null;
  isActive?: boolean;
  configuration?:
    Prisma.InputJsonValue;
};

export type UpdateKpiDefinitionInput = {
  categoryId?: string | null;
  name?: string;
  description?: string | null;
  module?: string | null;
  ownerOrganizationUserId?:
    string | null;
  target?: string;
  warningThreshold?: string;
  criticalThreshold?: string;
  weight?: string;
  periodType?: KpiPeriodType;
  effectiveStart?: Date | null;
  effectiveEnd?: Date | null;
  isActive?: boolean;
  configuration?:
    Prisma.InputJsonValue;
};

const definitionInclude = {
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

function normalizedCode(
  value: string
) {
  return value
    .trim()
    .toUpperCase();
}

function optionalTrimmed(
  value:
    | string
    | null
    | undefined
) {
  if (
    value === undefined ||
    value === null
  ) {
    return value;
  }

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function definitionView(
  definition:
    Prisma.KpiDefinitionGetPayload<{
      include:
        typeof definitionInclude;
    }>
) {
  return {
    id:
      definition.id,
    organizationId:
      definition.organizationId,
    categoryId:
      definition.categoryId,
    code:
      definition.code,
    name:
      definition.name,
    description:
      definition.description,
    module:
      definition.module,
    origin:
      definition.origin,
    dataSourceType:
      definition.dataSourceType,
    calculationRuleCode:
      definition.calculationRuleCode,
    scopeType:
      definition.scopeType,
    scopeId:
      definition.scopeType ===
        HealthScopeType.BRANCH
        ? definition.branchId
        : definition.scopeType ===
            HealthScopeType.DEPARTMENT
          ? definition.departmentId
          : definition.organizationId,
    ownerOrganizationUserId:
      definition
        .ownerOrganizationUserId,
    unit:
      definition.unit,
    direction:
      definition.direction,
    target:
      normalizedDecimal(
        definition.target
      ),
    warningThreshold:
      normalizedDecimal(
        definition.warningThreshold
      ),
    criticalThreshold:
      normalizedDecimal(
        definition.criticalThreshold
      ),
    weight:
      normalizedDecimal(
        definition.weight
      ),
    periodType:
      definition.periodType,
    effectiveStart:
      definition.effectiveStart,
    effectiveEnd:
      definition.effectiveEnd,
    isActive:
      definition.isActive,
    configuration:
      definition.configuration,
    category:
      definition.category,
    branch:
      definition.branch,
    department:
      definition.department,
    owner:
      definition.owner,
    createdAt:
      definition.createdAt,
    updatedAt:
      definition.updatedAt
  };
}

function translateDefinitionError(
  error: unknown
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new KpiServiceError(
      "KPI_DEFINITION_CODE_CONFLICT",
      "A KPI definition with this code already exists."
    );
  }

  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    (
      error.code === "P2003" ||
      error.code === "P2014"
    )
  ) {
    throw new KpiServiceError(
      "KPI_DEFINITION_RELATION_INVALID",
      "A KPI definition relationship is invalid."
    );
  }

  throw error;
}

async function validateCategory(
  organizationId: string,
  categoryId:
    | string
    | null
    | undefined
) {
  if (
    categoryId ===
      undefined ||
    categoryId === null
  ) {
    return;
  }

  const category =
    await prisma.kpiCategory.findFirst({
      where: {
        id:
          categoryId,
        organizationId,
        isActive: true
      },
      select: {
        id: true
      }
    });

  if (!category) {
    throw new KpiServiceError(
      "KPI_CATEGORY_INVALID",
      "An active same-tenant KPI category is required."
    );
  }
}

async function validateOwner(
  organizationId: string,
  ownerOrganizationUserId:
    | string
    | null
    | undefined
) {
  if (
    ownerOrganizationUserId ===
      undefined ||
    ownerOrganizationUserId ===
      null
  ) {
    return;
  }

  const owner =
    await prisma.organizationUser.findFirst({
      where: {
        id:
          ownerOrganizationUserId,
        organizationId,
        status:
          "ACTIVE"
      },
      select: {
        id: true
      }
    });

  if (!owner) {
    throw new KpiServiceError(
      "KPI_OWNER_INVALID",
      "An active same-tenant KPI owner is required."
    );
  }
}

function validateEffectivePeriod(
  effectiveStart:
    | Date
    | null
    | undefined,
  effectiveEnd:
    | Date
    | null
    | undefined
) {
  if (
    effectiveStart &&
    effectiveEnd &&
    effectiveStart >=
      effectiveEnd
  ) {
    throw new KpiServiceError(
      "KPI_EFFECTIVE_PERIOD_INVALID",
      "KPI effective start must be before effective end."
    );
  }
}

function validatePercentageBounds(
  unit: KpiUnit,
  values: Array<
    string | Prisma.Decimal
  >
) {
  if (
    unit !==
    KpiUnit.PERCENTAGE
  ) {
    return;
  }

  const invalid =
    values.some(
      (value) => {
        const decimal =
          new Prisma.Decimal(
            value
          );

        return (
          decimal.lessThan(0) ||
          decimal.greaterThan(100)
        );
      }
    );

  if (invalid) {
    throw new KpiServiceError(
      "KPI_PERCENTAGE_INVALID",
      "Percentage KPI targets and thresholds must be between 0 and 100."
    );
  }
}

function validateWeight(
  weight: string
) {
  const normalized =
    new Prisma.Decimal(
      weight
    );

  if (
    normalized.lessThan(0)
  ) {
    throw new KpiServiceError(
      "KPI_WEIGHT_INVALID",
      "KPI weight must not be negative."
    );
  }
}

export async function listKpiDefinitions(
  actor: KpiActor,
  input?: {
    scope?: {
      scopeType:
        HealthScopeType;
      scopeId: string;
    };
    active?: boolean;
    categoryId?: string;
    dataSourceType?:
      KpiDataSourceType;
    limit?: number;
  }
) {
  const resolved =
    await resolveKpiScope(
      actor,
      input?.scope
    );

  const definitions =
    await prisma.kpiDefinition.findMany({
      where: {
        organizationId:
          actor.organizationId,
        ...kpiDefinitionScopeData(
          resolved.scope
        ),
        ...(input?.active !==
        undefined
          ? {
              isActive:
                input.active
            }
          : {}),
        ...(input?.categoryId
          ? {
              categoryId:
                input.categoryId
            }
          : {}),
        ...(input?.dataSourceType
          ? {
              dataSourceType:
                input.dataSourceType
            }
          : {})
      },
      include:
        definitionInclude,
      orderBy: [
        {
          code: "asc"
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
    definitions:
      definitions.map(
        definitionView
      )
  };
}

export async function getKpiDefinition(
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
        definitionInclude
    });

  if (!definition) {
    throw new KpiServiceError(
      "KPI_DEFINITION_NOT_FOUND",
      "KPI definition was not found."
    );
  }

  const scopeId =
    definition.scopeType ===
      HealthScopeType.BRANCH
      ? definition.branchId
      : definition.scopeType ===
          HealthScopeType.DEPARTMENT
        ? definition.departmentId
        : definition.organizationId;

  if (!scopeId) {
    throw new KpiServiceError(
      "KPI_SCOPE_INVALID",
      "KPI definition scope is invalid."
    );
  }

  await resolveKpiScope(
    actor,
    {
      scopeType:
        definition.scopeType,
      scopeId
    }
  );

  return definitionView(
    definition
  );
}

export async function createKpiDefinition(
  actor: KpiActor,
  input: CreateKpiDefinitionInput
) {
  const origin =
    input.origin ??
    KpiDefinitionOrigin.ORGANIZATION;

  if (
    origin !==
    KpiDefinitionOrigin.ORGANIZATION
  ) {
    throw new KpiServiceError(
      "KPI_ORIGIN_FORBIDDEN",
      "Tenant users may create only organization-owned KPI definitions."
    );
  }

  const resolved =
    await requireActiveKpiScope(
      actor,
      input.scope
    );

  await Promise.all([
    validateCategory(
      actor.organizationId,
      input.categoryId
    ),
    validateOwner(
      actor.organizationId,
      input.ownerOrganizationUserId
    )
  ]);

  const calculationRuleCode =
    optionalTrimmed(
      input.calculationRuleCode
    ) ?? null;

  validateKpiDataSource({
    dataSourceType:
      input.dataSourceType,
    calculationRuleCode
  });

  if (
    input.direction !==
    KpiDirection.TARGET_RANGE
  ) {
    validateThresholdOrder(
      input.direction,
      input.target,
      input.warningThreshold,
      input.criticalThreshold
    );
  }

  validatePercentageBounds(
    input.unit,
    [
      input.target,
      input.warningThreshold,
      input.criticalThreshold
    ]
  );

  const weight =
    input.weight ??
    "1";

  validateWeight(
    weight
  );

  validateEffectivePeriod(
    input.effectiveStart,
    input.effectiveEnd
  );

  let definition:
    Prisma.KpiDefinitionGetPayload<{
      include:
        typeof definitionInclude;
    }>;

  try {
    definition =
      await prisma.kpiDefinition.create({
        data: {
          organizationId:
            actor.organizationId,
          ...(input.categoryId !==
          undefined
            ? {
                categoryId:
                  input.categoryId
              }
            : {}),
          code:
            normalizedCode(
              input.code
            ),
          name:
            input.name.trim(),
          ...(input.description !==
          undefined
            ? {
                description:
                  input.description ===
                    null
                    ? null
                    : input.description
                        .trim() ||
                      null
              }
            : {}),
          ...(input.module !==
          undefined
            ? {
                module:
                  input.module ===
                    null
                    ? null
                    : input.module
                        .trim() ||
                      null
              }
            : {}),
          origin,
          dataSourceType:
            input.dataSourceType,
          calculationRuleCode,
          ...kpiDefinitionScopeData(
            resolved.scope
          ),
          ...(input
            .ownerOrganizationUserId !==
          undefined
            ? {
                ownerOrganizationUserId:
                  input
                    .ownerOrganizationUserId
              }
            : {}),
          unit:
            input.unit,
          direction:
            input.direction,
          target:
            new Prisma.Decimal(
              input.target
            ),
          warningThreshold:
            new Prisma.Decimal(
              input.warningThreshold
            ),
          criticalThreshold:
            new Prisma.Decimal(
              input.criticalThreshold
            ),
          weight:
            new Prisma.Decimal(
              weight
            ),
          periodType:
            input.periodType,
          ...(input.effectiveStart !==
          undefined
            ? {
                effectiveStart:
                  input.effectiveStart
              }
            : {}),
          ...(input.effectiveEnd !==
          undefined
            ? {
                effectiveEnd:
                  input.effectiveEnd
              }
            : {}),
          isActive:
            input.isActive ??
            true,
          ...(input.configuration !==
          undefined
            ? {
                configuration:
                  input.configuration
              }
            : {})
        },
        include:
          definitionInclude
      });
  } catch (error) {
    translateDefinitionError(
      error
    );
  }

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "KPI_DEFINITION_CREATED",
    entityType:
      "KPI_DEFINITION",
    entityId:
      definition.id,
    newValues: {
      code:
        definition.code,
      categoryId:
        definition.categoryId,
      scopeType:
        definition.scopeType,
      scopeId:
        resolved.scope.scopeId,
      dataSourceType:
        definition.dataSourceType,
      calculationRuleCode:
        definition
          .calculationRuleCode,
      direction:
        definition.direction,
      unit:
        definition.unit,
      target:
        normalizedDecimal(
          definition.target
        ),
      warningThreshold:
        normalizedDecimal(
          definition
            .warningThreshold
        ),
      criticalThreshold:
        normalizedDecimal(
          definition
            .criticalThreshold
        ),
      isActive:
        definition.isActive
    }
  });

  return definitionView(
    definition
  );
}

export async function updateKpiDefinition(
  actor: KpiActor,
  definitionId: string,
  input: UpdateKpiDefinitionInput
) {
  await getKpiDefinition(
    actor,
    definitionId
  );

  const existing =
    await prisma.kpiDefinition.findFirst({
      where: {
        id:
          definitionId,
        organizationId:
          actor.organizationId
      },
      include:
        definitionInclude
    });

  if (!existing) {
    throw new KpiServiceError(
      "KPI_DEFINITION_NOT_FOUND",
      "KPI definition was not found."
    );
  }

  if (
    input.categoryId !==
    undefined
  ) {
    await validateCategory(
      actor.organizationId,
      input.categoryId
    );
  }

  if (
    input
      .ownerOrganizationUserId !==
    undefined
  ) {
    await validateOwner(
      actor.organizationId,
      input
        .ownerOrganizationUserId
    );
  }

  const target =
    input.target ??
    normalizedDecimal(
      existing.target
    );

  const warningThreshold =
    input.warningThreshold ??
    normalizedDecimal(
      existing.warningThreshold
    );

  const criticalThreshold =
    input.criticalThreshold ??
    normalizedDecimal(
      existing.criticalThreshold
    );

  if (
    existing.direction !==
    KpiDirection.TARGET_RANGE
  ) {
    validateThresholdOrder(
      existing.direction,
      target,
      warningThreshold,
      criticalThreshold
    );
  }

  validatePercentageBounds(
    existing.unit,
    [
      target,
      warningThreshold,
      criticalThreshold
    ]
  );

  const weight =
    input.weight ??
    normalizedDecimal(
      existing.weight
    );

  validateWeight(
    weight
  );

  const effectiveStart =
    input.effectiveStart ===
      undefined
      ? existing.effectiveStart
      : input.effectiveStart;

  const effectiveEnd =
    input.effectiveEnd ===
      undefined
      ? existing.effectiveEnd
      : input.effectiveEnd;

  validateEffectivePeriod(
    effectiveStart,
    effectiveEnd
  );

  let definition:
    Prisma.KpiDefinitionGetPayload<{
      include:
        typeof definitionInclude;
    }>;

  try {
    definition =
      await prisma.kpiDefinition.update({
        where: {
          id:
            existing.id
        },
        data: {
          ...(input.categoryId !==
          undefined
            ? {
                categoryId:
                  input.categoryId
              }
            : {}),
          ...(input.name !==
          undefined
            ? {
                name:
                  input.name.trim()
              }
            : {}),
          ...(input.description !==
          undefined
            ? {
                description:
                  input.description ===
                    null
                    ? null
                    : input.description
                        .trim() ||
                      null
              }
            : {}),
          ...(input.module !==
          undefined
            ? {
                module:
                  input.module ===
                    null
                    ? null
                    : input.module
                        .trim() ||
                      null
              }
            : {}),
          ...(input
            .ownerOrganizationUserId !==
          undefined
            ? {
                ownerOrganizationUserId:
                  input
                    .ownerOrganizationUserId
              }
            : {}),
          ...(input.target !==
          undefined
            ? {
                target:
                  new Prisma.Decimal(
                    target
                  )
              }
            : {}),
          ...(input.warningThreshold !==
          undefined
            ? {
                warningThreshold:
                  new Prisma.Decimal(
                    warningThreshold
                  )
              }
            : {}),
          ...(input.criticalThreshold !==
          undefined
            ? {
                criticalThreshold:
                  new Prisma.Decimal(
                    criticalThreshold
                  )
              }
            : {}),
          ...(input.weight !==
          undefined
            ? {
                weight:
                  new Prisma.Decimal(
                    weight
                  )
              }
            : {}),
          ...(input.periodType !==
          undefined
            ? {
                periodType:
                  input.periodType
              }
            : {}),
          ...(input.effectiveStart !==
          undefined
            ? {
                effectiveStart:
                  input.effectiveStart
              }
            : {}),
          ...(input.effectiveEnd !==
          undefined
            ? {
                effectiveEnd:
                  input.effectiveEnd
              }
            : {}),
          ...(input.isActive !==
          undefined
            ? {
                isActive:
                  input.isActive
              }
            : {}),
          ...(input.configuration !==
          undefined
            ? {
                configuration:
                  input.configuration
              }
            : {})
        },
        include:
          definitionInclude
      });
  } catch (error) {
    translateDefinitionError(
      error
    );
  }

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "KPI_DEFINITION_UPDATED",
    entityType:
      "KPI_DEFINITION",
    entityId:
      definition.id,
    oldValues: {
      categoryId:
        existing.categoryId,
      name:
        existing.name,
      description:
        existing.description,
      module:
        existing.module,
      ownerOrganizationUserId:
        existing
          .ownerOrganizationUserId,
      target:
        normalizedDecimal(
          existing.target
        ),
      warningThreshold:
        normalizedDecimal(
          existing.warningThreshold
        ),
      criticalThreshold:
        normalizedDecimal(
          existing.criticalThreshold
        ),
      weight:
        normalizedDecimal(
          existing.weight
        ),
      periodType:
        existing.periodType,
      effectiveStart:
        existing.effectiveStart,
      effectiveEnd:
        existing.effectiveEnd,
      isActive:
        existing.isActive,
      configuration:
        existing.configuration
    },
    newValues: {
      categoryId:
        definition.categoryId,
      name:
        definition.name,
      description:
        definition.description,
      module:
        definition.module,
      ownerOrganizationUserId:
        definition
          .ownerOrganizationUserId,
      target:
        normalizedDecimal(
          definition.target
        ),
      warningThreshold:
        normalizedDecimal(
          definition
            .warningThreshold
        ),
      criticalThreshold:
        normalizedDecimal(
          definition
            .criticalThreshold
        ),
      weight:
        normalizedDecimal(
          definition.weight
        ),
      periodType:
        definition.periodType,
      effectiveStart:
        definition.effectiveStart,
      effectiveEnd:
        definition.effectiveEnd,
      isActive:
        definition.isActive,
      configuration:
        definition.configuration
    }
  });

  return definitionView(
    definition
  );
}
