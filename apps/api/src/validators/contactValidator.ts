export type ContactType =
  | "MEMBER"
  | "CUSTOMER"
  | "EMPLOYEE"
  | "SUPPLIER"
  | "VOLUNTEER"
  | "DONOR"
  | "PARTNER"
  | "OTHER";

export type ContactStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

export type CreateContactInput = {
  contactType: ContactType;
  branchId?: string | null;
  departmentId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  organizationName?: string | null;
  email?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  nationalId?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  city?: string | null;
  countyState?: string | null;
  country?: string | null;
  status?: ContactStatus;
};

export type UpdateContactInput = {
  contactType?: ContactType;
  branchId?: string | null;
  departmentId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  organizationName?: string | null;
  email?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  nationalId?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  city?: string | null;
  countyState?: string | null;
  country?: string | null;
  status?: ContactStatus;
};

export type ContactFilters = {
  contactType?: ContactType;
  status?: ContactStatus;
  branchId?: string;
  departmentId?: string;
  search?: string;
};

const CONTACT_TYPES = new Set<ContactType>([
  "MEMBER",
  "CUSTOMER",
  "EMPLOYEE",
  "SUPPLIER",
  "VOLUNTEER",
  "DONOR",
  "PARTNER",
  "OTHER"
]);

const CONTACT_STATUSES = new Set<ContactStatus>([
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED"
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CREATE_FIELDS = new Set([
  "contactType",
  "branchId",
  "departmentId",
  "firstName",
  "lastName",
  "organizationName",
  "email",
  "phone",
  "secondaryPhone",
  "nationalId",
  "dateOfBirth",
  "address",
  "city",
  "countyState",
  "country",
  "status"
]);

const UPDATE_FIELDS = CREATE_FIELDS;

export function isValidContactId(
  value: string
) {
  return UUID_PATTERN.test(value);
}

function optionalString(
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

function optionalUuid(
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
    !UUID_PATTERN.test(value)
  ) {
    return {
      success: false,
      message:
        `A valid ${fieldName} ID is required`
    };
  }

  return {
    success: true,
    value
  };
}

function optionalDateOfBirth(
  value: unknown
):
  | {
      success: true;
      value?: Date | null;
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
    typeof value !== "string" &&
    !(value instanceof Date)
  ) {
    return {
      success: false,
      message:
        "Invalid date of birth"
    };
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      success: false,
      message:
        "Invalid date of birth"
    };
  }

  return {
    success: true,
    value: date
  };
}

function hasIdentity(
  data: {
    firstName?: string | null;
    lastName?: string | null;
    organizationName?: string | null;
  }
) {
  return Boolean(
    data.firstName ||
    data.lastName ||
    data.organizationName
  );
}

