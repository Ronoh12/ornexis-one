import {
  HealthScopeType,
  HealthStatus,
  KpiDataSourceType,
  KpiDirection,
  KpiPeriodType,
  KpiUnit
} from "../../../../packages/database/generated/client/enums.js";

export class KpiValidationError
  extends Error {
  constructor(
    message: string
  ) {
    super(message);
    this.name =
      "KpiValidationError";
  }
}

function objectValue(
  value: unknown,
  field = "body"
) {
  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new KpiValidationError(
      `${field} must be an object.`
    );
  }

  return value as Record<
    string,
    unknown
  >;
}

function rejectUnknownFields(
  value: Record<
    string,
    unknown
  >,
  allowed: readonly string[]
) {
  const unknown =
    Object.keys(value)
      .filter(
        (key) =>
          !allowed.includes(key)
      );

  if (
    unknown.length > 0
  ) {
    throw new KpiValidationError(
      `Unknown field: ${unknown[0]}.`
    );
  }
}

function singleValue(
  value: unknown,
  field: string
) {
  if (
    Array.isArray(value)
  ) {
    throw new KpiValidationError(
      `${field} must contain one value.`
    );
  }

  return value;
}

function optionalString(
  value: unknown,
  field: string
) {
  const defined =
    singleValue(
      value,
      field
    );

  if (
    defined === undefined
  ) {
    return undefined;
  }

  if (
    typeof defined !==
      "string" ||
    defined.trim().length === 0
  ) {
    throw new KpiValidationError(
      `${field} must be a non-empty string.`
    );
  }

  return defined.trim();
}

function requiredString(
  value: unknown,
  field: string
) {
  const parsed =
    optionalString(
      value,
      field
    );

  if (
    parsed === undefined
  ) {
    throw new KpiValidationError(
      `${field} is required.`
    );
  }

  return parsed;
}

function optionalNullableString(
  value: unknown,
  field: string
) {
  if (value === null) {
    return null;
  }

  return optionalString(
    value,
    field
  );
}

function optionalBoolean(
  value: unknown,
  field: string
) {
  const defined =
    singleValue(
      value,
      field
    );

  if (
    defined === undefined
  ) {
    return undefined;
  }

  if (
    typeof defined ===
      "boolean"
  ) {
    return defined;
  }

  if (
    defined === "true"
  ) {
    return true;
  }

  if (
    defined === "false"
  ) {
    return false;
  }

  throw new KpiValidationError(
    `${field} must be a boolean.`
  );
}

function optionalInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number
) {
  const defined =
    singleValue(
      value,
      field
    );

  if (
    defined === undefined
  ) {
    return undefined;
  }

  const parsed =
    typeof defined ===
      "number"
      ? defined
      : typeof defined ===
          "string" &&
        /^-?\d+$/.test(
          defined
        )
        ? Number(defined)
        : Number.NaN;

  if (
    !Number.isInteger(
      parsed
    ) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw new KpiValidationError(
      `${field} must be an integer from ${minimum} to ${maximum}.`
    );
  }

  return parsed;
}

function requiredDecimal(
  value: unknown,
  field: string
) {
  if (
    (
      typeof value !==
        "string" &&
      typeof value !==
        "number"
    ) ||
    !/^-?\d{1,14}(?:\.\d{1,4})?$/
      .test(
        String(value)
      )
  ) {
    throw new KpiValidationError(
      `${field} must be a decimal with at most four decimal places.`
    );
  }

  return String(value);
}

function optionalDecimal(
  value: unknown,
  field: string
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return requiredDecimal(
    value,
    field
  );
}

function requiredDate(
  value: unknown,
  field: string
) {
  const text =
    requiredString(
      value,
      field
    );

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new KpiValidationError(
      `${field} must be a valid date-time.`
    );
  }

  return date;
}

function optionalDate(
  value: unknown,
  field: string
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return requiredDate(
    value,
    field
  );
}

function parseUuid(
  value: unknown,
  field: string
) {
  const text =
    requiredString(
      value,
      field
    );

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(text)
  ) {
    throw new KpiValidationError(
      `${field} must be a valid UUID.`
    );
  }

  return text;
}

function optionalUuid(
  value: unknown,
  field: string
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return parseUuid(
    value,
    field
  );
}

