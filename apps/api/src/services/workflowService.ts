import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

export class WorkflowServiceError extends Error {
  code: string;

  constructor(
    code: string,
    message: string
  ) {
    super(message);
    this.name = "WorkflowServiceError";
    this.code = code;
  }
}

export type WorkflowActor = {
  organizationId: string;
  organizationUserId: string;
  userId?: string;
};

export type CreateWorkflowDefinitionInput = {
  name: string;
  code: string;
  description?: string | null;
  entityType: string;
  version?: number;
  isActive?: boolean;
};

export type UpdateWorkflowDefinitionInput = {
  name?: string;
  description?: string | null;
  entityType?: string;
  isActive?: boolean;
};

export type CreateWorkflowStateInput = {
  name: string;
  code: string;
  description?: string | null;
  position?: number;
  isInitial?: boolean;
  isTerminal?: boolean;
};

export type UpdateWorkflowStateInput = {
  name?: string;
  description?: string | null;
  position?: number;
  isInitial?: boolean;
  isTerminal?: boolean;
};

export type CreateWorkflowTransitionInput = {
  fromStateId: string;
  toStateId: string;
  name: string;
  code: string;
  description?: string | null;
  requiresApproval?: boolean;
  conditionConfig?: unknown | null;
  position?: number;
  isActive?: boolean;
};

export type UpdateWorkflowTransitionInput = {
  name?: string;
  description?: string | null;
  requiresApproval?: boolean;
  conditionConfig?: unknown | null;
  position?: number;
  isActive?: boolean;
};

