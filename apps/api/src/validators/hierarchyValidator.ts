import {
  OrganizationalUnitAssignmentRole
} from "../../../../packages/database/generated/client/enums.js";

import type {
  CreateOrganizationalUnitAssignmentInput,
  CreateOrganizationalUnitInput,
  CreateOrganizationalUnitTypeInput,
  HierarchyListInput,
  HierarchyTraversalInput,
  UpdateOrganizationalUnitAssignmentInput,
  UpdateOrganizationalUnitInput,
  UpdateOrganizationalUnitTypeInput
} from "../services/hierarchyTypes.js";

export class HierarchyValidationError
  extends Error {
  constructor(
    message: string
  ) {
    super(message);

    this.name =
      "HierarchyValidationError";
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function objectValue(
  value: unknown,
  field =
    "body"
) {
  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new HierarchyValidationError(
      `${field} must be an object.`
    );
  }

  return value as
    Record<
      string,
      unknown
    >;
}

function rejectUnknownFields(
  value:
    Record<
      string,
      unknown
    >,
  fields:
    readonly string[]
) {
  const allowed =
    new Set(
      fields
    );

  const unknown =
    Object.keys(value)
      .filter(
        (key) =>
          !allowed.has(key)
      );

  if (
    unknown.length >
      0
  ) {
    throw new HierarchyValidationError(
      `Unknown field: ${unknown[0]}.`
    );
  }
}

function requiredString(
  value: unknown,
  field: string
) {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new HierarchyValidationError(
      `${field} is required.`
    );
  }

  return value.trim();
}

function optionalNullableString(
  value: unknown,
  field: string
):
  string |
  null |
  undefined {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    value === null
  ) {
    return null;
  }

  if (
    typeof value !==
      "string"
  ) {
    throw new HierarchyValidationError(
      `${field} must be a string or null.`
    );
  }

  return value.trim() ||
    null;
}

function optionalBoolean(
  value: unknown,
  field: string
):
  boolean |
  undefined {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    typeof value !==
      "boolean"
  ) {
    throw new HierarchyValidationError(
      `${field} must be a boolean.`
    );
  }

  return value;
}

function optionalInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number
):
  number |
  undefined {
  if (
    value === undefined
  ) {
    return undefined;
  }

  const parsed =
    typeof value ===
      "string"
      ? Number(value)
      : value;

  if (
    typeof parsed !==
      "number" ||
    !Number.isInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw new HierarchyValidationError(
      `${field} must be an integer between ${minimum} and ${maximum}.`
    );
  }

  return parsed;
}

function uuidValue(
  value: unknown,
  field: string
) {
  if (
    typeof value !==
      "string" ||
    !uuidPattern.test(
      value.trim()
    )
  ) {
    throw new HierarchyValidationError(
      `${field} must be a valid UUID.`
    );
  }

  return value.trim();
}

function optionalNullableUuid(
  value: unknown,
  field: string
):
  string |
  null |
  undefined {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    value === null ||
    value ===
      "null"
  ) {
    return null;
  }

  return uuidValue(
    value,
    field
  );
}

function optionalDate(
  value: unknown,
  field: string
):
  Date |
  null |
  undefined {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    value === null
  ) {
    return null;
  }

  if (
    typeof value !==
      "string"
  ) {
    throw new HierarchyValidationError(
      `${field} must be an ISO date-time string or null.`
    );
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new HierarchyValidationError(
      `${field} must be a valid ISO date-time string.`
    );
  }

  return parsed;
}

function queryBoolean(
  value: unknown,
  field: string
):
  boolean |
  undefined {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    value ===
      "true"
  ) {
    return true;
  }

  if (
    value ===
      "false"
  ) {
    return false;
  }

  throw new HierarchyValidationError(
    `${field} must be true or false.`
  );
}

function requireMutationFields(
  value:
    Record<
      string,
      unknown
    >
) {
  if (
    Object.keys(value).length ===
      0
  ) {
    throw new HierarchyValidationError(
      "At least one update field is required."
    );
  }
}

export function parseHierarchyId(
  value: unknown,
  field =
    "id"
) {
  return uuidValue(
    value,
    field
  );
}

export function parseOrganizationalUnitTypeQuery(
  value: unknown
) {
  const query =
    objectValue(
      value,
      "query"
    );

  rejectUnknownFields(
    query,
    [
      "active",
      "limit"
    ]
  );

  return {
    ...(query.active !==
    undefined
      ? {
          active:
            queryBoolean(
              query.active,
              "active"
            )
        }
      : {}),
    ...(query.limit !==
    undefined
      ? {
          limit:
            optionalInteger(
              query.limit,
              "limit",
              1,
              200
            )
        }
      : {})
  };
}

