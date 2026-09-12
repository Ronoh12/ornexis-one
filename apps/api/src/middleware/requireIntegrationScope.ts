import type {
  NextFunction,
  Response
} from "express";

import type {
  IntegrationAuthenticatedRequest
} from "./authenticateIntegration.js";

export function requireIntegrationScope(
  scopeCode:
    string
) {
  return (
    req:
      IntegrationAuthenticatedRequest,
    res:
      Response,
    next:
      NextFunction
  ) => {
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

    if (
      !actor.scopes.has(
        scopeCode
      )
    ) {
      return res.status(
        403
      ).json({
        success:
          false,
        message:
          "Integration scope denied"
      });
    }

    return next();
  };
}
