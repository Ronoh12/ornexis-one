import type {
  Request,
  Response
} from "express";

import {
  getOrganizationBranding,
  upsertOrganizationBranding
} from "../services/organizationBrandingService.js";

import {
  validateOrganizationBrandingUpdateInput
} from "../validators/organizationBrandingValidator.js";

import {
  createAuditLog
} from "../services/auditService.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId?: string;
    organizationId?: string;
  };
};

export async function getOrganizationBrandingController(
  req: Request,
  res: Response
) {
  const auth =
    (req as AuthenticatedRequest).auth;

  const userId =
    auth?.userId;

  const organizationId =
    auth?.organizationId;

  const id =
    req.params.id;

  if (
    !userId ||
    !organizationId
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
        "A valid organization ID is required"
    });
  }

  if (id !== organizationId) {
    return res.status(403).json({
      success: false,
      message:
        "You do not have access to this organization"
    });
  }

  const branding =
    await getOrganizationBranding(
      organizationId
    );

  return res.json({
    success: true,
    data: branding
  });
}

export async function updateOrganizationBrandingController(
  req: Request,
  res: Response
) {
  const auth =
    (req as AuthenticatedRequest).auth;

  const userId =
    auth?.userId;

  const organizationId =
    auth?.organizationId;

  const id =
    req.params.id;

  if (
    !userId ||
    !organizationId
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
        "A valid organization ID is required"
    });
  }

  if (id !== organizationId) {
    return res.status(403).json({
      success: false,
      message:
        "You do not have access to this organization"
    });
  }

  const validation =
    validateOrganizationBrandingUpdateInput(
      req.body
    );

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        validation.message
    });
  }

  const existingBranding =
    await getOrganizationBranding(
      organizationId
    );

  const updatedBranding =
    await upsertOrganizationBranding(
      organizationId,
      validation.data
    );

  await createAuditLog({
    organizationId,
    userId,
    action:
      "ORGANIZATION_BRANDING_UPDATED",
    entityType:
      "OrganizationBranding",
    entityId:
      updatedBranding.id,
    oldValues:
      existingBranding
        ? {
            displayName:
              existingBranding.displayName,
            shortName:
              existingBranding.shortName,
            logoUrl:
              existingBranding.logoUrl,
            faviconUrl:
              existingBranding.faviconUrl,
            primaryColor:
              existingBranding.primaryColor,
            secondaryColor:
              existingBranding.secondaryColor,
            accentColor:
              existingBranding.accentColor
          }
        : undefined,
    newValues: {
      displayName:
        updatedBranding.displayName,
      shortName:
        updatedBranding.shortName,
      logoUrl:
        updatedBranding.logoUrl,
      faviconUrl:
        updatedBranding.faviconUrl,
      primaryColor:
        updatedBranding.primaryColor,
      secondaryColor:
        updatedBranding.secondaryColor,
      accentColor:
        updatedBranding.accentColor
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
      "Organization branding updated successfully",
    data:
      updatedBranding
  });
}