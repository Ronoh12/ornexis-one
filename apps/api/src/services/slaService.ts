import {
  NotificationPriority,
  SlaEventType,
  SlaInstanceStatus,
  SlaSourceType,
  SlaTargetType
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  createNotification
} from "./notificationService.js";

import type {
  CreateSlaInstanceBody,
  CreateSlaPolicyBody,
  CreateSlaTargetBody,
  SlaInstanceListQuery,
  UpdateSlaPolicyBody,
  UpdateSlaTargetBody
} from "../validators/slaValidator.js";

export type SlaActor = {
  userId: string;
  organizationId: string;
  organizationUserId: string;
};

export type SlaServiceErrorCode =
  | "SLA_POLICY_NOT_FOUND"
  | "SLA_TARGET_NOT_FOUND"
  | "SLA_INSTANCE_NOT_FOUND"
  | "SLA_SOURCE_NOT_FOUND"
  | "SLA_CONFIGURATION_INVALID"
  | "SLA_INSTANCE_EXISTS";

export class SlaServiceError extends Error {
  constructor(
    public readonly code:
      SlaServiceErrorCode,
    message: string
  ) {
    super(message);
    this.name =
      "SlaServiceError";
  }
}

function addMinutes(
  date: Date,
  minutes: number
) {
  return new Date(
    date.getTime() +
      minutes * 60_000
  );
}

function eventKey(
  instanceId: string,
  eventType: SlaEventType
) {
  return [
    "sla",
    instanceId,
    eventType
  ].join(":");
}

async function getPolicyRecord(
  organizationId: string,
  id: string
) {
  const policy =
    await prisma.slaPolicy.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        targets: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

  if (!policy) {
    throw new SlaServiceError(
      "SLA_POLICY_NOT_FOUND",
      "SLA policy not found."
    );
  }

  return policy;
}

async function getTargetRecord(
  organizationId: string,
  id: string
) {
  const target =
    await prisma.slaTarget.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        slaPolicy: true
      }
    });

  if (!target) {
    throw new SlaServiceError(
      "SLA_TARGET_NOT_FOUND",
      "SLA target not found."
    );
  }

  return target;
}