export function parseCreateOrganizationalUnitType(
  value: unknown
):
  CreateOrganizationalUnitTypeInput {
  const body =
    objectValue(value);

  rejectUnknownFields(
    body,
    [
      "code",
      "name",
      "description",
      "displayOrder",
      "isActive"
    ]
  );

  return {
    code:
      requiredString(
        body.code,
        "code"
      ),
    name:
      requiredString(
        body.name,
        "name"
      ),
    ...(body.description !==
    undefined
      ? {
          description:
            optionalNullableString(
              body.description,
              "description"
            )
        }
      : {}),
    ...(body.displayOrder !==
    undefined
      ? {
          displayOrder:
            optionalInteger(
              body.displayOrder,
              "displayOrder",
              -100000,
              100000
            )
        }
      : {}),
    ...(body.isActive !==
    undefined
      ? {
          isActive:
            optionalBoolean(
              body.isActive,
              "isActive"
            )
        }
      : {})
  };
}

export function parseUpdateOrganizationalUnitType(
  value: unknown
):
  UpdateOrganizationalUnitTypeInput {
  const body =
    objectValue(value);

  rejectUnknownFields(
    body,
    [
      "name",
      "description",
      "displayOrder",
      "isActive"
    ]
  );

  requireMutationFields(
    body
  );

  return {
    ...(body.name !==
    undefined
      ? {
          name:
            requiredString(
              body.name,
              "name"
            )
        }
      : {}),
    ...(body.description !==
    undefined
      ? {
          description:
            optionalNullableString(
              body.description,
              "description"
            )
        }
      : {}),
    ...(body.displayOrder !==
    undefined
      ? {
          displayOrder:
            optionalInteger(
              body.displayOrder,
              "displayOrder",
              -100000,
              100000
            )
        }
      : {}),
    ...(body.isActive !==
    undefined
      ? {
          isActive:
            optionalBoolean(
              body.isActive,
              "isActive"
            )
        }
      : {})
  };
}

export function parseOrganizationalUnitQuery(
  value: unknown
):
  HierarchyListInput {
  const query =
    objectValue(
      value,
      "query"
    );

  rejectUnknownFields(
    query,
    [
      "active",
      "unitTypeId",
      "parentId",
      "limit"
    ]
  );

  return {
    ...(query.active !==
    undefined
      ? {
          active:
            queryBoolean(
              query.active,
              "active"
            )
        }
      : {}),
    ...(query.unitTypeId !==
    undefined
      ? {
          unitTypeId:
            uuidValue(
              query.unitTypeId,
              "unitTypeId"
            )
        }
      : {}),
    ...(query.parentId !==
    undefined
      ? {
          parentId:
            optionalNullableUuid(
              query.parentId,
              "parentId"
            )
        }
      : {}),
    ...(query.limit !==
    undefined
      ? {
          limit:
            optionalInteger(
              query.limit,
              "limit",
              1,
              200
            )
        }
      : {})
  };
}

export function parseCreateOrganizationalUnit(
  value: unknown
):
  CreateOrganizationalUnitInput {
  const body =
    objectValue(value);

  rejectUnknownFields(
    body,
    [
      "unitTypeId",
      "parentId",
      "code",
      "name",
      "description",
      "isActive"
    ]
  );

  return {
    unitTypeId:
      uuidValue(
        body.unitTypeId,
        "unitTypeId"
      ),
    ...(body.parentId !==
    undefined
      ? {
          parentId:
            optionalNullableUuid(
              body.parentId,
              "parentId"
            )
        }
      : {}),
    code:
      requiredString(
        body.code,
        "code"
      ),
    name:
      requiredString(
        body.name,
        "name"
      ),
    ...(body.description !==
    undefined
      ? {
          description:
            optionalNullableString(
              body.description,
              "description"
            )
        }
      : {}),
    ...(body.isActive !==
    undefined
      ? {
          isActive:
            optionalBoolean(
              body.isActive,
              "isActive"
            )
        }
      : {})
  };
}

export function parseUpdateOrganizationalUnit(
  value: unknown
):
  UpdateOrganizationalUnitInput {
  const body =
    objectValue(value);

  rejectUnknownFields(
    body,
    [
      "unitTypeId",
      "parentId",
      "code",
      "name",
      "description",
      "isActive"
    ]
  );

  requireMutationFields(
    body
  );

  return {
    ...(body.unitTypeId !==
    undefined
      ? {
          unitTypeId:
            uuidValue(
              body.unitTypeId,
              "unitTypeId"
            )
        }
      : {}),
    ...(body.parentId !==
    undefined
      ? {
          parentId:
            optionalNullableUuid(
              body.parentId,
              "parentId"
            )
        }
      : {}),
    ...(body.code !==
    undefined
      ? {
          code:
            requiredString(
              body.code,
              "code"
            )
        }
      : {}),
    ...(body.name !==
    undefined
      ? {
          name:
            requiredString(
              body.name,
              "name"
            )
        }
      : {}),
    ...(body.description !==
    undefined
      ? {
          description:
            optionalNullableString(
              body.description,
              "description"
            )
        }
      : {}),
    ...(body.isActive !==
    undefined
      ? {
          isActive:
            optionalBoolean(
              body.isActive,
              "isActive"
            )
        }
      : {})
  };
}

