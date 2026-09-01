import {
  SlaInstanceStatus,
  SlaSourceType,
  SlaTargetType
} from "../../../../packages/database/generated/client/enums.js";

export class SlaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlaValidationError";
  }
}

type UnknownRecord =
  Record<string, unknown>;

function asRecord(
  value: unknown
): UnknownRecord {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new SlaValidationError(
      "Request body must be an object."
    );
  }

  return value as UnknownRecord;
}

function requiredString(
  value: unknown,
  field: string
) {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new SlaValidationError(
      `${field} is required.`
    );
  }

  return value.trim();
}

function optionalString(
  value: unknown,
  field: string
) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new SlaValidationError(
      `${field} must be a non-empty string or null.`
    );
  }

  return value.trim();
}

function optionalBoolean(
  value: unknown,
  field: string
) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new SlaValidationError(
      `${field} must be a boolean.`
    );
  }

  return value;
}

function positiveInteger(
  value: unknown,
  field: string
) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new SlaValidationError(
      `${field} must be a positive integer.`
    );
  }

  return value;
}

function optionalNonNegativeInteger(
  value: unknown,
  field: string
) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new SlaValidationError(
      `${field} must be a non-negative integer or null.`
    );
  }

  return value;
}

function integerQuery(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
) {
  if (value === undefined) {
    return fallback;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw new SlaValidationError(
      `Expected an integer between ${minimum} and ${maximum}.`
    );
  }

  return parsed;
}

function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string
): T {
  if (
    typeof value !== "string" ||
    !values.includes(
      value as T
    )
  ) {
    throw new SlaValidationError(
      `Invalid ${field}.`
    );
  }

  return value as T;
}

export function parseId(
  value: unknown
) {
  return requiredString(
    value,
    "id"
  );
}

export type CreateSlaPolicyBody = {
  name: string;
  code: string;
  description?: string | null;
  isActive?: boolean;
};

export function parseCreateSlaPolicyBody(
  body: unknown
): CreateSlaPolicyBody {
  const input =
    asRecord(body);

  const description =
    optionalString(
      input.description,
      "description"
    );

  const isActive =
    optionalBoolean(
      input.isActive,
      "isActive"
    );

  return {
    name:
      requiredString(
        input.name,
        "name"
      ),
    code:
      requiredString(
        input.code,
        "code"
      ).toUpperCase(),
    ...(description !== undefined
      ? { description }
      : {}),
    ...(isActive !== undefined
      ? { isActive }
      : {})
  };
}

export type UpdateSlaPolicyBody = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

export function parseUpdateSlaPolicyBody(
  body: unknown
): UpdateSlaPolicyBody {
  const input =
    asRecord(body);

  const name =
    input.name === undefined
      ? undefined
      : requiredString(
          input.name,
          "name"
        );

  const description =
    optionalString(
      input.description,
      "description"
    );

  const isActive =
    optionalBoolean(
      input.isActive,
      "isActive"
    );

  if (
    name === undefined &&
    description === undefined &&
    isActive === undefined
  ) {
    throw new SlaValidationError(
      "At least one field must be supplied."
    );
  }

  return {
    ...(name !== undefined
      ? { name }
      : {}),
    ...(description !== undefined
      ? { description }
      : {}),
    ...(isActive !== undefined
      ? { isActive }
      : {})
  };
}

export type CreateSlaTargetBody = {
  name: string;
  targetType: SlaTargetType;
  durationMinutes: number;
  warningMinutesBefore?: number | null;
  escalationMinutesAfter?: number | null;
  notifyOnWarning?: boolean;
  notifyOnBreach?: boolean;
  notifyOnEscalation?: boolean;
  isActive?: boolean;
};

export function parseCreateSlaTargetBody(
  body: unknown
): CreateSlaTargetBody {
  const input =
    asRecord(body);

  const warningMinutesBefore =
    optionalNonNegativeInteger(
      input.warningMinutesBefore,
      "warningMinutesBefore"
    );

  const escalationMinutesAfter =
    optionalNonNegativeInteger(
      input.escalationMinutesAfter,
      "escalationMinutesAfter"
    );

  const notifyOnWarning =
    optionalBoolean(
      input.notifyOnWarning,
      "notifyOnWarning"
    );

  const notifyOnBreach =
    optionalBoolean(
      input.notifyOnBreach,
      "notifyOnBreach"
    );

  const notifyOnEscalation =
    optionalBoolean(
      input.notifyOnEscalation,
      "notifyOnEscalation"
    );

  const isActive =
    optionalBoolean(
      input.isActive,
      "isActive"
    );

  return {
    name:
      requiredString(
        input.name,
        "name"
      ),

    targetType:
      enumValue(
        input.targetType,
        Object.values(
          SlaTargetType
        ),
        "targetType"
      ),

    durationMinutes:
      positiveInteger(
        input.durationMinutes,
        "durationMinutes"
      ),

    ...(warningMinutesBefore !== undefined
      ? { warningMinutesBefore }
      : {}),

    ...(escalationMinutesAfter !== undefined
      ? { escalationMinutesAfter }
      : {}),

    ...(notifyOnWarning !== undefined
      ? { notifyOnWarning }
      : {}),

    ...(notifyOnBreach !== undefined
      ? { notifyOnBreach }
      : {}),

    ...(notifyOnEscalation !== undefined
      ? { notifyOnEscalation }
      : {}),

    ...(isActive !== undefined
      ? { isActive }
      : {})
  };
}

