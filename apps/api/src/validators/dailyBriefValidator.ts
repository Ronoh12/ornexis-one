import {
  HealthScopeType
} from "../../../../packages/database/generated/client/enums.js";

export class DailyBriefValidationError
  extends Error {
  constructor(
    message: string
  ) {
    super(message);
    this.name =
      "DailyBriefValidationError";
  }
}

function singleValue(
  value: unknown,
  field: string
) {
  if (
    Array.isArray(value)
  ) {
    throw new DailyBriefValidationError(
      `${field} must contain one value.`
    );
  }

  return value;
}

function optionalString(
  value: unknown,
  field: string
) {
  const defined =
    singleValue(
      value,
      field
    );

  if (
    defined === undefined
  ) {
    return undefined;
  }

  if (
    typeof defined !==
      "string" ||
    defined.trim().length === 0
  ) {
    throw new DailyBriefValidationError(
      `${field} must be a non-empty string.`
    );
  }

  return defined.trim();
}

function optionalDate(
  value: unknown,
  field: string
) {
  const text =
    optionalString(
      value,
      field
    );

  if (
    text === undefined
  ) {
    return undefined;
  }

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new DailyBriefValidationError(
      `${field} must be a valid date-time.`
    );
  }

  return date;
}

function optionalLimit(
  value: unknown,
  field: string
) {
  const text =
    optionalString(
      value,
      field
    );

  if (
    text === undefined
  ) {
    return undefined;
  }

  if (
    !/^\d+$/.test(
      text
    )
  ) {
    throw new DailyBriefValidationError(
      `${field} must be an integer from 1 to 25.`
    );
  }

  const number =
    Number(text);

  if (
    number < 1 ||
    number > 25
  ) {
    throw new DailyBriefValidationError(
      `${field} must be an integer from 1 to 25.`
    );
  }

  return number;
}

function parseScopeType(
  value: unknown
) {
  const text =
    optionalString(
      value,
      "scopeType"
    );

  if (
    text === undefined
  ) {
    return undefined;
  }

  if (
    !Object.values(
      HealthScopeType
    ).includes(
      text as
        HealthScopeType
    )
  ) {
    throw new DailyBriefValidationError(
      "scopeType must be ORGANIZATION, BRANCH or DEPARTMENT."
    );
  }

  return text as
    HealthScopeType;
}

function parseUuid(
  value: unknown,
  field: string
) {
  const text =
    optionalString(
      value,
      field
    );

  if (
    text === undefined
  ) {
    return undefined;
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(text)
  ) {
    throw new DailyBriefValidationError(
      `${field} must be a valid UUID.`
    );
  }

  return text;
}

export function parseDailyBriefQuery(
  value: unknown
) {
  const query =
    (
      typeof value ===
        "object" &&
      value !== null &&
      !Array.isArray(value)
    )
      ? value as
          Record<
            string,
            unknown
          >
      : {};

  const scopeType =
    parseScopeType(
      query.scopeType
    );

  const scopeId =
    parseUuid(
      query.scopeId,
      "scopeId"
    );

  if (
    (
      scopeType === undefined
    ) !==
    (
      scopeId === undefined
    )
  ) {
    throw new DailyBriefValidationError(
      "scopeType and scopeId must be provided together."
    );
  }

  const asOf =
    optionalDate(
      query.asOf,
      "asOf"
    );

  const periodStart =
    optionalDate(
      query.periodStart,
      "periodStart"
    );

  if (
    asOf &&
    periodStart &&
    periodStart > asOf
  ) {
    throw new DailyBriefValidationError(
      "periodStart must not be after asOf."
    );
  }

  const focusLimit =
    optionalLimit(
      query.focusLimit,
      "focusLimit"
    );

  const recommendationLimit =
    optionalLimit(
      query.recommendationLimit,
      "recommendationLimit"
    );

  return {
    ...(scopeType &&
        scopeId
      ? {
          scope: {
            scopeType,
            scopeId
          }
        }
      : {}),
    ...(asOf
      ? {
          asOf
        }
      : {}),
    ...(periodStart
      ? {
          periodStart
        }
      : {}),
    ...(focusLimit !==
        undefined
      ? {
          focusLimit
        }
      : {}),
    ...(recommendationLimit !==
        undefined
      ? {
          recommendationLimit
        }
      : {})
  };
}
