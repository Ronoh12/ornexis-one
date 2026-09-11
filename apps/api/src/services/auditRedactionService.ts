const REDACTED =
  "[REDACTED]";

const TRUNCATED =
  "[TRUNCATED]";

const MAX_DEPTH =
  12;

const MAX_ARRAY_ITEMS =
  200;

const sensitiveKeys =
  new Set([
    "password",
    "passwordhash",
    "currentpassword",
    "newpassword",
    "confirmpassword",
    "accesstoken",
    "refreshtoken",
    "authorization",
    "authorizationheader",
    "cookie",
    "cookies",
    "privatekey",
    "secretkey",
    "apisecret",
    "apikey",
    "clientsecret",
    "sessionsecret",
    "resettoken",
    "activationtoken",
    "invitationtoken"
  ]);

function normalizedKey(
  key: string
) {
  return key
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );
}

function redactValue(
  value: unknown,
  depth: number
): unknown {
  if (depth > MAX_DEPTH) {
    return TRUNCATED;
  }

  if (
    value === null ||
    typeof value ===
      "string" ||
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
      "bigint"
  ) {
    return value.toString();
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    const items =
      value
        .slice(
          0,
          MAX_ARRAY_ITEMS
        )
        .map(
          (item) =>
            redactValue(
              item,
              depth + 1
            )
        );

    if (
      value.length >
        MAX_ARRAY_ITEMS
    ) {
      items.push(TRUNCATED);
    }

    return items;
  }

  if (
    typeof value ===
      "object"
  ) {
    const output:
      Record<string, unknown> = {};

    for (
      const [
        key,
        nestedValue
      ] of Object.entries(
        value
      )
    ) {
      output[key] =
        sensitiveKeys.has(
          normalizedKey(key)
        )
          ? REDACTED
          : redactValue(
              nestedValue,
              depth + 1
            );
    }

    return output;
  }

  return String(value);
}

export function redactAuditValue(
  value: unknown
): unknown {
  return redactValue(
    value,
    0
  );
}

export const auditRedactionMarker =
  REDACTED;
