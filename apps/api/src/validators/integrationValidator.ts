import {
  IntegrationClientStatus,
  IntegrationEventSource,
  WebhookDeliveryStatus,
  WebhookEndpointStatus
} from "../../../../packages/database/generated/client/enums.js";

import {
  INTEGRATION_MAX_LIMIT,
  IntegrationServiceError
} from "../services/integrationTypes.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function objectValue(
  value: unknown,
  label: string
) {
  if (
    typeof value !==
      "object" ||
    value ===
      null ||
    Array.isArray(
      value
    )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `${label} must be an object.`
    );
  }

  return value as
    Record<
      string,
      unknown
    >;
}

function rejectUnknown(
  value:
    Record<
      string,
      unknown
    >,
  allowed:
    string[]
) {
  const allowedSet =
    new Set(
      allowed
    );

  const unknown =
    Object.keys(
      value
    ).filter(
      (
        key
      ) =>
        !allowedSet.has(
          key
        )
    );

  if (
    unknown.length >
      0
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `Unsupported field: ${unknown[0]}.`
    );
  }
}

function requiredString(
  value: unknown,
  label: string,
  maximumLength:
    number
) {
  if (
    typeof value !==
      "string"
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `${label} is required.`
    );
  }

  const normalized =
    value.trim();

  if (
    !normalized ||
    normalized.length >
      maximumLength
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `${label} must contain from 1 to ${maximumLength} characters.`
    );
  }

  return normalized;
}

function optionalString(
  value: unknown,
  label: string,
  maximumLength:
    number
):
  string |
  null |
  undefined {
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

  return requiredString(
    value,
    label,
    maximumLength
  );
}

function uuid(
  value: unknown,
  label: string
) {
  const parsed =
    requiredString(
      value,
      label,
      64
    );

  if (
    !uuidPattern.test(
      parsed
    )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `${label} must be a valid UUID.`
    );
  }

  return parsed;
}

function optionalUuid(
  value: unknown,
  label: string
) {
  if (
    value ===
      undefined
  ) {
    return undefined;
  }

  return uuid(
    value,
    label
  );
}

function optionalDate(
  value: unknown,
  label: string
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
    typeof value !==
      "string"
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `${label} must be an ISO date-time.`
    );
  }

  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `${label} must be an ISO date-time.`
    );
  }

  return parsed;
}

function optionalLimit(
  value: unknown
) {
  if (
    value ===
      undefined
  ) {
    return undefined;
  }

  if (
    typeof value !==
      "string" ||
    !/^\d+$/.test(
      value
    )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_QUERY_INVALID",
      "Limit must be an integer."
    );
  }

  const parsed =
    Number(
      value
    );

  if (
    parsed < 1 ||
    parsed >
      INTEGRATION_MAX_LIMIT
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_QUERY_INVALID",
      `Limit must be from 1 to ${INTEGRATION_MAX_LIMIT}.`
    );
  }

  return parsed;
}

function enumValue<
  T extends string
>(
  value: unknown,
  values:
    readonly T[],
  label: string
) {
  if (
    typeof value !==
      "string" ||
    !values.includes(
      value as T
    )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      `${label} is invalid.`
    );
  }

  return value as T;
}

function optionalEnum<
  T extends string
>(
  value: unknown,
  values:
    readonly T[],
  label: string
) {
  if (
    value ===
      undefined
  ) {
    return undefined;
  }

  return enumValue(
    value,
    values,
    label
  );
}

function queryRecord(
  value: unknown
) {
  return objectValue(
    value,
    "Integration query"
  );
}

export function parseIntegrationId(
  value: unknown
) {
  return uuid(
    value,
    "Integration identifier"
  );
}

export function parseIntegrationClientQuery(
  value: unknown
) {
  const query =
    queryRecord(
      value
    );

  rejectUnknown(
    query,
    [
      "status",
      "search",
      "cursor",
      "limit"
    ]
  );

  return {
    status:
      optionalEnum(
        query.status,
        Object.values(
          IntegrationClientStatus
        ),
        "Integration client status"
      ),
    search:
      optionalString(
        query.search,
        "Search",
        200
      ) ??
      undefined,
    cursor:
      optionalString(
        query.cursor,
        "Cursor",
        2_000
      ) ??
      undefined,
    limit:
      optionalLimit(
        query.limit
      )
  };
}