export async function listSlaPolicies(
  organizationId: string
) {
  return prisma.slaPolicy.findMany({
    where: {
      organizationId
    },
    include: {
      targets: {
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getSlaPolicy(
  organizationId: string,
  id: string
) {
  return getPolicyRecord(
    organizationId,
    id
  );
}

export async function createSlaPolicy(
  actor: SlaActor,
  input: CreateSlaPolicyBody
) {
  const policy =
    await prisma.slaPolicy.create({
      data: {
        organizationId:
          actor.organizationId,

        name:
          input.name,

        code:
          input.code,

        description:
          input.description ?? null,

        isActive:
          input.isActive ?? true
      }
    });

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "SLA_POLICY_CREATED",
    entityType:
      "SLA_POLICY",
    entityId:
      policy.id,
    newValues: {
      name:
        policy.name,
      code:
        policy.code,
      isActive:
        policy.isActive
    }
  });

  return policy;
}

export async function updateSlaPolicy(
  actor: SlaActor,
  id: string,
  input: UpdateSlaPolicyBody
) {
  const existing =
    await getPolicyRecord(
      actor.organizationId,
      id
    );

  const updated =
    await prisma.slaPolicy.update({
      where: {
        id:
          existing.id
      },
      data: {
        ...(input.name !== undefined
          ? {
              name:
                input.name
            }
          : {}),

        ...(input.description !== undefined
          ? {
              description:
                input.description
            }
          : {}),

        ...(input.isActive !== undefined
          ? {
              isActive:
                input.isActive
            }
          : {})
      }
    });

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "SLA_POLICY_UPDATED",
    entityType:
      "SLA_POLICY",
    entityId:
      updated.id,
    oldValues: {
      name:
        existing.name,
      description:
        existing.description,
      isActive:
        existing.isActive
    },
    newValues: {
      name:
        updated.name,
      description:
        updated.description,
      isActive:
        updated.isActive
    }
  });

  return updated;
}

export async function createSlaTarget(
  actor: SlaActor,
  slaPolicyId: string,
  input: CreateSlaTargetBody
) {
  const policy =
    await getPolicyRecord(
      actor.organizationId,
      slaPolicyId
    );

  if (
    input.warningMinutesBefore !== undefined &&
    input.warningMinutesBefore !== null &&
    input.warningMinutesBefore >
      input.durationMinutes
  ) {
    throw new SlaServiceError(
      "SLA_CONFIGURATION_INVALID",
      "warningMinutesBefore cannot exceed durationMinutes."
    );
  }

  const target =
    await prisma.slaTarget.create({
      data: {
        organizationId:
          actor.organizationId,

        slaPolicyId:
          policy.id,

        name:
          input.name,

        targetType:
          input.targetType,

        durationMinutes:
          input.durationMinutes,

        warningMinutesBefore:
          input.warningMinutesBefore ?? null,

        escalationMinutesAfter:
          input.escalationMinutesAfter ?? null,

        notifyOnWarning:
          input.notifyOnWarning ?? true,

        notifyOnBreach:
          input.notifyOnBreach ?? true,

        notifyOnEscalation:
          input.notifyOnEscalation ?? true,

        isActive:
          input.isActive ?? true
      }
    });

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "SLA_TARGET_CREATED",
    entityType:
      "SLA_TARGET",
    entityId:
      target.id,
    newValues: {
      slaPolicyId:
        target.slaPolicyId,
      name:
        target.name,
      targetType:
        target.targetType,
      durationMinutes:
        target.durationMinutes
    }
  });

  return target;
}

export async function updateSlaTarget(
  actor: SlaActor,
  id: string,
  input: UpdateSlaTargetBody
) {
  const existing =
    await getTargetRecord(
      actor.organizationId,
      id
    );

  const duration =
    input.durationMinutes ??
    existing.durationMinutes;

  const warning =
    input.warningMinutesBefore === undefined
      ? existing.warningMinutesBefore
      : input.warningMinutesBefore;

  if (
    warning !== null &&
    warning >
      duration
  ) {
    throw new SlaServiceError(
      "SLA_CONFIGURATION_INVALID",
      "warningMinutesBefore cannot exceed durationMinutes."
    );
  }

  const updated =
    await prisma.slaTarget.update({
      where: {
        id:
          existing.id
      },
      data: {
        ...(input.name !== undefined
          ? {
              name:
                input.name
            }
          : {}),

        ...(input.durationMinutes !== undefined
          ? {
              durationMinutes:
                input.durationMinutes
            }
          : {}),

        ...(input.warningMinutesBefore !== undefined
          ? {
              warningMinutesBefore:
                input.warningMinutesBefore
            }
          : {}),

        ...(input.escalationMinutesAfter !== undefined
          ? {
              escalationMinutesAfter:
                input.escalationMinutesAfter
            }
          : {}),

        ...(input.notifyOnWarning !== undefined
          ? {
              notifyOnWarning:
                input.notifyOnWarning
            }
          : {}),

        ...(input.notifyOnBreach !== undefined
          ? {
              notifyOnBreach:
                input.notifyOnBreach
            }
          : {}),

        ...(input.notifyOnEscalation !== undefined
          ? {
              notifyOnEscalation:
                input.notifyOnEscalation
            }
          : {}),

        ...(input.isActive !== undefined
          ? {
              isActive:
                input.isActive
            }
          : {})
      }
    });

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "SLA_TARGET_UPDATED",
    entityType:
      "SLA_TARGET",
    entityId:
      updated.id,
    oldValues: {
      durationMinutes:
        existing.durationMinutes,
      warningMinutesBefore:
        existing.warningMinutesBefore,
      escalationMinutesAfter:
        existing.escalationMinutesAfter,
      isActive:
        existing.isActive
    },
    newValues: {
      durationMinutes:
        updated.durationMinutes,
      warningMinutesBefore:
        updated.warningMinutesBefore,
      escalationMinutesAfter:
        updated.escalationMinutesAfter,
      isActive:
        updated.isActive
    }
  });

  return updated;
}

