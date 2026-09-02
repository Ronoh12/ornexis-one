import type {
  Request,
  Response
} from "express";

import {
  CommandCentreServiceError
} from "../services/commandCentreScopeService.js";

import {
  getCommandCentre
} from "../services/commandCentreService.js";

import {
  CommandCentreValidationError,
  parseCommandCentreQuery
} from "../validators/commandCentreValidator.js";

type AuthRequest = Request & {
  auth?: {
    userId: string;
    organizationId: string;
    organizationUserId?: string;
  };
};

function actor(
  req: AuthRequest
) {
  const userId =
    req.auth?.userId;

  const organizationId =
    req.auth?.organizationId;

  const organizationUserId =
    req.auth?.organizationUserId;

  if (
    !userId ||
    !organizationId
  ) {
    throw new Error(
      "Authentication required"
    );
  }

  if (
    !organizationUserId
  ) {
    throw new Error(
      "Organization membership required"
    );
  }

  return {
    userId,
    organizationId,
    organizationUserId
  };
}

function handleError(
  res: Response,
  error: unknown
) {
  if (
    error instanceof
      CommandCentreValidationError
  ) {
    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  if (
    error instanceof
      CommandCentreServiceError
  ) {
    if (
      error.code ===
      "COMMAND_SCOPE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          error.message
      });
    }

    if (
      error.code ===
        "COMMAND_SCOPE_FORBIDDEN" ||
      error.code ===
        "COMMAND_SCOPE_UNASSIGNED" ||
      error.code ===
        "COMMAND_MEMBERSHIP_INVALID"
    ) {
      return res.status(403).json({
        success: false,
        message:
          error.message
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  if (
    error instanceof Error
  ) {
    if (
      error.message ===
      "Authentication required"
    ) {
      return res.status(401).json({
        success: false,
        message:
          error.message
      });
    }

    if (
      error.message ===
      "Organization membership required"
    ) {
      return res.status(403).json({
        success: false,
        message:
          error.message
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  throw error;
}

export async function overview(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await getCommandCentre(
        actor(req),
        parseCommandCentreQuery(
          req.query
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}
