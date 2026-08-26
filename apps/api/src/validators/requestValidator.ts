export const REQUEST_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "IN_FULFILMENT",
  "COMPLETED",
  "CANCELLED"
] as const;

export const REQUEST_PRIORITIES = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
  "CRITICAL"
] as const;

export type RequestStatus =
  (typeof REQUEST_STATUSES)[number];

export type RequestPriority =
  (typeof REQUEST_PRIORITIES)[number];

export type CreateRequestTypeInput = {
  name: string;
  code: string;
  description?: string | null | undefined;
  formSchema?: unknown | null | undefined;
  defaultPriority?: RequestPriority | undefined;
  defaultAssigneeOrganizationUserId?: string | null | undefined;
  defaultDepartmentId?: string | null | undefined;
  isActive?: boolean | undefined;
};

export type UpdateRequestTypeInput =
  Partial<CreateRequestTypeInput>;

export type CreateRequestInput = {
  requestTypeId: string;
  title: string;
  description?: string | null | undefined;
  formData?: unknown | null | undefined;
  priority?: RequestPriority | undefined;
  assignedToOrganizationUserId?: string | null | undefined;
  branchId?: string | null | undefined;
  departmentId?: string | null | undefined;
  contactId?: string | null | undefined;
  dueAt?: Date | null | undefined;
  submit?: boolean | undefined;
};

export type UpdateRequestInput = {
  title?: string;
  description?: string | null | undefined;
  formData?: unknown | null | undefined;
  branchId?: string | null | undefined;
  departmentId?: string | null | undefined;
  contactId?: string | null | undefined;
  dueAt?: Date | null | undefined;
};

export type AssignRequestInput = {
  assignedToOrganizationUserId: string | null;
};

export type ChangeRequestPriorityInput = {
  priority: RequestPriority;
};

export type ChangeRequestStatusInput = {
  status: RequestStatus;
};

export type AddRequestCommentInput = {
  body: string;
};

export type AttachRequestDocumentInput = {
  documentId: string;
};

export type RequestListQuery = {
  status?: RequestStatus;
  priority?: RequestPriority | undefined;
  requestTypeId?: string;
  requesterOrganizationUserId?: string;
  assignedToOrganizationUserId?: string;
  branchId?: string;
  departmentId?: string;
  contactId?: string;
  search?: string;
  page: number;
  limit: number;
};

export class RequestValidationError
  extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isString(
  value: unknown
): value is string {
  return typeof value === "string";
}

function normalizeNullableString(
  value: unknown,
  field: string
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!isString(value)) {
    throw new RequestValidationError(
      `${field} must be a string or null`
    );
  }

  return value.trim();
}

function normalizeOptionalUuid(
  value: unknown,
  field: string
): string | null | undefined {
  const normalized =
    normalizeNullableString(
      value,
      field
    );

  if (
    normalized !== undefined &&
    normalized !== null &&
    !normalized
  ) {
    throw new RequestValidationError(
      `${field} must not be empty`
    );
  }

  return normalized;
}

function normalizeDate(
  value: unknown,
  field: string
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (!isString(value)) {
    throw new RequestValidationError(
      `${field} must be a timestamp or null`
    );
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new RequestValidationError(
      `${field} must be a valid timestamp or null`
    );
  }

  return parsed;
}

function normalizePriority(
  value: unknown
): RequestPriority | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    !REQUEST_PRIORITIES.includes(
      value as RequestPriority
    )
  ) {
    throw new RequestValidationError(
      "Invalid request priority"
    );
  }

  return value as RequestPriority;
}

function requireBody(
  body: unknown
) {
  if (!isObject(body)) {
    throw new RequestValidationError(
      "Request body is required"
    );
  }

  return body;
}

export function parseCreateRequestTypeBody(
  body: unknown
): CreateRequestTypeInput {
  const input =
    requireBody(body);

  if (
    !isString(input.name) ||
    !input.name.trim()
  ) {
    throw new RequestValidationError(
      "name is required"
    );
  }

  if (
    input.name.trim().length > 120
  ) {
    throw new RequestValidationError(
      "name must not exceed 120 characters"
    );
  }

  if (
    !isString(input.code) ||
    !input.code.trim()
  ) {
    throw new RequestValidationError(
      "code is required"
    );
  }

  if (
    input.code.trim().length > 50
  ) {
    throw new RequestValidationError(
      "code must not exceed 50 characters"
    );
  }

  const description =
    normalizeNullableString(
      input.description,
      "description"
    );

  if (
    description &&
    description.length > 2000
  ) {
    throw new RequestValidationError(
      "description must not exceed 2000 characters"
    );
  }

  const priority =
    normalizePriority(
      input.defaultPriority
    );

  if (
    input.isActive !== undefined &&
    typeof input.isActive !== "boolean"
  ) {
    throw new RequestValidationError(
      "isActive must be boolean"
    );
  }

  return {
    name:
      input.name.trim(),

    code:
      input.code
        .trim()
        .toUpperCase(),

    ...(description !== undefined
      ? { description }
      : {}),

    ...(input.formSchema !== undefined
      ? {
          formSchema:
            input.formSchema
        }
      : {}),

    ...(priority !== undefined
      ? {
          defaultPriority:
            priority
        }
      : {}),

    ...(input.defaultAssigneeOrganizationUserId !==
    undefined
      ? {
          defaultAssigneeOrganizationUserId:
            normalizeOptionalUuid(
              input.defaultAssigneeOrganizationUserId,
              "defaultAssigneeOrganizationUserId"
            )
        }
      : {}),

    ...(input.defaultDepartmentId !== undefined
      ? {
          defaultDepartmentId:
            normalizeOptionalUuid(
              input.defaultDepartmentId,
              "defaultDepartmentId"
            )
        }
      : {}),

    ...(input.isActive !== undefined
      ? {
          isActive:
            input.isActive
        }
      : {})
  };
}