const workflowDefinitionInclude = {
  states: {
    orderBy: {
      position: "asc"
    }
  },

  transitions: {
    include: {
      fromState: true,
      toState: true
    },

    orderBy: {
      position: "asc"
    }
  },

  approvalSteps: {
    include: {
      workflowState: true
    },

    orderBy: {
      position: "asc"
    }
  }
} satisfies Prisma.WorkflowDefinitionInclude;

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function jsonValue(
  value: unknown | null | undefined
):
  | Prisma.InputJsonValue
  | Prisma.NullableJsonNullValueInput
  | undefined {

  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

async function requireDefinition(
  organizationId: string,
  workflowDefinitionId: string
) {
  const definition =
    await prisma.workflowDefinition.findFirst({
      where: {
        id: workflowDefinitionId,
        organizationId
      }
    });

  if (!definition) {
    throw new WorkflowServiceError(
      "WORKFLOW_DEFINITION_NOT_FOUND",
      "Workflow definition was not found."
    );
  }

  return definition;
}

async function requireState(
  organizationId: string,
  workflowDefinitionId: string,
  stateId: string
) {
  const state =
    await prisma.workflowState.findFirst({
      where: {
        id: stateId,
        organizationId,
        workflowDefinitionId
      }
    });

  if (!state) {
    throw new WorkflowServiceError(
      "WORKFLOW_STATE_NOT_FOUND",
      "Workflow state was not found in this workflow definition."
    );
  }

  return state;
}

export async function listWorkflowDefinitions(
  organizationId: string
) {
  return prisma.workflowDefinition.findMany({
    where: {
      organizationId
    },

    include: workflowDefinitionInclude,

    orderBy: [
      {
        name: "asc"
      },
      {
        version: "desc"
      }
    ]
  });
}

export async function getWorkflowDefinition(
  organizationId: string,
  workflowDefinitionId: string
) {
  const definition =
    await prisma.workflowDefinition.findFirst({
      where: {
        id: workflowDefinitionId,
        organizationId
      },

      include: workflowDefinitionInclude
    });

  if (!definition) {
    throw new WorkflowServiceError(
      "WORKFLOW_DEFINITION_NOT_FOUND",
      "Workflow definition was not found."
    );
  }

  return definition;
}

export async function createWorkflowDefinition(
  actor: WorkflowActor,
  input: CreateWorkflowDefinitionInput
) {
  const code = normalizeCode(input.code);

  if (!code) {
    throw new WorkflowServiceError(
      "INVALID_WORKFLOW_CODE",
      "Workflow code cannot be empty."
    );
  }

  const version = input.version ?? 1;

  const existing =
    await prisma.workflowDefinition.findFirst({
      where: {
        organizationId: actor.organizationId,
        code,
        version
      }
    });

  if (existing) {
    throw new WorkflowServiceError(
      "WORKFLOW_CODE_EXISTS",
      "A workflow definition with this code and version already exists."
    );
  }

  return prisma.workflowDefinition.create({
    data: {
      organizationId: actor.organizationId,
      name: input.name.trim(),
      code,

      ...(input.description !== undefined
        ? {
            description: input.description
          }
        : {}),

      entityType: input.entityType.trim(),
      version,

      ...(input.isActive !== undefined
        ? {
            isActive: input.isActive
          }
        : {})
    },

    include: workflowDefinitionInclude
  });
}

export async function updateWorkflowDefinition(
  actor: WorkflowActor,
  workflowDefinitionId: string,
  input: UpdateWorkflowDefinitionInput
) {
  await requireDefinition(
    actor.organizationId,
    workflowDefinitionId
  );

  return prisma.workflowDefinition.update({
    where: {
      id: workflowDefinitionId
    },

    data: {
      ...(input.name !== undefined
        ? {
            name: input.name.trim()
          }
        : {}),

      ...(input.description !== undefined
        ? {
            description: input.description
          }
        : {}),

      ...(input.entityType !== undefined
        ? {
            entityType: input.entityType.trim()
          }
        : {}),

      ...(input.isActive !== undefined
        ? {
            isActive: input.isActive
          }
        : {})
    },

    include: workflowDefinitionInclude
  });
}

export async function createWorkflowState(
  actor: WorkflowActor,
  workflowDefinitionId: string,
  input: CreateWorkflowStateInput
) {
  await requireDefinition(
    actor.organizationId,
    workflowDefinitionId
  );

  const code = normalizeCode(input.code);

  if (!code) {
    throw new WorkflowServiceError(
      "INVALID_WORKFLOW_STATE_CODE",
      "Workflow state code cannot be empty."
    );
  }

  return prisma.$transaction(async (tx) => {

    const existing =
      await tx.workflowState.findFirst({
        where: {
          organizationId:
            actor.organizationId,

          workflowDefinitionId,

          code
        }
      });

    if (existing) {
      throw new WorkflowServiceError(
        "WORKFLOW_STATE_CODE_EXISTS",
        "A state with this code already exists in the workflow."
      );
    }

    if (input.isInitial === true) {
      await tx.workflowState.updateMany({
        where: {
          organizationId:
            actor.organizationId,

          workflowDefinitionId,

          isInitial: true
        },

        data: {
          isInitial: false
        }
      });
    }

    return tx.workflowState.create({
      data: {
        organizationId:
          actor.organizationId,

        workflowDefinitionId,

        name: input.name.trim(),

        code,

        ...(input.description !== undefined
          ? {
              description: input.description
            }
          : {}),

        ...(input.position !== undefined
          ? {
              position: input.position
            }
          : {}),

        ...(input.isInitial !== undefined
          ? {
              isInitial: input.isInitial
            }
          : {}),

        ...(input.isTerminal !== undefined
          ? {
              isTerminal: input.isTerminal
            }
          : {})
      }
    });
  });
}

export async function updateWorkflowState(
  actor: WorkflowActor,
  workflowDefinitionId: string,
  stateId: string,
  input: UpdateWorkflowStateInput
) {
  await requireState(
    actor.organizationId,
    workflowDefinitionId,
    stateId
  );

  return prisma.$transaction(async (tx) => {

    if (input.isInitial === true) {
      await tx.workflowState.updateMany({
        where: {
          organizationId:
            actor.organizationId,

          workflowDefinitionId,

          isInitial: true,

          NOT: {
            id: stateId
          }
        },

        data: {
          isInitial: false
        }
      });
    }

    return tx.workflowState.update({
      where: {
        id: stateId
      },

      data: {
        ...(input.name !== undefined
          ? {
              name: input.name.trim()
            }
          : {}),

        ...(input.description !== undefined
          ? {
              description: input.description
            }
          : {}),

        ...(input.position !== undefined
          ? {
              position: input.position
            }
          : {}),

        ...(input.isInitial !== undefined
          ? {
              isInitial: input.isInitial
            }
          : {}),

        ...(input.isTerminal !== undefined
          ? {
              isTerminal: input.isTerminal
            }
          : {})
      }
    });
  });
}

export async function createWorkflowTransition(
  actor: WorkflowActor,
  workflowDefinitionId: string,
  input: CreateWorkflowTransitionInput
) {
  await requireDefinition(
    actor.organizationId,
    workflowDefinitionId
  );

  await requireState(
    actor.organizationId,
    workflowDefinitionId,
    input.fromStateId
  );

  await requireState(
    actor.organizationId,
    workflowDefinitionId,
    input.toStateId
  );

  if (input.fromStateId === input.toStateId) {
    throw new WorkflowServiceError(
      "INVALID_WORKFLOW_TRANSITION",
      "A workflow transition cannot point to the same state."
    );
  }

  const code = normalizeCode(input.code);

  if (!code) {
    throw new WorkflowServiceError(
      "INVALID_WORKFLOW_TRANSITION_CODE",
      "Workflow transition code cannot be empty."
    );
  }

  const existing =
    await prisma.workflowTransition.findFirst({
      where: {
        organizationId:
          actor.organizationId,

        workflowDefinitionId,

        code
      }
    });

  if (existing) {
    throw new WorkflowServiceError(
      "WORKFLOW_TRANSITION_CODE_EXISTS",
      "A transition with this code already exists in the workflow."
    );
  }

  const conditionConfig =
    jsonValue(input.conditionConfig);

  return prisma.workflowTransition.create({
    data: {
      organizationId:
        actor.organizationId,

      workflowDefinitionId,

      fromStateId:
        input.fromStateId,

      toStateId:
        input.toStateId,

      name:
        input.name.trim(),

      code,

      ...(input.description !== undefined
        ? {
            description: input.description
          }
        : {}),

      ...(input.requiresApproval !== undefined
        ? {
            requiresApproval:
              input.requiresApproval
          }
        : {}),

      ...(conditionConfig !== undefined
        ? {
            conditionConfig
          }
        : {}),

      ...(input.position !== undefined
        ? {
            position: input.position
          }
        : {}),

      ...(input.isActive !== undefined
        ? {
            isActive: input.isActive
          }
        : {})
    },

    include: {
      fromState: true,
      toState: true
    }
  });
}

export async function updateWorkflowTransition(
  actor: WorkflowActor,
  workflowDefinitionId: string,
  transitionId: string,
  input: UpdateWorkflowTransitionInput
) {
  const transition =
    await prisma.workflowTransition.findFirst({
      where: {
        id: transitionId,

        organizationId:
          actor.organizationId,

        workflowDefinitionId
      }
    });

  if (!transition) {
    throw new WorkflowServiceError(
      "WORKFLOW_TRANSITION_NOT_FOUND",
      "Workflow transition was not found."
    );
  }

  const conditionConfig =
    jsonValue(input.conditionConfig);

  return prisma.workflowTransition.update({
    where: {
      id: transitionId
    },

    data: {
      ...(input.name !== undefined
        ? {
            name: input.name.trim()
          }
        : {}),

      ...(input.description !== undefined
        ? {
            description: input.description
          }
        : {}),

      ...(input.requiresApproval !== undefined
        ? {
            requiresApproval:
              input.requiresApproval
          }
        : {}),

      ...(conditionConfig !== undefined
        ? {
            conditionConfig
          }
        : {}),

      ...(input.position !== undefined
        ? {
            position: input.position
          }
        : {}),

      ...(input.isActive !== undefined
        ? {
            isActive: input.isActive
          }
        : {})
    },

    include: {
      fromState: true,
      toState: true
    }
  });
}


// =========================================================
// Sprint 013 — Workflow Runtime Engine
// =========================================================

export type StartWorkflowInput = {
  workflowDefinitionId: string;
  entityType: string;
  entityId: string;
  contextData?: unknown;
};

export type WorkflowTransitionActionInput = {
  transitionId: string;
  comment?: string | null;
};

export type CancelWorkflowInput = {
  comment?: string | null;
};


// ---------------------------------------------------------
// Get Workflow Instance
// ---------------------------------------------------------

export async function getWorkflowInstance(
  organizationId: string,
  workflowInstanceId: string
) {
  const instance =
    await prisma.workflowInstance.findFirst({
      where: {
        id: workflowInstanceId,
        organizationId
      },

      include: {
        workflowDefinition: true,
        currentState: true,

        history: {
          include: {
            fromState: true,
            toState: true,
            actor: true
          },

          orderBy: {
            occurredAt: "asc"
          }
        },

        approvalDecisions: {
          include: {
            approvalStep: true,
            approver: true
          },

          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

  if (!instance) {
    throw new WorkflowServiceError(
      "WORKFLOW_INSTANCE_NOT_FOUND",
      "Workflow instance was not found."
    );
  }

  return instance;
}


// ---------------------------------------------------------
// Start Workflow
// ---------------------------------------------------------

export async function startWorkflow(
  actor: WorkflowActor,
  input: StartWorkflowInput
) {
  const definition =
    await prisma.workflowDefinition.findFirst({
      where: {
        id: input.workflowDefinitionId,
        organizationId: actor.organizationId,
        isActive: true
      },

      include: {
        states: {
          orderBy: {
            position: "asc"
          }
        }
      }
    });

  if (!definition) {
    throw new WorkflowServiceError(
      "WORKFLOW_DEFINITION_NOT_FOUND",
      "Active workflow definition was not found."
    );
  }

  const requestedEntityType =
    input.entityType.trim().toUpperCase();

  const definitionEntityType =
    definition.entityType.trim().toUpperCase();

  if (
    requestedEntityType !==
    definitionEntityType
  ) {
    throw new WorkflowServiceError(
      "WORKFLOW_ENTITY_TYPE_MISMATCH",
      "The entity type does not match the workflow definition."
    );
  }

  const initialStates =
    definition.states.filter(
      (state) => state.isInitial
    );

  if (initialStates.length === 0) {
    throw new WorkflowServiceError(
      "WORKFLOW_INITIAL_STATE_MISSING",
      "The workflow definition does not have an initial state."
    );
  }

  if (initialStates.length > 1) {
    throw new WorkflowServiceError(
      "WORKFLOW_INITIAL_STATE_AMBIGUOUS",
      "The workflow definition has more than one initial state."
    );
  }

  const initialState =
    initialStates[0]!;

  const contextData =
    jsonValue(input.contextData);

  return prisma.$transaction(
    async (tx) => {
      const instance =
        await tx.workflowInstance.create({
          data: {
            organizationId:
              actor.organizationId,

            workflowDefinitionId:
              definition.id,

            entityType:
              requestedEntityType,

            entityId:
              input.entityId,

            currentStateId:
              initialState.id,

            status:
              "ACTIVE",

            startedByOrganizationUserId:
              actor.organizationUserId,

            ...(contextData !== undefined
              ? {
                  contextData
                }
              : {})
          }
        });

      await tx.workflowHistory.create({
        data: {
          organizationId:
            actor.organizationId,

          workflowInstanceId:
            instance.id,

          fromStateId:
            null,

          toStateId:
            initialState.id,

          actorOrganizationUserId:
            actor.organizationUserId,

          action:
            "STARTED",

          comment:
            null
        }
      });

      return tx.workflowInstance.findUnique({
        where: {
          id: instance.id
        },

        include: {
          workflowDefinition: true,
          currentState: true,

          history: {
            include: {
              fromState: true,
              toState: true,
              actor: true
            },

            orderBy: {
              occurredAt: "asc"
            }
          }
        }
      });
    }
  );
}


// ---------------------------------------------------------
// Execute Workflow Transition
// ---------------------------------------------------------

export async function transitionWorkflow(
  actor: WorkflowActor,
  workflowInstanceId: string,
  input: WorkflowTransitionActionInput
) {
  return prisma.$transaction(
    async (tx) => {
      const instance =
        await tx.workflowInstance.findFirst({
          where: {
            id: workflowInstanceId,
            organizationId:
              actor.organizationId
          },

          include: {
            currentState: true
          }
        });

      if (!instance) {
        throw new WorkflowServiceError(
          "WORKFLOW_INSTANCE_NOT_FOUND",
          "Workflow instance was not found."
        );
      }

      if (instance.status !== "ACTIVE") {
        throw new WorkflowServiceError(
          "WORKFLOW_INSTANCE_NOT_ACTIVE",
          "Only active workflow instances can transition."
        );
      }

      const transition =
        await tx.workflowTransition.findFirst({
          where: {
            id: input.transitionId,

            organizationId:
              actor.organizationId,

            workflowDefinitionId:
              instance.workflowDefinitionId,

            isActive: true
          },

          include: {
            fromState: true,
            toState: true
          }
        });

      if (!transition) {
        throw new WorkflowServiceError(
          "WORKFLOW_TRANSITION_NOT_FOUND",
          "Active workflow transition was not found."
        );
      }

      if (
        transition.fromStateId !==
        instance.currentStateId
      ) {
        throw new WorkflowServiceError(
          "INVALID_WORKFLOW_CURRENT_STATE",
          "The transition cannot be executed from the current workflow state."
        );
      }

      if (transition.requiresApproval) {
        const requiredApprovalSteps =
          await tx.approvalStep.findMany({
            where: {
              organizationId:
                actor.organizationId,

              workflowDefinitionId:
                instance.workflowDefinitionId,

              workflowStateId:
                instance.currentStateId,

              isRequired: true,
              isActive: true
            },

            orderBy: {
              position: "asc"
            }
          });

        if (requiredApprovalSteps.length === 0) {
          throw new WorkflowServiceError(
            "WORKFLOW_APPROVAL_CONFIGURATION_MISSING",
            "This transition requires approval, but the current workflow state has no active required approval steps."
          );
        }

        for (
          const approvalStep
          of requiredApprovalSteps
        ) {
          const approvedCount =
            await tx.approvalDecision.count({
              where: {
                organizationId:
                  actor.organizationId,

                workflowInstanceId:
                  instance.id,

                approvalStepId:
                  approvalStep.id,

                decision:
                  "APPROVED"
              }
            });

          const rejectedCount =
            await tx.approvalDecision.count({
              where: {
                organizationId:
                  actor.organizationId,

                workflowInstanceId:
                  instance.id,

                approvalStepId:
                  approvalStep.id,

                decision:
                  "REJECTED"
              }
            });

          if (rejectedCount > 0) {
            throw new WorkflowServiceError(
              "WORKFLOW_APPROVAL_REJECTED",
              `Required approval step "${approvalStep.name}" has been rejected.`
            );
          }

          if (
            approvedCount <
            approvalStep.minimumApprovals
          ) {
            throw new WorkflowServiceError(
              "WORKFLOW_APPROVAL_PENDING",
              `Required approval step "${approvalStep.name}" needs ${approvalStep.minimumApprovals} approval(s), but currently has ${approvedCount}.`
            );
          }
        }
      }

      const now = new Date();

      const completed =
        transition.toState.isTerminal;

      const updated =
        await tx.workflowInstance.update({
          where: {
            id: instance.id
          },

          data: {
            currentStateId:
              transition.toStateId,

            ...(completed
              ? {
                  status:
                    "COMPLETED",

                  completedAt:
                    now,

                  completedByOrganizationUserId:
                    actor.organizationUserId
                }
              : {})
          }
        });

      await tx.workflowHistory.create({
        data: {
          organizationId:
            actor.organizationId,

          workflowInstanceId:
            instance.id,

          fromStateId:
            transition.fromStateId,

          toStateId:
            transition.toStateId,

          actorOrganizationUserId:
            actor.organizationUserId,

          action:
            completed
              ? "COMPLETED"
              : "TRANSITIONED",

          comment:
            input.comment ?? null
        }
      });

      return tx.workflowInstance.findUnique({
        where: {
          id: updated.id
        },

        include: {
          workflowDefinition: true,
          currentState: true,

          history: {
            include: {
              fromState: true,
              toState: true,
              actor: true
            },

            orderBy: {
              occurredAt: "asc"
            }
          }
        }
      });
    }
  );
}


// ---------------------------------------------------------
// Cancel Workflow
// ---------------------------------------------------------

export async function cancelWorkflow(
  actor: WorkflowActor,
  workflowInstanceId: string,
  input: CancelWorkflowInput
) {
  return prisma.$transaction(
    async (tx) => {
      const instance =
        await tx.workflowInstance.findFirst({
          where: {
            id: workflowInstanceId,
            organizationId:
              actor.organizationId
          }
        });

      if (!instance) {
        throw new WorkflowServiceError(
          "WORKFLOW_INSTANCE_NOT_FOUND",
          "Workflow instance was not found."
        );
      }

      if (instance.status !== "ACTIVE") {
        throw new WorkflowServiceError(
          "WORKFLOW_INSTANCE_NOT_ACTIVE",
          "Only active workflow instances can be cancelled."
        );
      }

      const now = new Date();

      const updated =
        await tx.workflowInstance.update({
          where: {
            id: instance.id
          },

          data: {
            status:
              "CANCELLED",

            completedAt:
              now,

            completedByOrganizationUserId:
              actor.organizationUserId
          }
        });

      await tx.workflowHistory.create({
        data: {
          organizationId:
            actor.organizationId,

          workflowInstanceId:
            instance.id,

          fromStateId:
            instance.currentStateId,

          toStateId:
            instance.currentStateId,

          actorOrganizationUserId:
            actor.organizationUserId,

          action:
            "CANCELLED",

          comment:
            input.comment ?? null
        }
      });

      return tx.workflowInstance.findUnique({
        where: {
          id: updated.id
        },

        include: {
          workflowDefinition: true,
          currentState: true,

          history: {
            include: {
              fromState: true,
              toState: true,
              actor: true
            },

            orderBy: {
              occurredAt: "asc"
            }
          }
        }
      });
    }
  );
}

// =========================================================
// Sprint 013 — Approval Runtime
// =========================================================

export type CreateApprovalStepInput = {
  workflowStateId: string;
  name: string;
  code: string;
  description?: string | null;
  position?: number;
  approverType: string;
  approverConfig?: unknown;
  minimumApprovals?: number;
  allowSelfApproval?: boolean;
  isRequired?: boolean;
  isActive?: boolean;
};

export type ApprovalDecisionInput = {
  approvalStepId: string;
  decision: "APPROVED" | "REJECTED";
  comment?: string | null;
};

type ApprovalConfigRecord =
  Record<string, unknown>;

function asApprovalConfigRecord(
  value: unknown
): ApprovalConfigRecord {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as ApprovalConfigRecord;
}

function configuredApproverUserIds(
  value: unknown
) {
  const config =
    asApprovalConfigRecord(value);

  const rawIds =
    config.organizationUserIds;

  if (!Array.isArray(rawIds)) {
    return [];
  }

  return rawIds.filter(
    (value): value is string =>
      typeof value === "string" &&
      value.trim().length > 0
  );
}

function assertApprovalEligibility(
  organizationUserId: string,
  approverType: string,
  approverConfig: unknown
) {
  const type =
    approverType
      .trim()
      .toUpperCase();

  if (type === "ANY") {
    return;
  }

  if (type === "USER") {
    const allowedUserIds =
      configuredApproverUserIds(
        approverConfig
      );

    if (allowedUserIds.length === 0) {
      throw new WorkflowServiceError(
        "APPROVER_CONFIGURATION_INVALID",
        "USER approval steps require approverConfig.organizationUserIds."
      );
    }

    if (
      !allowedUserIds.includes(
        organizationUserId
      )
    ) {
      throw new WorkflowServiceError(
        "APPROVER_NOT_ELIGIBLE",
        "This organization user is not configured as an approver for this step."
      );
    }

    return;
  }

  throw new WorkflowServiceError(
    "APPROVER_TYPE_UNSUPPORTED",
    `Unsupported approver type: ${approverType}.`
  );
}


// ---------------------------------------------------------
// Create Approval Step
// ---------------------------------------------------------

export async function createApprovalStep(
  actor: WorkflowActor,
  workflowDefinitionId: string,
  input: CreateApprovalStepInput
) {
  const definition =
    await prisma.workflowDefinition.findFirst({
      where: {
        id: workflowDefinitionId,
        organizationId: actor.organizationId
      }
    });

  if (!definition) {
    throw new WorkflowServiceError(
      "WORKFLOW_DEFINITION_NOT_FOUND",
      "Workflow definition was not found."
    );
  }

  const state =
    await prisma.workflowState.findFirst({
      where: {
        id: input.workflowStateId,
        organizationId: actor.organizationId,
        workflowDefinitionId
      }
    });

  if (!state) {
    throw new WorkflowServiceError(
      "WORKFLOW_STATE_NOT_FOUND",
      "Workflow state was not found."
    );
  }

  const code =
    normalizeCode(input.code);

  if (!code) {
    throw new WorkflowServiceError(
      "INVALID_APPROVAL_STEP_CODE",
      "Approval step code cannot be empty."
    );
  }

  const duplicateStep =
    await prisma.approvalStep.findFirst({
      where: {
        organizationId:
          actor.organizationId,

        workflowDefinitionId,

        code
      }
    });

  if (duplicateStep) {
    throw new WorkflowServiceError(
      "APPROVAL_STEP_CODE_EXISTS",
      "An approval step with this code already exists in the workflow."
    );
  }

  if (
    input.minimumApprovals !== undefined &&
    input.minimumApprovals < 1
  ) {
    throw new WorkflowServiceError(
      "INVALID_MINIMUM_APPROVALS",
      "minimumApprovals must be at least 1."
    );
  }

  return prisma.approvalStep.create({
    data: {
      organizationId:
        actor.organizationId,

      workflowDefinitionId,

      workflowStateId:
        input.workflowStateId,

      name:
        input.name,

      code,

      description:
        input.description ?? null,

      position:
        input.position ?? 0,

      approverType:
        input.approverType,

      approverConfig:
        input.approverConfig === undefined
          ? undefined
          : (input.approverConfig as any),

      minimumApprovals:
        input.minimumApprovals ?? 1,

      allowSelfApproval:
        input.allowSelfApproval ?? false,

      isRequired:
        input.isRequired ?? true,

      isActive:
        input.isActive ?? true
    }
  });
}


// ---------------------------------------------------------
// Submit Approval Decision
// ---------------------------------------------------------

export async function submitApprovalDecision(
  actor: WorkflowActor,
  workflowInstanceId: string,
  input: ApprovalDecisionInput
) {
  return prisma.$transaction(
    async (tx) => {

      const instance =
        await tx.workflowInstance.findFirst({
          where: {
            id: workflowInstanceId,
            organizationId:
              actor.organizationId
          },

          include: {
            currentState: true
          }
        });

      if (!instance) {
        throw new WorkflowServiceError(
          "WORKFLOW_INSTANCE_NOT_FOUND",
          "Workflow instance was not found."
        );
      }

      if (instance.status !== "ACTIVE") {
        throw new WorkflowServiceError(
          "WORKFLOW_INSTANCE_NOT_ACTIVE",
          "Approval decisions can only be submitted for active workflow instances."
        );
      }


      const approvalStep =
        await tx.approvalStep.findFirst({
          where: {
            id: input.approvalStepId,

            organizationId:
              actor.organizationId,

            workflowDefinitionId:
              instance.workflowDefinitionId,

            workflowStateId:
              instance.currentStateId,

            isActive: true
          }
        });

      if (!approvalStep) {
        throw new WorkflowServiceError(
          "APPROVAL_STEP_NOT_FOUND",
          "Active approval step was not found for the current workflow state."
        );
      }


      assertApprovalEligibility(
        actor.organizationUserId,
        approvalStep.approverType,
        approvalStep.approverConfig
      );

      if (
        !approvalStep.allowSelfApproval &&
        instance.startedByOrganizationUserId ===
          actor.organizationUserId
      ) {
        throw new WorkflowServiceError(
          "SELF_APPROVAL_NOT_ALLOWED",
          "The user who started this workflow cannot approve this step."
        );
      }


      const existingDecision =
        await tx.approvalDecision.findFirst({
          where: {
            organizationId:
              actor.organizationId,

            workflowInstanceId:
              instance.id,

            approvalStepId:
              approvalStep.id,

            approverOrganizationUserId:
              actor.organizationUserId
          }
        });

      if (existingDecision) {
        throw new WorkflowServiceError(
          "APPROVAL_DECISION_ALREADY_EXISTS",
          "This approver has already submitted a decision for this approval step."
        );
      }


      const decision =
        await tx.approvalDecision.create({
          data: {
            organizationId:
              actor.organizationId,

            workflowInstanceId:
              instance.id,

            approvalStepId:
              approvalStep.id,

            approverOrganizationUserId:
              actor.organizationUserId,

            decision:
              input.decision,

            comment:
              input.comment ?? null
          }
        });


      await tx.workflowHistory.create({
        data: {
          organizationId:
            actor.organizationId,

          workflowInstanceId:
            instance.id,

          fromStateId:
            instance.currentStateId,

          toStateId:
            instance.currentStateId,

          actorOrganizationUserId:
            actor.organizationUserId,

          action:
            input.decision === "APPROVED"
              ? "APPROVED"
              : "REJECTED",

          comment:
            input.comment ?? null,

          metadata: {
            approvalStepId:
              approvalStep.id,

            approvalDecisionId:
              decision.id
          }
        }
      });


      const approvedCount =
        await tx.approvalDecision.count({
          where: {
            organizationId:
              actor.organizationId,

            workflowInstanceId:
              instance.id,

            approvalStepId:
              approvalStep.id,

            decision:
              "APPROVED"
          }
        });


      const rejectedCount =
        await tx.approvalDecision.count({
          where: {
            organizationId:
              actor.organizationId,

            workflowInstanceId:
              instance.id,

            approvalStepId:
              approvalStep.id,

            decision:
              "REJECTED"
          }
        });


      return {
        decision,

        approvalStep: {
          id:
            approvalStep.id,

          name:
            approvalStep.name,

          minimumApprovals:
            approvalStep.minimumApprovals,

          isRequired:
            approvalStep.isRequired
        },

        approvalStatus: {
          approvedCount,

          rejectedCount,

          requiredApprovals:
            approvalStep.minimumApprovals,

          approved:
            approvedCount >=
            approvalStep.minimumApprovals,

          rejected:
            rejectedCount > 0
        }
      };
    }
  );
}
