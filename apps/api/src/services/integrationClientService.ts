import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  AuditEventCategory,
  AuditEventSource,
  IntegrationClientStatus,
  IntegrationCredentialStatus,
  WebhookEndpointStatus
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  redactAuditValue
} from "./auditRedactionService.js";

import {
  loadAuthorizedIntegrationClient,
  loadAuthorizedIntegrationMembership,
  requireIntegrationPermissions
} from "./integrationAuthorizationService.js";

import {
  normalizeIntegrationCode,
  normalizeOptionalText,
  normalizeRequiredText,
  validateFutureExpiry,
  validateIntegrationLimit,
  validateMetadata
} from "./integrationIdentityService.js";

import {
  generateIntegrationCredential
} from "./integrationSecurityService.js";

import {
  INTEGRATION_DEFAULT_LIMIT,
  INTEGRATION_MAX_CLIENTS,
  INTEGRATION_MAX_CREDENTIALS,
  INTEGRATION_MAX_LIMIT,
  IntegrationServiceError,
  type CreateIntegrationClientInput,
  type CreateIntegrationCredentialInput,
  type IntegrationActor,
  type IntegrationListInput,
  type IntegrationRequestContext,
  type ReplaceIntegrationScopesInput,
  type UpdateIntegrationClientInput
} from "./integrationTypes.js";

const clientSelect = {
  id: true,
  organizationId: true,
  code: true,
  name: true,
  description: true,
  status: true,
  externalSystemId: true,
  metadata: true,
  createdByOrganizationUserId:
    true,
  createdAt: true,
  updatedAt: true,
  suspendedAt: true,
  revokedAt: true,
  _count: {
    select: {
      credentials:
        true,
      permissions:
        true,
      endpoints:
        true
    }
  }
} satisfies
  Prisma.IntegrationClientSelect;

const credentialSelect = {
  id: true,
  organizationId: true,
  integrationClientId:
    true,
  prefix: true,
  name: true,
  status: true,
  expiresAt: true,
  lastUsedAt: true,
  createdByOrganizationUserId:
    true,
  createdAt: true,
  revokedAt: true
} satisfies
  Prisma.IntegrationCredentialSelect;

function translateIntegrationClientError(
  error: unknown
): never {
  if (
    error instanceof
      IntegrationServiceError
  ) {
    throw error;
  }

  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    if (
      error.code ===
        "P2002"
    ) {
      throw new IntegrationServiceError(
        "INTEGRATION_DUPLICATE",
        "The integration record already exists."
      );
    }

    if (
      error.code ===
        "P2003"
    ) {
      throw new IntegrationServiceError(
        "INTEGRATION_CONFLICT",
        "The integration record is still in use."
      );
    }
  }

  throw error;
}

function metadataValue(
  value: unknown
):
  Prisma.InputJsonValue |
  typeof Prisma.JsonNull {
  const redacted =
    redactAuditValue(
      value
    );

  if (
    redacted ===
      null
  ) {
    return Prisma.JsonNull;
  }

  return redacted as
    Prisma.InputJsonValue;
}

function auditContext(
  context:
    IntegrationRequestContext
) {
  return {
    ...(context.requestId
      ? {
          requestId:
            context.requestId
        }
      : {}),
    ...(context.correlationId
      ? {
          correlationId:
            context.correlationId
        }
      : {}),
    ...(context.ipAddress
      ? {
          ipAddress:
            context.ipAddress
        }
      : {}),
    ...(context.userAgent
      ? {
          userAgent:
            context.userAgent
        }
      : {}),
    ...(context.httpMethod
      ? {
          httpMethod:
            context.httpMethod
        }
      : {}),
    ...(context.requestPath
      ? {
          requestPath:
            context.requestPath
        }
      : {})
  };
}

