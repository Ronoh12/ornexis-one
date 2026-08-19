type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

type UpdateOrganizationSettingInput = {
  locale?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekStartsOn?: number;
  defaultLanguage?: string;
  defaultCountry?: string;
  defaultCurrency?: string;
  defaultTimezone?: string;
};

const ALLOWED_FIELDS = new Set([
  "locale",
  "dateFormat",
  "timeFormat",
  "weekStartsOn",
  "defaultLanguage",
  "defaultCountry",
  "defaultCurrency",
  "defaultTimezone"
]);

const ALLOWED_TIME_FORMATS = new Set([
  "12h",
  "24h"
]);

export function validateOrganizationSettingUpdateInput(
  body: unknown
): ValidationResult<UpdateOrganizationSettingInput> {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return {
      success: false,
      message: "Invalid request body"
    };
  }

  const data =
    body as Record<string, unknown>;

  const keys =
    Object.keys(data);

  if (keys.length === 0) {
    return {
      success: false,
      message:
        "At least one organization setting is required"
    };
  }

  for (const key of keys) {
    if (!ALLOWED_FIELDS.has(key)) {
      return {
        success: false,
        message:
          `Field "${key}" cannot be updated`
      };
    }
  }

  const result: UpdateOrganizationSettingInput = {};

  if (data.locale !== undefined) {
    if (
      typeof data.locale !== "string" ||
      !data.locale.trim()
    ) {
      return {
        success: false,
        message:
          "A valid locale is required"
      };
    }

    result.locale =
      data.locale.trim();
  }

  if (data.dateFormat !== undefined) {
    if (
      typeof data.dateFormat !== "string" ||
      !data.dateFormat.trim()
    ) {
      return {
        success: false,
        message:
          "A valid date format is required"
      };
    }

    result.dateFormat =
      data.dateFormat.trim();
  }

  if (data.timeFormat !== undefined) {
    if (
      typeof data.timeFormat !== "string" ||
      !ALLOWED_TIME_FORMATS.has(
        data.timeFormat.trim()
      )
    ) {
      return {
        success: false,
        message:
          'Time format must be either "12h" or "24h"'
      };
    }

    result.timeFormat =
      data.timeFormat.trim();
  }

  if (data.weekStartsOn !== undefined) {
    if (
      typeof data.weekStartsOn !== "number" ||
      !Number.isInteger(data.weekStartsOn) ||
      data.weekStartsOn < 0 ||
      data.weekStartsOn > 6
    ) {
      return {
        success: false,
        message:
          "weekStartsOn must be an integer between 0 and 6"
      };
    }

    result.weekStartsOn =
      data.weekStartsOn;
  }

  if (data.defaultLanguage !== undefined) {
    if (
      typeof data.defaultLanguage !== "string" ||
      !data.defaultLanguage.trim()
    ) {
      return {
        success: false,
        message:
          "A valid default language is required"
      };
    }

    result.defaultLanguage =
      data.defaultLanguage.trim();
  }

  if (data.defaultCountry !== undefined) {
    if (
      typeof data.defaultCountry !== "string" ||
      !data.defaultCountry.trim()
    ) {
      return {
        success: false,
        message:
          "A valid default country is required"
      };
    }

    result.defaultCountry =
      data.defaultCountry.trim();
  }

  if (data.defaultCurrency !== undefined) {
    if (
      typeof data.defaultCurrency !== "string" ||
      !/^[A-Za-z]{3}$/.test(
        data.defaultCurrency.trim()
      )
    ) {
      return {
        success: false,
        message:
          "Default currency must be a valid 3-letter code"
      };
    }

    result.defaultCurrency =
      data.defaultCurrency
        .trim()
        .toUpperCase();
  }

  if (data.defaultTimezone !== undefined) {
    if (
      typeof data.defaultTimezone !== "string" ||
      !data.defaultTimezone.trim()
    ) {
      return {
        success: false,
        message:
          "A valid default timezone is required"
      };
    }

    result.defaultTimezone =
      data.defaultTimezone.trim();
  }

  return {
    success: true,
    data: result
  };
}