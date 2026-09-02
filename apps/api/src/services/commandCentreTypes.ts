export type CapabilityStatus =
  | "AVAILABLE"
  | "NO_DATA"
  | "UNAVAILABLE"
  | "FORBIDDEN";

export type CommandCapability<T> = {
  status: CapabilityStatus;
  reason: string;
  data: T | null;
};

export type CommandPriorityItem = {
  sourceCapability:
    | "ATTENTION"
    | "WORK"
    | "REQUESTS"
    | "SLA";
  sourceType: string;
  sourceId: string;
  title: string;
  summary: string;
  severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
  dueAt: Date | null;
  recommendedAction:
    string | null;
  reason: string;
  drillDownAvailable: boolean;
  severityRank: number;
  breached: boolean;
  overdue: boolean;
  blocked: boolean;
  sourceTimestamp: Date;
};

export type CommandRecommendation = {
  text: string;
  sources: Array<{
    capability: string;
    sourceType: string;
    sourceId: string;
  }>;
};