export function parseUpdateRequestTypeBody(
  body: unknown
): UpdateRequestTypeInput {
  const input =
    requireBody(body);

  if (
    Object.keys(input).length === 0
  ) {
    throw new RequestValidationError(
      "At least one field must be supplied"
    );
  }

  const output:
    UpdateRequestTypeInput = {};

  if (input.name !== undefined) {
    if (
      !isString(input.name) ||
      !input.name.trim()
    ) {
      throw new RequestValidationError(
        "name must not be empty"
      );
    }

    output.name =
      input.name.trim();
  }

  if (input.code !== undefined) {
    if (
      !isString(input.code) ||
      !input.code.trim()
    ) {
      throw new RequestValidationError(
        "code must not be empty"
      );
    }

    output.code =
      input.code
        .trim()
        .toUpperCase();
  }

  if (input.description !== undefined) {
    output.description =
      normalizeNullableString(
        input.description,
        "description"
      );
  }

  if (input.formSchema !== undefined) {
    output.formSchema =
      input.formSchema;
  }

  if (input.defaultPriority !== undefined) {
    output.defaultPriority =
      normalizePriority(
        input.defaultPriority
      );
  }

  if (
    input.defaultAssigneeOrganizationUserId !==
    undefined
  ) {
    output.defaultAssigneeOrganizationUserId =
      normalizeOptionalUuid(
        input.defaultAssigneeOrganizationUserId,
        "defaultAssigneeOrganizationUserId"
      );
  }

  if (input.defaultDepartmentId !== undefined) {
    output.defaultDepartmentId =
      normalizeOptionalUuid(
        input.defaultDepartmentId,
        "defaultDepartmentId"
      );
  }

  if (input.isActive !== undefined) {
    if (
      typeof input.isActive !==
      "boolean"
    ) {
      throw new RequestValidationError(
        "isActive must be boolean"
      );
    }

    output.isActive =
      input.isActive;
  }

  return output;
}

export function parseCreateRequestBody(
  body: unknown
): CreateRequestInput {
  const input =
    requireBody(body);

  if (
    !isString(input.requestTypeId) ||
    !input.requestTypeId.trim()
  ) {
    throw new RequestValidationError(
      "requestTypeId is required"
    );
  }

  if (
    !isString(input.title) ||
    !input.title.trim()
  ) {
    throw new RequestValidationError(
      "title is required"
    );
  }

  if (
    input.title.trim().length > 255
  ) {
    throw new RequestValidationError(
      "title must not exceed 255 characters"
    );
  }

  const description =
    normalizeNullableString(
      input.description,
      "description"
    );

  if (
    description &&
    description.length > 10000
  ) {
    throw new RequestValidationError(
      "description must not exceed 10000 characters"
    );
  }

  if (
    input.submit !== undefined &&
    typeof input.submit !== "boolean"
  ) {
    throw new RequestValidationError(
      "submit must be boolean"
    );
  }

  const result:
    CreateRequestInput = {
      requestTypeId:
        input.requestTypeId.trim(),

      title:
        input.title.trim(),

      submit:
        input.submit === true
    };

  if (description !== undefined) {
    result.description =
      description;
  }

  if (input.formData !== undefined) {
    result.formData =
      input.formData;
  }

  const priority =
    normalizePriority(
      input.priority
    );

  if (priority !== undefined) {
    result.priority =
      priority;
  }

  const optionalIds = [
    [
      "assignedToOrganizationUserId",
      input.assignedToOrganizationUserId
    ],
    [
      "branchId",
      input.branchId
    ],
    [
      "departmentId",
      input.departmentId
    ],
    [
      "contactId",
      input.contactId
    ]
  ] as const;

  for (
    const [
      field,
      value
    ] of optionalIds
  ) {
    if (value !== undefined) {
      result[field] =
        normalizeOptionalUuid(
          value,
          field
        ) as any;
    }
  }

  const dueAt =
    normalizeDate(
      input.dueAt,
      "dueAt"
    );

  if (dueAt !== undefined) {
    result.dueAt =
      dueAt;
  }

  return result;
}