function parseEnum<
  T extends string
>(
  value: unknown,
  field: string,
  enumValues: readonly T[]
) {
  const text =
    requiredString(
      value,
      field
    );

  if (
    !enumValues.includes(
      text as T
    )
  ) {
    throw new KpiValidationError(
      `${field} has an unsupported value.`
    );
  }

  return text as T;
}

function optionalEnum<
  T extends string
>(
  value: unknown,
  field: string,
  enumValues: readonly T[]
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  return parseEnum(
    value,
    field,
    enumValues
  );
}

function parseScopeFields(
  scopeTypeValue: unknown,
  scopeIdValue: unknown,
  required: boolean
) {
  if (
    scopeTypeValue ===
      undefined &&
    scopeIdValue ===
      undefined &&
    !required
  ) {
    return undefined;
  }

  if (
    (
      scopeTypeValue ===
        undefined
    ) !==
    (
      scopeIdValue ===
        undefined
    )
  ) {
    throw new KpiValidationError(
      "scopeType and scopeId must be provided together."
    );
  }

  const scopeType =
    parseEnum(
      scopeTypeValue,
      "scopeType",
      Object.values(
        HealthScopeType
      )
    );

  const scopeId =
    parseUuid(
      scopeIdValue,
      "scopeId"
    );

  return {
    scopeType,
    scopeId
  };
}

function optionalMetadata(
  value: unknown,
  field: string
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new KpiValidationError(
      `${field} must be an object.`
    );
  }

  return value as Record<
    string,
    unknown
  >;
}

export function parseKpiId(
  value: unknown
) {
  return parseUuid(
    value,
    "id"
  );
}

export function parseKpiCategoryQuery(
  value: unknown
) {
  const query =
    objectValue(
      value,
      "query"
    );

  rejectUnknownFields(
    query,
    [
      "active"
    ]
  );

  const active =
    optionalBoolean(
      query.active,
      "active"
    );

  return {
    ...(active !==
    undefined
      ? { active }
      : {})
  };
}

export function parseCreateKpiCategory(
  value: unknown
) {
  const input =
    objectValue(value);

  rejectUnknownFields(
    input,
    [
      "code",
      "name",
      "description",
      "displayOrder",
      "isActive"
    ]
  );

  const description =
    optionalNullableString(
      input.description,
      "description"
    );

  const displayOrder =
    optionalInteger(
      input.displayOrder,
      "displayOrder",
      0,
      100000
    );

  const isActive =
    optionalBoolean(
      input.isActive,
      "isActive"
    );

  return {
    code:
      requiredString(
        input.code,
        "code"
      ),
    name:
      requiredString(
        input.name,
        "name"
      ),
    ...(description !==
    undefined
      ? { description }
      : {}),
    ...(displayOrder !==
    undefined
      ? { displayOrder }
      : {}),
    ...(isActive !==
    undefined
      ? { isActive }
      : {})
  };
}

export function parseUpdateKpiCategory(
  value: unknown
) {
  const input =
    objectValue(value);

  rejectUnknownFields(
    input,
    [
      "name",
      "description",
      "displayOrder",
      "isActive"
    ]
  );

  const name =
    optionalString(
      input.name,
      "name"
    );

  const description =
    optionalNullableString(
      input.description,
      "description"
    );

  const displayOrder =
    optionalInteger(
      input.displayOrder,
      "displayOrder",
      0,
      100000
    );

  const isActive =
    optionalBoolean(
      input.isActive,
      "isActive"
    );

  if (
    name === undefined &&
    description === undefined &&
    displayOrder ===
      undefined &&
    isActive === undefined
  ) {
    throw new KpiValidationError(
      "At least one category field must be provided."
    );
  }

  return {
    ...(name !== undefined
      ? { name }
      : {}),
    ...(description !==
    undefined
      ? { description }
      : {}),
    ...(displayOrder !==
    undefined
      ? { displayOrder }
      : {}),
    ...(isActive !==
    undefined
      ? { isActive }
      : {})
  };
}

