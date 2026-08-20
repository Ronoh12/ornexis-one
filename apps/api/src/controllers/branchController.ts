import type {
  Request,
  Response
} from "express";

import {
  createBranch,
  deleteBranch,
  getBranchById,
  getBranches,
  updateBranch
} from "../services/branchService.js";

import {
  createAuditLog
} from "../services/auditService.js";

import {
  isValidBranchId,
  validateBranchCreate,
  validateBranchUpdate
} from "../validators/branchValidator.js";

type OrganizationRequest = Request & {
  auth?: {
    userId?: string;
    organizationId?: string;
  };
};

function getContext(
  req: OrganizationRequest
) {
  return {
    organizationId:
      req.auth?.organizationId,
    userId:
      req.auth?.userId
  };
}

export async function listBranches(
  req: OrganizationRequest,
  res: Response
) {
  const { organizationId } =
    getContext(req);

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  const branches =
    await getBranches(
      organizationId
    );

  return res.json({
    success: true,
    data: branches
  });
}

export async function getBranch(
  req: OrganizationRequest,
  res: Response
) {
  const { organizationId } =
    getContext(req);

  const id =
    req.params.id;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (
    typeof id !== "string" ||
    !isValidBranchId(id)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid branch ID is required"
    });
  }

  const branch =
    await getBranchById(
      id,
      organizationId
    );

  if (!branch) {
    return res.status(404).json({
      success: false,
      message:
        "Branch not found"
    });
  }

  return res.json({
    success: true,
    data: branch
  });
}

export async function addBranch(
  req: OrganizationRequest,
  res: Response
) {
  const {
    organizationId,
    userId
  } = getContext(req);

  if (
    !organizationId ||
    !userId
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  const validation =
    validateBranchCreate(
      req.body
    );

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        validation.message
    });
  }

  const result =
    await createBranch(
      organizationId,
      validation.data
    );

  if (!result.success) {
    return res.status(409).json({
      success: false,
      message:
        "A branch with this name or code already exists"
    });
  }

  const branch =
    result.data;

  await createAuditLog({
    organizationId,
    userId,
    action:
      "BRANCH_CREATED",
    entityType:
      "Branch",
    entityId:
      branch.id,
    newValues:
      branch,
    ...(req.ip
      ? {
          ipAddress:
            req.ip
        }
      : {}),
    ...(req.headers["user-agent"]
      ? {
          userAgent:
            req.headers["user-agent"]
        }
      : {})
  });

  return res.status(201).json({
    success: true,
    message:
      "Branch created successfully",
    data: branch
  });
}

export async function editBranch(
  req: OrganizationRequest,
  res: Response
) {
  const {
    organizationId,
    userId
  } = getContext(req);

  const id =
    req.params.id;

  if (
    !organizationId ||
    !userId
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (
    typeof id !== "string" ||
    !isValidBranchId(id)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid branch ID is required"
    });
  }

  const validation =
    validateBranchUpdate(
      req.body
    );

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        validation.message
    });
  }

  const result =
    await updateBranch(
      id,
      organizationId,
      validation.data
    );

  if (!result.success) {
    if (
      result.reason ===
      "NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Branch not found"
      });
    }

    return res.status(409).json({
      success: false,
      message:
        "A branch with this name or code already exists"
    });
  }

  await createAuditLog({
    organizationId,
    userId,
    action:
      "BRANCH_UPDATED",
    entityType:
      "Branch",
    entityId:
      result.data.id,
    oldValues:
      result.oldValues,
    newValues:
      result.data,
    ...(req.ip
      ? {
          ipAddress:
            req.ip
        }
      : {}),
    ...(req.headers["user-agent"]
      ? {
          userAgent:
            req.headers["user-agent"]
        }
      : {})
  });

  return res.json({
    success: true,
    message:
      "Branch updated successfully",
    data:
      result.data
  });
}

export async function removeBranch(
  req: OrganizationRequest,
  res: Response
) {
  const {
    organizationId,
    userId
  } = getContext(req);

  const id =
    req.params.id;

  if (
    !organizationId ||
    !userId
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (
    typeof id !== "string" ||
    !isValidBranchId(id)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid branch ID is required"
    });
  }

  const result =
    await deleteBranch(
      id,
      organizationId
    );

  if (!result.success) {
    if (
      result.reason ===
      "NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Branch not found"
      });
    }

    return res.status(409).json({
      success: false,
      message:
        "Branch cannot be deleted while departments belong to it"
    });
  }

  await createAuditLog({
    organizationId,
    userId,
    action:
      "BRANCH_DELETED",
    entityType:
      "Branch",
    entityId:
      result.data.id,
    oldValues:
      result.data,
    ...(req.ip
      ? {
          ipAddress:
            req.ip
        }
      : {}),
    ...(req.headers["user-agent"]
      ? {
          userAgent:
            req.headers["user-agent"]
        }
      : {})
  });

  return res.json({
    success: true,
    message:
      "Branch deleted successfully",
    data:
      result.data
  });
}