type SourceSnapshot = {
  id: string;
  title: string;
  assigneeOrganizationUserId:
    string | null;
  completedAt:
    Date | null;
  cancelledAt:
    Date | null;
};

async function getSourceSnapshot(
  organizationId: string,
  sourceType: SlaSourceType,
  sourceId: string
): Promise<SourceSnapshot> {
  if (
    sourceType ===
    SlaSourceType.WORK_ITEM
  ) {
    const item =
      await prisma.workItem.findFirst({
        where: {
          id:
            sourceId,
          organizationId
        },
        select: {
          id: true,
          title: true,
          assigneeOrganizationUserId:
            true,
          completedAt: true,
          cancelledAt: true
        }
      });

    if (!item) {
      throw new SlaServiceError(
        "SLA_SOURCE_NOT_FOUND",
        "Work item source not found."
      );
    }

    return {
      id:
        item.id,
      title:
        item.title,
      assigneeOrganizationUserId:
        item.assigneeOrganizationUserId,
      completedAt:
        item.completedAt,
      cancelledAt:
        item.cancelledAt
    };
  }

  if (
    sourceType ===
    SlaSourceType.REQUEST
  ) {
    const request =
      await prisma.request.findFirst({
        where: {
          id:
            sourceId,
          organizationId
        },
        select: {
          id: true,
          title: true,
          assignedToOrganizationUserId:
            true,
          completedAt: true,
          cancelledAt: true
        }
      });

    if (!request) {
      throw new SlaServiceError(
        "SLA_SOURCE_NOT_FOUND",
        "Request source not found."
      );
    }

    return {
      id:
        request.id,
      title:
        request.title,
      assigneeOrganizationUserId:
        request.assignedToOrganizationUserId,
      completedAt:
        request.completedAt,
      cancelledAt:
        request.cancelledAt
    };
  }

  throw new SlaServiceError(
    "SLA_SOURCE_NOT_FOUND",
    "Unsupported SLA source type."
  );
}

