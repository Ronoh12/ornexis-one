import type {
  Request,
  Response
} from "express";

import {
  getHealthSnapshot,
  getLatestHealthSnapshot,
  HealthServiceError,
  listHealthDefinitions,
  listHealthSnapshots,
  manuallyEvaluateHealth,
  updateHealthDefinition
} from "../services/healthService.js";

import {
  HealthValidationError,
  parseEvaluateHealthBody,
  parseHealthDefinitionUpdate,
  parseHealthId,
  parseHealthScopeParams,
  parseHealthSnapshotQuery
} from "../validators/healthValidator.js";

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

  if (!organizationUserId) {
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
      HealthValidationError
  ) {
    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  if (
    error instanceof
      HealthServiceError
  ) {
    if (
      error.code ===
        "HEALTH_DEFINITION_NOT_FOUND" ||
      error.code ===
        "HEALTH_SNAPSHOT_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          error.message
      });
    }

    if (
      error.code ===
        "HEALTH_SCOPE_FORBIDDEN" ||
      error.code ===
        "HEALTH_MEMBERSHIP_INVALID"
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

  if (error instanceof Error) {
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

export async function definitions(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await listHealthDefinitions(
        actor(req)
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

export async function updateDefinition(
  req: AuthRequest,
  res: Response
) {
  try {
    const id =
      parseHealthId(
        req.params.id
      );

    const input =
      parseHealthDefinitionUpdate(
        req.body
      );

    const data =
      await updateHealthDefinition(
        actor(req),
        id,
        input
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

export async function snapshots(
  req: AuthRequest,
  res: Response
) {
  try {
    const query =
      parseHealthSnapshotQuery(
        req.query
      );

    const data =
      await listHealthSnapshots(
        actor(req),
        query
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

export async function snapshot(
  req: AuthRequest,
  res: Response
) {
  try {
    const id =
      parseHealthId(
        req.params.id
      );

    const data =
      await getHealthSnapshot(
        actor(req),
        id
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

export async function latest(
  req: AuthRequest,
  res: Response
) {
  try {
    const currentActor =
      actor(req);

    const scope =
      parseHealthScopeParams(
        req.params.scopeType,
        req.params.scopeId
      );

    if (
      scope.scopeType ===
        "ORGANIZATION" &&
      scope.scopeId &&
      scope.scopeId !==
        currentActor.organizationId
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Health snapshot was not found."
      });
    }

    const data =
      await getLatestHealthSnapshot(
        currentActor,
        scope.scopeType,
        scope.scopeId
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

export async function evaluate(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseEvaluateHealthBody(
        req.body
      );

    const data =
      await manuallyEvaluateHealth(
        actor(req),
        input
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
