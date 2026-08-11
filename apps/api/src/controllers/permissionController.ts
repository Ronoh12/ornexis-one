import type { Request, Response } from "express";

import {
  createPermission,
  getPermissionById,
  getPermissions
} from "../services/permissionService.js";

export async function listPermissions(
  _req: Request,
  res: Response
) {
  const permissions = await getPermissions();

  return res.json({
    success: true,
    data: permissions
  });
}

export async function getPermission(
  req: Request,
  res: Response
) {
  const id = req.params.id;

  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "A valid permission ID is required"
    });
  }

  const permission = await getPermissionById(id);

  if (!permission) {
    return res.status(404).json({
      success: false,
      message: "Permission not found"
    });
  }

  return res.json({
    success: true,
    data: permission
  });
}

export async function addPermission(
  req: Request,
  res: Response
) {
  try {
    const permission = await createPermission(req.body);

    return res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: permission
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A permission with this code already exists"
      });
    }

    throw error;
  }
}