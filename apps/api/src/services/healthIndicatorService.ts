import {
  AttentionItemStatus,
  AttentionSeverity,
  HealthScopeType,
  SlaInstanceStatus,
  SlaSourceType
} from "../../../../packages/database/generated/client/enums.js";

import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

export type HealthEvaluationScope = {
  scopeType: HealthScopeType;
  branchId?: string | null;
  departmentId?: string | null;
};

export type HealthIndicatorResult = {
  code: string;
  measuredValue: number | null;
  sampleSize: number;
  score: number;
  confidence: number;
  explanation: string;
  recommendedAction: string | null;
  metadata: Record<string, unknown>;
};

function percentage(
  successful: number,
  total: number
) {
  if (total === 0) {
    return 0;
  }

  return Math.round(
    (successful / total) * 100
  );
}

function evidenceConfidence(
  sampleSize: number
) {
  if (sampleSize === 0) {
    return 0;
  }

  return Math.min(
    100,
    sampleSize * 20
  );
}

function structuralFilter(
  scope: HealthEvaluationScope
): {
  branchId?: string;
  departmentId?: string;
} {
  if (
    scope.scopeType ===
    HealthScopeType.BRANCH
  ) {
    if (!scope.branchId) {
      throw new Error(
        "Branch health requires a branch ID."
      );
    }

    return {
      branchId:
        scope.branchId
    };
  }

  if (
    scope.scopeType ===
    HealthScopeType.DEPARTMENT
  ) {
    if (!scope.departmentId) {
      throw new Error(
        "Department health requires a department ID."
      );
    }

    return {
      departmentId:
        scope.departmentId
    };
  }

  return {};
}

export function validateHealthScope(
  scope: HealthEvaluationScope
) {
  if (
    scope.scopeType ===
      HealthScopeType.ORGANIZATION &&
    (
      scope.branchId ||
      scope.departmentId
    )
  ) {
    throw new Error(
      "Organization health cannot contain branch or department scope."
    );
  }

  if (
    scope.scopeType ===
      HealthScopeType.BRANCH &&
    (
      !scope.branchId ||
      scope.departmentId
    )
  ) {
    throw new Error(
      "Branch health requires only a branch ID."
    );
  }

  if (
    scope.scopeType ===
      HealthScopeType.DEPARTMENT &&
    (
      !scope.departmentId ||
      scope.branchId
    )
  ) {
    throw new Error(
      "Department health requires only a department ID."
    );
  }
}

export async function evaluateWorkExecution(
  organizationId: string,
  scope: HealthEvaluationScope,
  now: Date
): Promise<HealthIndicatorResult> {
  const scopeFilter =
    structuralFilter(scope);

  const activeWhere:
    Prisma.WorkItemWhereInput = {
    organizationId,
    ...scopeFilter,
    dueAt: {
      not: null
    },
    status: {
      notIn: [
        "COMPLETED",
        "CANCELLED"
      ]
    }
  };

  const [
    active,
    overdue
  ] = await Promise.all([
    prisma.workItem.count({
      where: activeWhere
    }),
    prisma.workItem.count({
      where: {
        ...activeWhere,
        dueAt: {
          not: null,
          lte: now
        }
      }
    })
  ]);

  const onTrack =
    active - overdue;

  const score =
    percentage(
      onTrack,
      active
    );

  return {
    code: "WORK_EXECUTION",
    measuredValue:
      active === 0
        ? null
        : score,
    sampleSize:
      active,
    score,
    confidence:
      evidenceConfidence(active),
    explanation:
      active === 0
        ? "No active Work Items with due dates were available for this scope."
        : `${onTrack} of ${active} active Work Items with due dates are not overdue.`,
    recommendedAction:
      overdue > 0
        ? "Review overdue Work Items, confirm ownership and agree recovery dates."
        : null,
    metadata: {
      active,
      onTrack,
      overdue
    }
  };
}

export async function evaluateRequestOwnership(
  organizationId: string,
  scope: HealthEvaluationScope
): Promise<HealthIndicatorResult> {
  const scopeFilter =
    structuralFilter(scope);

  const activeWhere:
    Prisma.RequestWhereInput = {
    organizationId,
    ...scopeFilter,
    status: {
      notIn: [
        "DRAFT",
        "REJECTED",
        "COMPLETED",
        "CANCELLED"
      ]
    }
  };

  const [
    active,
    assigned
  ] = await Promise.all([
    prisma.request.count({
      where: activeWhere
    }),
    prisma.request.count({
      where: {
        ...activeWhere,
        assignedToOrganizationUserId: {
          not: null
        }
      }
    })
  ]);

  const unassigned =
    active - assigned;

  const score =
    percentage(
      assigned,
      active
    );

  return {
    code: "REQUEST_OWNERSHIP",
    measuredValue:
      active === 0
        ? null
        : score,
    sampleSize:
      active,
    score,
    confidence:
      evidenceConfidence(active),
    explanation:
      active === 0
        ? "No active Requests were available for this scope."
        : `${assigned} of ${active} active Requests have an assigned owner.`,
    recommendedAction:
      unassigned > 0
        ? "Assign unowned Requests and confirm responsibility for progressing them."
        : null,
    metadata: {
      active,
      assigned,
      unassigned
    }
  };
}

