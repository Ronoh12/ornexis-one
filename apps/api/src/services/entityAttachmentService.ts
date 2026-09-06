import {
  EntityAttachmentType,
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
  loadEntityRelationshipMembership,
  membershipHasPermission
} from "./entityAuthorizationService.js";

import {
  EntityRelationshipServiceError,
  type EntityEndpoint,
  type EntityRelationshipActor
} from "./entityRelationshipTypes.js";

const attachmentInclude = {
  attachedBy: {
    select: {
      id: true,
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  },
  document: {
    select: {
      id: true,
      title: true,
      description: true,
      originalFileName: true,
      mimeType: true,
      fileExtension: true,
      sizeBytes: true,
      status: true,
      branchId: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true
    }
  }
} satisfies Prisma.EntityAttachmentInclude;

type AttachmentRecord =
  Prisma.EntityAttachmentGetPayload<{
    include:
      typeof attachmentInclude;
  }>;

type AttachmentIdentity = {
  id: string;
  documentId: string;
  entityType:
    EntityAttachmentType;
  entityId: string;
};

export type AttachmentMutationHook =
  (
    tx: Prisma.TransactionClient,
    attachment:
      AttachmentIdentity
  ) => Promise<unknown>;

function parentEndpoint(
  entityType:
    EntityAttachmentType,
  entityId: string
): EntityEndpoint {
  switch (entityType) {
    case EntityAttachmentType.WORK_ITEM:
      return {
        entityType:
          EntityType.WORK_ITEM,
        entityId
      };

    case EntityAttachmentType.CONTACT:
      return {
        entityType:
          EntityType.CONTACT,
        entityId
      };

    case EntityAttachmentType.REQUEST:
      return {
        entityType:
          EntityType.REQUEST,
        entityId
      };
  }
}

function moduleAuditAction(
  entityType:
    EntityAttachmentType,
  operation:
    "ADDED" |
    "REMOVED"
) {
  return (
    `${entityType}_ATTACHMENT_` +
    operation
  );
}

function requireDocumentsView(
  permissions: Set<string>
) {
  if (
    !permissions.has(
      "documents.view"
    )
  ) {
    throw new EntityRelationshipServiceError(
      "ATTACHMENT_DOCUMENT_FORBIDDEN",
      "Document access is required."
    );
  }
}

async function safeAttachment(
  actor:
    EntityRelationshipActor,
  attachment:
    AttachmentRecord
) {
  const membership =
    await loadEntityRelationshipMembership(
      actor
    );

  requireDocumentsView(
    membership.permissions
  );

  await authorizeEntity(
    actor,
    membership,
    parentEndpoint(
      attachment.entityType,
      attachment.entityId
    ),
    "VIEW"
  );

  await authorizeEntity(
    actor,
    membership,
    {
      entityType:
        EntityType.DOCUMENT,
      entityId:
        attachment.documentId
    },
    "VIEW"
  );

  return {
    id:
      attachment.id,
    organizationId:
      attachment.organizationId,
    documentId:
      attachment.documentId,
    entityType:
      attachment.entityType,
    entityId:
      attachment.entityId,
    attachedByOrganizationUserId:
      attachment
        .attachedByOrganizationUserId,
    attachedBy: {
      organizationUserId:
        attachment.attachedBy.id,
      displayName:
        [
          attachment.attachedBy
            .user.firstName,
          attachment.attachedBy
            .user.lastName
        ]
          .filter(Boolean)
          .join(" ")
    },
    createdAt:
      attachment.createdAt,
    document: {
      id:
        attachment.document.id,
      title:
        attachment.document.title,
      description:
        attachment.document
          .description,
      originalFileName:
        attachment.document
          .originalFileName,
      mimeType:
        attachment.document
          .mimeType,
      fileExtension:
        attachment.document
          .fileExtension,
      sizeBytes:
        attachment.document
          .sizeBytes.toString(),
      status:
        attachment.document.status,
      createdAt:
        attachment.document
          .createdAt,
      updatedAt:
        attachment.document
          .updatedAt
    },
    downloadAvailable:
      membershipHasPermission(
        membership,
        "documents.download"
      )
  };
}

async function findAttachment(
  organizationId: string,
  input: {
    attachmentId?: string;
    documentId?: string;
    entityType:
      EntityAttachmentType;
    entityId: string;
  }
) {
  return prisma.entityAttachment
    .findFirst({
      where: {
        organizationId,
        entityType:
          input.entityType,
        entityId:
          input.entityId,
        ...(input.attachmentId
          ? {
              id:
                input.attachmentId
            }
          : {}),
        ...(input.documentId
          ? {
              documentId:
                input.documentId
            }
          : {})
      },
      include:
        attachmentInclude
    });
}

export async function createEntityAttachment(
  actor:
    EntityRelationshipActor,
  input: {
    entityType:
      EntityAttachmentType;
    entityId: string;
    documentId: string;
    onCreated?:
      AttachmentMutationHook;
  }
) {
  const membership =
    await loadEntityRelationshipMembership(
      actor
    );

  requireDocumentsView(
    membership.permissions
  );

  await authorizeEntity(
    actor,
    membership,
    parentEndpoint(
      input.entityType,
      input.entityId
    ),
    "ATTACH"
  );

  const document =
    await authorizeEntity(
      actor,
      membership,
      {
        entityType:
          EntityType.DOCUMENT,
        entityId:
          input.documentId
      },
      "VIEW"
    );

  if (
    document.summary.status !==
      "ACTIVE"
  ) {
    throw new EntityRelationshipServiceError(
      "ATTACHMENT_DOCUMENT_INACTIVE",
      "Only an active Document may be attached."
    );
  }

  const result =
    await prisma.$transaction(
      async (tx) => {
        const inserted =
          await tx.$queryRaw<
            Array<{
              id: string;
            }>
          >(
            Prisma.sql`
              INSERT INTO "entity_attachments" (
                "id",
                "organization_id",
                "document_id",
                "entity_type",
                "entity_id",
                "attached_by_organization_user_id",
                "created_at"
              )
              VALUES (
                gen_random_uuid(),
                ${actor.organizationId}::uuid,
                ${input.documentId}::uuid,
                ${input.entityType}::"EntityAttachmentType",
                ${input.entityId}::uuid,
                ${membership.id}::uuid,
                CURRENT_TIMESTAMP
              )
              ON CONFLICT (
                "organization_id",
                "document_id",
                "entity_type",
                "entity_id"
              )
              DO NOTHING
              RETURNING "id"
            `
          );

        const created =
          inserted.length ===
            1;

        const attachment =
          await tx.entityAttachment
            .findFirst({
              where: {
                organizationId:
                  actor.organizationId,
                documentId:
                  input.documentId,
                entityType:
                  input.entityType,
                entityId:
                  input.entityId
              },
              include:
                attachmentInclude
            });

        if (!attachment) {
          throw new EntityRelationshipServiceError(
            "ATTACHMENT_CREATE_FAILED",
            "The attachment could not be created."
          );
        }

        if (
          created &&
          input.onCreated
        ) {
          await input.onCreated(
            tx,
            {
              id:
                attachment.id,
              documentId:
                attachment.documentId,
              entityType:
                attachment.entityType,
              entityId:
                attachment.entityId
            }
          );
        }

        return {
          attachment,
          created
        };
      }
    );

  if (result.created) {
    await Promise.all([
      createAuditLog({
        organizationId:
          actor.organizationId,
        userId:
          actor.userId,
        action:
          "ENTITY_ATTACHMENT_CREATED",
        entityType:
          "EntityAttachment",
        entityId:
          result.attachment.id,
        newValues: {
          documentId:
            result.attachment
              .documentId,
          parentType:
            result.attachment
              .entityType,
          parentId:
            result.attachment
              .entityId
        }
      }),
      createAuditLog({
        organizationId:
          actor.organizationId,
        userId:
          actor.userId,
        action:
          moduleAuditAction(
            input.entityType,
            "ADDED"
          ),
        entityType:
          "EntityAttachment",
        entityId:
          result.attachment.id
      })
    ]);
  }

  return {
    attachment:
      await safeAttachment(
        actor,
        result.attachment
      ),
    created:
      result.created
  };
}

export async function listEntityAttachments(
  actor:
    EntityRelationshipActor,
  input: {
    entityType:
      EntityAttachmentType;
    entityId: string;
    limit?: number;
  }
) {
  const membership =
    await loadEntityRelationshipMembership(
      actor
    );

  requireDocumentsView(
    membership.permissions
  );

  await authorizeEntity(
    actor,
    membership,
    parentEndpoint(
      input.entityType,
      input.entityId
    ),
    "VIEW"
  );

  const attachments =
    await prisma.entityAttachment
      .findMany({
        where: {
          organizationId:
            actor.organizationId,
          entityType:
            input.entityType,
          entityId:
            input.entityId
        },
        include:
          attachmentInclude,
        orderBy: [
          {
            createdAt:
              "desc"
          },
          {
            documentId:
              "asc"
          },
          {
            id:
              "asc"
          }
        ],
        take:
          input.limit ??
          100
      });

  const visible = [];

  for (
    const attachment of
    attachments
  ) {
    try {
      visible.push(
        await safeAttachment(
          actor,
          attachment
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

export async function removeEntityAttachment(
  actor:
    EntityRelationshipActor,
  input: {
    entityType:
      EntityAttachmentType;
    entityId: string;
    attachmentId: string;
    onRemoved?:
      AttachmentMutationHook;
  }
) {
  const membership =
    await loadEntityRelationshipMembership(
      actor
    );

  requireDocumentsView(
    membership.permissions
  );

  await authorizeEntity(
    actor,
    membership,
    parentEndpoint(
      input.entityType,
      input.entityId
    ),
    "ATTACH"
  );

  const existing =
    await findAttachment(
      actor.organizationId,
      {
        attachmentId:
          input.attachmentId,
        entityType:
          input.entityType,
        entityId:
          input.entityId
      }
    );

  if (!existing) {
    throw new EntityRelationshipServiceError(
      "ATTACHMENT_NOT_FOUND",
      "The attachment was not found."
    );
  }

  await authorizeEntity(
    actor,
    membership,
    {
      entityType:
        EntityType.DOCUMENT,
      entityId:
        existing.documentId
    },
    "VIEW"
  );

  await prisma.$transaction(
    async (tx) => {
      await tx.entityAttachment
        .delete({
          where: {
            id:
              existing.id
          }
        });

      if (input.onRemoved) {
        await input.onRemoved(
          tx,
          {
            id:
              existing.id,
            documentId:
              existing.documentId,
            entityType:
              existing.entityType,
            entityId:
              existing.entityId
          }
        );
      }
    }
  );

  await Promise.all([
    createAuditLog({
      organizationId:
        actor.organizationId,
      userId:
        actor.userId,
      action:
        "ENTITY_ATTACHMENT_REMOVED",
      entityType:
        "EntityAttachment",
      entityId:
        existing.id,
      oldValues: {
        documentId:
          existing.documentId,
        parentType:
          existing.entityType,
        parentId:
          existing.entityId
      }
    }),
    createAuditLog({
      organizationId:
        actor.organizationId,
      userId:
        actor.userId,
      action:
        moduleAuditAction(
          input.entityType,
          "REMOVED"
        ),
      entityType:
        "EntityAttachment",
      entityId:
        existing.id
    })
  ]);

  return {
    id:
      existing.id,
    documentId:
      existing.documentId,
    entityType:
      existing.entityType,
    entityId:
      existing.entityId,
    removed:
      true
  };
}

export async function listDocumentAttachments(
  actor:
    EntityRelationshipActor,
  documentId: string,
  limit = 100
) {
  const membership =
    await loadEntityRelationshipMembership(
      actor
    );

  requireDocumentsView(
    membership.permissions
  );

  await authorizeEntity(
    actor,
    membership,
    {
      entityType:
        EntityType.DOCUMENT,
      entityId:
        documentId
    },
    "VIEW"
  );

  const attachments =
    await prisma.entityAttachment
      .findMany({
        where: {
          organizationId:
            actor.organizationId,
          documentId
        },
        include:
          attachmentInclude,
        orderBy: [
          {
            createdAt:
              "desc"
          },
          {
            entityType:
              "asc"
          },
          {
            entityId:
              "asc"
          },
          {
            id:
              "asc"
          }
        ],
        take:
          limit
      });

  const visible = [];

  for (
    const attachment of
    attachments
  ) {
    try {
      const parent =
        await authorizeEntity(
          actor,
          membership,
          parentEndpoint(
            attachment.entityType,
            attachment.entityId
          ),
          "VIEW"
        );

      visible.push({
        id:
          attachment.id,
        entity:
          parent.summary,
        createdAt:
          attachment.createdAt,
        attachedByOrganizationUserId:
          attachment
            .attachedByOrganizationUserId
      });
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