export function parseKpiDefinitionQuery(
  value: unknown
) {
  const query =
    objectValue(
      value,
      "query"
    );

  rejectUnknownFields(
    query,
    [
      "scopeType",
      "scopeId",
      "active",
      "categoryId",
      "dataSourceType",
      "limit"
    ]
  );

  const scope =
    parseScopeFields(
      query.scopeType,
      query.scopeId,
      false
    );

  const active =
    optionalBoolean(
      query.active,
      "active"
    );

  const categoryId =
    query.categoryId ===
      undefined
      ? undefined
      : parseUuid(
          query.categoryId,
          "categoryId"
        );

  const dataSourceType =
    optionalEnum(
      query.dataSourceType,
      "dataSourceType",
      Object.values(
        KpiDataSourceType
      )
    );

  const limit =
    optionalInteger(
      query.limit,
      "limit",
      1,
      100
    );

  return {
    ...(scope
      ? { scope }
      : {}),
    ...(active !==
    undefined
      ? { active }
      : {}),
    ...(categoryId
      ? { categoryId }
      : {}),
    ...(dataSourceType
      ? { dataSourceType }
      : {}),
    ...(limit !==
    undefined
      ? { limit }
      : {})
  };
}

export function parseCreateKpiDefinition(
  value: unknown
) {
  const input =
    objectValue(value);

  rejectUnknownFields(
    input,
    [
      "categoryId",
      "code",
      "name",
      "description",
      "module",
      "dataSourceType",
      "calculationRuleCode",
      "scopeType",
      "scopeId",
      "ownerOrganizationUserId",
      "unit",
      "direction",
      "target",
      "warningThreshold",
      "criticalThreshold",
      "weight",
      "periodType",
      "effectiveStart",
      "effectiveEnd",
      "isActive",
      "configuration"
    ]
  );

  const categoryId =
    optionalUuid(
      input.categoryId,
      "categoryId"
    );

  const description =
    optionalNullableString(
      input.description,
      "description"
    );

  const module =
    optionalNullableString(
      input.module,
      "module"
    );

  const calculationRuleCode =
    optionalNullableString(
      input.calculationRuleCode,
      "calculationRuleCode"
    );

  const ownerOrganizationUserId =
    optionalUuid(
      input.ownerOrganizationUserId,
      "ownerOrganizationUserId"
    );

  const weight =
    optionalDecimal(
      input.weight,
      "weight"
    );

  const effectiveStart =
    optionalDate(
      input.effectiveStart,
      "effectiveStart"
    );

  const effectiveEnd =
    optionalDate(
      input.effectiveEnd,
      "effectiveEnd"
    );

  if (
    effectiveStart &&
    effectiveEnd &&
    effectiveStart >=
      effectiveEnd
  ) {
    throw new KpiValidationError(
      "effectiveStart must be before effectiveEnd."
    );
  }

  const isActive =
    optionalBoolean(
      input.isActive,
      "isActive"
    );

  const configuration =
    optionalMetadata(
      input.configuration,
      "configuration"
    );

  return {
    ...(categoryId !==
    undefined
      ? { categoryId }
      : {}),
    code:
      requiredString(
        input.code,
        "code"
      ),
    name:
      requiredString(
        input.name,
        "name"
      ),
    ...(description !==
    undefined
      ? { description }
      : {}),
    ...(module !==
    undefined
      ? { module }
      : {}),
    dataSourceType:
      parseEnum(
        input.dataSourceType,
        "dataSourceType",
        Object.values(
          KpiDataSourceType
        )
      ),
    ...(calculationRuleCode !==
    undefined
      ? {
          calculationRuleCode
        }
      : {}),
    scope:
      parseScopeFields(
        input.scopeType,
        input.scopeId,
        true
      )!,
    ...(ownerOrganizationUserId !==
    undefined
      ? {
          ownerOrganizationUserId
        }
      : {}),
    unit:
      parseEnum(
        input.unit,
        "unit",
        Object.values(
          KpiUnit
        )
      ),
    direction:
      parseEnum(
        input.direction,
        "direction",
        Object.values(
          KpiDirection
        )
      ),
    target:
      requiredDecimal(
        input.target,
        "target"
      ),
    warningThreshold:
      requiredDecimal(
        input.warningThreshold,
        "warningThreshold"
      ),
    criticalThreshold:
      requiredDecimal(
        input.criticalThreshold,
        "criticalThreshold"
      ),
    ...(weight !==
    undefined
      ? { weight }
      : {}),
    periodType:
      parseEnum(
        input.periodType,
        "periodType",
        Object.values(
          KpiPeriodType
        )
      ),
    ...(effectiveStart !==
    undefined
      ? { effectiveStart }
      : {}),
    ...(effectiveEnd !==
    undefined
      ? { effectiveEnd }
      : {}),
    ...(isActive !==
    undefined
      ? { isActive }
      : {}),
    ...(configuration !==
    undefined
      ? {
          configuration:
            configuration as any
        }
      : {})
  };
}

