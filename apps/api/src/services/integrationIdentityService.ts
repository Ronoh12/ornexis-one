import {
  IntegrationServiceError
} from "./integrationTypes.js";

export function normalizeIntegrationCode(
  value: string
) {
  const normalized =
    value
      .trim()
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      )
      .toUpperCase();

  if (
    !normalized ||
    !/^[A-Z0-9][A-Z0-9_-]{0,127}$/
      .test(
        normalized
      )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      "Integration client code is invalid."
    );
  }

  return normalized;
}

export function normalizeRequiredText(
  value: string,
  label: string,
  maximumLength:
    number
) {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `${label} is required.`
    );
  }

  if (
    normalized.length >
      maximumLength
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `${label} must be at most ${maximumLength} characters.`
    );
  }

  return normalized;
}

export function normalizeOptionalText(
  value:
    string |
    null |
    undefined,
  label: string,
  maximumLength:
    number
) {
  if (
    value ===
      undefined
  ) {
    return undefined;
  }

  if (
    value ===
      null
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.length >
      maximumLength
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `${label} must be at most ${maximumLength} characters.`
    );
  }

  return normalized;
}

export function normalizeEventType(
  value: string
) {
  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/
      .test(
        normalized
      )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      "Integration event type is invalid."
    );
  }

  return normalized;
}

export function normalizeEntityType(
  value: string
) {
  return normalizeRequiredText(
    value,
    "Entity type",
    128
  )
    .replace(
      /[^a-zA-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    )
    .toUpperCase();
}

export function validateIntegrationLimit(
  value:
    number |
    undefined,
  defaultLimit:
    number,
  maximumLimit:
    number
) {
  if (
    value ===
      undefined
  ) {
    return defaultLimit;
  }

  if (
    !Number.isInteger(
      value
    ) ||
    value < 1 ||
    value >
      maximumLimit
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_QUERY_INVALID",
      `Limit must be an integer from 1 to ${maximumLimit}.`
    );
  }

  return value;
}

export function validateFutureExpiry(
  value:
    Date |
    null |
    undefined
) {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return value;
  }

  if (
    Number.isNaN(
      value.getTime()
    ) ||
    value.getTime() <=
      Date.now()
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      "Credential expiry must be in the future."
    );
  }

  return value;
}

export function validateMetadata(
  value: unknown
) {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return value;
  }

  let serialized:
    string;

  try {
    serialized =
      JSON.stringify(
        value
      );
  } catch {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      "Metadata must be JSON serializable."
    );
  }

  if (
    serialized ===
      undefined ||
    serialized.length >
      32_768
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      "Metadata must not exceed 32768 serialized characters."
    );
  }

  return value;
}
