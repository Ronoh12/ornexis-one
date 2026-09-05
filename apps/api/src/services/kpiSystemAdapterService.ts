import {
  AttentionItemStatus,
  Prisma,
  RequestStatus,
  SlaInstanceStatus,
  SlaSourceType,
  WorkItemStatus
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  kpiStructuralScopeFilter,
  type KpiScope
} from "./kpiScopeService.js";

import type {
  KpiCalculationResult
} from "./kpiTypes.js";

import type {
  SupportedSystemKpiRule
} from "./kpiCalculationService.js";

type AdapterInput = {
  organizationId: string;
  scope: KpiScope;
  periodStart: Date;
  periodEnd: Date;
  evaluatedAt: Date;
};

function percentage(
  numerator: number,
  denominator: number
) {
  return new Prisma.Decimal(
    numerator
  )
    .dividedBy(
      denominator
    )
    .times(100)
    .toFixed(4);
}

function noEvidence(
  explanation: string,
  metadata: Record<
    string,
    unknown
  >
): KpiCalculationResult {
  return {
    measuredValue: null,
    sampleSize: 0,
    explanation,
    metadata
  };
}

async function workOnTimeRate(
  input: AdapterInput
): Promise<
  KpiCalculationResult
> {
  const workItems =
    await prisma.workItem.findMany({
      where: {
        organizationId:
          input.organizationId,
        ...kpiStructuralScopeFilter(
          input.scope
        ),
        status: {
          notIn: [
            WorkItemStatus.DRAFT,
            WorkItemStatus.CANCELLED
          ]
        },
        dueAt: {
          gte:
            input.periodStart,
          lte:
            input.periodEnd
        }
      },
      select: {
        id: true,
        status: true,
        dueAt: true,
        completedAt: true
      },
      orderBy: {
        id: "asc"
      }
    });

  if (
    workItems.length === 0
  ) {
    return noEvidence(
      "No qualifying Work Items with due dates exist for this scope and period.",
      {
        qualifying: 0,
        onTime: 0,
        overdue: 0
      }
    );
  }

  const onTime =
    workItems.filter(
      (item) =>
        item.status ===
          WorkItemStatus.COMPLETED &&
        item.completedAt !== null &&
        item.dueAt !== null &&
        item.completedAt <=
          item.dueAt
    ).length;

  const overdue =
    workItems.length -
    onTime;

  return {
    measuredValue:
      percentage(
        onTime,
        workItems.length
      ),
    sampleSize:
      workItems.length,
    explanation:
      `${onTime} of ${workItems.length} qualifying Work Items were completed on time.`,
    recommendedAction:
      overdue > 0
        ? "Review overdue Work Items, confirm ownership and agree recovery dates."
        : undefined,
    metadata: {
      qualifying:
        workItems.length,
      onTime,
      overdue
    }
  };
}

async function requestAssignmentRate(
  input: AdapterInput
): Promise<
  KpiCalculationResult
> {
  const activeStatuses = [
    RequestStatus.SUBMITTED,
    RequestStatus.IN_REVIEW,
    RequestStatus.APPROVED,
    RequestStatus.IN_FULFILMENT
  ];

  const requests =
    await prisma.request.findMany({
      where: {
        organizationId:
          input.organizationId,
        ...kpiStructuralScopeFilter(
          input.scope
        ),
        status: {
          in:
            activeStatuses
        },
        submittedAt: {
          not: null,
          gte:
            input.periodStart,
          lte:
            input.periodEnd
        }
      },
      select: {
        id: true,
        assignedToOrganizationUserId:
          true
      },
      orderBy: {
        id: "asc"
      }
    });

  if (
    requests.length === 0
  ) {
    return noEvidence(
      "No qualifying active Requests exist for this scope and period.",
      {
        active: 0,
        assigned: 0,
        unassigned: 0
      }
    );
  }

  const assigned =
    requests.filter(
      (request) =>
        request
          .assignedToOrganizationUserId !==
        null
    ).length;

  const unassigned =
    requests.length -
    assigned;

  return {
    measuredValue:
      percentage(
        assigned,
        requests.length
      ),
    sampleSize:
      requests.length,
    explanation:
      `${assigned} of ${requests.length} qualifying active Requests have an assigned owner.`,
    recommendedAction:
      unassigned > 0
        ? "Assign unowned Requests and confirm responsibility for progressing them."
        : undefined,
    metadata: {
      active:
        requests.length,
      assigned,
      unassigned
    }
  };
}

async function scopedSlaSourceIds(
  input: AdapterInput
) {
  const scopeFilter =
    kpiStructuralScopeFilter(
      input.scope
    );

  const [
    workItems,
    requests
  ] =
    await Promise.all([
      prisma.workItem.findMany({
        where: {
          organizationId:
            input.organizationId,
          ...scopeFilter
        },
        select: {
          id: true
        },
        orderBy: {
          id: "asc"
        }
      }),
      prisma.request.findMany({
        where: {
          organizationId:
            input.organizationId,
          ...scopeFilter
        },
        select: {
          id: true
        },
        orderBy: {
          id: "asc"
        }
      })
    ]);

  return {
    workItemIds:
      workItems.map(
        (item) =>
          item.id
      ),
    requestIds:
      requests.map(
        (request) =>
          request.id
      )
  };
}

