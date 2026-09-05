import {
  createHash
} from "node:crypto";

import {
  HealthStatus,
  KpiDataSourceType,
  KpiDirection,
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import type {
  KpiFingerprintInput,
  KpiMovement
} from "./kpiTypes.js";

import {
  KpiServiceError
} from "./kpiScopeService.js";

export const KPI_RULES_VERSION =
  "sprint-020-v1";

export const SUPPORTED_SYSTEM_KPI_RULES = [
  "WORK_ON_TIME_RATE",
  "REQUEST_ASSIGNMENT_RATE",
  "SLA_COMPLIANCE_RATE",
  "ATTENTION_RESOLUTION_RATE"
] as const;

export type SupportedSystemKpiRule =
  typeof SUPPORTED_SYSTEM_KPI_RULES[
    number
  ];

function decimal(
  value:
    | string
    | number
    | Prisma.Decimal
) {
  return new Prisma.Decimal(
    value
  );
}

export function normalizedDecimal(
  value:
    | string
    | number
    | Prisma.Decimal
) {
  return decimal(
    value
  ).toFixed(4);
}

export function isSupportedSystemKpiRule(
  value: string
): value is SupportedSystemKpiRule {
  return (
    SUPPORTED_SYSTEM_KPI_RULES as readonly string[]
  ).includes(
    value
  );
}

export function validateThresholdOrder(
  direction: KpiDirection,
  target:
    | string
    | number
    | Prisma.Decimal,
  warningThreshold:
    | string
    | number
    | Prisma.Decimal,
  criticalThreshold:
    | string
    | number
    | Prisma.Decimal
) {
  const normalizedTarget =
    decimal(target);
  const warning =
    decimal(
      warningThreshold
    );
  const critical =
    decimal(
      criticalThreshold
    );

  if (
    direction ===
      KpiDirection.HIGHER_IS_BETTER &&
    (
      normalizedTarget.lessThan(
        warning
      ) ||
      warning.lessThan(
        critical
      )
    )
  ) {
    throw new KpiServiceError(
      "KPI_THRESHOLDS_INVALID",
      "Higher-is-better thresholds must satisfy target >= warning >= critical."
    );
  }

  if (
    direction ===
      KpiDirection.LOWER_IS_BETTER &&
    (
      normalizedTarget.greaterThan(
        warning
      ) ||
      warning.greaterThan(
        critical
      )
    )
  ) {
    throw new KpiServiceError(
      "KPI_THRESHOLDS_INVALID",
      "Lower-is-better thresholds must satisfy target <= warning <= critical."
    );
  }

  if (
    direction ===
    KpiDirection.TARGET_RANGE
  ) {
    throw new KpiServiceError(
      "KPI_DIRECTION_UNSUPPORTED",
      "Target-range KPI evaluation is not supported in Sprint 020."
    );
  }
}

export function calculateKpiStatus(
  direction: KpiDirection,
  measuredValue:
    | string
    | number
    | Prisma.Decimal,
  target:
    | string
    | number
    | Prisma.Decimal,
  warningThreshold:
    | string
    | number
    | Prisma.Decimal,
  criticalThreshold:
    | string
    | number
    | Prisma.Decimal
): HealthStatus {
  validateThresholdOrder(
    direction,
    target,
    warningThreshold,
    criticalThreshold
  );

  const value =
    decimal(
      measuredValue
    );
  const normalizedTarget =
    decimal(target);
  const warning =
    decimal(
      warningThreshold
    );
  const critical =
    decimal(
      criticalThreshold
    );

  if (
    direction ===
    KpiDirection.HIGHER_IS_BETTER
  ) {
    if (
      value.greaterThanOrEqualTo(
        normalizedTarget
      )
    ) {
      return HealthStatus.HEALTHY;
    }

    if (
      value.greaterThanOrEqualTo(
        warning
      )
    ) {
      return HealthStatus.WATCH;
    }

    if (
      value.greaterThanOrEqualTo(
        critical
      )
    ) {
      return HealthStatus.AT_RISK;
    }

    return HealthStatus.CRITICAL;
  }

  if (
    value.lessThanOrEqualTo(
      normalizedTarget
    )
  ) {
    return HealthStatus.HEALTHY;
  }

  if (
    value.lessThanOrEqualTo(
      warning
    )
  ) {
    return HealthStatus.WATCH;
  }

  if (
    value.lessThanOrEqualTo(
      critical
    )
  ) {
    return HealthStatus.AT_RISK;
  }

  return HealthStatus.CRITICAL;
}

export function systemKpiConfidence(
  sampleSize: number
) {
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

  if (sampleSize === 0) {
    return 0;
  }

  return Math.min(
    100,
    20 +
      sampleSize * 8
  );
}

export function manualKpiConfidence() {
  return 50;
}

export function explainKpiStatus(
  input: {
    measuredValue: string;
    target: string;
    warningThreshold: string;
    criticalThreshold: string;
    direction: KpiDirection;
    status: HealthStatus;
  }
) {
  const directionText =
    input.direction ===
      KpiDirection.HIGHER_IS_BETTER
      ? "higher values are better"
      : "lower values are better";

  return (
    `Measured ${input.measuredValue}; ` +
    `target ${input.target}, ` +
    `warning threshold ${input.warningThreshold}, ` +
    `critical threshold ${input.criticalThreshold}. ` +
    `The result is ${input.status} because ${directionText}.`
  );
}

function canonicalValue(
  value: unknown
): unknown {
  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    value instanceof
    Prisma.Decimal
  ) {
    return value.toFixed(4);
  }

  if (
    Array.isArray(value)
  ) {
    return value.map(
      canonicalValue
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<
          string,
          unknown
        >
      )
        .sort(
          (
            [left],
            [right]
          ) =>
            left.localeCompare(
              right
            )
        )
        .map(
          ([key, item]) => [
            key,
            canonicalValue(
              item
            )
          ]
        )
    );
  }

  return value;
}