export function parseCreateIntegrationClient(
  value: unknown
) {
  const body =
    objectValue(
      value,
      "Integration client"
    );

  rejectUnknown(
    body,
    [
      "code",
      "name",
      "description",
      "externalSystemId",
      "metadata"
    ]
  );

  return {
    code:
      requiredString(
        body.code,
        "Integration client code",
        128
      ),
    name:
      requiredString(
        body.name,
        "Integration client name",
        200
      ),
    description:
      optionalString(
        body.description,
        "Description",
        2_000
      ),
    externalSystemId:
      optionalString(
        body.externalSystemId,
        "External-system identifier",
        200
      ),
    ...(body.metadata !==
    undefined
      ? {
          metadata:
            body.metadata
        }
      : {})
  };
}

export function parseUpdateIntegrationClient(
  value: unknown
) {
  const body =
    objectValue(
      value,
      "Integration client update"
    );

  rejectUnknown(
    body,
    [
      "name",
      "description",
      "externalSystemId",
      "metadata"
    ]
  );

  if (
    Object.keys(
      body
    ).length ===
      0
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      "At least one integration client field is required."
    );
  }

  return {
    ...(body.name !==
    undefined
      ? {
          name:
            requiredString(
              body.name,
              "Integration client name",
              200
            )
        }
      : {}),
    ...(body.description !==
    undefined
      ? {
          description:
            optionalString(
              body.description,
              "Description",
              2_000
            )
        }
      : {}),
    ...(body.externalSystemId !==
    undefined
      ? {
          externalSystemId:
            optionalString(
              body.externalSystemId,
              "External-system identifier",
              200
            )
        }
      : {}),
    ...(body.metadata !==
    undefined
      ? {
          metadata:
            body.metadata
        }
      : {})
  };
}

export function parseCreateIntegrationCredential(
  value: unknown
) {
  const body =
    objectValue(
      value,
      "Integration credential"
    );

  rejectUnknown(
    body,
    [
      "name",
      "expiresAt"
    ]
  );

  return {
    name:
      requiredString(
        body.name,
        "Credential name",
        200
      ),
    expiresAt:
      optionalDate(
        body.expiresAt,
        "Credential expiry"
      )
  };
}

export function parseReplaceIntegrationScopes(
  value: unknown
) {
  const body =
    objectValue(
      value,
      "Integration scopes"
    );

  rejectUnknown(
    body,
    [
      "permissionIds"
    ]
  );

  if (
    !Array.isArray(
      body.permissionIds
    ) ||
    body.permissionIds.length >
      200
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      "Permission IDs must be an array containing at most 200 items."
    );
  }

  return {
    permissionIds:
      body.permissionIds.map(
        (
          permissionId
        ) =>
          uuid(
            permissionId,
            "Permission ID"
          )
      )
  };
}

export function parseWebhookEndpointQuery(
  value: unknown
) {
  const query =
    queryRecord(
      value
    );

  rejectUnknown(
    query,
    [
      "integrationClientId",
      "status",
      "search",
      "cursor",
      "limit"
    ]
  );

  return {
    integrationClientId:
      optionalUuid(
        query.integrationClientId,
        "Integration client ID"
      ),
    status:
      optionalEnum(
        query.status,
        Object.values(
          WebhookEndpointStatus
        ),
        "Webhook endpoint status"
      ),
    search:
      optionalString(
        query.search,
        "Search",
        200
      ) ??
      undefined,
    cursor:
      optionalString(
        query.cursor,
        "Cursor",
        2_000
      ) ??
      undefined,
    limit:
      optionalLimit(
        query.limit
      )
  };
}

export function parseCreateWebhookEndpoint(
  value: unknown
) {
  const body =
    objectValue(
      value,
      "Webhook endpoint"
    );

  rejectUnknown(
    body,
    [
      "integrationClientId",
      "name",
      "url",
      "description"
    ]
  );

  return {
    integrationClientId:
      uuid(
        body.integrationClientId,
        "Integration client ID"
      ),
    name:
      requiredString(
        body.name,
        "Webhook endpoint name",
        200
      ),
    url:
      requiredString(
        body.url,
        "Webhook URL",
        2_048
      ),
    description:
      optionalString(
        body.description,
        "Description",
        2_000
      )
  };
}

export function parseUpdateWebhookEndpoint(
  value: unknown
) {
  const body =
    objectValue(
      value,
      "Webhook endpoint update"
    );

  rejectUnknown(
    body,
    [
      "name",
      "url",
      "description"
    ]
  );

  if (
    Object.keys(
      body
    ).length ===
      0
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      "At least one webhook endpoint field is required."
    );
  }

  return {
    ...(body.name !==
    undefined
      ? {
          name:
            requiredString(
              body.name,
              "Webhook endpoint name",
              200
            )
        }
      : {}),
    ...(body.url !==
    undefined
      ? {
          url:
            requiredString(
              body.url,
              "Webhook URL",
              2_048
            )
        }
      : {}),
    ...(body.description !==
    undefined
      ? {
          description:
            optionalString(
              body.description,
              "Description",
              2_000
            )
        }
      : {})
  };
}

