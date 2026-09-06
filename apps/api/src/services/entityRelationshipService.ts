import {
  EntityRelationshipType,
  EntityType,
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  authorizeEntity,
  authorizeRelationshipEndpoints,
  loadEntityRelationshipMembership
} from "./entityAuthorizationService.js";

import {
  normalizeRelationship
} from "./entityRelationshipIdentityService.js";

import {
  EntityRelationshipServiceError,
  type CreateEntityRelationshipInput,
  type EntityEndpoint,
  type EntityRelationshipActor,
  type EntityRelationshipMembership,
  type RelationshipDirection
} from "./entityRelationshipTypes.js";

const relationshipInclude = {
  createdBy: {
    select: {
      id: true,
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  }
} satisfies Prisma.EntityRelationshipInclude;

type RelationshipRecord =
  Prisma.EntityRelationshipGetPayload<{
    include:
      typeof relationshipInclude;
  }>;

function translatePersistenceError(
  error: unknown
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      throw new EntityRelationshipServiceError(
        "RELATIONSHIP_DUPLICATE",
        "This entity relationship already exists."
      );
    }

    if (
      error.code === "P2003" ||
      error.code === "P2025"
    ) {
      throw new EntityRelationshipServiceError(
        "RELATIONSHIP_NOT_FOUND",
        "The entity relationship was not found."
      );
    }
  }

  throw error;
}

function endpointFromSource(
  relationship:
    RelationshipRecord
): EntityEndpoint {
  return {
    entityType:
      relationship.sourceType,
    entityId:
      relationship.sourceId
  };
}

function endpointFromTarget(
  relationship:
    RelationshipRecord
): EntityEndpoint {
  return {
    entityType:
      relationship.targetType,
    entityId:
      relationship.targetId
  };
}

async function serializeRelationship(
  actor:
    EntityRelationshipActor,
  membership:
    EntityRelationshipMembership,
  relationship:
    RelationshipRecord
) {
  const authorized =
    await authorizeRelationshipEndpoints(
      actor,
      membership,
      endpointFromSource(
        relationship
      ),
      endpointFromTarget(
        relationship
      ),
      "VIEW"
    );

  return {
    id:
      relationship.id,
    relationshipType:
      relationship.relationshipType,
    symmetric:
      relationship.relationshipType ===
        EntityRelationshipType.RELATED_TO ||
      relationship.relationshipType ===
        EntityRelationshipType.ASSOCIATED_WITH,
    source:
      authorized.source.summary,
    target:
      authorized.target.summary,
    description:
      relationship.description,
    metadata:
      relationship.metadata,
    createdBy: {
      organizationUserId:
        relationship.createdBy.id,
      displayName:
        [
          relationship.createdBy
            .user.firstName,
          relationship.createdBy
            .user.lastName
        ]
          .filter(Boolean)
          .join(" ")
    },
    createdAt:
      relationship.createdAt
  };
}

async function findByCanonicalKey(
  organizationId: string,
  canonicalKey: string
) {
  return prisma.entityRelationship
    .findUnique({
      where: {
        organizationId_canonicalKey: {
          organizationId,
          canonicalKey
        }
      },
      include:
        relationshipInclude
    });
}

export async function createEntityRelationship(
  actor:
    EntityRelationshipActor,
  input:
    CreateEntityRelationshipInput
) {
  const membership =
    await loadEntityRelationshipMembership(
      actor
    );

  const normalized =
    normalizeRelationship(
      input.source,
      input.target,
      input.relationshipType
    );

  await authorizeRelationshipEndpoints(
    actor,
    membership,
    normalized.source,
    normalized.target,
    "MANAGE"
  );

  const existing =
    await findByCanonicalKey(
      actor.organizationId,
      normalized.canonicalKey
    );

  if (existing) {
    return {
      relationship:
        await serializeRelationship(
          actor,
          membership,
          existing
        ),
      created:
        false
    };
  }

  let relationship:
    RelationshipRecord;

  try {
    relationship =
      await prisma.entityRelationship
        .create({
          data: {
            organizationId:
              actor.organizationId,
            sourceType:
              normalized.source
                .entityType,
            sourceId:
              normalized.source
                .entityId,
            targetType:
              normalized.target
                .entityType,
            targetId:
              normalized.target
                .entityId,
            relationshipType:
              normalized
                .relationshipType,
            canonicalKey:
              normalized.canonicalKey,
            ...(input.description !==
            undefined
              ? {
                  description:
                    input.description
                }
              : {}),
            ...(input.metadata !==
            undefined
              ? {
                  metadata:
                    input.metadata ===
                      null
                      ? Prisma.JsonNull
                      : input.metadata as
                          Prisma.InputJsonValue
                }
              : {}),
            createdByOrganizationUserId:
              membership.id
          },
          include:
            relationshipInclude
        });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const concurrent =
        await findByCanonicalKey(
          actor.organizationId,
          normalized.canonicalKey
        );

      if (concurrent) {
        return {
          relationship:
            await serializeRelationship(
              actor,
              membership,
              concurrent
            ),
          created:
            false
        };
      }
    }

    translatePersistenceError(
      error
    );
  }

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "ENTITY_RELATIONSHIP_CREATED",
    entityType:
      "EntityRelationship",
    entityId:
      relationship.id,
    newValues: {
      sourceType:
        relationship.sourceType,
      sourceId:
        relationship.sourceId,
      targetType:
        relationship.targetType,
      targetId:
        relationship.targetId,
      relationshipType:
        relationship.relationshipType
    }
  });

  return {
    relationship:
      await serializeRelationship(
        actor,
        membership,
        relationship
      ),
    created:
      true
  };
}