export function createKpiFingerprint(
  input: KpiFingerprintInput
) {
  const canonical =
    canonicalValue(input);

  return createHash(
    "sha256"
  )
    .update(
      JSON.stringify(
        canonical
      )
    )
    .digest(
      "hex"
    );
}

export function compareKpiMeasurements(
  current: {
    measuredValue:
      Prisma.Decimal;
    unit: string;
    direction:
      KpiDirection;
    calculationRuleCode:
      string | null;
    rulesVersion: string;
  },
  previous:
    | {
        measuredValue:
          Prisma.Decimal;
        unit: string;
        direction:
          KpiDirection;
        calculationRuleCode:
          string | null;
        rulesVersion: string;
      }
    | null
): KpiMovement {
  if (!previous) {
    return {
      comparable: false,
      reason:
        "No previous comparable KPI measurement exists.",
      previousValue: null,
      absoluteChange: null,
      percentageChange: null,
      movement:
        "NOT_COMPARABLE"
    };
  }

  if (
    current.unit !==
      previous.unit ||
    current.direction !==
      previous.direction ||
    current.calculationRuleCode !==
      previous.calculationRuleCode ||
    current.rulesVersion !==
      previous.rulesVersion
  ) {
    return {
      comparable: false,
      reason:
        "The previous KPI measurement uses incompatible calculation context.",
      previousValue:
        normalizedDecimal(
          previous.measuredValue
        ),
      absoluteChange: null,
      percentageChange: null,
      movement:
        "NOT_COMPARABLE"
    };
  }

  const change =
    current.measuredValue.minus(
      previous.measuredValue
    );

  const percentageChange =
    previous.measuredValue.isZero()
      ? null
      : change
          .dividedBy(
            previous.measuredValue
              .abs()
          )
          .times(100)
          .toFixed(4);

  let movement:
    | "IMPROVED"
    | "WORSENED"
    | "STABLE";

  if (change.isZero()) {
    movement = "STABLE";
  } else if (
    current.direction ===
      KpiDirection.HIGHER_IS_BETTER
  ) {
    movement =
      change.greaterThan(0)
        ? "IMPROVED"
        : "WORSENED";
  } else {
    movement =
      change.lessThan(0)
        ? "IMPROVED"
        : "WORSENED";
  }

  return {
    comparable: true,
    reason:
      "Movement uses the immediately previous compatible KPI measurement.",
    previousValue:
      normalizedDecimal(
        previous.measuredValue
      ),
    absoluteChange:
      change.toFixed(4),
    percentageChange,
    movement
  };
}

export function validateKpiDataSource(
  input: {
    dataSourceType:
      KpiDataSourceType;
    calculationRuleCode:
      string | null;
  }
) {
  if (
    input.dataSourceType ===
      KpiDataSourceType.SYSTEM
  ) {
    if (
      !input.calculationRuleCode ||
      !isSupportedSystemKpiRule(
        input.calculationRuleCode
      )
    ) {
      throw new KpiServiceError(
        "KPI_CALCULATION_RULE_UNSUPPORTED",
        "A registered system KPI calculation rule is required."
      );
    }

    return;
  }

  if (
    input.dataSourceType ===
      KpiDataSourceType.MANUAL
  ) {
    if (
      input.calculationRuleCode
    ) {
      throw new KpiServiceError(
        "KPI_CALCULATION_RULE_INVALID",
        "Manual KPI definitions cannot specify a system calculation rule."
      );
    }

    return;
  }

  if (
    input.dataSourceType ===
      KpiDataSourceType.INTEGRATION ||
    input.dataSourceType ===
      KpiDataSourceType.DERIVED
  ) {
    return;
  }
}
