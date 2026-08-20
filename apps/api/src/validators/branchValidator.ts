export type CreateBranchInput = {
  name: string;
  code?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  countyState?: string | null;
  country?: string | null;
  isActive?: boolean;
};

export type UpdateBranchInput = {
  name?: string;
  code?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  countyState?: string | null;
  country?: string | null;
  isActive?: boolean;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidBranchId(
  value: string
) {
  return uuidPattern.test(value);
}

function normalizeOptionalString(
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

  if (typeof value !== "string") {
    return {
      success: false,
      message:
        `${fieldName} must be a string or null`
    };
  }

  const trimmed =
    value.trim();

  return {
    success: true,
    value:
      trimmed || null
  };
}

export function validateBranchCreate(
  body: unknown
):
  | {
      success: true;
      data: CreateBranchInput;
    }
  | {
      success: false;
      message: string;
    } {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return {
      success: false,
      message:
        "A valid request body is required"
    };
  }

  const input =
    body as Record<string, unknown>;

  const allowedFields = [
    "name",
    "code",
    "description",
    "email",
    "phone",
    "address",
    "city",
    "countyState",
    "country",
    "isActive"
  ];

  for (const field of Object.keys(input)) {
    if (!allowedFields.includes(field)) {
      return {
        success: false,
        message:
          `Field "${field}" is not allowed`
      };
    }
  }

  if (
    typeof input.name !== "string" ||
    !input.name.trim()
  ) {
    return {
      success: false,
      message:
        "A valid branch name is required"
    };
  }

  const name =
    input.name.trim();

  if (name.length > 150) {
    return {
      success: false,
      message:
        "Branch name must not exceed 150 characters"
    };
  }

  const result: CreateBranchInput = {
    name
  };

  const stringFields = [
    "code",
    "description",
    "email",
    "phone",
    "address",
    "city",
    "countyState",
    "country"
  ] as const;

  for (const field of stringFields) {
    const normalized =
      normalizeOptionalString(
        input[field],
        field
      );

    if (!normalized.success) {
      return normalized;
    }

    if (normalized.value !== undefined) {
      result[field] =
        normalized.value;
    }
  }

  if (input.isActive !== undefined) {
    if (
      typeof input.isActive !== "boolean"
    ) {
      return {
        success: false,
        message:
          "isActive must be a boolean"
      };
    }

    result.isActive =
      input.isActive;
  }

  return {
    success: true,
    data: result
  };
}

export function validateBranchUpdate(
  body: unknown
):
  | {
      success: true;
      data: UpdateBranchInput;
    }
  | {
      success: false;
      message: string;
    } {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return {
      success: false,
      message:
        "A valid request body is required"
    };
  }

  const input =
    body as Record<string, unknown>;

  if (Object.keys(input).length === 0) {
    return {
      success: false,
      message:
        "At least one branch field must be provided"
    };
  }

  const allowedFields = [
    "name",
    "code",
    "description",
    "email",
    "phone",
    "address",
    "city",
    "countyState",
    "country",
    "isActive"
  ];

  for (const field of Object.keys(input)) {
    if (!allowedFields.includes(field)) {
      return {
        success: false,
        message:
          `Field "${field}" is not allowed`
      };
    }
  }

  const result: UpdateBranchInput = {};

  if (input.name !== undefined) {
    if (
      typeof input.name !== "string" ||
      !input.name.trim()
    ) {
      return {
        success: false,
        message:
          "A valid branch name is required"
      };
    }

    const name =
      input.name.trim();

    if (name.length > 150) {
      return {
        success: false,
        message:
          "Branch name must not exceed 150 characters"
      };
    }

    result.name =
      name;
  }

  const stringFields = [
    "code",
    "description",
    "email",
    "phone",
    "address",
    "city",
    "countyState",
    "country"
  ] as const;

  for (const field of stringFields) {
    const normalized =
      normalizeOptionalString(
        input[field],
        field
      );

    if (!normalized.success) {
      return normalized;
    }

    if (normalized.value !== undefined) {
      result[field] =
        normalized.value;
    }
  }

  if (input.isActive !== undefined) {
    if (
      typeof input.isActive !== "boolean"
    ) {
      return {
        success: false,
        message:
          "isActive must be a boolean"
      };
    }

    result.isActive =
      input.isActive;
  }

  return {
    success: true,
    data: result
  };
}