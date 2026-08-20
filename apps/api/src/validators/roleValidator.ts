export type UpdateRoleInput = {
  name?: string;
  description?: string | null;
};

export function validateRoleUpdate(
  body: unknown
):
  | {
      success: true;
      data: UpdateRoleInput;
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
      message: "A valid request body is required"
    };
  }

  const input =
    body as Record<string, unknown>;

  const allowedFields = [
    "name",
    "description"
  ];

  for (const field of Object.keys(input)) {
    if (!allowedFields.includes(field)) {
      return {
        success: false,
        message:
          `Field "${field}" cannot be updated`
      };
    }
  }

  if (Object.keys(input).length === 0) {
    return {
      success: false,
      message:
        "At least one role field must be provided"
    };
  }

  const result: UpdateRoleInput = {};

  if (input.name !== undefined) {
    if (
      typeof input.name !== "string" ||
      !input.name.trim()
    ) {
      return {
        success: false,
        message:
          "A valid role name is required"
      };
    }

    if (input.name.trim().length > 100) {
      return {
        success: false,
        message:
          "Role name must not exceed 100 characters"
      };
    }

    result.name =
      input.name.trim();
  }

  if (input.description !== undefined) {
    if (input.description === null) {
      result.description = null;
    } else if (
      typeof input.description === "string"
    ) {
      result.description =
        input.description.trim();
    } else {
      return {
        success: false,
        message:
          "Role description must be a string or null"
      };
    }
  }

  return {
    success: true,
    data: result
  };
}