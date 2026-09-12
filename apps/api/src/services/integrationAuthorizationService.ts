import {
  prisma
} from "../../../../packages/database/index.js";

import {
  IntegrationServiceError,
  type IntegrationActor
} from "./integrationTypes.js";

export async function loadAuthorizedIntegrationMembership(
  actor:
    IntegrationActor,
  permissionCode:
    string
) {
  const membership =
    await prisma
      .organizationUser
      .findFirst({
        where: {
          id:
            actor.organizationUserId,
          organizationId:
            actor.organizationId,
          userId:
            actor.userId,
          status:
            "ACTIVE"
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission:
                    true
                }
              }
            }
          }
        }
      });

  if (!membership) {
    throw new IntegrationServiceError(
      "INTEGRATION_FORBIDDEN",
      "Active organization membership is required."
    );
  }

  const permissions =
    new Set(
      membership.role
        .rolePermissions
        .map(
          (
            rolePermission
          ) =>
            rolePermission
              .permission
              .code
        )
    );

  if (
    !permissions.has(
      permissionCode
    )
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_FORBIDDEN",
      "Integration permission is required."
    );
  }

  return {
    id:
      membership.id,
    organizationId:
      membership.organizationId,
    userId:
      membership.userId,
    permissions
  };
}

export async function requireIntegrationPermissions(
  actor:
    IntegrationActor,
  permissionCodes:
    string[]
) {
  if (
    permissionCodes.length ===
      0
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_FORBIDDEN",
      "At least one integration permission is required."
    );
  }

  const membership =
    await loadAuthorizedIntegrationMembership(
      actor,
      permissionCodes[0]!
    );

  for (
    const permissionCode
    of permissionCodes
  ) {
    if (
      !membership
        .permissions
        .has(
          permissionCode
        )
    ) {
      throw new IntegrationServiceError(
        "INTEGRATION_FORBIDDEN",
        "Integration permission is required."
      );
    }
  }

  return membership;
}

export async function loadAuthorizedIntegrationClient(
  actor:
    IntegrationActor,
  integrationClientId:
    string
) {
  const client =
    await prisma
      .integrationClient
      .findFirst({
        where: {
          id:
            integrationClientId,
          organizationId:
            actor.organizationId
        }
      });

  if (!client) {
    throw new IntegrationServiceError(
      "INTEGRATION_NOT_FOUND",
      "Integration client was not found."
    );
  }

  return client;
}

export async function loadAuthorizedWebhookEndpoint(
  actor:
    IntegrationActor,
  webhookEndpointId:
    string
) {
  const endpoint =
    await prisma
      .webhookEndpoint
      .findFirst({
        where: {
          id:
            webhookEndpointId,
          organizationId:
            actor.organizationId
        }
      });

  if (!endpoint) {
    throw new IntegrationServiceError(
      "INTEGRATION_NOT_FOUND",
      "Webhook endpoint was not found."
    );
  }

  return endpoint;
}
