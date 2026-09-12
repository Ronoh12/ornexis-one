import type {
  Response
} from "express";

import type {
  IntegrationAuthenticatedRequest
} from "../middleware/authenticateIntegration.js";

export async function me(
  req:
    IntegrationAuthenticatedRequest,
  res:
    Response
) {
  const actor =
    req.integrationAuth;

  if (!actor) {
    return res.status(
      401
    ).json({
      success:
        false,
      message:
        "Integration authentication required"
    });
  }

  return res.json({
    success:
      true,
    data: {
      organizationId:
        actor.organizationId,
      integrationClientId:
        actor.integrationClientId,
      integrationCredentialId:
        actor.integrationCredentialId,
      clientCode:
        actor.clientCode,
      scopes: [
        ...actor.scopes
      ].sort()
    }
  });
}