export async function listIntegrationClients(
  actor:
    IntegrationActor,
  input:
    IntegrationListInput
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.view"
  );

  const limit =
    validateIntegrationLimit(
      input.limit,
      INTEGRATION_DEFAULT_LIMIT,
      INTEGRATION_MAX_LIMIT
    );

  return prisma
    .integrationClient
    .findMany({
      where: {
        organizationId:
          actor.organizationId,
        ...(input.status
          ? {
              status:
                input.status
            }
          : {}),
        ...(input.search
          ? {
              OR: [
                {
                  code: {
                    contains:
                      input.search,
                    mode:
                      "insensitive"
                  }
                },
                {
                  name: {
                    contains:
                      input.search,
                    mode:
                      "insensitive"
                  }
                },
                {
                  externalSystemId: {
                    contains:
                      input.search,
                    mode:
                      "insensitive"
                  }
                }
              ]
            }
          : {})
      },
      orderBy: [
        {
          createdAt:
            "desc"
        },
        {
          id:
            "desc"
        }
      ],
      take:
        limit,
      select:
        clientSelect
    });
}

export async function getIntegrationClient(
  actor:
    IntegrationActor,
  integrationClientId:
    string
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.view"
  );

  const client =
    await prisma
      .integrationClient
      .findFirst({
        where: {
          id:
            integrationClientId,
          organizationId:
            actor.organizationId
        },
        select:
          clientSelect
      });

  if (!client) {
    throw new IntegrationServiceError(
      "INTEGRATION_NOT_FOUND",
      "Integration client was not found."
    );
  }

  return client;
}

export async function createIntegrationClient(
  actor:
    IntegrationActor,
  input:
    CreateIntegrationClientInput,
  context:
    IntegrationRequestContext = {}
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.manage"
  );

  const code =
    normalizeIntegrationCode(
      input.code
    );

  const name =
    normalizeRequiredText(
      input.name,
      "Integration client name",
      200
    );

  const description =
    normalizeOptionalText(
      input.description,
      "Integration client description",
      2_000
    );

  const externalSystemId =
    normalizeOptionalText(
      input.externalSystemId,
      "External-system identifier",
      200
    );

  const metadata =
    validateMetadata(
      input.metadata
    );

  try {
    return await prisma.$transaction(
      async (
        tx
      ) => {
        const count =
          await tx
            .integrationClient
            .count({
              where: {
                organizationId:
                  actor.organizationId,
                status: {
                  not:
                    IntegrationClientStatus.REVOKED
                }
              }
            });

        if (
          count >=
            INTEGRATION_MAX_CLIENTS
        ) {
          throw new IntegrationServiceError(
            "INTEGRATION_LIMIT_EXCEEDED",
            `An organization may have at most ${INTEGRATION_MAX_CLIENTS} non-revoked integration clients.`
          );
        }

        const client =
          await tx
            .integrationClient
            .create({
              data: {
                organizationId:
                  actor.organizationId,
                code,
                name,
                ...(description !==
                undefined
                  ? {
                      description
                    }
                  : {}),
                ...(externalSystemId !==
                undefined
                  ? {
                      externalSystemId
                    }
                  : {}),
                ...(metadata !==
                undefined
                  ? {
                      metadata:
                        metadataValue(
                          metadata
                        )
                    }
                  : {}),
                createdByOrganizationUserId:
                  actor.organizationUserId
              },
              select:
                clientSelect
            });

        await createAuditLog(
          {
            organizationId:
              actor.organizationId,
            userId:
              actor.userId,
            organizationUserId:
              actor.organizationUserId,
            action:
              "INTEGRATION_CLIENT_CREATED",
            entityType:
              "INTEGRATION_CLIENT",
            entityId:
              client.id,
            category:
              AuditEventCategory.INTEGRATION,
            source:
              AuditEventSource.API,
            newValues: {
              code:
                client.code,
              name:
                client.name,
              status:
                client.status,
              externalSystemId:
                client.externalSystemId
            },
            ...auditContext(
              context
            )
          },
          tx
        );

        return client;
      }
    );
  } catch (
    error
  ) {
    translateIntegrationClientError(
      error
    );
  }
}

