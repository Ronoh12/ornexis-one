import type {
  NextFunction,
  Request,
  Response
} from "express";

import { prisma } from "../../../../packages/database/index.js";

type OrganizationRequest = Request & {
  auth?: {
    userId: string;
    organizationId?: string;
  };
};

export async function organizationContext(
  req: OrganizationRequest,
  res: Response,
  next: NextFunction
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  const organizationHeader =
    req.headers["x-organization-id"];

  if (
    typeof organizationHeader !== "string" ||
    !organizationHeader
  ) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  const membership =
    await prisma.organizationUser.findFirst({
      where: {
        userId,
        organizationId: organizationHeader,
        status: "ACTIVE"
      }
    });

  if (!membership) {
    return res.status(403).json({
      success: false,
      message: "You do not have access to this organization"
    });
  }

  req.auth = {
    userId,
    organizationId: organizationHeader
  };

  next();
}