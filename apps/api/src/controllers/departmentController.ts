import type {
  Request,
  Response
} from "express";

import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartments,
  updateDepartment
} from "../services/departmentService.js";

import {
  createAuditLog
} from "../services/auditService.js";

import {
  isValidDepartmentId,
  validateDepartmentCreate,
  validateDepartmentUpdate
} from "../validators/departmentValidator.js";

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

export async function listDepartments(
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

  const departments =
    await getDepartments(
      organizationId
    );

  return res.json({
    success: true,
    data: departments
  });
}

export async function getDepartment(
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
    !isValidDepartmentId(id)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid department ID is required"
    });
  }

  const department =
    await getDepartmentById(
      id,
      organizationId
    );

  if (!department) {
    return res.status(404).json({
      success: false,
      message:
        "Department not found"
    });
  }

  return res.json({
    success: true,
    data: department
  });
}

export async function addDepartment(
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
    validateDepartmentCreate(
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
    await createDepartment(
      organizationId,
      validation.data
    );

  if (!result.success) {
    if (
      result.reason ===
      "INVALID_BRANCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Branch does not belong to this organization"
      });
    }

    return res.status(409).json({
      success: false,
      message:
        "A department with this name or code already exists"
    });
  }

  await createAuditLog({
    organizationId,
    userId,
    action:
      "DEPARTMENT_CREATED",
    entityType:
      "Department",
    entityId:
      result.data.id,
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

  return res.status(201).json({
    success: true,
    message:
      "Department created successfully",
    data:
      result.data
  });
}

export async function editDepartment(
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
    !isValidDepartmentId(id)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid department ID is required"
    });
  }

  const validation =
    validateDepartmentUpdate(
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
    await updateDepartment(
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
          "Department not found"
      });
    }

    if (
      result.reason ===
      "INVALID_BRANCH"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Branch does not belong to this organization"
      });
    }

    return res.status(409).json({
      success: false,
      message:
        "A department with this name or code already exists"
    });
  }

  await createAuditLog({
    organizationId,
    userId,
    action:
      "DEPARTMENT_UPDATED",
    entityType:
      "Department",
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
      "Department updated successfully",
    data:
      result.data
  });
}

export async function removeDepartment(
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
    !isValidDepartmentId(id)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid department ID is required"
    });
  }

  const result =
    await deleteDepartment(
      id,
      organizationId
    );

  if (!result.success) {
    return res.status(404).json({
      success: false,
      message:
        "Department not found"
    });
  }

  await createAuditLog({
    organizationId,
    userId,
    action:
      "DEPARTMENT_DELETED",
    entityType:
      "Department",
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
      "Department deleted successfully",
    data:
      result.data
  });
}