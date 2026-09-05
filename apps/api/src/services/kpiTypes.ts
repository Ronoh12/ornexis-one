import type {
  HealthScopeType,
  HealthStatus,
  KpiDataSourceType,
  KpiDirection,
  KpiUnit
} from "../../../../packages/database/generated/client/enums.js";

export type KpiCalculationEvidence = {
  measuredValue: string;
  sampleSize: number;
  explanation: string;
  recommendedAction?:
    string | undefined;
  metadata: Record<
    string,
    unknown
  >;
};

export type KpiNoEvidence = {
  measuredValue: null;
  sampleSize: 0;
  explanation: string;
  recommendedAction?:
    string | undefined;
  metadata: Record<
    string,
    unknown
  >;
};

export type KpiCalculationResult =
  | KpiCalculationEvidence
  | KpiNoEvidence;

export type KpiFingerprintInput = {
  organizationId: string;
  definitionId: string;
  scopeType: HealthScopeType;
  scopeId: string;
  periodStart: Date;
  periodEnd: Date;
  evaluatedAt: Date;
  dataSourceType: KpiDataSourceType;
  calculationRuleCode:
    string | null;
  rulesVersion: string;
  measuredValue: string;
  target: string;
  warningThreshold: string;
  criticalThreshold: string;
  unit: KpiUnit;
  direction: KpiDirection;
  status: HealthStatus;
  sampleSize: number;
  confidence: number;
  metadata: Record<
    string,
    unknown
  >;
};

export type KpiMovement = {
  comparable: boolean;
  reason: string;
  previousValue:
    string | null;
  absoluteChange:
    string | null;
  percentageChange:
    string | null;
  movement:
    | "IMPROVED"
    | "WORSENED"
    | "STABLE"
    | "NOT_COMPARABLE";
};
