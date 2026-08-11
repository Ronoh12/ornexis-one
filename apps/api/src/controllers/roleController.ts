import type { Request, Response } from "express";

import {
  createRole,
  getRoleById,
  getRoles
} from "../services/roleService.js";

export async function listRoles(
  _req: Request,
  res: Response
) {
  const roles = await getRoles();

  return res.json({
    success: true,
    data: roles
  });
}

export async function getRole(
  req: Request,
  res: Response
) {
  const id = req.params.id;

  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "A valid role ID is required"
    });
  }

  const role = await getRoleById(id);

  if (!role) {
    return res.status(404).json({
      success: false,
      message: "Role not found"
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
  try {
    const role = await createRole(req.body);

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This organization already has a role with that name"
      });
    }

    if (error?.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "The organization does not exist"
      });
    }

    throw error;
  }
}