export async function createSlaInstance(
  actor: SlaActor,
  input: CreateSlaInstanceBody
) {
  const policy =
    await getPolicyRecord(
      actor.organizationId,
      input.slaPolicyId
    );

  const target =
    await getTargetRecord(
      actor.organizationId,
      input.slaTargetId
    );

  if (
    target.slaPolicyId !==
    policy.id
  ) {
    throw new SlaServiceError(
      "SLA_CONFIGURATION_INVALID",
      "SLA target does not belong to the selected SLA policy."
    );
  }

  if (
    !policy.isActive ||
    !target.isActive
  ) {
    throw new SlaServiceError(
      "SLA_CONFIGURATION_INVALID",
      "SLA policy and target must both be active."
    );
  }

  const source =
    await getSourceSnapshot(
      actor.organizationId,
      input.sourceType,
      input.sourceId
    );

  const existing =
    await prisma.slaInstance.findFirst({
      where: {
        organizationId:
          actor.organizationId,
        slaTargetId:
          target.id,
        sourceType:
          input.sourceType,
        sourceId:
          source.id
      }
    });

  if (existing) {
    throw new SlaServiceError(
      "SLA_INSTANCE_EXISTS",
      "An SLA instance for this source and target already exists."
    );
  }

  const startedAt =
    input.startedAt
      ? new Date(
          input.startedAt
        )
      : new Date();

  const targetAt =
    addMinutes(
      startedAt,
      target.durationMinutes
    );

  const initialStatus =
    source.cancelledAt
      ? SlaInstanceStatus.CANCELLED
      : source.completedAt
        ? SlaInstanceStatus.SATISFIED
        : SlaInstanceStatus.ACTIVE;

  const instance =
    await prisma.slaInstance.create({
      data: {
        organizationId:
          actor.organizationId,

        slaPolicyId:
          policy.id,

        slaTargetId:
          target.id,

        sourceType:
          input.sourceType,

        sourceId:
          source.id,

        status:
          initialStatus,

        startedAt,
        targetAt,

        ...(source.completedAt
          ? {
              satisfiedAt:
                source.completedAt
            }
          : {}),

        ...(source.cancelledAt
          ? {
              cancelledAt:
                source.cancelledAt
            }
          : {})
      }
    });

  await prisma.slaEvent.create({
    data: {
      organizationId:
        actor.organizationId,

      slaInstanceId:
        instance.id,

      eventType:
        initialStatus ===
        SlaInstanceStatus.SATISFIED
          ? SlaEventType.SATISFIED
          : initialStatus ===
            SlaInstanceStatus.CANCELLED
            ? SlaEventType.CANCELLED
            : SlaEventType.STARTED,

      occurredAt:
        source.completedAt ??
        source.cancelledAt ??
        startedAt,

      idempotencyKey:
        eventKey(
          instance.id,
          initialStatus ===
          SlaInstanceStatus.SATISFIED
            ? SlaEventType.SATISFIED
            : initialStatus ===
              SlaInstanceStatus.CANCELLED
              ? SlaEventType.CANCELLED
              : SlaEventType.STARTED
        ),

      metadata: {
        sourceType:
          input.sourceType,
        sourceId:
          source.id,
        targetAt:
          targetAt.toISOString()
      }
    }
  });

  return getSlaInstance(
    actor.organizationId,
    instance.id
  );
}

export async function listSlaInstances(
  organizationId: string,
  query: SlaInstanceListQuery
) {
  const skip =
    (query.page - 1) *
    query.limit;

  const where = {
    organizationId,

    ...(query.status !== undefined
      ? {
          status:
            query.status
        }
      : {}),

    ...(query.sourceType !== undefined
      ? {
          sourceType:
            query.sourceType
        }
      : {})
  };

  const [
    total,
    items
  ] = await Promise.all([
    prisma.slaInstance.count({
      where
    }),

    prisma.slaInstance.findMany({
      where,

      include: {
        slaPolicy: true,
        slaTarget: true
      },

      orderBy: {
        targetAt:
          "asc"
      },

      skip,

      take:
        query.limit
    })
  ]);

  return {
    items,
    page:
      query.page,
    limit:
      query.limit,
    total,
    pages:
      Math.ceil(
        total /
          query.limit
      )
  };
}

export async function getSlaInstance(
  organizationId: string,
  id: string
) {
  const instance =
    await prisma.slaInstance.findFirst({
      where: {
        id,
        organizationId
      },

      include: {
        slaPolicy: true,
        slaTarget: true,

        events: {
          orderBy: {
            occurredAt:
              "asc"
          }
        }
      }
    });

  if (!instance) {
    throw new SlaServiceError(
      "SLA_INSTANCE_NOT_FOUND",
      "SLA instance not found."
    );
  }

  return instance;
}

