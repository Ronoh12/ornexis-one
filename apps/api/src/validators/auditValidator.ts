import {
  AuditEventCategory,
  AuditEventResult,
  AuditEventSource
} from "../../../../packages/database/generated/client/enums.js";

import {
  AUDIT_DEFAULT_LIMIT,
  AUDIT_MAX_ENTITY_TYPE_LENGTH,
  AUDIT_MAX_IDENTIFIER_LENGTH,
  AUDIT_MAX_LIMIT,
  AUDIT_MAX_SEARCH_LENGTH,
  AuditServiceError,
  type AuditCursor,
  type AuditExportInput,
  type AuditListInput
} from "../services/auditTypes.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const filterFields =
  new Set([
    "action",
    "entityType",
    "entityId",
    "userId",
    "organizationUserId",
    "category",
    "source",
    "result",
    "requestId",
    "correlationId",
    "createdFrom",
    "createdTo",
    "search"
  ]);

const listFields =
  new Set([
    ...filterFields,
    "cursor",
    "limit"
  ]);

const exportFields =
  new Set([
    ...filterFields,
    "format"
  ]);

function objectQuery(
  query: unknown
) {
  if (
    !query ||
    typeof query !==
      "object" ||
    Array.isArray(query)
  ) {
    throw new AuditServiceError(
      "AUDIT_QUERY_INVALID",
      "Audit query is invalid."
    );
  }

  return query as
    Record<
      string,
      unknown
    >;
}

function rejectUnknownFields(
  query:
    Record<
      string,
      unknown
    >,
  allowed:
    Set<string>
) {
  const unknown =
    Object.keys(query)
      .filter(
        (key) =>
          !allowed.has(key)
      );

  if (unknown.length > 0) {
    throw new AuditServiceError(
      "AUDIT_QUERY_INVALID",
      `Unknown audit query field: ${unknown[0]}.`
    );
  }
}

function optionalString(
  value: unknown,
  label: string,
  maximumLength:
    number
) {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !==
      "string"
  ) {
    throw new AuditServiceError(
      "AUDIT_QUERY_INVALID",
      `${label} must be a string.`
    );
  }

  const normalized =
    value.trim();

  if (!normalized) {
    throw new AuditServiceError(
      "AUDIT_QUERY_INVALID",
      `${label} cannot be blank.`
    );
  }

  if (
    normalized.length >
      maximumLength
  ) {
    throw new AuditServiceError(
      "AUDIT_QUERY_INVALID",
      `${label} must be at most ${maximumLength} characters.`
    );
  }

  return normalized;
}

function identifier(
  value: unknown,
  label: string,
  maximumLength:
    number
) {
  const parsed =
    optionalString(
      value,
      label,
      maximumLength
    );

  return parsed
    ?.replace(
      /[^a-zA-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    )
    .toUpperCase();
}

function optionalUuid(
  value: unknown,
  label: string
) {
  const parsed =
    optionalString(
      value,
      label,
      36
    );

  if (
    parsed &&
    !uuidPattern.test(
      parsed
    )
  ) {
    throw new AuditServiceError(
      "AUDIT_QUERY_INVALID",
      `${label} must be a valid UUID.`
    );
  }

  return parsed;
}

function optionalDate(
  value: unknown,
  label: string
) {
  const parsed =
    optionalString(
      value,
      label,
      64
    );

  if (!parsed) {
    return undefined;
  }

  const date =
    new Date(parsed);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new AuditServiceError(
      "AUDIT_QUERY_INVALID",
      `${label} must be a valid ISO date-time.`
    );
  }

  return date;
}

function optionalEnum<
  T extends string
>(
  value: unknown,
  label: string,
  values:
    readonly T[]
): T | undefined {
  const parsed =
    optionalString(
      value,
      label,
      64
    );

  if (!parsed) {
    return undefined;
  }

  const normalized =
    parsed.toUpperCase() as T;

  if (
    !values.includes(
      normalized
    )
  ) {
    throw new AuditServiceError(
      "AUDIT_QUERY_INVALID",
      `${label} is invalid.`
    );
  }

  return normalized;
}

