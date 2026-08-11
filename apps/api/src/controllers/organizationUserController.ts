import type { Request, Response } from "express";

import {
  createOrganizationUser,
  getOrganizationUserById,
  getOrganizationUsers
} from "../services/organizationUserService.js";

export async function listOrganizationUsers(
  _req: Request,
  res: Response
) {
  const memberships =
    await getOrganizationUsers();

  return res.json({
    success: true,
    data: memberships
  });
}

export async function getOrganizationUser(
  req: Request,
  res: Response
) {
  const id = req.params.id;

  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "A valid organization membership ID is required"
    });
  }

  const membership =
    await getOrganizationUserById(id);

  if (!membership) {
    return res.status(404).json({
      success: false,
      message: "Organization membership not found"
    });
  }

  return res.json({
    success: true,
    data: membership
  });
}

export async function addOrganizationUser(
  req: Request,
  res: Response
) {
  try {
    const membership =
      await createOrganizationUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User added to organization successfully",
      data: membership
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This user already belongs to this organization"
      });
    }

    if (error?.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Organization, user, or role does not exist"
      });
    }

    throw error;
  }
}