export async function updateIntegrationClient(
  actor:
    IntegrationActor,
  integrationClientId:
    string,
  input:
    UpdateIntegrationClientInput,
  context:
    IntegrationRequestContext = {}
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.manage"
  );

  const existing =
    await loadAuthorizedIntegrationClient(
      actor,
      integrationClientId
    );

  if (
    existing.status ===
      IntegrationClientStatus.REVOKED
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "A revoked integration client cannot be updated."
    );
  }

  const name =
    input.name !==
      undefined
      ? normalizeRequiredText(
          input.name,
          "Integration client name",
          200
        )
      : undefined;

  const description =
    normalizeOptionalText(
      input.description,
      "Integration client description",
      2_000
    );

  const externalSystemId =
    normalizeOptionalText(
      input.externalSystemId,
      "External-system identifier",
      200
    );

  const metadata =
    validateMetadata(
      input.metadata
    );

  try {
    return await prisma.$transaction(
      async (
        tx
      ) => {
        const updated =
          await tx
            .integrationClient
            .update({
              where: {
                id:
                  existing.id
              },
              data: {
                ...(name !==
                undefined
                  ? {
                      name
                    }
                  : {}),
                ...(description !==
                undefined
                  ? {
                      description
                    }
                  : {}),
                ...(externalSystemId !==
                undefined
                  ? {
                      externalSystemId
                    }
                  : {}),
                ...(metadata !==
                undefined
                  ? {
                      metadata:
                        metadataValue(
                          metadata
                        )
                    }
                  : {})
              },
              select:
                clientSelect
            });

        await createAuditLog(
          {
            organizationId:
              actor.organizationId,
            userId:
              actor.userId,
            organizationUserId:
              actor.organizationUserId,
            action:
              "INTEGRATION_CLIENT_UPDATED",
            entityType:
              "INTEGRATION_CLIENT",
            entityId:
              updated.id,
            category:
              AuditEventCategory.INTEGRATION,
            source:
              AuditEventSource.API,
            oldValues: {
              name:
                existing.name,
              description:
                existing.description,
              externalSystemId:
                existing.externalSystemId
            },
            newValues: {
              name:
                updated.name,
              description:
                updated.description,
              externalSystemId:
                updated.externalSystemId
            },
            ...auditContext(
              context
            )
          },
          tx
        );

        return updated;
      }
    );
  } catch (
    error
  ) {
    translateIntegrationClientError(
      error
    );
  }
}

async function transitionIntegrationClient(
  actor:
    IntegrationActor,
  integrationClientId:
    string,
  targetStatus:
    IntegrationClientStatus,
  context:
    IntegrationRequestContext
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.manage"
  );

  const existing =
    await loadAuthorizedIntegrationClient(
      actor,
      integrationClientId
    );

  const now =
    new Date();

  if (
    targetStatus ===
      IntegrationClientStatus.SUSPENDED &&
    existing.status !==
      IntegrationClientStatus.ACTIVE
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "Only an active integration client may be suspended."
    );
  }

  if (
    targetStatus ===
      IntegrationClientStatus.ACTIVE &&
    existing.status !==
      IntegrationClientStatus.SUSPENDED
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "Only a suspended integration client may be activated."
    );
  }

  if (
    targetStatus ===
      IntegrationClientStatus.REVOKED &&
    existing.status ===
      IntegrationClientStatus.REVOKED
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "The integration client is already revoked."
    );
  }

  try {
    return await prisma.$transaction(
      async (
        tx
      ) => {
        const changed =
          await tx
            .integrationClient
            .updateMany({
              where: {
                id:
                  existing.id,
                organizationId:
                  actor.organizationId,
                status:
                  existing.status
              },
              data: {
                status:
                  targetStatus,
                suspendedAt:
                  targetStatus ===
                    IntegrationClientStatus.SUSPENDED
                    ? now
                    : targetStatus ===
                        IntegrationClientStatus.ACTIVE
                      ? null
                      : existing.suspendedAt,
                revokedAt:
                  targetStatus ===
                    IntegrationClientStatus.REVOKED
                    ? now
                    : null
              }
            });

        if (
          changed.count !==
            1
        ) {
          throw new IntegrationServiceError(
            "INTEGRATION_STATE_CONFLICT",
            "The integration client changed concurrently."
          );
        }

        if (
          targetStatus ===
            IntegrationClientStatus.REVOKED
        ) {
          await tx
            .integrationCredential
            .updateMany({
              where: {
                organizationId:
                  actor.organizationId,
                integrationClientId:
                  existing.id,
                status:
                  IntegrationCredentialStatus.ACTIVE
              },
              data: {
                status:
                  IntegrationCredentialStatus.REVOKED,
                revokedAt:
                  now
              }
            });

          await tx
            .webhookEndpoint
            .updateMany({
              where: {
                organizationId:
                  actor.organizationId,
                integrationClientId:
                  existing.id,
                status:
                  WebhookEndpointStatus.ACTIVE
              },
              data: {
                status:
                  WebhookEndpointStatus.DISABLED,
                disabledAt:
                  now
              }
            });
        }

        const updated =
          await tx
            .integrationClient
            .findUniqueOrThrow({
              where: {
                id:
                  existing.id
              },
              select:
                clientSelect
            });

        await createAuditLog(
          {
            organizationId:
              actor.organizationId,
            userId:
              actor.userId,
            organizationUserId:
              actor.organizationUserId,
            action:
              `INTEGRATION_CLIENT_${targetStatus}`,
            entityType:
              "INTEGRATION_CLIENT",
            entityId:
              updated.id,
            category:
              AuditEventCategory.INTEGRATION,
            source:
              AuditEventSource.API,
            oldValues: {
              status:
                existing.status
            },
            newValues: {
              status:
                updated.status
            },
            ...auditContext(
              context
            )
          },
          tx
        );

        return updated;
      }
    );
  } catch (
    error
  ) {
    translateIntegrationClientError(
      error
    );
  }
}

