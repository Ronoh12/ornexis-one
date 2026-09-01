import {
  AttentionItemStatus,
  AttentionSeverity,
  AttentionSignalType,
  AttentionSourceType
} from "../../../../packages/database/generated/client/enums.js";

export class AttentionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttentionValidationError";
  }
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new AttentionValidationError(
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
    throw new AttentionValidationError(
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

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new AttentionValidationError(
      `${field} must be a non-empty string.`
    );
  }

  return value.trim();
}

function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string
): T | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "string" ||
    !values.includes(value as T)
  ) {
    throw new AttentionValidationError(
      `Invalid ${field}.`
    );
  }

  return value as T;
}

function integerValue(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw new AttentionValidationError(
      `Expected an integer between ${minimum} and ${maximum}.`
    );
  }

  return parsed;
}

export function parseAttentionId(
  value: unknown
) {
  return requiredString(value, "id");
}

export type AttentionListQuery = {
  page: number;
  limit: number;
  status?: AttentionItemStatus;
  severity?: AttentionSeverity;
  signalType?: AttentionSignalType;
  sourceType?: AttentionSourceType;
  responsibleOrganizationUserId?: string;
  branchId?: string;
  departmentId?: string;
};

export function parseAttentionListQuery(
  query: UnknownRecord
): AttentionListQuery {
  const status = enumValue(
    query.status,
    Object.values(AttentionItemStatus),
    "status"
  );

  const severity = enumValue(
    query.severity,
    Object.values(AttentionSeverity),
    "severity"
  );

  const signalType = enumValue(
    query.signalType,
    Object.values(AttentionSignalType),
    "signalType"
  );

  const sourceType = enumValue(
    query.sourceType,
    Object.values(AttentionSourceType),
    "sourceType"
  );

  const responsibleOrganizationUserId =
    optionalString(
      query.responsibleOrganizationUserId,
      "responsibleOrganizationUserId"
    );

  const branchId = optionalString(
    query.branchId,
    "branchId"
  );

  const departmentId = optionalString(
    query.departmentId,
    "departmentId"
  );

  return {
    page: integerValue(query.page, 1, 1, 1000000),
    limit: integerValue(query.limit, 25, 1, 100),
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(signalType ? { signalType } : {}),
    ...(sourceType ? { sourceType } : {}),
    ...(responsibleOrganizationUserId
      ? { responsibleOrganizationUserId }
      : {}),
    ...(branchId ? { branchId } : {}),
    ...(departmentId ? { departmentId } : {})
  };
}

export type AttentionActionBody = {
  comment?: string;
};

export function parseAttentionActionBody(
  body: unknown
): AttentionActionBody {
  const input = asRecord(body);
  const comment = optionalString(
    input.comment,
    "comment"
  );

  return {
    ...(comment ? { comment } : {})
  };
}

export type EvaluateAttentionBody = {
  limit?: number;
};

export function parseEvaluateAttentionBody(
  body: unknown
): EvaluateAttentionBody {
  const input = asRecord(body);

  if (input.limit === undefined) {
    return {};
  }

  return {
    limit: integerValue(
      input.limit,
      100,
      1,
      500
    )
  };
}