async function slaStructuralFilter(
  organizationId: string,
  scope: HealthEvaluationScope
): Promise<Prisma.SlaInstanceWhereInput> {
  if (
    scope.scopeType ===
    HealthScopeType.ORGANIZATION
  ) {
    return {};
  }

  const scopeFilter =
    structuralFilter(scope);

  const [
    workItems,
    requests
  ] = await Promise.all([
    prisma.workItem.findMany({
      where: {
        organizationId,
        ...scopeFilter
      },
      select: {
        id: true
      }
    }),
    prisma.request.findMany({
      where: {
        organizationId,
        ...scopeFilter
      },
      select: {
        id: true
      }
    })
  ]);

  return {
    OR: [
      {
        sourceType:
          SlaSourceType.WORK_ITEM,
        sourceId: {
          in:
            workItems.map(
              (item) => item.id
            )
        }
      },
      {
        sourceType:
          SlaSourceType.REQUEST,
        sourceId: {
          in:
            requests.map(
              (request) =>
                request.id
            )
        }
      }
    ]
  };
}

export async function evaluateSlaReliability(
  organizationId: string,
  scope: HealthEvaluationScope,
  periodStart: Date,
  periodEnd: Date
): Promise<HealthIndicatorResult> {
  const scopeFilter =
    await slaStructuralFilter(
      organizationId,
      scope
    );

  const relevantWhere:
    Prisma.SlaInstanceWhereInput = {
      organizationId,
      ...scopeFilter,
      startedAt: {
        gte: periodStart,
        lte: periodEnd
      },
      status: {
        not:
          SlaInstanceStatus.CANCELLED
      }
    };

  const [
    relevant,
    breached
  ] = await Promise.all([
    prisma.slaInstance.count({
      where:
        relevantWhere
    }),
    prisma.slaInstance.count({
      where: {
        ...relevantWhere,
        status:
          SlaInstanceStatus.BREACHED
      }
    })
  ]);

  const reliable =
    relevant - breached;

  const score =
    percentage(
      reliable,
      relevant
    );

  return {
    code: "SLA_RELIABILITY",
    measuredValue:
      relevant === 0
        ? null
        : score,
    sampleSize:
      relevant,
    score,
    confidence:
      evidenceConfidence(relevant),
    explanation:
      relevant === 0
        ? "No relevant SLA instances were available for this evaluation period."
        : `${reliable} of ${relevant} relevant SLA instances avoided breach.`,
    recommendedAction:
      breached > 0
        ? "Review breached SLA instances and address recurring delivery delays."
        : null,
    metadata: {
      relevant,
      reliable,
      breached,
      periodStart:
        periodStart.toISOString(),
      periodEnd:
        periodEnd.toISOString()
    }
  };
}

export async function evaluateAttentionPressure(
  organizationId: string,
  scope: HealthEvaluationScope
): Promise<HealthIndicatorResult> {
  const scopeFilter =
    structuralFilter(scope);

  const activeWhere:
    Prisma.AttentionItemWhereInput = {
      organizationId,
      ...scopeFilter,
      status: {
        in: [
          AttentionItemStatus.OPEN,
          AttentionItemStatus.ACKNOWLEDGED
        ]
      }
    };

  const [
    active,
    highPressure
  ] = await Promise.all([
    prisma.attentionItem.count({
      where:
        activeWhere
    }),
    prisma.attentionItem.count({
      where: {
        ...activeWhere,
        severity: {
          in: [
            AttentionSeverity.HIGH,
            AttentionSeverity.CRITICAL
          ]
        }
      }
    })
  ]);

  const controlled =
    active - highPressure;

  const score =
    percentage(
      controlled,
      active
    );

  return {
    code: "ATTENTION_PRESSURE",
    measuredValue:
      active === 0
        ? null
        : score,
    sampleSize:
      active,
    score,
    confidence:
      evidenceConfidence(active),
    explanation:
      active === 0
        ? "No active Attention Centre items were available for this scope."
        : `${highPressure} of ${active} active Attention Centre items are high or critical severity.`,
    recommendedAction:
      highPressure > 0
        ? "Review unresolved high and critical Attention Centre items."
        : null,
    metadata: {
      active,
      controlled,
      highOrCritical:
        highPressure
    }
  };
}

export async function evaluateHealthIndicators(
  organizationId: string,
  scope: HealthEvaluationScope,
  input?: {
    now?: Date;
    periodStart?: Date;
    periodEnd?: Date;
  }
) {
  validateHealthScope(scope);

  const now =
    input?.now ??
    new Date();

  const periodEnd =
    input?.periodEnd ??
    now;

  const periodStart =
    input?.periodStart ??
    new Date(
      periodEnd.getTime() -
      30 * 24 * 60 * 60 * 1000
    );

  if (periodStart > periodEnd) {
    throw new Error(
      "Health evaluation period start must not be after period end."
    );
  }

  const results =
    await Promise.all([
      evaluateWorkExecution(
        organizationId,
        scope,
        now
      ),
      evaluateSlaReliability(
        organizationId,
        scope,
        periodStart,
        periodEnd
      ),
      evaluateRequestOwnership(
        organizationId,
        scope
      ),
      evaluateAttentionPressure(
        organizationId,
        scope
      )
    ]);

  return {
    now,
    periodStart,
    periodEnd,
    results
  };
}
