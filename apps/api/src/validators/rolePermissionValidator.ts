export type CreateRolePermissionInput = {
  roleId: string;
  permissionId: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateRolePermissionCreate(
  body: unknown
):
  | {
      success: true;
      data: CreateRolePermissionInput;
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
    "roleId",
    "permissionId"
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
    typeof input.roleId !== "string" ||
    !uuidPattern.test(input.roleId)
  ) {
    return {
      success: false,
      message: "A valid role ID is required"
    };
  }

  if (
    typeof input.permissionId !== "string" ||
    !uuidPattern.test(input.permissionId)
  ) {
    return {
      success: false,
      message:
        "A valid permission ID is required"
    };
  }

  return {
    success: true,
    data: {
      roleId:
        input.roleId,
      permissionId:
        input.permissionId
    }
  };
}