import type {
  Request,
  Response
} from "express";

import {
  createRole,
  deleteRole,
  getRoleById,
  getRoles,
  updateRole
} from "../services/roleService.js";

import {
  createAuditLog
} from "../services/auditService.js";

import {
  validateRoleUpdate
} from "../validators/roleValidator.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId?: string;
    organizationId?: string;
  };
};

export async function listRoles(
  req: Request,
  res: Response
) {
  const auth =
    (req as AuthenticatedRequest).auth;

  const organizationId =
    auth?.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  const roles =
    await getRoles(
      organizationId
    );

  return res.json({
    success: true,
    data: roles
  });
}

export async function getRole(
  req: Request,
  res: Response
) {
  const auth =
    (req as AuthenticatedRequest).auth;

  const organizationId =
    auth?.organizationId;

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
    !id
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid role ID is required"
    });
  }

  const role =
    await getRoleById(
      id,
      organizationId
    );

  if (!role) {
    return res.status(404).json({
      success: false,
      message:
        "Role not found"
    });
  }

  return res.json({
    success: true,
    data: role
  });
}

export async function addRole(
  req: Request,
  res: Response
) {
  const auth =
    (req as AuthenticatedRequest).auth;

  const organizationId =
    auth?.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  const {
    name,
    description
  } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid role name is required"
    });
  }

  try {
    const role =
      await createRole({
        organizationId,
        name:
          name.trim(),
        ...(typeof description === "string" &&
        description.trim()
          ? {
              description:
                description.trim()
            }
          : {})
      });

    return res.status(201).json({
      success: true,
      message:
        "Role created successfully",
      data: role
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "This organization already has a role with that name"
      });
    }

    throw error;
  }
}

export async function updateRoleController(
  req: Request,
  res: Response
) {
  const auth =
    (req as AuthenticatedRequest).auth;

  const organizationId =
    auth?.organizationId;

  const userId =
    auth?.userId;

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
    !id
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid role ID is required"
    });
  }

  const validation =
    validateRoleUpdate(
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
    await updateRole(
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
          "Role not found"
      });
    }

    if (
      result.reason ===
      "SYSTEM_ROLE"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "System roles cannot be modified"
      });
    }

    if (
      result.reason ===
      "DUPLICATE_NAME"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This organization already has a role with that name"
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to update role"
    });
  }

  const role =
    result.data;

  await createAuditLog({
    organizationId,
    userId,
    action:
      "ROLE_UPDATED",
    entityType:
      "Role",
    entityId:
      role.id,
    oldValues:
      result.oldValues,
    newValues: {
      name:
        role.name,
      description:
        role.description
    },
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
      "Role updated successfully",
    data: role
  });
}

export async function removeRoleController(
  req: Request,
  res: Response
) {
  const auth =
    (req as AuthenticatedRequest).auth;

  const organizationId =
    auth?.organizationId;

  const userId =
    auth?.userId;

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
    !id
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid role ID is required"
    });
  }

  const result =
    await deleteRole(
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
          "Role not found"
      });
    }

    if (
      result.reason ===
      "SYSTEM_ROLE"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "System roles cannot be deleted"
      });
    }

    if (
      result.reason ===
      "ROLE_IN_USE"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Role cannot be deleted while organization memberships use it"
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete role"
    });
  }

  const role =
    result.data;

  await createAuditLog({
    organizationId,
    userId,
    action:
      "ROLE_DELETED",
    entityType:
      "Role",
    entityId:
      role.id,
    oldValues: {
      name:
        role.name,
      description:
        role.description,
      isSystemRole:
        role.isSystemRole,
      permissions:
        role.rolePermissions.map(
          assignment =>
            assignment.permission.code
        )
    },
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
      "Role deleted successfully",
    data: role
  });
}