async function createEventOnce(
  input: {
    organizationId: string;
    slaInstanceId: string;
    eventType: SlaEventType;
    occurredAt: Date;
    metadata: object;
  }
) {
  const idempotencyKey =
    eventKey(
      input.slaInstanceId,
      input.eventType
    );

  const existing =
    await prisma.slaEvent.findFirst({
      where: {
        organizationId:
          input.organizationId,
        idempotencyKey
      }
    });

  if (existing) {
    return {
      event:
        existing,
      created:
        false
    };
  }

  try {
    const event =
      await prisma.slaEvent.create({
        data: {
          organizationId:
            input.organizationId,

          slaInstanceId:
            input.slaInstanceId,

          eventType:
            input.eventType,

          occurredAt:
            input.occurredAt,

          idempotencyKey,

          metadata:
            input.metadata
        }
      });

    return {
      event,
      created:
        true
    };
  } catch (error) {
    const raced =
      await prisma.slaEvent.findFirst({
        where: {
          organizationId:
            input.organizationId,
          idempotencyKey
        }
      });

    if (raced) {
      return {
        event:
          raced,
        created:
          false
      };
    }

    throw error;
  }
}

async function notifySourceAssignee(
  input: {
    organizationId: string;
    recipientOrganizationUserId:
      string | null;
    sourceType: SlaSourceType;
    sourceId: string;
    sourceTitle: string;
    instanceId: string;
    targetAt: Date;
    eventType: SlaEventType;
  }
) {
  if (
    !input.recipientOrganizationUserId
  ) {
    return;
  }

  const common = {
    organizationId:
      input.organizationId,

    recipientOrganizationUserId:
      input.recipientOrganizationUserId,

    sourceType:
      `SLA_${input.sourceType}`,

    sourceId:
      input.sourceId,

    metadata: {
      slaInstanceId:
        input.instanceId,
      slaEventType:
        input.eventType,
      targetAt:
        input.targetAt.toISOString()
    }
  };

  if (
    input.eventType ===
    SlaEventType.WARNING
  ) {
    await createNotification({
      ...common,
      type:
        "SLA_WARNING",
      title:
        "SLA target approaching",
      message:
        `"${input.sourceTitle}" is approaching its SLA target.`,
      priority:
        NotificationPriority.HIGH
    });
  }

  if (
    input.eventType ===
    SlaEventType.BREACHED
  ) {
    await createNotification({
      ...common,
      type:
        "SLA_BREACHED",
      title:
        "SLA breached",
      message:
        `"${input.sourceTitle}" has breached its SLA target.`,
      priority:
        NotificationPriority.CRITICAL
    });
  }

  if (
    input.eventType ===
    SlaEventType.ESCALATED
  ) {
    await createNotification({
      ...common,
      type:
        "SLA_ESCALATED",
      title:
        "SLA escalated",
      message:
        `"${input.sourceTitle}" requires escalation.`,
      priority:
        NotificationPriority.CRITICAL
    });
  }
}