export async function suspendIntegrationClient(
  actor:
    IntegrationActor,
  integrationClientId:
    string,
  context:
    IntegrationRequestContext = {}
) {
  return transitionIntegrationClient(
    actor,
    integrationClientId,
    IntegrationClientStatus.SUSPENDED,
    context
  );
}

export async function activateIntegrationClient(
  actor:
    IntegrationActor,
  integrationClientId:
    string,
  context:
    IntegrationRequestContext = {}
) {
  return transitionIntegrationClient(
    actor,
    integrationClientId,
    IntegrationClientStatus.ACTIVE,
    context
  );
}

export async function revokeIntegrationClient(
  actor:
    IntegrationActor,
  integrationClientId:
    string,
  context:
    IntegrationRequestContext = {}
) {
  return transitionIntegrationClient(
    actor,
    integrationClientId,
    IntegrationClientStatus.REVOKED,
    context
  );
}

export async function listIntegrationCredentials(
  actor:
    IntegrationActor,
  integrationClientId:
    string
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.credentials"
  );

  await loadAuthorizedIntegrationClient(
    actor,
    integrationClientId
  );

  return prisma
    .integrationCredential
    .findMany({
      where: {
        organizationId:
          actor.organizationId,
        integrationClientId
      },
      orderBy: [
        {
          createdAt:
            "desc"
        },
        {
          id:
            "desc"
        }
      ],
      select:
        credentialSelect
    });
}

