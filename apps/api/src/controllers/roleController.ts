import type {
  Request,
  Response
} from "express";

import {
  createRole,
  getRoleById,
  getRoles
} from "../services/roleService.js";

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
        name: name.trim(),
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

    if (error?.code === "P2003") {
      return res.status(400).json({
        success: false,
        message:
          "The organization does not exist"
      });
    }

    throw error;
  }
}