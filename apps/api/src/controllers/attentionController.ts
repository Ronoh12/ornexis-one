import type {
  Request,
  Response
} from "express";

import {
  acknowledgeAttentionItem,
  AttentionServiceError,
  dismissAttentionItem,
  getAttentionItem,
  listAttentionItems
} from "../services/attentionService.js";

import {
  evaluateOrganizationAttention
} from "../services/attentionEvaluatorService.js";

import {
  AttentionValidationError,
  parseAttentionActionBody,
  parseAttentionId,
  parseAttentionListQuery,
  parseEvaluateAttentionBody
} from "../validators/attentionValidator.js";

type AuthRequest = Request & {
  auth?: {
    userId: string;
    organizationId: string;
    organizationUserId?: string;
  };
};

function actor(req: AuthRequest) {
  const userId = req.auth?.userId;
  const organizationId =
    req.auth?.organizationId;
  const organizationUserId =
    req.auth?.organizationUserId;

  if (!userId || !organizationId) {
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
      AttentionValidationError
  ) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (
    error instanceof
      AttentionServiceError
  ) {
    if (
      error.code ===
      "ATTENTION_ITEM_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.code ===
      "ATTENTION_ITEM_TERMINAL"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.code ===
      "ATTENTION_MEMBERSHIP_INVALID"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (error instanceof Error) {
    if (
      error.message ===
      "Authentication required"
    ) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    if (
      error.message ===
      "Organization membership required"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  throw error;
}

export async function list(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await listAttentionItems(
        actor(req),
        parseAttentionListQuery(
          req.query as
            Record<string, unknown>
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function get(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await getAttentionItem(
        actor(req),
        parseAttentionId(req.params.id)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function acknowledge(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await acknowledgeAttentionItem(
        actor(req),
        parseAttentionId(req.params.id),
        parseAttentionActionBody(req.body)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function dismiss(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await dismissAttentionItem(
        actor(req),
        parseAttentionId(req.params.id),
        parseAttentionActionBody(req.body)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function evaluate(
  req: AuthRequest,
  res: Response
) {
  try {
    const ctx = actor(req);
    const input =
      parseEvaluateAttentionBody(
        req.body
      );

    const data =
      await evaluateOrganizationAttention(
        ctx.organizationId,
        {
          ...(input.limit !== undefined
            ? { limit: input.limit }
            : {})
        }
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}
