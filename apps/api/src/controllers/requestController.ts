import type {
  Request,
  Response
} from "express";

import {
  addRequestComment,
  attachRequestDocument,
  assignRequest,
  changeRequestPriority,
  changeRequestStatus,
  createRequest,
  createRequestType,
  getRequest,
  getRequestType,
  listRequestActivities,
  listRequestAttachments,
  listRequests,
  listRequestTypes,
  removeRequestAttachment,
  updateRequest,
  updateRequestType
} from "../services/requestService.js";

import {
  parseAssignmentBody,
  parseAttachmentBody,
  parseCommentBody,
  parseCreateRequestBody,
  parseCreateRequestTypeBody,
  parsePriorityBody,
  parseRequestListQuery,
  parseStatusBody,
  parseUpdateRequestBody,
  parseUpdateRequestTypeBody,
  RequestValidationError
} from "../validators/requestValidator.js";

type AuthRequest = Request & {
  auth?: {
    userId: string;
    organizationId: string;
    organizationUserId?: string;
  };
};

function context(
  req: AuthRequest
) {
  const userId =
    req.auth?.userId;

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

function actor(
  req: AuthRequest
) {
  const ctx = context(req);

  return {
    userId: ctx.userId,
    organizationId:
      ctx.organizationId,
    organizationUserId:
      ctx.organizationUserId
  };
}

function handleError(
  res: Response,
  error: unknown
) {
  if (
    error instanceof
      RequestValidationError
  ) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (error instanceof Error) {
    const message = error.message;

    if (
      message.toLowerCase().includes(
        "not found"
      )
    ) {
      return res.status(404).json({
        success: false,
        message
      });
    }

    if (
      message ===
        "Authentication required"
    ) {
      return res.status(401).json({
        success: false,
        message
      });
    }

    if (
      message ===
        "Organization membership required"
    ) {
      return res.status(403).json({
        success: false,
        message
      });
    }

    return res.status(400).json({
      success: false,
      message
    });
  }

  throw error;
}

/* ============================================================
   REQUEST TYPES
============================================================ */

export async function requestTypes(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId
    } = context(req);

    const includeInactive =
      req.query.includeInactive ===
      "true";

    const data =
      await listRequestTypes(
        organizationId,
        includeInactive
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function requestType(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId
    } = context(req);

    const data =
      await getRequestType(
        organizationId,
        String(req.params.id)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createType(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseCreateRequestTypeBody(
        req.body
      );

    const data =
      await createRequestType(
        actor(req),
        input
      );

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateType(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseUpdateRequestTypeBody(
        req.body
      );

    const data =
      await updateRequestType(
        actor(req),
        String(req.params.id),
        input
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

/* ============================================================
   REQUESTS
============================================================ */

export async function list(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId
    } = context(req);

    const query =
      parseRequestListQuery(
        req.query
      );

    const data =
      await listRequests(
        organizationId,
        query
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getOne(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId
    } = context(req);

    const data =
      await getRequest(
        organizationId,
        String(req.params.id)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function create(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseCreateRequestBody(
        req.body
      );

    const data =
      await createRequest(
        actor(req),
        input
      );

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseUpdateRequestBody(
        req.body
      );

    const data =
      await updateRequest(
        actor(req),
        String(req.params.id),
        input
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function assign(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseAssignmentBody(
        req.body
      );

    const data =
      await assignRequest(
        actor(req),
        String(req.params.id),
        input
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function priority(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parsePriorityBody(
        req.body
      );

    const data =
      await changeRequestPriority(
        actor(req),
        String(req.params.id),
        input
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function status(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseStatusBody(
        req.body
      );

    const data =
      await changeRequestStatus(
        actor(req),
        String(req.params.id),
        input
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function comment(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseCommentBody(
        req.body
      );

    const data =
      await addRequestComment(
        actor(req),
        String(req.params.id),
        input
      );

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function activity(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId
    } = context(req);

    const data =
      await listRequestActivities(
        organizationId,
        String(req.params.id)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

/* ============================================================
   REQUEST ATTACHMENTS
============================================================ */

export async function attachments(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId
    } = context(req);

    const data =
      await listRequestAttachments(
        organizationId,
        String(req.params.id)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function attach(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseAttachmentBody(
        req.body
      );

    const data =
      await attachRequestDocument(
        actor(req),
        String(req.params.id),
        input.documentId
      );

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function detach(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await removeRequestAttachment(
        actor(req),
        String(req.params.id),
        String(req.params.attachmentId)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(res, error);
  }
}
