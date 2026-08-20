type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

export type UpdateOrganizationUserInput = {
  roleId?: string;
  branchId?: string | null;
  departmentId?: string | null;
  status?: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
};

const ALLOWED_FIELDS = new Set([
  "roleId",
  "branchId",
  "departmentId",
  "status"
]);

const ALLOWED_STATUSES = new Set([
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
  "REMOVED"
]);

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateNullableUuid(
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

  if (
    typeof value !== "string" ||
    !uuidPattern.test(value.trim())
  ) {
    return {
      success: false,
      message:
        `A valid ${fieldName} ID is required`
    };
  }

  return {
    success: true,
    value: value.trim()
  };
}

export function validateOrganizationUserUpdateInput(
  body: unknown
): ValidationResult<UpdateOrganizationUserInput> {
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
        "At least one organization user field is required"
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
    UpdateOrganizationUserInput = {};

  if (data.roleId !== undefined) {
    if (
      typeof data.roleId !== "string" ||
      !uuidPattern.test(
        data.roleId.trim()
      )
    ) {
      return {
        success: false,
        message:
          "A valid role ID is required"
      };
    }

    result.roleId =
      data.roleId.trim();
  }

  const branchValidation =
    validateNullableUuid(
      data.branchId,
      "branch"
    );

  if (!branchValidation.success) {
    return branchValidation;
  }

  if (
    branchValidation.value !== undefined
  ) {
    result.branchId =
      branchValidation.value;
  }

  const departmentValidation =
    validateNullableUuid(
      data.departmentId,
      "department"
    );

  if (!departmentValidation.success) {
    return departmentValidation;
  }

  if (
    departmentValidation.value !== undefined
  ) {
    result.departmentId =
      departmentValidation.value;
  }

  if (data.status !== undefined) {
    if (
      typeof data.status !== "string" ||
      !ALLOWED_STATUSES.has(
        data.status
      )
    ) {
      return {
        success: false,
        message:
          "A valid organization user status is required"
      };
    }

    result.status =
      data.status as
      | "INVITED"
      | "ACTIVE"
      | "SUSPENDED"
      | "REMOVED";
  }

  return {
    success: true,
    data: result
  };
}