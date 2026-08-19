import type { Request, Response } from "express";
import { createAuditLog } from "../services/auditService.js";

import {
  createOrganization,
  deleteOrganizationById,
  getOrganizationById,
  getOrganizations,
  getOrganizationForTenant,
  updateOrganizationForTenant
} from "../services/organizationService.js";

import {
  validateOrganizationUpdateInput
} from "../validators/organizationValidator.js";

export async function listOrganizations(
  req: Request,
  res: Response
) {
  const auth =
    (req as Request & {
      auth?: {
        userId?: string;
        organizationId?: string;
      };
    }).auth;

  const userId = auth?.userId;
  const organizationId = auth?.organizationId;

  if (!userId || !organizationId) {
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

  await createAuditLog({
    organizationId,
    userId,
    action: "ORGANIZATION_VIEWED",
    entityType: "Organization",
    entityId: organization.id,
    ...(req.ip ? { ipAddress: req.ip } : {}),
    ...(req.headers["user-agent"]
      ? { userAgent: req.headers["user-agent"] }
      : {})
  });

  return res.json({
    success: true,
    data: [organization]
  });
}

export async function getOrganization(
  req: Request,
  res: Response
) {
  const auth =
    (req as Request & {
      auth?: {
        userId?: string;
        organizationId?: string;
      };
    }).auth;

  const organizationId =
    auth?.organizationId;

  const id = req.params.id;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  if (
    typeof id !== "string" ||
    !id
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid organization ID is required"
    });
  }

  if (id !== organizationId) {
    return res.status(403).json({
      success: false,
      message:
        "You do not have access to this organization"
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
    data: organization
  });
}

export async function addOrganization(
  req: Request,
  res: Response
) {
  try {
    const organization = await createOrganization(req.body);

    const auth =
  (req as Request & {
    auth?: {
      userId?: string;
      organizationId?: string;
    };
  }).auth;

await createAuditLog({
  ...(auth?.organizationId
    ? { organizationId: auth.organizationId }
    : {}),
  ...(auth?.userId
    ? { userId: auth.userId }
    : {}),
  action: "ORGANIZATION_CREATED",
  entityType: "Organization",
  entityId: organization.id,
  newValues: {
    name: organization.name,
    slug: organization.slug,
    organizationType: organization.organizationType,
    status: organization.status
  },
  ...(req.ip ? { ipAddress: req.ip } : {}),
  ...(req.headers["user-agent"]
    ? { userAgent: req.headers["user-agent"] }
    : {})
});

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

export async function updateOrganization(
  req: Request,
  res: Response
) {
  const auth =
    (req as Request & {
      auth?: {
        userId?: string;
        organizationId?: string;
      };
    }).auth;

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
    validateOrganizationUpdateInput(
      req.body
    );

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }

  const existingOrganization =
    await getOrganizationForTenant(
      organizationId
    );

  if (!existingOrganization) {
    return res.status(404).json({
      success: false,
      message:
        "Organization not found"
    });
  }

  const updatedOrganization =
    await updateOrganizationForTenant(
      organizationId,
      validation.data
    );

  await createAuditLog({
    organizationId,
    userId,
    action:
      "ORGANIZATION_UPDATED",
    entityType:
      "Organization",
    entityId:
      updatedOrganization.id,
    oldValues: {
      name:
        existingOrganization.name,
      registrationNumber:
        existingOrganization.registrationNumber,
      email:
        existingOrganization.email,
      phone:
        existingOrganization.phone,
      website:
        existingOrganization.website,
      country:
        existingOrganization.country,
      currency:
        existingOrganization.currency,
      timezone:
        existingOrganization.timezone
    },
    newValues: {
      name:
        updatedOrganization.name,
      registrationNumber:
        updatedOrganization.registrationNumber,
      email:
        updatedOrganization.email,
      phone:
        updatedOrganization.phone,
      website:
        updatedOrganization.website,
      country:
        updatedOrganization.country,
      currency:
        updatedOrganization.currency,
      timezone:
        updatedOrganization.timezone
    },
    ...(req.ip
      ? { ipAddress: req.ip }
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
      "Organization updated successfully",
    data:
      updatedOrganization
  });
}

export async function removeOrganization(
  req: Request,
  res: Response
) {
  const auth =
    (req as Request & {
      auth?: {
        userId?: string;
        organizationId?: string;
      };
    }).auth;

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

  const existingOrganization =
    await getOrganizationForTenant(
      organizationId
    );

  if (!existingOrganization) {
    return res.status(404).json({
      success: false,
      message:
        "Organization not found"
    });
  }

  await deleteOrganizationById(
    organizationId
  );

  await createAuditLog({
    organizationId,
    userId,
    action:
      "ORGANIZATION_DELETED",
    entityType:
      "Organization",
    entityId:
      existingOrganization.id,
    oldValues: {
      name:
        existingOrganization.name,
      slug:
        existingOrganization.slug,
      organizationType:
        existingOrganization.organizationType,
      status:
        existingOrganization.status
    },
    ...(req.ip
      ? { ipAddress: req.ip }
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
      "Organization deleted successfully"
  });
}