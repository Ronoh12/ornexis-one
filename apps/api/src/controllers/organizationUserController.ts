import type { Request, Response } from "express";

import {
  createOrganizationUser,
  getOrganizationUserById,
  getOrganizationUsers,
  removeOrganizationUser,
  updateOrganizationUser
} from "../services/organizationUserService.js";

import {
  createInvitationToken
} from "../services/invitationTokenService.js";

import {
  createAuditLog
} from "../services/auditService.js";

import {
  validateOrganizationUserUpdateInput
} from "../validators/organizationUserValidator.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId?: string;
    organizationId?: string;
  };
};

const ORGANIZATION_USER_STATUSES = [
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
  "REMOVED"
] as const;

export async function listOrganizationUsers(
  req: Request,
  res: Response
) {
  const auth = (req as AuthenticatedRequest).auth;
  const organizationId = auth?.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  const memberships =
    await getOrganizationUsers(
      organizationId
    );

  return res.json({
    success: true,
    data: memberships
  });
}

export async function getOrganizationUser(
  req: Request,
  res: Response
) {
  const auth = (req as AuthenticatedRequest).auth;
  const organizationId = auth?.organizationId;

  const id = req.params.id;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "A valid organization membership ID is required"
    });
  }

  const membership =
    await getOrganizationUserById(
      id,
      organizationId
    );

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

export async function updateOrganizationUserMembership(
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
        "A valid organization membership ID is required"
    });
  }

  const validation =
    validateOrganizationUserUpdateInput(
      req.body
    );

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        validation.message
    });
  }

  const existingMembership =
    await getOrganizationUserById(
      id,
      organizationId
    );

  if (!existingMembership) {
    return res.status(404).json({
      success: false,
      message:
        "Organization membership not found"
    });
  }

  const result =
    await updateOrganizationUser(
      id,
      organizationId,
      validation.data
    );

  if (
    result.reason ===
    "LAST_ACTIVE_ADMINISTRATOR"
  ) {
    return res.status(409).json({
      success: false,
      message:
        "The last active Administrator cannot be suspended, removed, or reassigned"
    });
  }

  if (!result.success) {
    if (result.reason === "INVALID_ROLE") {
      return res.status(400).json({
        success: false,
        message:
          "Role does not belong to this organization"
      });
    }

    return res.status(404).json({
      success: false,
      message:
        "Organization membership not found"
    });
  }

  const updatedMembership =
    result.data;

  await createAuditLog({
    organizationId,
    userId,
    action:
      "ORGANIZATION_USER_UPDATED",
    entityType:
      "OrganizationUser",
    entityId:
      updatedMembership.id,
    oldValues: {
      roleId:
        existingMembership.roleId,
      status:
        existingMembership.status
    },
    newValues: {
      roleId:
        updatedMembership.roleId,
      status:
        updatedMembership.status
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
      "Organization user updated successfully",
    data:
      updatedMembership
  });
}

export async function removeOrganizationUserMembership(
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
        "A valid organization membership ID is required"
    });
  }

  const existingMembership =
    await getOrganizationUserById(
      id,
      organizationId
    );

  if (!existingMembership) {
    return res.status(404).json({
      success: false,
      message:
        "Organization membership not found"
    });
  }

  const result =
    await removeOrganizationUser(
      id,
      organizationId
    );

  if (
    result.reason ===
    "LAST_ACTIVE_ADMINISTRATOR"
  ) {
    return res.status(409).json({
      success: false,
      message:
        "The last active Administrator cannot be removed"
    });
  }

  if (!result.success) {
    if (
      result.reason ===
      "ALREADY_REMOVED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Organization membership is already removed"
      });
    }

    return res.status(404).json({
      success: false,
      message:
        "Organization membership not found"
    });
  }

  const removedMembership =
    result.data;

  await createAuditLog({
    organizationId,
    userId,
    action:
      "ORGANIZATION_USER_REMOVED",
    entityType:
      "OrganizationUser",
    entityId:
      removedMembership.id,
    oldValues: {
      roleId:
        existingMembership.roleId,
      status:
        existingMembership.status
    },
    newValues: {
      roleId:
        removedMembership.roleId,
      status:
        removedMembership.status
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
      "Organization user removed successfully",
    data:
      removedMembership
  });
}

export async function addOrganizationUser(
  req: Request,
  res: Response
) {
  const auth = (req as AuthenticatedRequest).auth;

  const userId = auth?.userId;
  const organizationId = auth?.organizationId;

  if (!userId || !organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  const {
    userId: membershipUserId,
    roleId,
    status
  } = req.body;

  if (
    typeof membershipUserId !== "string" ||
    !membershipUserId
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid user ID is required"
    });
  }

  if (
    typeof roleId !== "string" ||
    !roleId
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid role ID is required"
    });
  }

  let validatedStatus:
  | (typeof ORGANIZATION_USER_STATUSES)[number]
  | undefined;

if (status !== undefined) {
  if (
    typeof status !== "string" ||
    !ORGANIZATION_USER_STATUSES.includes(
      status as (typeof ORGANIZATION_USER_STATUSES)[number]
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid organization user status is required"
    });
  }

  validatedStatus =
    status as (typeof ORGANIZATION_USER_STATUSES)[number];
}

  try {
    const result =
      await createOrganizationUser({
        organizationId,
        userId: membershipUserId,
        roleId,
        ...(validatedStatus !== undefined
        ? { status: validatedStatus }
        : {}),
        invitedBy: userId
      });

    if (!result.success) {
      if (result.reason === "INVALID_ROLE") {
        return res.status(400).json({
          success: false,
          message:
            "Role does not belong to this organization"
        });
      }
    }

    let invitationToken:
      | string
      | undefined;

    if (result.data.status === "INVITED") {
      const invitation =
        await createInvitationToken({
          userId: result.data.userId,
          organizationUserId:
            result.data.id
        });

      invitationToken =
        invitation.invitationToken;

      await createAuditLog({
        organizationId,
        userId,
        action: "INVITATION_CREATED",
        entityType: "OrganizationUser",
        entityId: result.data.id,
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
    }

    return res.status(201).json({
      success: true,
      message:
        "User added to organization successfully",
      data: {
        membership: result.data,
        ...(invitationToken !== undefined
          ? { invitationToken }
          : {})
      }
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message:
          "This user already belongs to this organization"
      });
    }

    if (error?.code === "P2003") {
      return res.status(400).json({
        success: false,
        message:
          "User or related record does not exist"
      });
    }

    throw error;
  }
}
