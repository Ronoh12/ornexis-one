import type {
  Request,
  Response
} from "express";

import {
  getDashboardOverview
} from "../services/dashboardService.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId?: string;
    organizationId?: string;
  };
};

export async function getOverview(
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

  const overview =
    await getDashboardOverview(
      organizationId
    );

  return res.json({
    success: true,
    data:
      overview
  });
}