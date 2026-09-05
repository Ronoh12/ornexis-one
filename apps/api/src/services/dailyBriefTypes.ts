import type {
  CapabilityStatus,
  CommandPriorityItem,
  CommandRecommendation
} from "./commandCentreTypes.js";

export type DailyBriefTone =
  | "CRITICAL"
  | "ACTION"
  | "WATCH"
  | "STABLE"
  | "NO_DATA";

export type DailyBriefHeadline = {
  tone: DailyBriefTone;
  text: string;
  reason: string;
  source: {
    capability: string;
    sourceType: string;
    sourceId: string;
  } | null;
};

export type DailyBriefChange = {
  capability: string;
  status:
    | "IMPROVING"
    | "STABLE"
    | "DECLINING"
    | "UNAVAILABLE"
    | "NO_DATA"
    | "FORBIDDEN";
  summary: string;
  currentValue:
    number | null;
  previousValue:
    number | null;
  difference:
    number | null;
};

export type DailyBriefCapabilitySummary = {
  capability:
    | "HEALTH"
    | "ATTENTION"
    | "WORK"
    | "REQUESTS"
    | "SLA"
    | "APPROVALS";
  status: CapabilityStatus;
  summary: string;
  metrics:
    Record<
      string,
      string | number | boolean | null
    > | null;
};

export type DailyBriefProvenance = {
  compositionVersion: string;
  commandCentreGeneratedAt: Date;
  reportingTime: Date;
  reportingPeriod: {
    start: Date;
    end: Date;
  };
  scope: {
    type: string;
    id: string;
  };
  audience: string;
  sourceStatuses:
    Record<
      string,
      CapabilityStatus
    >;
};

export type DailyBriefResult = {
  generatedAt: Date;
  reportingPeriod: {
    start: Date;
    end: Date;
  };
  scope: {
    type: string;
    id: string;
    name: string;
  };
  audience: string;
  headline:
    DailyBriefHeadline;
  overview: string;
  changes:
    DailyBriefChange[];
  focusToday:
    CommandPriorityItem[];
  capabilities:
    DailyBriefCapabilitySummary[];
  recommendations:
    CommandRecommendation[];
  provenance:
    DailyBriefProvenance;
  limits: {
    focusItems: number;
    recommendations: number;
  };
};