export function parseUpdateKpiDefinition(
  value: unknown
) {
  const input =
    objectValue(value);

  rejectUnknownFields(
    input,
    [
      "categoryId",
      "name",
      "description",
      "module",
      "ownerOrganizationUserId",
      "target",
      "warningThreshold",
      "criticalThreshold",
      "weight",
      "periodType",
      "effectiveStart",
      "effectiveEnd",
      "isActive",
      "configuration"
    ]
  );

  const categoryId =
    optionalUuid(
      input.categoryId,
      "categoryId"
    );

  const name =
    optionalString(
      input.name,
      "name"
    );

  const description =
    optionalNullableString(
      input.description,
      "description"
    );

  const module =
    optionalNullableString(
      input.module,
      "module"
    );

  const ownerOrganizationUserId =
    optionalUuid(
      input.ownerOrganizationUserId,
      "ownerOrganizationUserId"
    );

  const target =
    optionalDecimal(
      input.target,
      "target"
    );

  const warningThreshold =
    optionalDecimal(
      input.warningThreshold,
      "warningThreshold"
    );

  const criticalThreshold =
    optionalDecimal(
      input.criticalThreshold,
      "criticalThreshold"
    );

  const weight =
    optionalDecimal(
      input.weight,
      "weight"
    );

  const periodType =
    optionalEnum(
      input.periodType,
      "periodType",
      Object.values(
        KpiPeriodType
      )
    );

  const effectiveStart =
    optionalDate(
      input.effectiveStart,
      "effectiveStart"
    );

  const effectiveEnd =
    optionalDate(
      input.effectiveEnd,
      "effectiveEnd"
    );

  if (
    effectiveStart &&
    effectiveEnd &&
    effectiveStart >=
      effectiveEnd
  ) {
    throw new KpiValidationError(
      "effectiveStart must be before effectiveEnd."
    );
  }

  const isActive =
    optionalBoolean(
      input.isActive,
      "isActive"
    );

  const configuration =
    optionalMetadata(
      input.configuration,
      "configuration"
    );

  const result = {
    ...(categoryId !==
    undefined
      ? { categoryId }
      : {}),
    ...(name !==
    undefined
      ? { name }
      : {}),
    ...(description !==
    undefined
      ? { description }
      : {}),
    ...(module !==
    undefined
      ? { module }
      : {}),
    ...(ownerOrganizationUserId !==
    undefined
      ? {
          ownerOrganizationUserId
        }
      : {}),
    ...(target !==
    undefined
      ? { target }
      : {}),
    ...(warningThreshold !==
    undefined
      ? {
          warningThreshold
        }
      : {}),
    ...(criticalThreshold !==
    undefined
      ? {
          criticalThreshold
        }
      : {}),
    ...(weight !==
    undefined
      ? { weight }
      : {}),
    ...(periodType !==
    undefined
      ? { periodType }
      : {}),
    ...(effectiveStart !==
    undefined
      ? { effectiveStart }
      : {}),
    ...(effectiveEnd !==
    undefined
      ? { effectiveEnd }
      : {}),
    ...(isActive !==
    undefined
      ? { isActive }
      : {}),
    ...(configuration !==
    undefined
      ? {
          configuration:
            configuration as any
        }
      : {})
  };

  if (
    Object.keys(result)
      .length === 0
  ) {
    throw new KpiValidationError(
      "At least one KPI definition field must be provided."
    );
  }

  return result;
}

