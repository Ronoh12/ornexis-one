type UnknownRecord =
  Record<string, unknown>;

function asRecord(
  input: unknown
): UnknownRecord {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input)
  ) {
    throw new Error(
      "Request body must be an object"
    );
  }

  return input as UnknownRecord;
}

function requiredString(
  value: unknown,
  field: string
) {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${field} is required`
    );
  }

  return value.trim();
}

function optionalString(
  value: unknown,
  field: string
) {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(
      `${field} must be a string`
    );
  }

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : undefined;
}

function optionalBoolean(
  value: unknown,
  field: string
) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new Error(
      `${field} must be boolean`
    );
  }

  return value;
}

function optionalNumber(
  value: unknown,
  field: string
) {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `${field} must be a number`
    );
  }

  return value;
}

function uuid(
  value: unknown,
  field: string
) {
  const candidate =
    requiredString(
      value,
      field
    );

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      candidate
    )
  ) {
    throw new Error(
      `${field} must be a valid UUID`
    );
  }

  return candidate;
}

function optionalUuid(
  value: unknown,
  field: string
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  return uuid(
    value,
    field
  );
}

export function parseCreateWorkflowDefinition(
  input: unknown
) {
  const body =
    asRecord(input);

  return {
    name:
      requiredString(
        body.name,
        "name"
      ),

    code:
      requiredString(
        body.code,
        "code"
      ).toUpperCase(),

    description:
      optionalString(
        body.description,
        "description"
      ),

    entityType:
      requiredString(
        body.entityType,
        "entityType"
      ).toUpperCase(),

    version:
      optionalNumber(
        body.version,
        "version"
      ) ?? 1,

    isActive:
      optionalBoolean(
        body.isActive,
        "isActive"
      ) ?? true
  };
}

export function parseUpdateWorkflowDefinition(
  input: unknown
) {
  const body =
    asRecord(input);

  return {
    name:
      optionalString(
        body.name,
        "name"
      ),

    description:
      optionalString(
        body.description,
        "description"
      ),

    isActive:
      optionalBoolean(
        body.isActive,
        "isActive"
      )
  };
}

export function parseCreateWorkflowState(
  input: unknown
) {
  const body =
    asRecord(input);

  return {
    name:
      requiredString(
        body.name,
        "name"
      ),

    code:
      requiredString(
        body.code,
        "code"
      ).toUpperCase(),

    description:
      optionalString(
        body.description,
        "description"
      ),

    position:
      optionalNumber(
        body.position,
        "position"
      ) ?? 0,

    isInitial:
      optionalBoolean(
        body.isInitial,
        "isInitial"
      ) ?? false,

    isTerminal:
      optionalBoolean(
        body.isTerminal,
        "isTerminal"
      ) ?? false
  };
}

export function parseUpdateWorkflowState(
  input: unknown
) {
  const body =
    asRecord(input);

  return {
    name:
      optionalString(
        body.name,
        "name"
      ),

    description:
      optionalString(
        body.description,
        "description"
      ),

    position:
      optionalNumber(
        body.position,
        "position"
      ),

    isInitial:
      optionalBoolean(
        body.isInitial,
        "isInitial"
      ),

    isTerminal:
      optionalBoolean(
        body.isTerminal,
        "isTerminal"
      )
  };
}

export function parseCreateWorkflowTransition(
  input: unknown
) {
  const body =
    asRecord(input);

  return {
    fromStateId:
      uuid(
        body.fromStateId,
        "fromStateId"
      ),

    toStateId:
      uuid(
        body.toStateId,
        "toStateId"
      ),

    name:
      requiredString(
        body.name,
        "name"
      ),

    code:
      requiredString(
        body.code,
        "code"
      ).toUpperCase(),

    description:
      optionalString(
        body.description,
        "description"
      ),

    requiresApproval:
      optionalBoolean(
        body.requiresApproval,
        "requiresApproval"
      ) ?? false,

    conditionConfig:
      body.conditionConfig,

    position:
      optionalNumber(
        body.position,
        "position"
      ) ?? 0,

    isActive:
      optionalBoolean(
        body.isActive,
        "isActive"
      ) ?? true
  };
}

export function parseUpdateWorkflowTransition(
  input: unknown
) {
  const body =
    asRecord(input);

  return {
    name:
      optionalString(
        body.name,
        "name"
      ),

    description:
      optionalString(
        body.description,
        "description"
      ),

    requiresApproval:
      optionalBoolean(
        body.requiresApproval,
        "requiresApproval"
      ),

    conditionConfig:
      body.conditionConfig,

    position:
      optionalNumber(
        body.position,
        "position"
      ),

    isActive:
      optionalBoolean(
        body.isActive,
        "isActive"
      )
  };
}

export function parseStartWorkflow(
  input: unknown
) {
  const body =
    asRecord(input);

  return {
    workflowDefinitionId:
      uuid(
        body.workflowDefinitionId,
        "workflowDefinitionId"
      ),

    entityType:
      requiredString(
        body.entityType,
        "entityType"
      ).toUpperCase(),

    entityId:
      uuid(
        body.entityId,
        "entityId"
      ),

    contextData:
      body.contextData
  };
}

export function parseWorkflowTransitionAction(
  input: unknown
) {
  const body =
    asRecord(input);

  return {
    transitionId:
      uuid(
        body.transitionId,
        "transitionId"
      ),

    comment:
      optionalString(
        body.comment,
        "comment"
      )
  };
}

export function parseCancelWorkflow(
  input: unknown
) {
  const body =
    asRecord(input);

  return {
    comment:
      optionalString(
        body.comment,
        "comment"
      )
  };
}

export function parseCreateApprovalStep(
  input: unknown
) {
  const body =
    asRecord(input);

  return {
    workflowStateId:
      uuid(
        body.workflowStateId,
        "workflowStateId"
      ),

    name:
      requiredString(
        body.name,
        "name"
      ),

    code:
      requiredString(
        body.code,
        "code"
      ).toUpperCase(),

    description:
      optionalString(
        body.description,
        "description"
      ),

    position:
      optionalNumber(
        body.position,
        "position"
      ) ?? 0,

    approverType: (() => {
      const approverType =
        requiredString(
          body.approverType,
          "approverType"
        ).toUpperCase();

      if (
        approverType !== "ANY" &&
        approverType !== "USER"
      ) {
        throw new Error(
          'approverType must currently be either "ANY" or "USER"'
        );
      }

      return approverType as
        | "ANY"
        | "USER";
    })(),

    approverConfig:
      body.approverConfig,

    minimumApprovals:
      optionalNumber(
        body.minimumApprovals,
        "minimumApprovals"
      ) ?? 1,

    allowSelfApproval:
      optionalBoolean(
        body.allowSelfApproval,
        "allowSelfApproval"
      ) ?? false,

    isRequired:
      optionalBoolean(
        body.isRequired,
        "isRequired"
      ) ?? true,

    isActive:
      optionalBoolean(
        body.isActive,
        "isActive"
      ) ?? true
  };
}

export function parseApprovalDecision(
  input: unknown
) {
  const body =
    asRecord(input);

  const decision =
    requiredString(
      body.decision,
      "decision"
    ).toUpperCase();

  if (
    decision !== "APPROVED" &&
    decision !== "REJECTED"
  ) {
    throw new Error(
      'decision must be either "APPROVED" or "REJECTED"'
    );
  }

  return {
    approvalStepId:
      uuid(
        body.approvalStepId,
        "approvalStepId"
      ),

    decision:
      decision as
        | "APPROVED"
        | "REJECTED",

    comment:
      optionalString(
        body.comment,
        "comment"
      )
  };
}

export function parseId(
  value: unknown,
  field = "id"
) {
  return uuid(
    value,
    field
  );
}

export function parseOptionalOrganizationUserId(
  value: unknown
) {
  return optionalUuid(
    value,
    "organizationUserId"
  );
}