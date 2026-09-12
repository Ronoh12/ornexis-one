import type {
  NextFunction,
  Request,
  Response
} from "express";

import {
  IntegrationClientStatus,
  IntegrationCredentialStatus
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  hashIntegrationCredential,
  parseIntegrationCredential,
  safeHashEquals
} from "../services/integrationSecurityService.js";

import type {
  IntegrationMachineActor
} from "../services/integrationTypes.js";

export type IntegrationAuthenticatedRequest =
  Request & {
    integrationAuth?:
      IntegrationMachineActor;
  };

function unauthorized(
  res:
    Response
) {
  return res.status(
    401
  ).json({
    success:
      false,
    message:
      "Invalid or inactive integration credential"
  });
}

export async function authenticateIntegration(
  req:
    IntegrationAuthenticatedRequest,
  res:
    Response,
  next:
    NextFunction
) {
  const authorizationHeader =
    req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader
      .startsWith(
        "OrnexisIntegration "
      )
  ) {
    return res.status(
      401
    ).json({
      success:
        false,
      message:
        "Integration authentication required"
    });
  }

  const rawCredential =
    authorizationHeader
      .slice(
        "OrnexisIntegration "
          .length
      )
      .trim();

  let parsed: {
    credential: string;
    prefix: string;
  };

  try {
    parsed =
      parseIntegrationCredential(
        rawCredential
      );
  } catch {
    return unauthorized(
      res
    );
  }

  const credential =
    await prisma
      .integrationCredential
      .findUnique({
        where: {
          prefix:
            parsed.prefix
        },
        include: {
          integrationClient: {
            include: {
              permissions: {
                include: {
                  permission:
                    true
                }
              }
            }
          }
        }
      });

  const presentedHash =
    hashIntegrationCredential(
      parsed.credential
    );

  const storedHash =
    credential
      ?.credentialHash ??
    "0".repeat(
      64
    );

  const validHash =
    safeHashEquals(
      presentedHash,
      storedHash
    );

  if (
    !credential ||
    !validHash
  ) {
    return unauthorized(
      res
    );
  }

  const now =
    new Date();

  const expired =
    credential.expiresAt !==
      null &&
    credential.expiresAt <=
      now;

  if (expired) {
    if (
      credential.status ===
        IntegrationCredentialStatus.ACTIVE
    ) {
      await prisma
        .integrationCredential
        .updateMany({
          where: {
            id:
              credential.id,
            status:
              IntegrationCredentialStatus.ACTIVE
          },
          data: {
            status:
              IntegrationCredentialStatus.EXPIRED
          }
        });
    }

    return unauthorized(
      res
    );
  }

  if (
    credential.status !==
      IntegrationCredentialStatus.ACTIVE ||
    credential.integrationClient
      .status !==
      IntegrationClientStatus.ACTIVE
  ) {
    return unauthorized(
      res
    );
  }

  const organizationHeader =
    req.headers[
      "x-organization-id"
    ];

  if (
    organizationHeader !==
      undefined &&
    (
      typeof organizationHeader !==
        "string" ||
      organizationHeader !==
        credential.organizationId
    )
  ) {
    return res.status(
      403
    ).json({
      success:
        false,
      message:
        "Integration organization context is invalid"
    });
  }

  req.integrationAuth = {
    organizationId:
      credential.organizationId,
    integrationClientId:
      credential.integrationClientId,
    integrationCredentialId:
      credential.id,
    clientCode:
      credential.integrationClient
        .code,
    scopes:
      new Set(
        credential
          .integrationClient
          .permissions
          .filter(
            (
              assignment
            ) =>
              assignment.permission
                .integrationAssignable
          )
          .map(
            (
              assignment
            ) =>
              assignment.permission
                .code
          )
      )
  };

  await prisma
    .integrationCredential
    .update({
      where: {
        id:
          credential.id
      },
      data: {
        lastUsedAt:
          now
      }
    });

  return next();
}