export function parseUpdateRequestBody(
  body: unknown
): UpdateRequestInput {
  const input =
    requireBody(body);

  if (
    Object.keys(input).length === 0
  ) {
    throw new RequestValidationError(
      "At least one field must be supplied"
    );
  }

  const output:
    UpdateRequestInput = {};

  if (input.title !== undefined) {
    if (
      !isString(input.title) ||
      !input.title.trim()
    ) {
      throw new RequestValidationError(
        "title must not be empty"
      );
    }

    output.title =
      input.title.trim();
  }

  if (input.description !== undefined) {
    output.description =
      normalizeNullableString(
        input.description,
        "description"
      );
  }

  if (input.formData !== undefined) {
    output.formData =
      input.formData;
  }

  const optionalIds = [
    [
      "branchId",
      input.branchId
    ],
    [
      "departmentId",
      input.departmentId
    ],
    [
      "contactId",
      input.contactId
    ]
  ] as const;

  for (
    const [
      field,
      value
    ] of optionalIds
  ) {
    if (value !== undefined) {
      output[field] =
        normalizeOptionalUuid(
          value,
          field
        ) as any;
    }
  }

  const dueAt =
    normalizeDate(
      input.dueAt,
      "dueAt"
    );

  if (dueAt !== undefined) {
    output.dueAt =
      dueAt;
  }

  return output;
}

export function parseAssignmentBody(
  body: unknown
): AssignRequestInput {
  const input =
    requireBody(body);

  if (
    input.assignedToOrganizationUserId ===
    undefined
  ) {
    throw new RequestValidationError(
      "assignedToOrganizationUserId is required"
    );
  }

  return {
    assignedToOrganizationUserId:
      normalizeOptionalUuid(
        input.assignedToOrganizationUserId,
        "assignedToOrganizationUserId"
      ) ?? null
  };
}

export function parsePriorityBody(
  body: unknown
): ChangeRequestPriorityInput {
  const input =
    requireBody(body);

  const priority =
    normalizePriority(
      input.priority
    );

  if (!priority) {
    throw new RequestValidationError(
      "priority is required"
    );
  }

  return {
    priority
  };
}

export function parseStatusBody(
  body: unknown
): ChangeRequestStatusInput {
  const input =
    requireBody(body);

  if (
    !REQUEST_STATUSES.includes(
      input.status as RequestStatus
    )
  ) {
    throw new RequestValidationError(
      "Invalid request status"
    );
  }

  return {
    status:
      input.status as RequestStatus
  };
}

export function parseCommentBody(
  body: unknown
): AddRequestCommentInput {
  const input =
    requireBody(body);

  if (
    !isString(input.body) ||
    !input.body.trim()
  ) {
    throw new RequestValidationError(
      "Comment body is required"
    );
  }

  if (
    input.body.trim().length > 10000
  ) {
    throw new RequestValidationError(
      "Comment must not exceed 10000 characters"
    );
  }

  return {
    body:
      input.body.trim()
  };
}

export function parseAttachmentBody(
  body: unknown
): AttachRequestDocumentInput {
  const input =
    requireBody(body);

  if (
    !isString(input.documentId) ||
    !input.documentId.trim()
  ) {
    throw new RequestValidationError(
      "documentId is required"
    );
  }

  return {
    documentId:
      input.documentId.trim()
  };
}

export function parseRequestListQuery(
  query: Record<string, unknown>
): RequestListQuery {
  const pageRaw =
    typeof query.page === "string"
      ? Number(query.page)
      : 1;

  const limitRaw =
    typeof query.limit === "string"
      ? Number(query.limit)
      : 25;

  const page =
    Number.isInteger(pageRaw) &&
    pageRaw > 0
      ? pageRaw
      : 1;

  const limit =
    Number.isInteger(limitRaw) &&
    limitRaw > 0 &&
    limitRaw <= 100
      ? limitRaw
      : 25;

  const output:
    RequestListQuery = {
      page,
      limit
    };

  if (query.status !== undefined) {
    if (
      !REQUEST_STATUSES.includes(
        query.status as RequestStatus
      )
    ) {
      throw new RequestValidationError(
        "Invalid request status"
      );
    }

    output.status =
      query.status as RequestStatus;
  }

  if (query.priority !== undefined) {
    const priority =
      normalizePriority(
        query.priority
      );

    if (priority) {
      output.priority =
        priority;
    }
  }

  const idFields = [
    "requestTypeId",
    "requesterOrganizationUserId",
    "assignedToOrganizationUserId",
    "branchId",
    "departmentId",
    "contactId"
  ] as const;

  for (const field of idFields) {
    const value =
      query[field];

    if (value !== undefined) {
      if (
        !isString(value) ||
        !value.trim()
      ) {
        throw new RequestValidationError(
          `${field} must be a string`
        );
      }

      output[field] =
        value.trim();
    }
  }

  if (query.search !== undefined) {
    if (
      !isString(query.search)
    ) {
      throw new RequestValidationError(
        "search must be a string"
      );
    }

    output.search =
      query.search.trim();
  }

  return output;
}