export async function createIntegrationCredential(
  actor:
    IntegrationActor,
  integrationClientId:
    string,
  input:
    CreateIntegrationCredentialInput,
  context:
    IntegrationRequestContext = {}
) {
  await requireIntegrationPermissions(
    actor,
    [
      "integrations.manage",
      "integrations.credentials"
    ]
  );

  const client =
    await loadAuthorizedIntegrationClient(
      actor,
      integrationClientId
    );

  if (
    client.status !==
      IntegrationClientStatus.ACTIVE
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "Credentials may be issued only to an active integration client."
    );
  }

  const name =
    normalizeRequiredText(
      input.name,
      "Credential name",
      200
    );

  const expiresAt =
    validateFutureExpiry(
      input.expiresAt
    );

  const generated =
    generateIntegrationCredential();

  try {
    const credentialRecord =
      await prisma.$transaction(
        async (
          tx
        ) => {
          const activeCount =
            await tx
              .integrationCredential
              .count({
                where: {
                  organizationId:
                    actor.organizationId,
                  integrationClientId:
                    client.id,
                  status:
                    IntegrationCredentialStatus.ACTIVE
                }
              });

          if (
            activeCount >=
              INTEGRATION_MAX_CREDENTIALS
          ) {
            throw new IntegrationServiceError(
              "INTEGRATION_LIMIT_EXCEEDED",
              `An integration client may have at most ${INTEGRATION_MAX_CREDENTIALS} active credentials.`
            );
          }

          const created =
            await tx
              .integrationCredential
              .create({
                data: {
                  organizationId:
                    actor.organizationId,
                  integrationClientId:
                    client.id,
                  prefix:
                    generated.prefix,
                  credentialHash:
                    generated
                      .credentialHash,
                  name,
                  ...(expiresAt !==
                  undefined
                    ? {
                        expiresAt
                      }
                    : {}),
                  createdByOrganizationUserId:
                    actor.organizationUserId
                },
                select:
                  credentialSelect
              });

          await createAuditLog(
            {
              organizationId:
                actor.organizationId,
              userId:
                actor.userId,
              organizationUserId:
                actor.organizationUserId,
              action:
                "INTEGRATION_CREDENTIAL_CREATED",
              entityType:
                "INTEGRATION_CREDENTIAL",
              entityId:
                created.id,
              category:
                AuditEventCategory.INTEGRATION,
              source:
                AuditEventSource.API,
              newValues: {
                integrationClientId:
                  client.id,
                prefix:
                  created.prefix,
                name:
                  created.name,
                status:
                  created.status,
                expiresAt:
                  created.expiresAt
              },
              ...auditContext(
                context
              )
            },
            tx
          );

          return created;
        }
      );

    return {
      ...credentialRecord,
      credential:
        generated.credential
    };
  } catch (
    error
  ) {
    translateIntegrationClientError(
      error
    );
  }
}

export async function revokeIntegrationCredential(
  actor:
    IntegrationActor,
  integrationCredentialId:
    string,
  context:
    IntegrationRequestContext = {}
) {
  await requireIntegrationPermissions(
    actor,
    [
      "integrations.manage",
      "integrations.credentials"
    ]
  );

  const existing =
    await prisma
      .integrationCredential
      .findFirst({
        where: {
          id:
            integrationCredentialId,
          organizationId:
            actor.organizationId
        },
        select:
          credentialSelect
      });

  if (!existing) {
    throw new IntegrationServiceError(
      "INTEGRATION_NOT_FOUND",
      "Integration credential was not found."
    );
  }

  if (
    existing.status !==
      IntegrationCredentialStatus.ACTIVE
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "Only an active integration credential may be revoked."
    );
  }

  const now =
    new Date();

  try {
    return await prisma.$transaction(
      async (
        tx
      ) => {
        const changed =
          await tx
            .integrationCredential
            .updateMany({
              where: {
                id:
                  existing.id,
                organizationId:
                  actor.organizationId,
                status:
                  IntegrationCredentialStatus.ACTIVE
              },
              data: {
                status:
                  IntegrationCredentialStatus.REVOKED,
                revokedAt:
                  now
              }
            });

        if (
          changed.count !==
            1
        ) {
          throw new IntegrationServiceError(
            "INTEGRATION_STATE_CONFLICT",
            "The integration credential changed concurrently."
          );
        }

        const revoked =
          await tx
            .integrationCredential
            .findUniqueOrThrow({
              where: {
                id:
                  existing.id
              },
              select:
                credentialSelect
            });

        await createAuditLog(
          {
            organizationId:
              actor.organizationId,
            userId:
              actor.userId,
            organizationUserId:
              actor.organizationUserId,
            action:
              "INTEGRATION_CREDENTIAL_REVOKED",
            entityType:
              "INTEGRATION_CREDENTIAL",
            entityId:
              revoked.id,
            category:
              AuditEventCategory.INTEGRATION,
            source:
              AuditEventSource.API,
            oldValues: {
              status:
                existing.status
            },
            newValues: {
              status:
                revoked.status,
              revokedAt:
                revoked.revokedAt
            },
            ...auditContext(
              context
            )
          },
          tx
        );

        return revoked;
      }
    );
  } catch (
    error
  ) {
    translateIntegrationClientError(
      error
    );
  }
}

