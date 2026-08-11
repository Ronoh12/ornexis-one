import type { Request, Response } from "express";

import {
  createRolePermission,
  getRolePermissions
} from "../services/rolePermissionService.js";

export async function listRolePermissions(
  _req: Request,
  res: Response
) {
  const rolePermissions =
    await getRolePermissions();

  return res.json({
    success: true,
    data: rolePermissions
  });
}

export async function addRolePermission(
  req: Request,
  res: Response
) {
  try {
    const rolePermission =
      await createRolePermission(req.body);

    return res.status(201).json({
      success: true,
      message: "Permission assigned to role successfully",
      data: rolePermission
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This permission is already assigned to this role"
      });
    }

    if (error?.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Role or permission does not exist"
      });
    }

    throw error;
  }
}