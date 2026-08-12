import type { Request, Response } from "express";

import {
  createOrganization,
  deleteOrganizationById,
  getOrganizationById,
  getOrganizations,
  getOrganizationForTenant
} from "../services/organizationService.js";

export async function listOrganizations(
  req: Request,
  res: Response
) {
  const organizationId =
    (req as Request & {
      auth?: {
        organizationId?: string;
      };
    }).auth?.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  const organization =
    await getOrganizationForTenant(
      organizationId
    );

  if (!organization) {
    return res.status(404).json({
      success: false,
      message: "Organization not found"
    });
  }

  return res.json({
    success: true,
    data: [organization]
  });
}

export async function getOrganization(
  req: Request,
  res: Response
) {
  const id = req.params.id;

  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "A valid organization ID is required"
    });
  }

  const organization = await getOrganizationById(id);

  if (!organization) {
    return res.status(404).json({
      success: false,
      message: "Organization not found"
    });
  }

  return res.json({
    success: true,
    data: organization
  });
}

export async function addOrganization(
  req: Request,
  res: Response
) {
  try {
    const organization = await createOrganization(req.body);

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: organization
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An organization with this slug already exists"
      });
    }

    throw error;
  }
}

export async function removeOrganization(
  req: Request,
  res: Response
) {
  const id = req.params.id;

  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "A valid organization ID is required"
    });
  }

  const existingOrganization =
    await getOrganizationById(id);

  if (!existingOrganization) {
    return res.status(404).json({
      success: false,
      message: "Organization not found"
    });
  }

  await deleteOrganizationById(id);

  return res.json({
    success: true,
    message: "Organization deleted successfully"
  });
}