function parseReportingPeriod(
  input: Record<
    string,
    unknown
  >
) {
  const periodStart =
    requiredDate(
      input.periodStart,
      "periodStart"
    );

  const periodEnd =
    requiredDate(
      input.periodEnd,
      "periodEnd"
    );

  const evaluatedAt =
    input.evaluatedAt ===
      undefined
      ? undefined
      : requiredDate(
          input.evaluatedAt,
          "evaluatedAt"
        );

  if (
    periodStart >=
      periodEnd
  ) {
    throw new KpiValidationError(
      "periodStart must be before periodEnd."
    );
  }

  if (
    evaluatedAt &&
    periodEnd >
      evaluatedAt
  ) {
    throw new KpiValidationError(
      "periodEnd must not be after evaluatedAt."
    );
  }

  return {
    periodStart,
    periodEnd,
    ...(evaluatedAt
      ? { evaluatedAt }
      : {})
  };
}

export function parseKpiMeasurementQuery(
  value: unknown
) {
  const query =
    objectValue(
      value,
      "query"
    );

  rejectUnknownFields(
    query,
    [
      "scopeType",
      "scopeId",
      "definitionId",
      "status",
      "dataSourceType",
      "periodStart",
      "periodEnd",
      "limit"
    ]
  );

  const scope =
    parseScopeFields(
      query.scopeType,
      query.scopeId,
      false
    );

  const definitionId =
    query.definitionId ===
      undefined
      ? undefined
      : parseUuid(
          query.definitionId,
          "definitionId"
        );

  const status =
    optionalEnum(
      query.status,
      "status",
      Object.values(
        HealthStatus
      )
    );

  const dataSourceType =
    optionalEnum(
      query.dataSourceType,
      "dataSourceType",
      Object.values(
        KpiDataSourceType
      )
    );

  const periodStart =
    query.periodStart ===
      undefined
      ? undefined
      : requiredDate(
          query.periodStart,
          "periodStart"
        );

  const periodEnd =
    query.periodEnd ===
      undefined
      ? undefined
      : requiredDate(
          query.periodEnd,
          "periodEnd"
        );

  if (
    periodStart &&
    periodEnd &&
    periodStart >
      periodEnd
  ) {
    throw new KpiValidationError(
      "periodStart must not be after periodEnd."
    );
  }

  const limit =
    optionalInteger(
      query.limit,
      "limit",
      1,
      100
    );

  return {
    ...(scope
      ? { scope }
      : {}),
    ...(definitionId
      ? { definitionId }
      : {}),
    ...(status
      ? { status }
      : {}),
    ...(dataSourceType
      ? { dataSourceType }
      : {}),
    ...(periodStart
      ? { periodStart }
      : {}),
    ...(periodEnd
      ? { periodEnd }
      : {}),
    ...(limit !==
    undefined
      ? { limit }
      : {})
  };
}

export function parseManualKpiMeasurement(
  value: unknown
) {
  const input =
    objectValue(value);

  rejectUnknownFields(
    input,
    [
      "definitionId",
      "measuredValue",
      "sampleSize",
      "periodStart",
      "periodEnd",
      "evaluatedAt",
      "explanation",
      "recommendedAction",
      "metadata"
    ]
  );

  const sampleSize =
    optionalInteger(
      input.sampleSize,
      "sampleSize",
      0,
      2147483647
    );

  const explanation =
    optionalString(
      input.explanation,
      "explanation"
    );

  const recommendedAction =
    optionalNullableString(
      input.recommendedAction,
      "recommendedAction"
    );

  const metadata =
    optionalMetadata(
      input.metadata,
      "metadata"
    );

  return {
    definitionId:
      parseUuid(
        input.definitionId,
        "definitionId"
      ),
    measuredValue:
      requiredDecimal(
        input.measuredValue,
        "measuredValue"
      ),
    ...(sampleSize !==
    undefined
      ? { sampleSize }
      : {}),
    ...parseReportingPeriod(
      input
    ),
    ...(explanation
      ? { explanation }
      : {}),
    ...(recommendedAction !==
    undefined
      ? {
          recommendedAction
        }
      : {}),
    ...(metadata
      ? { metadata }
      : {})
  };
}

export function parseSystemKpiEvaluation(
  value: unknown
) {
  const input =
    objectValue(value);

  rejectUnknownFields(
    input,
    [
      "definitionId",
      "periodStart",
      "periodEnd",
      "evaluatedAt"
    ]
  );

  return {
    definitionId:
      parseUuid(
        input.definitionId,
        "definitionId"
      ),
    ...parseReportingPeriod(
      input
    )
  };
}
