type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

type UpdateOrganizationInput = {
  name?: string;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
  currency?: string;
  timezone?: string;
};

const ALLOWED_FIELDS = new Set([
  "name",
  "registrationNumber",
  "email",
  "phone",
  "website",
  "country",
  "currency",
  "timezone"
]);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export function validateOrganizationUpdateInput(
  body: unknown
): ValidationResult<UpdateOrganizationInput> {
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
        "At least one organization field is required"
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

  const result: UpdateOrganizationInput = {};

  if (data.name !== undefined) {
    if (
      typeof data.name !== "string" ||
      data.name.trim().length < 2
    ) {
      return {
        success: false,
        message:
          "Organization name must be at least 2 characters long"
      };
    }

    result.name =
      data.name.trim();
  }

  if (data.registrationNumber !== undefined) {
    if (
      typeof data.registrationNumber !== "string"
    ) {
      return {
        success: false,
        message:
          "Registration number must be a string"
      };
    }

    result.registrationNumber =
      data.registrationNumber.trim();
  }

  if (data.email !== undefined) {
    if (
      typeof data.email !== "string" ||
      !isValidEmail(
        data.email.trim().toLowerCase()
      )
    ) {
      return {
        success: false,
        message:
          "A valid organization email is required"
      };
    }

    result.email =
      data.email.trim().toLowerCase();
  }

  if (data.phone !== undefined) {
    if (
      typeof data.phone !== "string" ||
      !data.phone.trim()
    ) {
      return {
        success: false,
        message:
          "A valid organization phone is required"
      };
    }

    result.phone =
      data.phone.trim();
  }

  if (data.website !== undefined) {
    if (
      typeof data.website !== "string" ||
      !isValidUrl(data.website.trim())
    ) {
      return {
        success: false,
        message:
          "A valid organization website URL is required"
      };
    }

    result.website =
      data.website.trim();
  }

  if (data.country !== undefined) {
    if (
      typeof data.country !== "string" ||
      !data.country.trim()
    ) {
      return {
        success: false,
        message:
          "A valid country is required"
      };
    }

    result.country =
      data.country.trim();
  }

  if (data.currency !== undefined) {
    if (
      typeof data.currency !== "string" ||
      !/^[A-Za-z]{3}$/.test(
        data.currency.trim()
      )
    ) {
      return {
        success: false,
        message:
          "Currency must be a valid 3-letter code"
      };
    }

    result.currency =
      data.currency.trim().toUpperCase();
  }

  if (data.timezone !== undefined) {
    if (
      typeof data.timezone !== "string" ||
      !data.timezone.trim()
    ) {
      return {
        success: false,
        message:
          "A valid timezone is required"
      };
    }

    result.timezone =
      data.timezone.trim();
  }

  return {
    success: true,
    data: result
  };
}