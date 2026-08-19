type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

export type UpdateOrganizationBrandingInput = {
  displayName?: string;
  shortName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
};

const ALLOWED_FIELDS = new Set([
  "displayName",
  "shortName",
  "logoUrl",
  "faviconUrl",
  "primaryColor",
  "secondaryColor",
  "accentColor"
]);

const COLOR_PATTERN =
  /^#[0-9A-Fa-f]{6}$/;

function isValidUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export function validateOrganizationBrandingUpdateInput(
  body: unknown
): ValidationResult<UpdateOrganizationBrandingInput> {
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
        "At least one branding field is required"
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

  const result:
    UpdateOrganizationBrandingInput = {};

  if (data.displayName !== undefined) {
    if (
      typeof data.displayName !== "string" ||
      !data.displayName.trim()
    ) {
      return {
        success: false,
        message:
          "A valid display name is required"
      };
    }

    if (data.displayName.trim().length > 150) {
      return {
        success: false,
        message:
          "Display name cannot exceed 150 characters"
      };
    }

    result.displayName =
      data.displayName.trim();
  }

  if (data.shortName !== undefined) {
    if (
      typeof data.shortName !== "string" ||
      !data.shortName.trim()
    ) {
      return {
        success: false,
        message:
          "A valid short name is required"
      };
    }

    if (data.shortName.trim().length > 50) {
      return {
        success: false,
        message:
          "Short name cannot exceed 50 characters"
      };
    }

    result.shortName =
      data.shortName.trim();
  }

  if (data.logoUrl !== undefined) {
    if (
      typeof data.logoUrl !== "string" ||
      !isValidUrl(data.logoUrl.trim())
    ) {
      return {
        success: false,
        message:
          "A valid HTTP or HTTPS logo URL is required"
      };
    }

    result.logoUrl =
      data.logoUrl.trim();
  }

  if (data.faviconUrl !== undefined) {
    if (
      typeof data.faviconUrl !== "string" ||
      !isValidUrl(data.faviconUrl.trim())
    ) {
      return {
        success: false,
        message:
          "A valid HTTP or HTTPS favicon URL is required"
      };
    }

    result.faviconUrl =
      data.faviconUrl.trim();
  }

  if (data.primaryColor !== undefined) {
    if (
      typeof data.primaryColor !== "string" ||
      !COLOR_PATTERN.test(
        data.primaryColor.trim()
      )
    ) {
      return {
        success: false,
        message:
          "Primary color must be a valid hex color such as #0B1120"
      };
    }

    result.primaryColor =
      data.primaryColor.trim().toUpperCase();
  }

  if (data.secondaryColor !== undefined) {
    if (
      typeof data.secondaryColor !== "string" ||
      !COLOR_PATTERN.test(
        data.secondaryColor.trim()
      )
    ) {
      return {
        success: false,
        message:
          "Secondary color must be a valid hex color such as #1E293B"
      };
    }

    result.secondaryColor =
      data.secondaryColor.trim().toUpperCase();
  }

  if (data.accentColor !== undefined) {
    if (
      typeof data.accentColor !== "string" ||
      !COLOR_PATTERN.test(
        data.accentColor.trim()
      )
    ) {
      return {
        success: false,
        message:
          "Accent color must be a valid hex color such as #3B82F6"
      };
    }

    result.accentColor =
      data.accentColor.trim().toUpperCase();
  }

  return {
    success: true,
    data: result
  };
}