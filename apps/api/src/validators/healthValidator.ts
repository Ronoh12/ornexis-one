import {
  HealthScopeType,
  HealthStatus
} from "../../../../packages/database/generated/client/enums.js";

export class HealthValidationError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "HealthValidationError";
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
    throw new HealthValidationError(
      "Request body must be an object."
    );
  }

  return value as UnknownRecord;
}

function parseUuid(
  value: unknown,
  field: string
) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(value)
  ) {
    throw new HealthValidationError(
      `${field} must be a valid UUID.`
    );
  }

  return value;
}

function optionalString(
  value: unknown,
  field: string,
  maximum: number
) {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > maximum
  ) {
    throw new HealthValidationError(
      `${field} must contain between 1 and ${maximum} characters.`
    );
  }

  return value.trim();
}

function optionalDate(
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
    throw new HealthValidationError(
      `${field} must be an ISO date-time string.`
    );
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new HealthValidationError(
      `${field} must be a valid ISO date-time string.`
    );
  }

  return parsed;
}

function parseScopeType(
  value: unknown,
  required = false
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    if (required) {
      throw new HealthValidationError(
        "scopeType is required."
      );
    }

    return undefined;
  }

  if (
    typeof value !== "string" ||
    !Object.values(
      HealthScopeType
    ).includes(
      value as HealthScopeType
    )
  ) {
    throw new HealthValidationError(
      "scopeType must be ORGANIZATION, BRANCH or DEPARTMENT."
    );
  }

  return value as HealthScopeType;
}

function parseScope(
  input: UnknownRecord
) {
  const scopeType =
    parseScopeType(
      input.scopeType,
      true
    )!;

  const scopeId =
    input.scopeId === undefined ||
    input.scopeId === null
      ? undefined
      : parseUuid(
          input.scopeId,
          "scopeId"
        );

  if (
    scopeType ===
      HealthScopeType.ORGANIZATION &&
    scopeId
  ) {
    throw new HealthValidationError(
      "Organization scope must not include scopeId."
    );
  }

  if (
    scopeType !==
      HealthScopeType.ORGANIZATION &&
    !scopeId
  ) {
    throw new HealthValidationError(
      "Branch and department scopes require scopeId."
    );
  }

  return {
    scopeType,
    branchId:
      scopeType ===
        HealthScopeType.BRANCH
        ? scopeId
        : null,
    departmentId:
      scopeType ===
        HealthScopeType.DEPARTMENT
        ? scopeId
        : null
  };
}

export function parseHealthId(
  value: unknown
) {
  return parseUuid(
    value,
    "id"
  );
}

export function parseHealthSnapshotQuery(
  value: unknown
) {
  const input =
    value as UnknownRecord;

  const scopeType =
    parseScopeType(
      input.scopeType
    );

  const scopeId =
    input.scopeId === undefined
      ? undefined
      : parseUuid(
          input.scopeId,
          "scopeId"
        );

  let status:
    HealthStatus | undefined;

  if (input.status !== undefined) {
    if (
      typeof input.status !== "string" ||
      !Object.values(
        HealthStatus
      ).includes(
        input.status as
          HealthStatus
      )
    ) {
      throw new HealthValidationError(
        "status is invalid."
      );
    }

    status =
      input.status as HealthStatus;
  }

  const page =
    input.page === undefined
      ? 1
      : Number(input.page);

  const limit =
    input.limit === undefined
      ? 20
      : Number(input.limit);

  if (
    !Number.isInteger(page) ||
    page < 1
  ) {
    throw new HealthValidationError(
      "page must be a positive integer."
    );
  }

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new HealthValidationError(
      "limit must be between 1 and 100."
    );
  }

  return {
    scopeType,
    scopeId,
    status,
    page,
    limit
  };
}

export function parseEvaluateHealthBody(
  value: unknown
) {
  const input =
    asRecord(value);

  const scope =
    parseScope(input);

  const now =
    optionalDate(
      input.now,
      "now"
    );

  const periodStart =
    optionalDate(
      input.periodStart,
      "periodStart"
    );

  const periodEnd =
    optionalDate(
      input.periodEnd,
      "periodEnd"
    );

  if (
    periodStart &&
    periodEnd &&
    periodStart > periodEnd
  ) {
    throw new HealthValidationError(
      "periodStart must not be after periodEnd."
    );
  }

  return {
    scope,
    now,
    periodStart,
    periodEnd
  };
}

export function parseHealthDefinitionUpdate(
  value: unknown
) {
  const input =
    asRecord(value);

  const output: {
    weight?: number;
    isActive?: boolean;
    name?: string;
    description?: string;
  } = {};

  if (input.weight !== undefined) {
    const weight =
      Number(input.weight);

    if (
      !Number.isFinite(weight) ||
      weight < 0 ||
      weight > 100
    ) {
      throw new HealthValidationError(
        "weight must be between 0 and 100."
      );
    }

    output.weight =
      weight;
  }

  if (input.isActive !== undefined) {
    if (
      typeof input.isActive !==
      "boolean"
    ) {
      throw new HealthValidationError(
        "isActive must be boolean."
      );
    }

    output.isActive =
      input.isActive;
  }

  const name =
    optionalString(
      input.name,
      "name",
      120
    );

  const description =
    optionalString(
      input.description,
      "description",
      500
    );

  if (name !== undefined) {
    output.name =
      name;
  }

  if (description !== undefined) {
    output.description =
      description;
  }

  if (
    Object.keys(output).length === 0
  ) {
    throw new HealthValidationError(
      "At least one supported definition field is required."
    );
  }

  return output;
}

export function parseHealthScopeParams(
  scopeTypeValue: unknown,
  scopeIdValue: unknown
) {
  const scopeType =
    parseScopeType(
      scopeTypeValue,
      true
    )!;

  const scopeId =
    scopeIdValue === undefined
      ? undefined
      : parseUuid(
          scopeIdValue,
          "scopeId"
        );

  if (
    scopeType !==
      HealthScopeType.ORGANIZATION &&
    !scopeId
  ) {
    throw new HealthValidationError(
      "Branch and department scopes require scopeId."
    );
  }

  return {
    scopeType,
    scopeId
  };
}