export async function evaluateSlaInstance(
  organizationId: string,
  instanceId: string,
  now = new Date()
) {
  const instance =
    await getSlaInstance(
      organizationId,
      instanceId
    );

  if (
    instance.status ===
      SlaInstanceStatus.SATISFIED ||
    instance.status ===
      SlaInstanceStatus.CANCELLED
  ) {
    return {
      instance,
      warningCreated:
        false,
      breachCreated:
        false,
      escalationCreated:
        false,
      satisfied:
        false,
      cancelled:
        false
    };
  }

  const source =
    await getSourceSnapshot(
      organizationId,
      instance.sourceType,
      instance.sourceId
    );

  if (source.cancelledAt) {
    const cancelled =
      await createEventOnce({
        organizationId,
        slaInstanceId:
          instance.id,
        eventType:
          SlaEventType.CANCELLED,
        occurredAt:
          source.cancelledAt,
        metadata: {
          sourceId:
            source.id
        }
      });

    const updated =
      await prisma.slaInstance.update({
        where: {
          id:
            instance.id
        },
        data: {
          status:
            SlaInstanceStatus.CANCELLED,
          cancelledAt:
            source.cancelledAt
        }
      });

    return {
      instance:
        updated,
      warningCreated:
        false,
      breachCreated:
        false,
      escalationCreated:
        false,
      satisfied:
        false,
      cancelled:
        cancelled.created
    };
  }

  if (source.completedAt) {
    const satisfied =
      await createEventOnce({
        organizationId,
        slaInstanceId:
          instance.id,
        eventType:
          SlaEventType.SATISFIED,
        occurredAt:
          source.completedAt,
        metadata: {
          sourceId:
            source.id,
          completedAt:
            source.completedAt.toISOString()
        }
      });

    const updated =
      await prisma.slaInstance.update({
        where: {
          id:
            instance.id
        },
        data: {
          status:
            SlaInstanceStatus.SATISFIED,
          satisfiedAt:
            source.completedAt
        }
      });

    return {
      instance:
        updated,
      warningCreated:
        false,
      breachCreated:
        false,
      escalationCreated:
        false,
      satisfied:
        satisfied.created,
      cancelled:
        false
    };
  }

  let warningCreated =
    false;

  let breachCreated =
    false;

  let escalationCreated =
    false;

  const target =
    instance.slaTarget;

  if (
    target.warningMinutesBefore !== null
  ) {
    const warningAt =
      addMinutes(
        instance.targetAt,
        -target.warningMinutesBefore
      );

    if (
      now >= warningAt
    ) {
      const warning =
        await createEventOnce({
          organizationId,
          slaInstanceId:
            instance.id,
          eventType:
            SlaEventType.WARNING,
          occurredAt:
            now,
          metadata: {
            warningAt:
              warningAt.toISOString(),
            targetAt:
              instance.targetAt.toISOString()
          }
        });

      warningCreated =
        warning.created;

      if (
        warning.created &&
        target.notifyOnWarning
      ) {
        await notifySourceAssignee({
          organizationId,
          recipientOrganizationUserId:
            source.assigneeOrganizationUserId,
          sourceType:
            instance.sourceType,
          sourceId:
            source.id,
          sourceTitle:
            source.title,
          instanceId:
            instance.id,
          targetAt:
            instance.targetAt,
          eventType:
            SlaEventType.WARNING
        });
      }
    }
  }

  if (
    now >=
    instance.targetAt
  ) {
    const breach =
      await createEventOnce({
        organizationId,
        slaInstanceId:
          instance.id,
        eventType:
          SlaEventType.BREACHED,
        occurredAt:
          now,
        metadata: {
          targetAt:
            instance.targetAt.toISOString()
        }
      });

    breachCreated =
      breach.created;

    if (
      breach.created &&
      target.notifyOnBreach
    ) {
      await notifySourceAssignee({
        organizationId,
        recipientOrganizationUserId:
          source.assigneeOrganizationUserId,
        sourceType:
          instance.sourceType,
        sourceId:
          source.id,
        sourceTitle:
          source.title,
        instanceId:
          instance.id,
        targetAt:
          instance.targetAt,
        eventType:
          SlaEventType.BREACHED
      });
    }
  }

  if (
    target.escalationMinutesAfter !== null
  ) {
    const escalationAt =
      addMinutes(
        instance.targetAt,
        target.escalationMinutesAfter
      );

    if (
      now >= escalationAt
    ) {
      const escalation =
        await createEventOnce({
          organizationId,
          slaInstanceId:
            instance.id,
          eventType:
            SlaEventType.ESCALATED,
          occurredAt:
            now,
          metadata: {
            escalationAt:
              escalationAt.toISOString(),
            targetAt:
              instance.targetAt.toISOString()
          }
        });

      escalationCreated =
        escalation.created;

      if (
        escalation.created &&
        target.notifyOnEscalation
      ) {
        await notifySourceAssignee({
          organizationId,
          recipientOrganizationUserId:
            source.assigneeOrganizationUserId,
          sourceType:
            instance.sourceType,
          sourceId:
            source.id,
          sourceTitle:
            source.title,
          instanceId:
            instance.id,
          targetAt:
            instance.targetAt,
          eventType:
            SlaEventType.ESCALATED
        });
      }
    }
  }

  let finalInstance =
    instance;

  if (
    now >= instance.targetAt &&
    instance.status ===
      SlaInstanceStatus.ACTIVE
  ) {
    finalInstance =
      await prisma.slaInstance.update({
        where: {
          id:
            instance.id
        },
        data: {
          status:
            SlaInstanceStatus.BREACHED,
          breachedAt:
            instance.breachedAt ??
            now
        },
        include: {
          slaPolicy: true,
          slaTarget: true,
          events: {
            orderBy: {
              occurredAt:
                "asc"
            }
          }
        }
      });
  }

  return {
    instance:
      finalInstance,
    warningCreated,
    breachCreated,
    escalationCreated,
    satisfied:
      false,
    cancelled:
      false
  };
}

