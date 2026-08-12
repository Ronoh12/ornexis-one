import type {
  NextFunction,
  Request,
  Response
} from "express";

import {
  userHasPermission
} from "../services/authorizationService.js";

type PermissionRequest = Request & {
  auth?: {
    userId: string;
    organizationId: string;
  };
};

export function requirePermission(
  permissionCode: string
) {
  return async (
    req: PermissionRequest,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.auth?.userId;
    const organizationId =
      req.auth?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const allowed =
      await userHasPermission(
        userId,
        organizationId,
        permissionCode
      );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Permission denied"
      });
    }

    next();
  };
}