export type UpdateSlaTargetBody = {
  name?: string;
  durationMinutes?: number;
  warningMinutesBefore?: number | null;
  escalationMinutesAfter?: number | null;
  notifyOnWarning?: boolean;
  notifyOnBreach?: boolean;
  notifyOnEscalation?: boolean;
  isActive?: boolean;
};

export function parseUpdateSlaTargetBody(
  body: unknown
): UpdateSlaTargetBody {
  const input =
    asRecord(body);

  const name =
    input.name === undefined
      ? undefined
      : requiredString(
          input.name,
          "name"
        );

  const durationMinutes =
    input.durationMinutes === undefined
      ? undefined
      : positiveInteger(
          input.durationMinutes,
          "durationMinutes"
        );

  const warningMinutesBefore =
    optionalNonNegativeInteger(
      input.warningMinutesBefore,
      "warningMinutesBefore"
    );

  const escalationMinutesAfter =
    optionalNonNegativeInteger(
      input.escalationMinutesAfter,
      "escalationMinutesAfter"
    );

  const notifyOnWarning =
    optionalBoolean(
      input.notifyOnWarning,
      "notifyOnWarning"
    );

  const notifyOnBreach =
    optionalBoolean(
      input.notifyOnBreach,
      "notifyOnBreach"
    );

  const notifyOnEscalation =
    optionalBoolean(
      input.notifyOnEscalation,
      "notifyOnEscalation"
    );

  const isActive =
    optionalBoolean(
      input.isActive,
      "isActive"
    );

  if (
    name === undefined &&
    durationMinutes === undefined &&
    warningMinutesBefore === undefined &&
    escalationMinutesAfter === undefined &&
    notifyOnWarning === undefined &&
    notifyOnBreach === undefined &&
    notifyOnEscalation === undefined &&
    isActive === undefined
  ) {
    throw new SlaValidationError(
      "At least one field must be supplied."
    );
  }

  return {
    ...(name !== undefined
      ? { name }
      : {}),

    ...(durationMinutes !== undefined
      ? { durationMinutes }
      : {}),

    ...(warningMinutesBefore !== undefined
      ? { warningMinutesBefore }
      : {}),

    ...(escalationMinutesAfter !== undefined
      ? { escalationMinutesAfter }
      : {}),

    ...(notifyOnWarning !== undefined
      ? { notifyOnWarning }
      : {}),

    ...(notifyOnBreach !== undefined
      ? { notifyOnBreach }
      : {}),

    ...(notifyOnEscalation !== undefined
      ? { notifyOnEscalation }
      : {}),

    ...(isActive !== undefined
      ? { isActive }
      : {})
  };
}

export type CreateSlaInstanceBody = {
  slaPolicyId: string;
  slaTargetId: string;
  sourceType: SlaSourceType;
  sourceId: string;
  startedAt?: string;
};

export function parseCreateSlaInstanceBody(
  body: unknown
): CreateSlaInstanceBody {
  const input =
    asRecord(body);

  const startedAt =
    optionalString(
      input.startedAt,
      "startedAt"
    );

  if (
    startedAt !== undefined &&
    startedAt !== null &&
    Number.isNaN(
      Date.parse(startedAt)
    )
  ) {
    throw new SlaValidationError(
      "startedAt must be a valid ISO date/time."
    );
  }

  return {
    slaPolicyId:
      requiredString(
        input.slaPolicyId,
        "slaPolicyId"
      ),

    slaTargetId:
      requiredString(
        input.slaTargetId,
        "slaTargetId"
      ),

    sourceType:
      enumValue(
        input.sourceType,
        Object.values(
          SlaSourceType
        ),
        "sourceType"
      ),

    sourceId:
      requiredString(
        input.sourceId,
        "sourceId"
      ),

    ...(startedAt
      ? { startedAt }
      : {})
  };
}

export type SlaInstanceListQuery = {
  page: number;
  limit: number;
  status?: SlaInstanceStatus;
  sourceType?: SlaSourceType;
};

export function parseSlaInstanceListQuery(
  query: Record<string, unknown>
): SlaInstanceListQuery {
  const page =
    integerQuery(
      query.page,
      1,
      1,
      1000000
    );

  const limit =
    integerQuery(
      query.limit,
      25,
      1,
      100
    );

  const status =
    query.status === undefined
      ? undefined
      : enumValue(
          query.status,
          Object.values(
            SlaInstanceStatus
          ),
          "status"
        );

  const sourceType =
    query.sourceType === undefined
      ? undefined
      : enumValue(
          query.sourceType,
          Object.values(
            SlaSourceType
          ),
          "sourceType"
        );

  return {
    page,
    limit,
    ...(status !== undefined
      ? { status }
      : {}),
    ...(sourceType !== undefined
      ? { sourceType }
      : {})
  };
}

export type EvaluateSlaBody = {
  limit?: number;
};

export function parseEvaluateSlaBody(
  body: unknown
): EvaluateSlaBody {
  if (
    body === undefined ||
    body === null
  ) {
    return {};
  }

  const input =
    asRecord(body);

  if (input.limit === undefined) {
    return {};
  }

  return {
    limit:
      positiveInteger(
        input.limit,
        "limit"
      )
  };
}
