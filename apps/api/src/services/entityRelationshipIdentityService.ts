import {
  createHash
} from "node:crypto";

import {
  EntityRelationshipType,
  EntityType
} from "../../../../packages/database/generated/client/enums.js";

import {
  EntityRelationshipServiceError,
  type EntityEndpoint,
  type NormalizedRelationship
} from "./entityRelationshipTypes.js";

const symmetricTypes =
  new Set<EntityRelationshipType>([
    EntityRelationshipType.RELATED_TO,
    EntityRelationshipType.ASSOCIATED_WITH
  ]);

const allowedDirectionalPairs =
  new Set<string>([
    pair(
      EntityType.CONTACT,
      EntityType.WORK_ITEM
    ),
    pair(
      EntityType.CONTACT,
      EntityType.REQUEST
    ),
    pair(
      EntityType.WORK_ITEM,
      EntityType.REQUEST
    ),
    pair(
      EntityType.REQUEST,
      EntityType.WORKFLOW_INSTANCE
    ),
    pair(
      EntityType.WORK_ITEM,
      EntityType.WORKFLOW_INSTANCE
    ),
    pair(
      EntityType.ORGANIZATION_USER,
      EntityType.WORK_ITEM
    ),
    pair(
      EntityType.ORGANIZATION_USER,
      EntityType.REQUEST
    ),
    pair(
      EntityType.BRANCH,
      EntityType.DEPARTMENT
    )
  ]);

function pair(
  sourceType: EntityType,
  targetType: EntityType
) {
  return `${sourceType}->${targetType}`;
}

function endpointIdentity(
  endpoint: EntityEndpoint
) {
  return (
    `${endpoint.entityType}:` +
    endpoint.entityId.toLowerCase()
  );
}

function compareEndpoints(
  left: EntityEndpoint,
  right: EntityEndpoint
) {
  return endpointIdentity(left)
    .localeCompare(
      endpointIdentity(right)
    );
}

function pairIsAllowed(
  source: EntityEndpoint,
  target: EntityEndpoint,
  symmetric: boolean
) {
  if (
    source.entityType ===
      EntityType.DOCUMENT ||
    target.entityType ===
      EntityType.DOCUMENT
  ) {
    return false;
  }

  const direct =
    allowedDirectionalPairs.has(
      pair(
        source.entityType,
        target.entityType
      )
    );

  if (direct) {
    return true;
  }

  return (
    symmetric &&
    allowedDirectionalPairs.has(
      pair(
        target.entityType,
        source.entityType
      )
    )
  );
}

export function isSymmetricRelationship(
  relationshipType:
    EntityRelationshipType
) {
  return symmetricTypes.has(
    relationshipType
  );
}

export function normalizeRelationship(
  source: EntityEndpoint,
  target: EntityEndpoint,
  relationshipType:
    EntityRelationshipType
): NormalizedRelationship {
  if (
    source.entityType ===
      target.entityType &&
    source.entityId.toLowerCase() ===
      target.entityId.toLowerCase()
  ) {
    throw new EntityRelationshipServiceError(
      "RELATIONSHIP_SELF_FORBIDDEN",
      "An entity cannot be related to itself."
    );
  }

  const symmetric =
    isSymmetricRelationship(
      relationshipType
    );

  if (
    !pairIsAllowed(
      source,
      target,
      symmetric
    )
  ) {
    throw new EntityRelationshipServiceError(
      "RELATIONSHIP_PAIR_UNSUPPORTED",
      "This entity relationship pair is not supported."
    );
  }

  let normalizedSource =
    source;

  let normalizedTarget =
    target;

  if (
    symmetric &&
    compareEndpoints(
      normalizedSource,
      normalizedTarget
    ) > 0
  ) {
    normalizedSource =
      target;

    normalizedTarget =
      source;
  }

  const canonicalPayload =
    JSON.stringify([
      relationshipType,
      normalizedSource.entityType,
      normalizedSource.entityId
        .toLowerCase(),
      normalizedTarget.entityType,
      normalizedTarget.entityId
        .toLowerCase()
    ]);

  const canonicalKey =
    createHash("sha256")
      .update(canonicalPayload)
      .digest("hex");

  return {
    source:
      normalizedSource,
    target:
      normalizedTarget,
    relationshipType,
    symmetric,
    canonicalKey
  };
}

export function relationshipMatchesAnchor(
  relationship: {
    sourceType: EntityType;
    sourceId: string;
    targetType: EntityType;
    targetId: string;
  },
  anchor: EntityEndpoint
) {
  return (
    (
      relationship.sourceType ===
        anchor.entityType &&
      relationship.sourceId ===
        anchor.entityId
    ) ||
    (
      relationship.targetType ===
        anchor.entityType &&
      relationship.targetId ===
        anchor.entityId
    )
  );
}
