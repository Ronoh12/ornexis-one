import type {
  Request,
  Response
} from "express";

import {
  activateUser,
  getCurrentUser,
  issueAccessToken,
  loginUser
} from "../services/authService.js";

import {
  revokeRefreshSessionByToken,
  rotateRefreshSession
} from "../services/refreshSessionService.js";

import {
  validateActivationInput,
  validateForgotPasswordInput,
  validateLoginInput,
  validateRefreshTokenInput,
  validateResetPasswordInput
} from "../validators/authValidator.js";

import {
  createPasswordResetToken,
  resetPassword
} from "../services/passwordResetService.js";

import { createAuditLog } from "../services/auditService.js";

export async function activate(
  req: Request,
  res: Response
) {
  const validation =
    validateActivationInput(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }

  const result =
    await activateUser(validation.data);

  if (!result.success) {
    if (
      result.reason ===
      "INVALID_INVITATION"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired invitation"
      });
    }

    if (
      result.reason ===
      "ALREADY_ACTIVE"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "User account is already active"
      });
    }

    if (
      result.reason ===
      "ACCOUNT_INACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account cannot be activated"
      });
    }
  }

  const activatedUser =
    result.data.activatedUser;

  const membership =
    result.data.membership;

  await createAuditLog({
    organizationId:
      membership.organizationId,
    userId:
      activatedUser.id,
    action: "USER_ACTIVATED",
    entityType: "User",
    entityId:
      activatedUser.id,
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

  await createAuditLog({
    organizationId:
      membership.organizationId,
    userId:
      activatedUser.id,
    action: "INVITATION_ACCEPTED",
    entityType:
      "OrganizationUser",
    entityId:
      membership.id,
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
      "User activated successfully",
    data: {
      user: activatedUser,
      membership: {
        id: membership.id,
        organizationId:
          membership.organizationId,
        roleId:
          membership.roleId,
        status:
          membership.status,
        joinedAt:
          membership.joinedAt
      }
    }
  });
}

export async function login(
  req: Request,
  res: Response
) {
  const validation =
    validateLoginInput(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }

  const result =
    await loginUser(
      validation.data,
      {
        ...(req.ip
          ? { ipAddress: req.ip }
          : {}),
        ...(req.headers["user-agent"]
          ? {
              userAgent:
                req.headers["user-agent"]
            }
          : {})
      }
    );

if (!result.success) {
  if (result.reason === "SUSPENDED") {
    return res.status(403).json({
      success: false,
      message: "This account has been suspended"
    });
  }

  if (result.reason === "DISABLED") {
    return res.status(403).json({
      success: false,
      message: "This account has been disabled"
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid email or password"
  });
}

const loginData = result.data;

await createAuditLog({
  userId: loginData.user.id,
  action: "USER_LOGIN",
  entityType: "User",
  entityId: loginData.user.id,
  ...(req.ip ? { ipAddress: req.ip } : {}),
  ...(req.headers["user-agent"]
    ? { userAgent: req.headers["user-agent"] }
    : {})
});

return res.json({
  success: true,
  message: "Login successful",
  data: loginData
});
}

export async function me(
  req: Request,
  res: Response
) {
  const userId =
    (req as Request & {
      auth?: {
        userId?: string;
      };
    }).auth?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  const user = await getCurrentUser(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  return res.json({
    success: true,
    data: user
  });
}


export async function refresh(
  req: Request,
  res: Response
) {
  const validation =
    validateRefreshTokenInput(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }

  const result =
    await rotateRefreshSession(
      validation.data.refreshToken,
      {
        ...(req.ip
          ? { ipAddress: req.ip }
          : {}),
        ...(req.headers["user-agent"]
          ? {
              userAgent:
                req.headers["user-agent"]
            }
          : {})
      }
    );

  if (!result.success) {
    if (
      result.reason ===
      "ACCOUNT_INACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account is not active"
      });
    }

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired refresh token"
    });
  }

  const accessToken =
    issueAccessToken(
      result.data.userId
    );

  return res.json({
    success: true,
    message:
      "Token refreshed successfully",
    data: {
      accessToken,
      refreshToken:
        result.data.refreshToken
    }
  });
}

export async function logout(
  req: Request,
  res: Response
) {
  const validation =
    validateRefreshTokenInput(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }

  const result =
    await revokeRefreshSessionByToken(
      validation.data.refreshToken
    );

  if (!result.success) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired refresh token"
    });
  }

  await createAuditLog({
    userId: result.data.userId,
    action: "USER_LOGOUT",
    entityType: "User",
    entityId: result.data.userId,
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
    message: "Logout successful"
  });
}

export async function forgotPassword(
  req: Request,
  res: Response
) {
  const validation =
    validateForgotPasswordInput(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }

  const result =
    await createPasswordResetToken(
      validation.data.email
    );

  const response: {
    success: true;
    message: string;
    data?: {
      resetToken: string;
    };
  } = {
    success: true,
    message:
      "If an account exists for this email, password reset instructions have been generated"
  };

  if (
    process.env.APP_ENV === "development" &&
    result.resetToken !== undefined
  ) {
    response.data = {
      resetToken:
        result.resetToken
    };
  }

  return res.json(response);
}

export async function resetPasswordController(
  req: Request,
  res: Response
) {
  const validation =
    validateResetPasswordInput(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }

  const result =
    await resetPassword(
      validation.data.resetToken,
      validation.data.password
    );

  if (!result.success) {
    if (
      result.reason ===
      "ACCOUNT_INACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account cannot reset its password"
      });
    }

    return res.status(400).json({
      success: false,
      message:
        "Invalid or expired reset token"
    });
  }

  await createAuditLog({
    userId: result.data.userId,
    action:
      "PASSWORD_RESET_COMPLETED",
    entityType: "User",
    entityId:
      result.data.userId,
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
      "Password reset successfully"
  });
}