export async function evaluateOrganizationSla(
  organizationId: string,
  input?: {
    limit?: number;
    now?: Date;
  }
) {
  const now =
    input?.now ??
    new Date();

  const limit =
    input?.limit ??
    100;

  const instances =
    await prisma.slaInstance.findMany({
      where: {
        organizationId,
        status: {
          in: [
            SlaInstanceStatus.ACTIVE,
            SlaInstanceStatus.BREACHED
          ]
        }
      },
      orderBy: {
        targetAt:
          "asc"
      },
      take:
        limit,
      select: {
        id: true
      }
    });

  const result = {
    scanned:
      instances.length,
    warned:
      0,
    breached:
      0,
    escalated:
      0,
    satisfied:
      0,
    cancelled:
      0,
    failed:
      0
  };

  for (
    const instance
    of instances
  ) {
    try {
      const evaluation =
        await evaluateSlaInstance(
          organizationId,
          instance.id,
          now
        );

      if (
        evaluation.warningCreated
      ) {
        result.warned += 1;
      }

      if (
        evaluation.breachCreated
      ) {
        result.breached += 1;
      }

      if (
        evaluation.escalationCreated
      ) {
        result.escalated += 1;
      }

      if (
        evaluation.satisfied
      ) {
        result.satisfied += 1;
      }

      if (
        evaluation.cancelled
      ) {
        result.cancelled += 1;
      }
    } catch {
      result.failed += 1;
    }
  }

  return {
    organizationId,
    evaluatedAt:
      now,
    ...result
  };
}

export async function evaluateAllOrganizationsSla(
  input?: {
    limitPerOrganization?: number;
    now?: Date;
  }
) {
  const organizations =
    await prisma.organization.findMany({
      select: {
        id: true
      }
    });

  const results = [];

  for (
    const organization
    of organizations
  ) {
    results.push(
      await evaluateOrganizationSla(
        organization.id,
        {
          ...(input?.limitPerOrganization !== undefined
            ? {
                limit:
                  input.limitPerOrganization
              }
            : {}),

          ...(input?.now !== undefined
            ? {
                now:
                  input.now
              }
            : {})
        }
      )
    );
  }

  return {
    organizations:
      results.length,

    scanned:
      results.reduce(
        (
          total,
          value
        ) =>
          total +
          value.scanned,
        0
      ),

    warned:
      results.reduce(
        (total, value) =>
          total +
          value.warned,
        0
      ),

    breached:
      results.reduce(
        (total, value) =>
          total +
          value.breached,
        0
      ),

    escalated:
      results.reduce(
        (total, value) =>
          total +
          value.escalated,
        0
      ),

    satisfied:
      results.reduce(
        (total, value) =>
          total +
          value.satisfied,
        0
      ),

    cancelled:
      results.reduce(
        (total, value) =>
          total +
          value.cancelled,
        0
      ),

    failed:
      results.reduce(
        (total, value) =>
          total +
          value.failed,
        0
      ),

    results
  };
}

/*
 * Exported only so acceptance tests can verify the foundation's
 * supported target types without relying on string duplication.
 */
export const supportedSlaTargetTypes =
  Object.values(
    SlaTargetType
  );