export function validateContactCreate(
  body: unknown
):
  | {
      success: true;
      data: CreateContactInput;
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

  for (const field of Object.keys(input)) {
    if (!CREATE_FIELDS.has(field)) {
      return {
        success: false,
        message:
          `Field "${field}" is not allowed`
      };
    }
  }

  if (
    typeof input.contactType !== "string" ||
    !CONTACT_TYPES.has(
      input.contactType as ContactType
    )
  ) {
    return {
      success: false,
      message:
        "A valid contact type is required"
    };
  }

  const result: CreateContactInput = {
    contactType:
      input.contactType as ContactType
  };

  const stringFields = [
    "firstName",
    "lastName",
    "organizationName",
    "email",
    "phone",
    "secondaryPhone",
    "nationalId",
    "address",
    "city",
    "countyState",
    "country"
  ] as const;

  for (const field of stringFields) {
    const normalized =
      optionalString(
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
    optionalUuid(
      input.branchId,
      "branch"
    );

  if (!branch.success) {
    return branch;
  }

  if (branch.value !== undefined) {
    result.branchId =
      branch.value;
  }

  const department =
    optionalUuid(
      input.departmentId,
      "department"
    );

  if (!department.success) {
    return department;
  }

  if (department.value !== undefined) {
    result.departmentId =
      department.value;
  }

  const dateOfBirth =
    optionalDateOfBirth(
      input.dateOfBirth
    );

  if (!dateOfBirth.success) {
    return dateOfBirth;
  }

  if (dateOfBirth.value !== undefined) {
    result.dateOfBirth =
      dateOfBirth.value;
  }

  if (input.status !== undefined) {
    if (
      typeof input.status !== "string" ||
      !CONTACT_STATUSES.has(
        input.status as ContactStatus
      )
    ) {
      return {
        success: false,
        message:
          "A valid contact status is required"
      };
    }

    result.status =
      input.status as ContactStatus;
  }

  if (!hasIdentity(result)) {
    return {
      success: false,
      message:
        "A contact must have a person name or organization name"
    };
  }

  return {
    success: true,
    data: result
  };
}

export function validateContactUpdate(
  body: unknown
):
  | {
      success: true;
      data: UpdateContactInput;
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

  const keys =
    Object.keys(input);

  if (keys.length === 0) {
    return {
      success: false,
      message:
        "At least one contact field must be provided"
    };
  }

  for (const field of keys) {
    if (!UPDATE_FIELDS.has(field)) {
      return {
        success: false,
        message:
          `Field "${field}" is not allowed`
      };
    }
  }

  const result: UpdateContactInput = {};

  if (input.contactType !== undefined) {
    if (
      typeof input.contactType !== "string" ||
      !CONTACT_TYPES.has(
        input.contactType as ContactType
      )
    ) {
      return {
        success: false,
        message:
          "A valid contact type is required"
      };
    }

    result.contactType =
      input.contactType as ContactType;
  }

  const stringFields = [
    "firstName",
    "lastName",
    "organizationName",
    "email",
    "phone",
    "secondaryPhone",
    "nationalId",
    "address",
    "city",
    "countyState",
    "country"
  ] as const;

  for (const field of stringFields) {
    const normalized =
      optionalString(
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
    optionalUuid(
      input.branchId,
      "branch"
    );

  if (!branch.success) {
    return branch;
  }

  if (branch.value !== undefined) {
    result.branchId =
      branch.value;
  }

  const department =
    optionalUuid(
      input.departmentId,
      "department"
    );

  if (!department.success) {
    return department;
  }

  if (department.value !== undefined) {
    result.departmentId =
      department.value;
  }

  const dateOfBirth =
    optionalDateOfBirth(
      input.dateOfBirth
    );

  if (!dateOfBirth.success) {
    return dateOfBirth;
  }

  if (dateOfBirth.value !== undefined) {
    result.dateOfBirth =
      dateOfBirth.value;
  }

  if (input.status !== undefined) {
    if (
      typeof input.status !== "string" ||
      !CONTACT_STATUSES.has(
        input.status as ContactStatus
      )
    ) {
      return {
        success: false,
        message:
          "A valid contact status is required"
      };
    }

    result.status =
      input.status as ContactStatus;
  }

  return {
    success: true,
    data: result
  };
}

export function validateContactFilters(
  query: Record<string, unknown>
):
  | {
      success: true;
      data: ContactFilters;
    }
  | {
      success: false;
      message: string;
    } {
  const allowed =
    new Set([
      "contactType",
      "status",
      "branchId",
      "departmentId",
      "search"
    ]);

  for (const field of Object.keys(query)) {
    if (!allowed.has(field)) {
      return {
        success: false,
        message:
          `Query field "${field}" is not allowed`
      };
    }
  }

  const result: ContactFilters = {};

  if (query.contactType !== undefined) {
    if (
      typeof query.contactType !== "string" ||
      !CONTACT_TYPES.has(
        query.contactType as ContactType
      )
    ) {
      return {
        success: false,
        message:
          "A valid contact type is required"
      };
    }

    result.contactType =
      query.contactType as ContactType;
  }

  if (query.status !== undefined) {
    if (
      typeof query.status !== "string" ||
      !CONTACT_STATUSES.has(
        query.status as ContactStatus
      )
    ) {
      return {
        success: false,
        message:
          "A valid contact status is required"
      };
    }

    result.status =
      query.status as ContactStatus;
  }

  if (query.branchId !== undefined) {
    if (
      typeof query.branchId !== "string" ||
      !UUID_PATTERN.test(query.branchId)
    ) {
      return {
        success: false,
        message:
          "A valid branch ID is required"
      };
    }

    result.branchId =
      query.branchId;
  }

  if (query.departmentId !== undefined) {
    if (
      typeof query.departmentId !== "string" ||
      !UUID_PATTERN.test(
        query.departmentId
      )
    ) {
      return {
        success: false,
        message:
          "A valid department ID is required"
      };
    }

    result.departmentId =
      query.departmentId;
  }

  if (query.search !== undefined) {
    if (
      typeof query.search !== "string"
    ) {
      return {
        success: false,
        message:
          "Search must be a string"
      };
    }

    const search =
      query.search.trim();

    if (search) {
      result.search =
        search;
    }
  }

  return {
    success: true,
    data: result
  };
}