export async function listIntegrationScopes(
  actor:
    IntegrationActor,
  integrationClientId:
    string
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.view"
  );

  await loadAuthorizedIntegrationClient(
    actor,
    integrationClientId
  );

  return prisma
    .integrationClientPermission
    .findMany({
      where: {
        organizationId:
          actor.organizationId,
        integrationClientId
      },
      orderBy: {
        permission: {
          code:
            "asc"
        }
      },
      select: {
        id: true,
        permissionId: true,
        createdAt: true,
        permission: {
          select: {
            code: true,
            name: true,
            description:
              true,
            module: true
          }
        }
      }
    });
}

export async function replaceIntegrationScopes(
  actor:
    IntegrationActor,
  integrationClientId:
    string,
  input:
    ReplaceIntegrationScopesInput,
  context:
    IntegrationRequestContext = {}
) {
  await loadAuthorizedIntegrationMembership(
    actor,
    "integrations.manage"
  );

  const client =
    await loadAuthorizedIntegrationClient(
      actor,
      integrationClientId
    );

  if (
    client.status ===
      IntegrationClientStatus.REVOKED
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_STATE_CONFLICT",
      "Scopes cannot be changed for a revoked integration client."
    );
  }

  const permissionIds = [
    ...new Set(
      input.permissionIds
    )
  ];

  const permissions =
    permissionIds.length ===
      0
      ? []
      : await prisma
          .permission
          .findMany({
            where: {
              id: {
                in:
                  permissionIds
              },
              integrationAssignable:
                true
            },
            select: {
              id: true,
              code: true,
              name: true
            }
          });

  if (
    permissions.length !==
      permissionIds.length
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_SCOPE_INVALID",
      "One or more permissions cannot be assigned as integration scopes."
    );
  }

  try {
    return await prisma.$transaction(
      async (
        tx
      ) => {
        const previous =
          await tx
            .integrationClientPermission
            .findMany({
              where: {
                organizationId:
                  actor.organizationId,
                integrationClientId:
                  client.id
              },
              include: {
                permission:
                  true
              }
            });

        await tx
          .integrationClientPermission
          .deleteMany({
            where: {
              organizationId:
                actor.organizationId,
              integrationClientId:
                client.id
            }
          });

        if (
          permissions.length >
            0
        ) {
          await tx
            .integrationClientPermission
            .createMany({
              data:
                permissions.map(
                  (
                    permission
                  ) => ({
                    organizationId:
                      actor.organizationId,
                    integrationClientId:
                      client.id,
                    permissionId:
                      permission.id,
                    assignedByOrganizationUserId:
                      actor.organizationUserId
                  })
                )
            });
        }

        const updated =
          await tx
            .integrationClientPermission
            .findMany({
              where: {
                organizationId:
                  actor.organizationId,
                integrationClientId:
                  client.id
              },
              orderBy: {
                permission: {
                  code:
                    "asc"
                }
              },
              include: {
                permission:
                  true
              }
            });

        await createAuditLog(
          {
            organizationId:
              actor.organizationId,
            userId:
              actor.userId,
            organizationUserId:
              actor.organizationUserId,
            action:
              "INTEGRATION_SCOPES_REPLACED",
            entityType:
              "INTEGRATION_CLIENT",
            entityId:
              client.id,
            category:
              AuditEventCategory.INTEGRATION,
            source:
              AuditEventSource.API,
            oldValues: {
              scopes:
                previous.map(
                  (
                    item
                  ) =>
                    item.permission
                      .code
                )
            },
            newValues: {
              scopes:
                updated.map(
                  (
                    item
                  ) =>
                    item.permission
                      .code
                )
            },
            ...auditContext(
              context
            )
          },
          tx
        );

        return updated.map(
          (
            item
          ) => ({
            id:
              item.id,
            permissionId:
              item.permissionId,
            createdAt:
              item.createdAt,
            permission: {
              code:
                item.permission.code,
              name:
                item.permission.name,
              description:
                item.permission
                  .description,
              module:
                item.permission.module
            }
          })
        );
      }
    );
  } catch (
    error
  ) {
    translateIntegrationClientError(
      error
    );
  }
}
