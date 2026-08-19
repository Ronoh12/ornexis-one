import type {
  Request,
  Response
} from "express";

import {
  getOrganizationSettings,
  upsertOrganizationSettings
} from "../services/organizationSettingService.js";

import {
  validateOrganizationSettingUpdateInput
} from "../validators/organizationSettingValidator.js";

import {
  createAuditLog
} from "../services/auditService.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId?: string;
    organizationId?: string;
  };
};

export async function getOrganizationSetting(
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

  const settings =
    await getOrganizationSettings(
      organizationId
    );

  return res.json({
    success: true,
    data: settings
  });
}

export async function updateOrganizationSetting(
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
    validateOrganizationSettingUpdateInput(
      req.body
    );

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        validation.message
    });
  }

  const existingSettings =
    await getOrganizationSettings(
      organizationId
    );

  const updatedSettings =
    await upsertOrganizationSettings(
      organizationId,
      validation.data
    );

  await createAuditLog({
    organizationId,
    userId,
    action:
      "ORGANIZATION_SETTINGS_UPDATED",
    entityType:
      "OrganizationSetting",
    entityId:
      updatedSettings.id,
    oldValues:
      existingSettings
        ? {
            locale:
              existingSettings.locale,
            dateFormat:
              existingSettings.dateFormat,
            timeFormat:
              existingSettings.timeFormat,
            weekStartsOn:
              existingSettings.weekStartsOn,
            defaultLanguage:
              existingSettings.defaultLanguage,
            defaultCountry:
              existingSettings.defaultCountry,
            defaultCurrency:
              existingSettings.defaultCurrency,
            defaultTimezone:
              existingSettings.defaultTimezone
          }
        : undefined,
    newValues: {
      locale:
        updatedSettings.locale,
      dateFormat:
        updatedSettings.dateFormat,
      timeFormat:
        updatedSettings.timeFormat,
      weekStartsOn:
        updatedSettings.weekStartsOn,
      defaultLanguage:
        updatedSettings.defaultLanguage,
      defaultCountry:
        updatedSettings.defaultCountry,
      defaultCurrency:
        updatedSettings.defaultCurrency,
      defaultTimezone:
        updatedSettings.defaultTimezone
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
      "Organization settings updated successfully",
    data:
      updatedSettings
  });
}