function parseFilters(
  query:
    Record<
      string,
      unknown
    >
): AuditExportInput {
  const createdFrom =
    optionalDate(
      query.createdFrom,
      "createdFrom"
    );

  const createdTo =
    optionalDate(
      query.createdTo,
      "createdTo"
    );

  if (
    createdFrom &&
    createdTo &&
    createdFrom >
      createdTo
  ) {
    throw new AuditServiceError(
      "AUDIT_DATE_RANGE_INVALID",
      "createdFrom cannot occur after createdTo."
    );
  }

  const action =
    identifier(
      query.action,
      "action",
      AUDIT_MAX_IDENTIFIER_LENGTH
    );

  const entityType =
    identifier(
      query.entityType,
      "entityType",
      AUDIT_MAX_ENTITY_TYPE_LENGTH
    );

  const entityId =
    optionalString(
      query.entityId,
      "entityId",
      AUDIT_MAX_IDENTIFIER_LENGTH
    );

  const userId =
    optionalUuid(
      query.userId,
      "userId"
    );

  const organizationUserId =
    optionalUuid(
      query.organizationUserId,
      "organizationUserId"
    );

  const category =
    optionalEnum(
      query.category,
      "category",
      Object.values(
        AuditEventCategory
      )
    );

  const source =
    optionalEnum(
      query.source,
      "source",
      Object.values(
        AuditEventSource
      )
    );

  const result =
    optionalEnum(
      query.result,
      "result",
      Object.values(
        AuditEventResult
      )
    );

  const requestId =
    optionalString(
      query.requestId,
      "requestId",
      AUDIT_MAX_IDENTIFIER_LENGTH
    );

  const correlationId =
    optionalString(
      query.correlationId,
      "correlationId",
      AUDIT_MAX_IDENTIFIER_LENGTH
    );

  const search =
    optionalString(
      query.search,
      "search",
      AUDIT_MAX_SEARCH_LENGTH
    );

  return {
    ...(action
      ? { action }
      : {}),
    ...(entityType
      ? { entityType }
      : {}),
    ...(entityId
      ? { entityId }
      : {}),
    ...(userId
      ? { userId }
      : {}),
    ...(organizationUserId
      ? {
          organizationUserId
        }
      : {}),
    ...(category
      ? { category }
      : {}),
    ...(source
      ? { source }
      : {}),
    ...(result
      ? { result }
      : {}),
    ...(requestId
      ? { requestId }
      : {}),
    ...(correlationId
      ? { correlationId }
      : {}),
    ...(createdFrom
      ? { createdFrom }
      : {}),
    ...(createdTo
      ? { createdTo }
      : {}),
    ...(search
      ? { search }
      : {})
  };
}

export function encodeAuditCursor(
  cursor:
    AuditCursor
) {
  return Buffer
    .from(
      JSON.stringify(
        cursor
      ),
      "utf8"
    )
    .toString(
      "base64url"
    );
}

export function decodeAuditCursor(
  value: string
): AuditCursor {
  try {
    const parsed =
      JSON.parse(
        Buffer
          .from(
            value,
            "base64url"
          )
          .toString(
            "utf8"
          )
      ) as
        Record<
          string,
          unknown
        >;

    if (
      Object.keys(parsed)
        .sort()
        .join(",") !==
        "createdAt,id" ||
      typeof parsed.createdAt !==
        "string" ||
      typeof parsed.id !==
        "string" ||
      !uuidPattern.test(
        parsed.id
      ) ||
      Number.isNaN(
        new Date(
          parsed.createdAt
        ).getTime()
      )
    ) {
      throw new Error(
        "Invalid cursor."
      );
    }

    return {
      createdAt:
        parsed.createdAt,
      id:
        parsed.id
    };
  } catch {
    throw new AuditServiceError(
      "AUDIT_CURSOR_INVALID",
      "Audit cursor is invalid."
    );
  }
}

export function parseAuditListQuery(
  input: unknown
): AuditListInput {
  const query =
    objectQuery(input);

  rejectUnknownFields(
    query,
    listFields
  );

  const filters =
    parseFilters(query);

  const cursor =
    optionalString(
      query.cursor,
      "cursor",
      1024
    );

  if (cursor) {
    decodeAuditCursor(
      cursor
    );
  }

  let limit =
    AUDIT_DEFAULT_LIMIT;

  if (
    query.limit !==
      undefined
  ) {
    if (
      typeof query.limit !==
        "string" ||
      !/^[0-9]+$/.test(
        query.limit
      )
    ) {
      throw new AuditServiceError(
        "AUDIT_QUERY_INVALID",
        "limit must be an integer."
      );
    }

    limit =
      Number(query.limit);

    if (
      limit < 1 ||
      limit >
        AUDIT_MAX_LIMIT
    ) {
      throw new AuditServiceError(
        "AUDIT_QUERY_INVALID",
        `limit must be from 1 to ${AUDIT_MAX_LIMIT}.`
      );
    }
  }

  return {
    ...filters,
    ...(cursor
      ? { cursor }
      : {}),
    limit
  };
}

export function parseAuditExportQuery(
  input: unknown
): AuditExportInput {
  const query =
    objectQuery(input);

  rejectUnknownFields(
    query,
    exportFields
  );

  const format =
    optionalString(
      query.format,
      "format",
      16
    );

  if (
    format &&
    format.toLowerCase() !==
      "csv"
  ) {
    throw new AuditServiceError(
      "AUDIT_QUERY_INVALID",
      "Only CSV audit export is supported."
    );
  }

  return parseFilters(
    query
  );
}

export function parseAuditEventId(
  value: unknown
) {
  const parsed =
    optionalUuid(
      value,
      "Audit event ID"
    );

  if (!parsed) {
    throw new AuditServiceError(
      "AUDIT_QUERY_INVALID",
      "Audit event ID is required."
    );
  }

  return parsed;
}
