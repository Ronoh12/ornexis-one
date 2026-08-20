import type {
  Request,
  Response
} from "express";

import {
  createRolePermission,
  deleteRolePermission,
  getRolePermissions
} from "../services/rolePermissionService.js";

import {
  createAuditLog
} from "../services/auditService.js";

import {
  validateRolePermissionCreate
} from "../validators/rolePermissionValidator.js";

type OrganizationRequest = Request & {
  auth?: {
    userId: string;
    organizationId?: string;
  };
};

export async function listRolePermissions(
  req: OrganizationRequest,
  res: Response
) {
  const organizationId =
    req.auth?.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  const rolePermissions =
    await getRolePermissions(
      organizationId
    );

  return res.json({
    success: true,
    data:
      rolePermissions
  });
}

export async function addRolePermission(
  req: OrganizationRequest,
  res: Response
) {
  const organizationId =
    req.auth?.organizationId;

  const userId =
    req.auth?.userId;

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
    validateRolePermissionCreate(
      req.body
    );

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        validation.message
    });
  }

  const {
    roleId,
    permissionId
  } = validation.data;

  const result =
    await createRolePermission(
      organizationId,
      {
        roleId,
        permissionId
      }
    );

  if (!result.success) {
    if (
      result.reason ===
      "INVALID_ROLE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Role does not belong to this organization"
      });
    }

    if (
      result.reason ===
      "INVALID_PERMISSION"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Permission does not exist"
      });
    }

    if (
      result.reason ===
      "ALREADY_ASSIGNED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This permission is already assigned to this role"
      });
    }

    if (
      result.reason ===
      "SYSTEM_ROLE"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "System role permissions cannot be modified"
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to assign permission to role"
    });
  }

  const rolePermission =
    result.data;

  await createAuditLog({
    organizationId,
    userId,
    action:
      "ROLE_PERMISSION_GRANTED",
    entityType:
      "RolePermission",
    entityId:
      rolePermission.id,
    newValues: {
      roleId:
        rolePermission.roleId,
      roleName:
        rolePermission.role.name,
      permissionId:
        rolePermission.permissionId,
      permissionCode:
        rolePermission.permission.code
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

  return res.status(201).json({
    success: true,
    message:
      "Permission assigned to role successfully",
    data:
      rolePermission
  });
}

export async function removeRolePermission(
  req: OrganizationRequest,
  res: Response
) {
  const organizationId =
    req.auth?.organizationId;

  const userId =
    req.auth?.userId;

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
        "A valid role permission ID is required"
    });
  }

  const result =
    await deleteRolePermission(
      organizationId,
      id
    );

  if (!result.success) {
    if (
      result.reason ===
      "NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Role permission assignment not found"
      });
    }

    if (
      result.reason ===
      "SYSTEM_ROLE"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "System role permissions cannot be modified"
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to revoke permission from role"
    });
  }

  const rolePermission =
    result.data;

  await createAuditLog({
    organizationId,
    userId,
    action:
      "ROLE_PERMISSION_REVOKED",
    entityType:
      "RolePermission",
    entityId:
      rolePermission.id,
    oldValues: {
      roleId:
        rolePermission.roleId,
      roleName:
        rolePermission.role.name,
      permissionId:
        rolePermission.permissionId,
      permissionCode:
        rolePermission.permission.code
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
      "Permission revoked from role successfully",
    data:
      rolePermission
  });
}