export async function getEntityRelationship(
  actor:
    EntityRelationshipActor,
  relationshipId: string
) {
  const membership =
    await loadEntityRelationshipMembership(
      actor
    );

  const relationship =
    await prisma.entityRelationship
      .findFirst({
        where: {
          id:
            relationshipId,
          organizationId:
            actor.organizationId
        },
        include:
          relationshipInclude
      });

  if (!relationship) {
    throw new EntityRelationshipServiceError(
      "RELATIONSHIP_NOT_FOUND",
      "The entity relationship was not found."
    );
  }

  try {
    return await serializeRelationship(
      actor,
      membership,
      relationship
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        EntityRelationshipServiceError
    ) {
      throw new EntityRelationshipServiceError(
        "RELATIONSHIP_NOT_FOUND",
        "The entity relationship was not found."
      );
    }

    throw error;
  }
}

function relationshipAnchorWhere(
  anchor: EntityEndpoint,
  direction:
    RelationshipDirection
) {
  const outgoing = {
    sourceType:
      anchor.entityType,
    sourceId:
      anchor.entityId
  };

  const incoming = {
    targetType:
      anchor.entityType,
    targetId:
      anchor.entityId
  };

  if (direction === "OUTGOING") {
    return outgoing;
  }

  if (direction === "INCOMING") {
    return incoming;
  }

  return {
    OR: [
      outgoing,
      incoming
    ]
  };
}

export async function listEntityRelationships(
  actor:
    EntityRelationshipActor,
  input: {
    anchor: EntityEndpoint;
    direction:
      RelationshipDirection;
    relationshipType?:
      EntityRelationshipType;
    limit: number;
  }
) {
  const membership =
    await loadEntityRelationshipMembership(
      actor
    );

  await authorizeEntity(
    actor,
    membership,
    input.anchor,
    "VIEW"
  );

  const relationships =
    await prisma.entityRelationship
      .findMany({
        where: {
          organizationId:
            actor.organizationId,
          ...relationshipAnchorWhere(
            input.anchor,
            input.direction
          ),
          ...(input.relationshipType
            ? {
                relationshipType:
                  input.relationshipType
              }
            : {})
        },
        include:
          relationshipInclude,
        orderBy: [
          {
            createdAt:
              "desc"
          },
          {
            relationshipType:
              "asc"
          },
          {
            sourceType:
              "asc"
          },
          {
            sourceId:
              "asc"
          },
          {
            targetType:
              "asc"
          },
          {
            targetId:
              "asc"
          },
          {
            id:
              "asc"
          }
        ],
        take:
          input.limit
      });

  const visible = [];

  for (
    const relationship of
    relationships
  ) {
    try {
      visible.push(
        await serializeRelationship(
          actor,
          membership,
          relationship
        )
      );
    } catch (error) {
      if (
        !(
          error instanceof
            EntityRelationshipServiceError
        )
      ) {
        throw error;
      }
    }
  }

  return visible;
}

export async function removeEntityRelationship(
  actor:
    EntityRelationshipActor,
  relationshipId: string
) {
  const membership =
    await loadEntityRelationshipMembership(
      actor
    );

  const relationship =
    await prisma.entityRelationship
      .findFirst({
        where: {
          id:
            relationshipId,
          organizationId:
            actor.organizationId
        },
        include:
          relationshipInclude
      });

  if (!relationship) {
    throw new EntityRelationshipServiceError(
      "RELATIONSHIP_NOT_FOUND",
      "The entity relationship was not found."
    );
  }

  try {
    await authorizeRelationshipEndpoints(
      actor,
      membership,
      endpointFromSource(
        relationship
      ),
      endpointFromTarget(
        relationship
      ),
      "MANAGE"
    );
  } catch (error) {
    if (
      error instanceof
        EntityRelationshipServiceError
    ) {
      throw new EntityRelationshipServiceError(
        "RELATIONSHIP_NOT_FOUND",
        "The entity relationship was not found."
      );
    }

    throw error;
  }

  try {
    await prisma.entityRelationship
      .delete({
        where: {
          id:
            relationship.id
        }
      });
  } catch (error) {
    translatePersistenceError(
      error
    );
  }

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "ENTITY_RELATIONSHIP_REMOVED",
    entityType:
      "EntityRelationship",
    entityId:
      relationship.id,
    oldValues: {
      sourceType:
        relationship.sourceType,
      sourceId:
        relationship.sourceId,
      targetType:
        relationship.targetType,
      targetId:
        relationship.targetId,
      relationshipType:
        relationship.relationshipType
    }
  });

  return {
    id:
      relationship.id,
    removed:
      true
  };
}

export async function countEntityRelationships(
  organizationId: string,
  endpoint: EntityEndpoint
) {
  return prisma.entityRelationship
    .count({
      where: {
        organizationId,
        OR: [
          {
            sourceType:
              endpoint.entityType,
            sourceId:
              endpoint.entityId
          },
          {
            targetType:
              endpoint.entityType,
            targetId:
              endpoint.entityId
          }
        ]
      }
    });
}

export async function requireNoEntityRelationships(
  organizationId: string,
  endpoint: EntityEndpoint
) {
  const count =
    await countEntityRelationships(
      organizationId,
      endpoint
    );

  if (count > 0) {
    throw new EntityRelationshipServiceError(
      "RELATIONSHIP_DEPENDENCY_EXISTS",
      "Remove this entity's relationships before deleting it."
    );
  }
}

export {
  EntityRelationshipType,
  EntityType
};