export function parseHierarchyTraversalQuery(
  value: unknown
):
  HierarchyTraversalInput {
  const query =
    objectValue(
      value,
      "query"
    );

  rejectUnknownFields(
    query,
    [
      "maxDepth",
      "limit"
    ]
  );

  return {
    ...(query.maxDepth !==
    undefined
      ? {
          maxDepth:
            optionalInteger(
              query.maxDepth,
              "maxDepth",
              1,
              32
            )
        }
      : {}),
    ...(query.limit !==
    undefined
      ? {
          limit:
            optionalInteger(
              query.limit,
              "limit",
              1,
              200
            )
        }
      : {})
  };
}

export function parseAssignmentQuery(
  value: unknown
) {
  const query =
    objectValue(
      value,
      "query"
    );

  rejectUnknownFields(
    query,
    [
      "active",
      "limit"
    ]
  );

  return {
    ...(query.active !==
    undefined
      ? {
          active:
            queryBoolean(
              query.active,
              "active"
            )
        }
      : {}),
    ...(query.limit !==
    undefined
      ? {
          limit:
            optionalInteger(
              query.limit,
              "limit",
              1,
              200
            )
        }
      : {})
  };
}

function assignmentRole(
  value: unknown
) {
  if (
    typeof value !==
      "string" ||
    !Object.values(
      OrganizationalUnitAssignmentRole
    ).includes(
      value as
        OrganizationalUnitAssignmentRole
    )
  ) {
    throw new HierarchyValidationError(
      "assignmentRole is invalid."
    );
  }

  return value as
    OrganizationalUnitAssignmentRole;
}

export function parseCreateOrganizationalUnitAssignment(
  value: unknown
):
  CreateOrganizationalUnitAssignmentInput {
  const body =
    objectValue(value);

  rejectUnknownFields(
    body,
    [
      "organizationalUnitId",
      "organizationUserId",
      "assignmentRole",
      "isPrimary",
      "responsibilityLabel",
      "effectiveStart",
      "effectiveEnd"
    ]
  );

  return {
    organizationalUnitId:
      uuidValue(
        body.organizationalUnitId,
        "organizationalUnitId"
      ),
    organizationUserId:
      uuidValue(
        body.organizationUserId,
        "organizationUserId"
      ),
    assignmentRole:
      assignmentRole(
        body.assignmentRole
      ),
    ...(body.isPrimary !==
    undefined
      ? {
          isPrimary:
            optionalBoolean(
              body.isPrimary,
              "isPrimary"
            )
        }
      : {}),
    ...(body.responsibilityLabel !==
    undefined
      ? {
          responsibilityLabel:
            optionalNullableString(
              body.responsibilityLabel,
              "responsibilityLabel"
            )
        }
      : {}),
    ...(body.effectiveStart !==
    undefined
      ? {
          effectiveStart:
            optionalDate(
              body.effectiveStart,
              "effectiveStart"
            )
        }
      : {}),
    ...(body.effectiveEnd !==
    undefined
      ? {
          effectiveEnd:
            optionalDate(
              body.effectiveEnd,
              "effectiveEnd"
            )
        }
      : {})
  };
}

export function parseUpdateOrganizationalUnitAssignment(
  value: unknown
):
  UpdateOrganizationalUnitAssignmentInput {
  const body =
    objectValue(value);

  rejectUnknownFields(
    body,
    [
      "assignmentRole",
      "isPrimary",
      "isActive",
      "responsibilityLabel",
      "effectiveStart",
      "effectiveEnd"
    ]
  );

  requireMutationFields(
    body
  );

  return {
    ...(body.assignmentRole !==
    undefined
      ? {
          assignmentRole:
            assignmentRole(
              body.assignmentRole
            )
        }
      : {}),
    ...(body.isPrimary !==
    undefined
      ? {
          isPrimary:
            optionalBoolean(
              body.isPrimary,
              "isPrimary"
            )
        }
      : {}),
    ...(body.isActive !==
    undefined
      ? {
          isActive:
            optionalBoolean(
              body.isActive,
              "isActive"
            )
        }
      : {}),
    ...(body.responsibilityLabel !==
    undefined
      ? {
          responsibilityLabel:
            optionalNullableString(
              body.responsibilityLabel,
              "responsibilityLabel"
            )
        }
      : {}),
    ...(body.effectiveStart !==
    undefined
      ? {
          effectiveStart:
            optionalDate(
              body.effectiveStart,
              "effectiveStart"
            )
        }
      : {}),
    ...(body.effectiveEnd !==
    undefined
      ? {
          effectiveEnd:
            optionalDate(
              body.effectiveEnd,
              "effectiveEnd"
            )
        }
      : {})
  };
}
