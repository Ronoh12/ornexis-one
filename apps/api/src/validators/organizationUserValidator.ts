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
  status?: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
};

const ALLOWED_FIELDS = new Set([
  "roleId",
  "status"
]);

const ALLOWED_STATUSES = new Set([
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
  "REMOVED"
]);

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
      !data.roleId.trim()
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