async function slaComplianceRate(
  input: AdapterInput
): Promise<
  KpiCalculationResult
> {
  const sourceIds =
    await scopedSlaSourceIds(
      input
    );

  const sourceConditions:
    Prisma.SlaInstanceWhereInput[] =
      [];

  if (
    sourceIds
      .workItemIds.length >
    0
  ) {
    sourceConditions.push({
      sourceType:
        SlaSourceType.WORK_ITEM,
      sourceId: {
        in:
          sourceIds.workItemIds
      }
    });
  }

  if (
    sourceIds
      .requestIds.length >
    0
  ) {
    sourceConditions.push({
      sourceType:
        SlaSourceType.REQUEST,
      sourceId: {
        in:
          sourceIds.requestIds
      }
    });
  }

  if (
    sourceConditions.length ===
    0
  ) {
    return noEvidence(
      "No qualifying SLA source records exist for this scope.",
      {
        qualifying: 0,
        compliant: 0,
        breached: 0
      }
    );
  }

  const instances =
    await prisma.slaInstance.findMany({
      where: {
        organizationId:
          input.organizationId,
        status: {
          not:
            SlaInstanceStatus.CANCELLED
        },
        targetAt: {
          gte:
            input.periodStart,
          lte:
            input.periodEnd
        },
        OR:
          sourceConditions
      },
      select: {
        id: true,
        status: true
      },
      orderBy: {
        id: "asc"
      }
    });

  if (
    instances.length === 0
  ) {
    return noEvidence(
      "No qualifying SLA instances exist for this scope and period.",
      {
        qualifying: 0,
        compliant: 0,
        breached: 0
      }
    );
  }

  const breached =
    instances.filter(
      (instance) =>
        instance.status ===
        SlaInstanceStatus.BREACHED
    ).length;

  const compliant =
    instances.length -
    breached;

  return {
    measuredValue:
      percentage(
        compliant,
        instances.length
      ),
    sampleSize:
      instances.length,
    explanation:
      `${compliant} of ${instances.length} qualifying SLA instances avoided breach.`,
    recommendedAction:
      breached > 0
        ? "Review breached SLA instances and address recurring delivery delays."
        : undefined,
    metadata: {
      qualifying:
        instances.length,
      compliant,
      breached
    }
  };
}

async function attentionResolutionRate(
  input: AdapterInput
): Promise<
  KpiCalculationResult
> {
  const attentionItems =
    await prisma.attentionItem.findMany({
      where: {
        organizationId:
          input.organizationId,
        ...kpiStructuralScopeFilter(
          input.scope
        ),
        detectedAt: {
          gte:
            input.periodStart,
          lte:
            input.periodEnd
        }
      },
      select: {
        id: true,
        status: true,
        resolvedAt: true,
        dismissedAt: true
      },
      orderBy: {
        id: "asc"
      }
    });

  if (
    attentionItems.length === 0
  ) {
    return noEvidence(
      "No qualifying Attention Items were detected for this scope and period.",
      {
        qualifying: 0,
        resolved: 0,
        active: 0,
        dismissed: 0
      }
    );
  }

  const resolved =
    attentionItems.filter(
      (item) =>
        item.status ===
          AttentionItemStatus.RESOLVED &&
        item.resolvedAt !== null &&
        item.resolvedAt >=
          input.periodStart &&
        item.resolvedAt <=
          input.periodEnd
    ).length;

  const dismissed =
    attentionItems.filter(
      (item) =>
        item.status ===
        AttentionItemStatus.DISMISSED
    ).length;

  const active =
    attentionItems.filter(
      (item) =>
        item.status ===
          AttentionItemStatus.OPEN ||
        item.status ===
          AttentionItemStatus.ACKNOWLEDGED
    ).length;

  return {
    measuredValue:
      percentage(
        resolved,
        attentionItems.length
      ),
    sampleSize:
      attentionItems.length,
    explanation:
      `${resolved} of ${attentionItems.length} qualifying Attention Items were resolved during the period.`,
    recommendedAction:
      active > 0
        ? "Review active Attention Items and confirm the next operational action."
        : undefined,
    metadata: {
      qualifying:
        attentionItems.length,
      resolved,
      active,
      dismissed
    }
  };
}

export async function runSystemKpiAdapter(
  rule:
    SupportedSystemKpiRule,
  input: AdapterInput
): Promise<
  KpiCalculationResult
> {
  if (
    input.periodStart >=
      input.periodEnd ||
    input.periodEnd >
      input.evaluatedAt
  ) {
    throw new Error(
      "Invalid KPI adapter reporting period."
    );
  }

  switch (rule) {
    case "WORK_ON_TIME_RATE":
      return workOnTimeRate(
        input
      );

    case "REQUEST_ASSIGNMENT_RATE":
      return requestAssignmentRate(
        input
      );

    case "SLA_COMPLIANCE_RATE":
      return slaComplianceRate(
        input
      );

    case "ATTENTION_RESOLUTION_RATE":
      return attentionResolutionRate(
        input
      );
  }
}
