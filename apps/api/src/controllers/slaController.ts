import type {
  Request,
  Response
} from "express";

import {
  createSlaInstance,
  createSlaPolicy,
  createSlaTarget,
  evaluateOrganizationSla,
  getSlaInstance,
  getSlaPolicy,
  listSlaInstances,
  listSlaPolicies,
  SlaServiceError,
  updateSlaPolicy,
  updateSlaTarget
} from "../services/slaService.js";

import {
  parseCreateSlaInstanceBody,
  parseCreateSlaPolicyBody,
  parseCreateSlaTargetBody,
  parseEvaluateSlaBody,
  parseId,
  parseSlaInstanceListQuery,
  parseUpdateSlaPolicyBody,
  parseUpdateSlaTargetBody,
  SlaValidationError
} from "../validators/slaValidator.js";

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
      SlaValidationError
  ) {
    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  if (
    error instanceof
      SlaServiceError
  ) {
    if (
      error.code ===
        "SLA_POLICY_NOT_FOUND" ||
      error.code ===
        "SLA_TARGET_NOT_FOUND" ||
      error.code ===
        "SLA_INSTANCE_NOT_FOUND" ||
      error.code ===
        "SLA_SOURCE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          error.message
      });
    }

    if (
      error.code ===
      "SLA_INSTANCE_EXISTS"
    ) {
      return res.status(409).json({
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

export async function listPolicies(
  req: AuthRequest,
  res: Response
) {
  try {
    const ctx =
      actor(req);

    const data =
      await listSlaPolicies(
        ctx.organizationId
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

export async function getPolicy(
  req: AuthRequest,
  res: Response
) {
  try {
    const ctx =
      actor(req);

    const data =
      await getSlaPolicy(
        ctx.organizationId,
        parseId(
          req.params.id
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

export async function createPolicy(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await createSlaPolicy(
        actor(req),
        parseCreateSlaPolicyBody(
          req.body
        )
      );

    return res.status(201).json({
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

export async function updatePolicy(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await updateSlaPolicy(
        actor(req),
        parseId(
          req.params.id
        ),
        parseUpdateSlaPolicyBody(
          req.body
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

export async function createTarget(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await createSlaTarget(
        actor(req),
        parseId(
          req.params.id
        ),
        parseCreateSlaTargetBody(
          req.body
        )
      );

    return res.status(201).json({
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

export async function updateTarget(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await updateSlaTarget(
        actor(req),
        parseId(
          req.params.id
        ),
        parseUpdateSlaTargetBody(
          req.body
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

export async function createInstance(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await createSlaInstance(
        actor(req),
        parseCreateSlaInstanceBody(
          req.body
        )
      );

    return res.status(201).json({
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

export async function listInstances(
  req: AuthRequest,
  res: Response
) {
  try {
    const ctx =
      actor(req);

    const data =
      await listSlaInstances(
        ctx.organizationId,
        parseSlaInstanceListQuery(
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

export async function getInstance(
  req: AuthRequest,
  res: Response
) {
  try {
    const ctx =
      actor(req);

    const data =
      await getSlaInstance(
        ctx.organizationId,
        parseId(
          req.params.id
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

export async function evaluate(
  req: AuthRequest,
  res: Response
) {
  try {
    const ctx =
      actor(req);

    const input =
      parseEvaluateSlaBody(
        req.body
      );

    const data =
      await evaluateOrganizationSla(
        ctx.organizationId,
        {
          ...(input.limit !== undefined
            ? {
                limit:
                  input.limit
              }
            : {})
        }
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
