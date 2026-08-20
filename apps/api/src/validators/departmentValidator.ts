export type CreateDepartmentInput = {
  name: string;
  code?: string | null;
  description?: string | null;
  branchId?: string | null;
  isActive?: boolean;
};

export type UpdateDepartmentInput = {
  name?: string;
  code?: string | null;
  description?: string | null;
  branchId?: string | null;
  isActive?: boolean;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidDepartmentId(
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

function validateBranchId(
  value: unknown
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

  if (
    typeof value !== "string" ||
    !uuidPattern.test(value)
  ) {
    return {
      success: false,
      message:
        "A valid branch ID is required"
    };
  }

  return {
    success: true,
    value
  };
}

export function validateDepartmentCreate(
  body: unknown
):
  | {
      success: true;
      data: CreateDepartmentInput;
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
    "branchId",
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
        "A valid department name is required"
    };
  }

  const name =
    input.name.trim();

  if (name.length > 150) {
    return {
      success: false,
      message:
        "Department name must not exceed 150 characters"
    };
  }

  const result: CreateDepartmentInput = {
    name
  };

  for (
    const field of [
      "code",
      "description"
    ] as const
  ) {
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

  const branch =
    validateBranchId(
      input.branchId
    );

  if (!branch.success) {
    return branch;
  }

  if (branch.value !== undefined) {
    result.branchId =
      branch.value;
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

export function validateDepartmentUpdate(
  body: unknown
):
  | {
      success: true;
      data: UpdateDepartmentInput;
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
        "At least one department field must be provided"
    };
  }

  const allowedFields = [
    "name",
    "code",
    "description",
    "branchId",
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

  const result: UpdateDepartmentInput = {};

  if (input.name !== undefined) {
    if (
      typeof input.name !== "string" ||
      !input.name.trim()
    ) {
      return {
        success: false,
        message:
          "A valid department name is required"
      };
    }

    const name =
      input.name.trim();

    if (name.length > 150) {
      return {
        success: false,
        message:
          "Department name must not exceed 150 characters"
      };
    }

    result.name =
      name;
  }

  for (
    const field of [
      "code",
      "description"
    ] as const
  ) {
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

  const branch =
    validateBranchId(
      input.branchId
    );

  if (!branch.success) {
    return branch;
  }

  if (branch.value !== undefined) {
    result.branchId =
      branch.value;
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