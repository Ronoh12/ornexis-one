import type {
  Request,
  Response
} from "express";

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

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateNullableUuid(
  value: unknown,
  fieldName: string
):
  | {
      success: true;
      value?: string | null;
    }
  | {
      success: false;
      message: string;
    } {
  if (value === undefined) {
    return {
      success: true
    };
  }

  if (value === null) {
    return {
      success: true,
      value: null
    };
  }

  if (
    typeof value !== "string" ||
    !uuidPattern.test(value.trim())
  ) {
    return {
      success: false,
      message:
        `A valid ${fieldName} ID is required`
    };
  }

  return {
    success: true,
    value:
      value.trim()
  };
}

function handleStructureFailure(
  reason:
    | "INVALID_BRANCH"
    | "INVALID_DEPARTMENT"
    | "BRANCH_DEPARTMENT_MISMATCH",
  res: Response
) {
  if (
    reason ===
    "INVALID_BRANCH"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Branch does not belong to this organization"
    });
  }

  if (
    reason ===
    "INVALID_DEPARTMENT"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Department does not belong to this organization"
    });
  }

  return res.status(400).json({
    success: false,
    message:
      "Department does not belong to the selected branch"
  });
}

export async function listOrganizationUsers(
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

  const memberships =
    await getOrganizationUsers(
      organizationId
    );

  return res.json({
    success: true,
    data:
      memberships
  });
}

export async function getOrganizationUser(
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
        "A valid organization membership ID is required"
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
      message:
        "Organization membership not found"
    });
  }

  return res.json({
    success: true,
    data:
      membership
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
    !result.success
  ) {
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
        "INVALID_BRANCH" ||
      result.reason ===
        "INVALID_DEPARTMENT" ||
      result.reason ===
        "BRANCH_DEPARTMENT_MISMATCH"
    ) {
      return handleStructureFailure(
        result.reason,
        res
      );
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
      branchId:
        existingMembership.branchId,
      departmentId:
        existingMembership.departmentId,
      status:
        existingMembership.status
    },
    newValues: {
      roleId:
        updatedMembership.roleId,
      branchId:
        updatedMembership.branchId,
      departmentId:
        updatedMembership.departmentId,
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

  if (!result.success) {
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
      branchId:
        existingMembership.branchId,
      departmentId:
        existingMembership.departmentId,
      status:
        existingMembership.status
    },
    newValues: {
      roleId:
        removedMembership.roleId,
      branchId:
        removedMembership.branchId,
      departmentId:
        removedMembership.departmentId,
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
  const auth =
    (req as AuthenticatedRequest).auth;

  const userId =
    auth?.userId;

  const organizationId =
    auth?.organizationId;

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

  const {
    userId:
      membershipUserId,
    roleId,
    branchId,
    departmentId,
    status
  } = req.body;

  if (
    typeof membershipUserId !== "string" ||
    !uuidPattern.test(
      membershipUserId.trim()
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid user ID is required"
    });
  }

  if (
    typeof roleId !== "string" ||
    !uuidPattern.test(
      roleId.trim()
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid role ID is required"
    });
  }

  const branchValidation =
    validateNullableUuid(
      branchId,
      "branch"
    );

  if (!branchValidation.success) {
    return res.status(400).json({
      success: false,
      message:
        branchValidation.message
    });
  }

  const departmentValidation =
    validateNullableUuid(
      departmentId,
      "department"
    );

  if (!departmentValidation.success) {
    return res.status(400).json({
      success: false,
      message:
        departmentValidation.message
    });
  }

  let validatedStatus:
    | (typeof ORGANIZATION_USER_STATUSES)[number]
    | undefined;

  if (status !== undefined) {
    if (
      typeof status !== "string" ||
      !ORGANIZATION_USER_STATUSES.includes(
        status as
          (typeof ORGANIZATION_USER_STATUSES)[number]
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid organization user status is required"
      });
    }

    validatedStatus =
      status as
        (typeof ORGANIZATION_USER_STATUSES)[number];
  }

  try {
    const result =
      await createOrganizationUser({
        organizationId,
        userId:
          membershipUserId.trim(),
        roleId:
          roleId.trim(),
        ...(branchValidation.value !== undefined
          ? {
              branchId:
                branchValidation.value
            }
          : {}),
        ...(departmentValidation.value !== undefined
          ? {
              departmentId:
                departmentValidation.value
            }
          : {}),
        ...(validatedStatus !== undefined
          ? {
              status:
                validatedStatus
            }
          : {}),
        invitedBy:
          userId
      });

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
          "INVALID_BRANCH" ||
        result.reason ===
          "INVALID_DEPARTMENT" ||
        result.reason ===
          "BRANCH_DEPARTMENT_MISMATCH"
      ) {
        return handleStructureFailure(
          result.reason,
          res
        );
      }

      return res.status(400).json({
        success: false,
        message:
          "Unable to add organization user"
      });
    }

    let invitationToken:
      | string
      | undefined;

    if (
      result.data.status ===
      "INVITED"
    ) {
      const invitation =
        await createInvitationToken({
          userId:
            result.data.userId,
          organizationUserId:
            result.data.id
        });

      invitationToken =
        invitation.invitationToken;

      await createAuditLog({
        organizationId,
        userId,
        action:
          "INVITATION_CREATED",
        entityType:
          "OrganizationUser",
        entityId:
          result.data.id,
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
    }

    await createAuditLog({
      organizationId,
      userId,
      action:
        "ORGANIZATION_USER_CREATED",
      entityType:
        "OrganizationUser",
      entityId:
        result.data.id,
      newValues: {
        roleId:
          result.data.roleId,
        branchId:
          result.data.branchId,
        departmentId:
          result.data.departmentId,
        status:
          result.data.status
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
        "User added to organization successfully",
      data: {
        membership:
          result.data,
        ...(invitationToken !== undefined
          ? {
              invitationToken
            }
          : {})
      }
    });
  } catch (error: any) {
    if (
      error?.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This user already belongs to this organization"
      });
    }

    if (
      error?.code === "P2003"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User or related record does not exist"
      });
    }

    throw error;
  }
}