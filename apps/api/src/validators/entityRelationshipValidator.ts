import {
  EntityRelationshipType,
  EntityType
} from "../../../../packages/database/generated/client/enums.js";

import type {
  CreateEntityRelationshipInput,
  EntityEndpoint,
  RelationshipDirection
} from "../services/entityRelationshipTypes.js";

export class EntityRelationshipValidationError
  extends Error {
  constructor(
    message: string
  ) {
    super(message);
    this.name =
      "EntityRelationshipValidationError";
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function objectValue(
  value: unknown,
  field = "body"
): Record<string, unknown> {
  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new EntityRelationshipValidationError(
      `${field} must be an object.`
    );
  }

  return value as
    Record<string, unknown>;
}

function onlyFields(
  input:
    Record<string, unknown>,
  allowed: readonly string[]
) {
  const allowedSet =
    new Set(allowed);

  for (
    const field of
    Object.keys(input)
  ) {
    if (!allowedSet.has(field)) {
      throw new EntityRelationshipValidationError(
        `Field "${field}" is not allowed.`
      );
    }
  }
}

function singleValue(
  value: unknown,
  field: string
) {
  if (Array.isArray(value)) {
    throw new EntityRelationshipValidationError(
      `${field} must be provided only once.`
    );
  }

  return value;
}

function requiredString(
  value: unknown,
  field: string
) {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new EntityRelationshipValidationError(
      `${field} is required.`
    );
  }

  return value.trim();
}

function uuidValue(
  value: unknown,
  field: string
) {
  const parsed =
    requiredString(
      value,
      field
    );

  if (!uuidPattern.test(parsed)) {
    throw new EntityRelationshipValidationError(
      `${field} must be a valid UUID.`
    );
  }

  return parsed.toLowerCase();
}

function enumValue<
  T extends string
>(
  value: unknown,
  values: readonly T[],
  field: string
): T {
  const parsed =
    requiredString(
      value,
      field
    );

  if (
    !values.includes(
      parsed as T
    )
  ) {
    throw new EntityRelationshipValidationError(
      `${field} is not supported.`
    );
  }

  return parsed as T;
}

function optionalDescription(
  value: unknown
) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new EntityRelationshipValidationError(
      "description must be a string or null."
    );
  }

  const description =
    value.trim();

  if (
    description.length <
      1 ||
    description.length >
      1000
  ) {
    throw new EntityRelationshipValidationError(
      "description must contain between 1 and 1000 characters."
    );
  }

  return description;
}

function optionalMetadata(
  value: unknown
) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const metadata =
    objectValue(
      value,
      "metadata"
    );

  const serialized =
    JSON.stringify(metadata);

  if (
    Buffer.byteLength(
      serialized,
      "utf8"
    ) > 8192
  ) {
    throw new EntityRelationshipValidationError(
      "metadata must not exceed 8192 bytes."
    );
  }

  return metadata;
}

function endpoint(
  value: unknown,
  field: string
): EntityEndpoint {
  const input =
    objectValue(
      value,
      field
    );

  onlyFields(
    input,
    [
      "entityType",
      "entityId"
    ]
  );

  return {
    entityType:
      enumValue(
        input.entityType,
        Object.values(
          EntityType
        ),
        `${field}.entityType`
      ),
    entityId:
      uuidValue(
        input.entityId,
        `${field}.entityId`
      )
  };
}

export function parseRelationshipId(
  value: unknown
) {
  return uuidValue(
    value,
    "relationshipId"
  );
}

export function parseCreateEntityRelationship(
  value: unknown
): CreateEntityRelationshipInput {
  const input =
    objectValue(value);

  onlyFields(
    input,
    [
      "source",
      "target",
      "relationshipType",
      "description",
      "metadata"
    ]
  );

  return {
    source:
      endpoint(
        input.source,
        "source"
      ),
    target:
      endpoint(
        input.target,
        "target"
      ),
    relationshipType:
      enumValue(
        input.relationshipType,
        Object.values(
          EntityRelationshipType
        ),
        "relationshipType"
      ),
    ...(input.description !==
    undefined
      ? {
          description:
            optionalDescription(
              input.description
            )
        }
      : {}),
    ...(input.metadata !==
    undefined
      ? {
          metadata:
            optionalMetadata(
              input.metadata
            )
        }
      : {})
  };
}

export function parseEntityRelationshipQuery(
  query:
    Record<string, unknown>
) {
  onlyFields(
    query,
    [
      "entityType",
      "entityId",
      "relationshipType",
      "direction",
      "limit"
    ]
  );

  const entityType =
    enumValue(
      singleValue(
        query.entityType,
        "entityType"
      ),
      Object.values(
        EntityType
      ),
      "entityType"
    );

  const entityId =
    uuidValue(
      singleValue(
        query.entityId,
        "entityId"
      ),
      "entityId"
    );

  let direction:
    RelationshipDirection =
      "ANY";

  if (
    query.direction !==
      undefined
  ) {
    direction =
      enumValue(
        singleValue(
          query.direction,
          "direction"
        ),
        [
          "ANY",
          "OUTGOING",
          "INCOMING"
        ] as const,
        "direction"
      );
  }

  let limit = 50;

  if (query.limit !== undefined) {
    const raw =
      requiredString(
        singleValue(
          query.limit,
          "limit"
        ),
        "limit"
      );

    if (!/^[0-9]+$/.test(raw)) {
      throw new EntityRelationshipValidationError(
        "limit must be an integer."
      );
    }

    limit =
      Number(raw);

    if (
      limit < 1 ||
      limit > 100
    ) {
      throw new EntityRelationshipValidationError(
        "limit must be between 1 and 100."
      );
    }
  }

  const relationshipType =
    query.relationshipType ===
      undefined
      ? undefined
      : enumValue(
          singleValue(
            query.relationshipType,
            "relationshipType"
          ),
          Object.values(
            EntityRelationshipType
          ),
          "relationshipType"
        );

  return {
    anchor: {
      entityType,
      entityId
    },
    direction,
    ...(relationshipType
      ? {
          relationshipType
        }
      : {}),
    limit
  };
}
