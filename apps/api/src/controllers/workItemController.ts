import type {
  Request,
  Response
} from "express";

import {
  addComment,
  attachDocument,
  changeStatus,
  getWorkItem,
  listActivity,
  listAttachments,
  listComments,
  listWorkItems,
  removeAttachment,
  updateAssignment,
  updateWorkItem,
  createWorkItem,
  WorkItemServiceError
} from "../services/workItemService.js";

import {
  userHasPermission
} from "../services/authorizationService.js";

import {
  parseAssignmentBody,
  parseAttachmentBody,
  parseCommentBody,
  parseCreateWorkItemBody,
  parseStatusBody,
  parseUpdateWorkItemBody,
  WorkItemValidationError
} from "../validators/workItemValidator.js";

type AuthRequest = Request & {
  auth?: {
    userId: string;
    organizationId: string;
  };
};

function context(
  req: AuthRequest
) {
  const userId =
    req.auth?.userId;

  const organizationId =
    req.auth?.organizationId;

  if (!userId || !organizationId) {
    throw new WorkItemServiceError(
      "AUTH_REQUIRED",
      "Authentication required"
    );
  }

  return {
    userId,
    organizationId
  };
}

function handleError(
  res: Response,
  error: unknown
) {
  if (
    error instanceof
      WorkItemValidationError
  ) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  if (
    error instanceof
      WorkItemServiceError
  ) {
    const status =
      error.code ===
        "AUTH_REQUIRED"
        ? 401
        : (
            error.code ===
              "MEMBERSHIP_REQUIRED"
              ? 403
              : 400
          );

    return res.status(status).json({
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
    const {
      organizationId
    } = context(req);

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : undefined;

    const priority =
      typeof req.query.priority === "string"
        ? req.query.priority
        : undefined;

    const branchId =
      typeof req.query.branchId === "string"
        ? req.query.branchId
        : undefined;

    const departmentId =
      typeof req.query.departmentId === "string"
        ? req.query.departmentId
        : undefined;

    const contactId =
      typeof req.query.contactId === "string"
        ? req.query.contactId
        : undefined;

    const ownerOrganizationUserId =
      typeof req.query.ownerOrganizationUserId === "string"
        ? req.query.ownerOrganizationUserId
        : undefined;

    const assigneeOrganizationUserId =
      typeof req.query.assigneeOrganizationUserId === "string"
        ? req.query.assigneeOrganizationUserId
        : undefined;

    const overdue =
      req.query.overdue === "true";
    const filters: Parameters<
      typeof listWorkItems
    >[1] = {
      ...(status
        ? { status: status as any }
        : {}),

      ...(priority
        ? { priority: priority as any }
        : {}),

      ...(branchId
        ? { branchId }
        : {}),

      ...(departmentId
        ? { departmentId }
        : {}),

      ...(contactId
        ? { contactId }
        : {}),

      ...(ownerOrganizationUserId
        ? { ownerOrganizationUserId }
        : {}),

      ...(assigneeOrganizationUserId
        ? { assigneeOrganizationUserId }
        : {}),

      ...(overdue
        ? { overdue: true }
        : {})
    };

    const items =
      await listWorkItems(
        organizationId,
        filters
      );

    return res.json({
      success: true,
      data: items
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
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

    const item =
      await getWorkItem(
        organizationId,
        String(req.params.id)
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found"
      });
    }

    return res.json({
      success: true,
      data: item
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function create(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId,
      userId
    } = context(req);

    const body =
      parseCreateWorkItemBody(
        req.body
      );

    const item =
      await createWorkItem({
        organizationId,
        userId,
        ...body
      });

    return res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function update(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId,
      userId
    } = context(req);

    const body =
      parseUpdateWorkItemBody(
        req.body
      );

    const item =
      await updateWorkItem(
        organizationId,
        userId,
        String(req.params.id),
        body
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found"
      });
    }

    return res.json({
      success: true,
      data: item
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function assign(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId,
      userId
    } = context(req);

    const body =
      parseAssignmentBody(
        req.body
      );

    const item =
      await updateAssignment(
        organizationId,
        userId,
        String(req.params.id),
        body
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found"
      });
    }

    return res.json({
      success: true,
      data: item
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function status(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId,
      userId
    } = context(req);

    const body =
      parseStatusBody(
        req.body
      );

    const requiredPermission =
      body.status === "COMPLETED"
        ? "work_items.complete"
        : (
            body.status ===
              "CANCELLED"
              ? "work_items.cancel"
              : "work_items.update"
          );

    const allowed =
      await userHasPermission(
        userId,
        organizationId,
        requiredPermission
      );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "Permission denied"
      });
    }

    const item =
      await changeStatus(
        organizationId,
        userId,
        String(req.params.id),
        body.status
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found"
      });
    }

    return res.json({
      success: true,
      data: item
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function comments(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId
    } = context(req);

    const data =
      await listComments(
        organizationId,
        String(req.params.id)
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found"
      });
    }

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

export async function comment(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId,
      userId
    } = context(req);

    const body =
      parseCommentBody(
        req.body
      );

    const data =
      await addComment(
        organizationId,
        userId,
        String(req.params.id),
        body.body
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found"
      });
    }

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

export async function activity(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId
    } = context(req);

    const data =
      await listActivity(
        organizationId,
        String(req.params.id)
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found"
      });
    }

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

export async function attachments(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId
    } = context(req);

    const data =
      await listAttachments(
        organizationId,
        "WORK_ITEM",
        String(req.params.id)
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found"
      });
    }

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

export async function attach(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId,
      userId
    } = context(req);

    const body =
      parseAttachmentBody(
        req.body
      );

    const data =
      await attachDocument(
        organizationId,
        userId,
        "WORK_ITEM",
        String(req.params.id),
        body.documentId
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found"
      });
    }

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

export async function detach(
  req: AuthRequest,
  res: Response
) {
  try {
    const {
      organizationId,
      userId
    } = context(req);

    const data =
      await removeAttachment(
        organizationId,
        userId,
        "WORK_ITEM",
        String(req.params.id),
        String(
          req.params.attachmentId
        )
      );

    if (!data) {
      return res.status(404).json({
        success: false,
        message:
          "Attachment not found"
      });
    }

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