export function parseReplaceWebhookSubscriptions(
  value: unknown
) {
  const body =
    objectValue(
      value,
      "Webhook subscriptions"
    );

  rejectUnknown(
    body,
    [
      "eventTypes"
    ]
  );

  if (
    !Array.isArray(
      body.eventTypes
    ) ||
    body.eventTypes.length >
      100
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      "Event types must be an array containing at most 100 items."
    );
  }

  return {
    eventTypes:
      body.eventTypes.map(
        (
          eventType
        ) =>
          requiredString(
            eventType,
            "Event type",
            128
          ).toLowerCase()
      )
  };
}

export function parsePublishIntegrationEvent(
  value: unknown
) {
  const body =
    objectValue(
      value,
      "Integration event"
    );

  rejectUnknown(
    body,
    [
      "eventType",
      "payloadVersion",
      "entityType",
      "entityId",
      "payload",
      "source",
      "idempotencyKey",
      "occurredAt"
    ]
  );

  if (
    !Object.prototype
      .hasOwnProperty
      .call(
        body,
        "payload"
      )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_INPUT_INVALID",
      "Integration event payload is required."
    );
  }

  return {
    eventType:
      requiredString(
        body.eventType,
        "Event type",
        128
      ).toLowerCase(),
    payloadVersion:
      optionalString(
        body.payloadVersion,
        "Payload version",
        32
      ) ??
      undefined,
    entityType:
      requiredString(
        body.entityType,
        "Entity type",
        128
      ),
    entityId:
      optionalString(
        body.entityId,
        "Entity identifier",
        128
      ),
    payload:
      body.payload,
    source:
      optionalEnum(
        body.source,
        Object.values(
          IntegrationEventSource
        ),
        "Integration event source"
      ),
    idempotencyKey:
      optionalString(
        body.idempotencyKey,
        "Idempotency key",
        128
      ),
    occurredAt:
      optionalDate(
        body.occurredAt,
        "Occurrence time"
      ) ??
      undefined
  };
}

function dateRange(
  query:
    Record<
      string,
      unknown
    >
) {
  const createdFrom =
    optionalDate(
      query.createdFrom,
      "Created-from time"
    ) ??
    undefined;

  const createdTo =
    optionalDate(
      query.createdTo,
      "Created-to time"
    ) ??
    undefined;

  if (
    createdFrom &&
    createdTo &&
    createdFrom >
      createdTo
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_QUERY_INVALID",
      "Created-from time must not be after created-to time."
    );
  }

  return {
    createdFrom,
    createdTo
  };
}

export function parseIntegrationEventQuery(
  value: unknown
) {
  const query =
    queryRecord(
      value
    );

  rejectUnknown(
    query,
    [
      "eventType",
      "entityType",
      "entityId",
      "correlationId",
      "createdFrom",
      "createdTo",
      "cursor",
      "limit"
    ]
  );

  const range =
    dateRange(
      query
    );

  const eventType =
    optionalString(
      query.eventType,
      "Event type",
      128
    );

  const entityType =
    optionalString(
      query.entityType,
      "Entity type",
      128
    );

  return {
    eventType:
      eventType
        ?.toLowerCase(),
    entityType:
      entityType
        ?.toUpperCase(),
    entityId:
      optionalString(
        query.entityId,
        "Entity identifier",
        128
      ) ??
      undefined,
    correlationId:
      optionalString(
        query.correlationId,
        "Correlation identifier",
        128
      ) ??
      undefined,
    ...range,
    cursor:
      optionalString(
        query.cursor,
        "Cursor",
        2_000
      ) ??
      undefined,
    limit:
      optionalLimit(
        query.limit
      )
  };
}

export function parseWebhookDeliveryQuery(
  value: unknown
) {
  const query =
    queryRecord(
      value
    );

  rejectUnknown(
    query,
    [
      "integrationEventId",
      "webhookEndpointId",
      "status",
      "createdFrom",
      "createdTo",
      "cursor",
      "limit"
    ]
  );

  const range =
    dateRange(
      query
    );

  return {
    integrationEventId:
      optionalUuid(
        query.integrationEventId,
        "Integration event ID"
      ),
    webhookEndpointId:
      optionalUuid(
        query.webhookEndpointId,
        "Webhook endpoint ID"
      ),
    status:
      optionalEnum(
        query.status,
        Object.values(
          WebhookDeliveryStatus
        ),
        "Webhook delivery status"
      ),
    ...range,
    cursor:
      optionalString(
        query.cursor,
        "Cursor",
        2_000
      ) ??
      undefined,
    limit:
      optionalLimit(
        query.limit
      )
  };
}
