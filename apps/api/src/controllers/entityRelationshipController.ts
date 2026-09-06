import type {
  Request,
  Response
} from "express";

import {
  createEntityRelationship,
  getEntityRelationship,
  listEntityRelationships,
  removeEntityRelationship
} from "../services/entityRelationshipService.js";

import {
  EntityRelationshipServiceError,
  type EntityRelationshipActor
} from "../services/entityRelationshipTypes.js";

import {
  EntityRelationshipValidationError,
  parseCreateEntityRelationship,
  parseEntityRelationshipQuery,
  parseRelationshipId
} from "../validators/entityRelationshipValidator.js";

type AuthRequest =
  Request & {
    auth?: {
      userId: string;
      organizationId: string;
      organizationUserId: string;
    };
  };

function actor(
  req: AuthRequest
): EntityRelationshipActor {
  const auth =
    req.auth;

  if (
    !auth?.userId ||
    !auth.organizationId ||
    !auth.organizationUserId
  ) {
    throw new EntityRelationshipServiceError(
      "RELATIONSHIP_CONTEXT_REQUIRED",
      "Organization context is required."
    );
  }

  return {
    userId:
      auth.userId,
    organizationId:
      auth.organizationId,
    organizationUserId:
      auth.organizationUserId
  };
}

function statusForServiceError(
  error:
    EntityRelationshipServiceError
) {
  if (
    error.code ===
      "RELATIONSHIP_NOT_FOUND" ||
    error.code ===
      "RELATIONSHIP_ENTITY_NOT_FOUND"
  ) {
    return 404;
  }

  if (
    error.code ===
      "RELATIONSHIP_SELF_FORBIDDEN"
  ) {
    return 400;
  }

  if (
    error.code.includes(
      "FORBIDDEN"
    ) ||
    error.code.includes(
      "MEMBERSHIP"
    ) ||
    error.code.includes(
      "UNASSIGNED"
    )
  ) {
    return 403;
  }

  if (
    error.code ===
      "RELATIONSHIP_DEPENDENCY_EXISTS" ||
    error.code ===
      "RELATIONSHIP_DUPLICATE"
  ) {
    return 409;
  }

  return 400;
}

function handleError(
  res: Response,
  error: unknown
) {
  if (
    error instanceof
      EntityRelationshipValidationError
  ) {
    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  if (
    error instanceof
      EntityRelationshipServiceError
  ) {
    return res
      .status(
        statusForServiceError(
          error
        )
      )
      .json({
        success: false,
        message:
          error.message
      });
  }

  throw error;
}

export async function create(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseCreateEntityRelationship(
        req.body
      );

    const result =
      await createEntityRelationship(
        actor(req),
        input
      );

    return res
      .status(
        result.created
          ? 201
          : 200
      )
      .json({
        success: true,
        data:
          result
      });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function list(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseEntityRelationshipQuery(
        req.query as
          Record<
            string,
            unknown
          >
      );

    const relationships =
      await listEntityRelationships(
        actor(req),
        input
      );

    return res.json({
      success: true,
      data: {
        relationships,
        count:
          relationships.length,
        limit:
          input.limit
      }
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function get(
  req: AuthRequest,
  res: Response
) {
  try {
    const relationship =
      await getEntityRelationship(
        actor(req),
        parseRelationshipId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data:
        relationship
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function remove(
  req: AuthRequest,
  res: Response
) {
  try {
    const result =
      await removeEntityRelationship(
        actor(req),
        parseRelationshipId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data:
        result
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}
