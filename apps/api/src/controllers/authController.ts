import type {
  Request,
  Response
} from "express";

import {
  activateUser,
  getCurrentUser,
  loginUser
} from "../services/authService.js";

import {
  validateActivationInput,
  validateLoginInput
} from "../validators/authValidator.js";

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
    if (result.reason === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (result.reason === "ALREADY_ACTIVE") {
      return res.status(409).json({
        success: false,
        message: "User account is already active"
      });
    }
  }

  return res.json({
    success: true,
    message: "User activated successfully",
    data: {
      id: result.data.id,
      email: result.data.email,
      status: result.data.status
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
    await loginUser(validation.data);

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
