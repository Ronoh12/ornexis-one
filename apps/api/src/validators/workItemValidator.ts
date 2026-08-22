export const WORK_ITEM_STATUSES = [
  "DRAFT",
  "OPEN",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED"
] as const;

export const WORK_ITEM_PRIORITIES = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
  "CRITICAL"
] as const;

export type WorkItemStatus =
  (typeof WORK_ITEM_STATUSES)[number];

export type WorkItemPriority =
  (typeof WORK_ITEM_PRIORITIES)[number];

export type CreateWorkItemBody = {
  title: string;
  description?: string | null;
  priority?: WorkItemPriority;
  status?: "DRAFT" | "OPEN";
  dueAt?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  contactId?: string | null;
  ownerOrganizationUserId?: string | null;
  assigneeOrganizationUserId?: string | null;
};

export type UpdateWorkItemBody = {
  title?: string;
  description?: string | null;
  priority?: WorkItemPriority;
  dueAt?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  contactId?: string | null;
};

export type AssignmentBody = {
  ownerOrganizationUserId?: string | null;
  assigneeOrganizationUserId?: string | null;
};

export type StatusBody = {
  status: WorkItemStatus;
};

export class WorkItemValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkItemValidationError";
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function validateNullableString(
  value: unknown,
  field: string
) {
  if (
    value !== undefined &&
    value !== null &&
    !isString(value)
  ) {
    throw new WorkItemValidationError(
      `${field} must be a string or null`
    );
  }
}

function validateTimestamp(
  value: unknown,
  field: string
) {
  if (
    value !== undefined &&
    value !== null &&
    (
      !isString(value) ||
      Number.isNaN(Date.parse(value))
    )
  ) {
    throw new WorkItemValidationError(
      `${field} must be a valid timestamp or null`
    );
  }
}

export function parseCreateWorkItemBody(
  body: unknown
): CreateWorkItemBody {
  if (!body || typeof body !== "object") {
    throw new WorkItemValidationError(
      "Request body is required"
    );
  }

  const input =
    body as Record<string, unknown>;

  if (
    !isString(input.title) ||
    !input.title.trim()
  ) {
    throw new WorkItemValidationError(
      "title is required"
    );
  }

  const title =
    input.title.trim();

  if (title.length > 250) {
    throw new WorkItemValidationError(
      "title must not exceed 250 characters"
    );
  }

  validateNullableString(
    input.description,
    "description"
  );

  if (
    isString(input.description) &&
    input.description.length > 10000
  ) {
    throw new WorkItemValidationError(
      "description must not exceed 10000 characters"
    );
  }

  if (
    input.priority !== undefined &&
    !WORK_ITEM_PRIORITIES.includes(
      input.priority as WorkItemPriority
    )
  ) {
    throw new WorkItemValidationError(
      "Invalid priority"
    );
  }

  if (
    input.status !== undefined &&
    input.status !== "DRAFT" &&
    input.status !== "OPEN"
  ) {
    throw new WorkItemValidationError(
      "New work items may only start as DRAFT or OPEN"
    );
  }

  validateNullableString(
    input.branchId,
    "branchId"
  );

  validateNullableString(
    input.departmentId,
    "departmentId"
  );

  validateNullableString(
    input.contactId,
    "contactId"
  );

  validateNullableString(
    input.ownerOrganizationUserId,
    "ownerOrganizationUserId"
  );

  validateNullableString(
    input.assigneeOrganizationUserId,
    "assigneeOrganizationUserId"
  );

  validateTimestamp(
    input.dueAt,
    "dueAt"
  );

  const result:
    CreateWorkItemBody = {
      title
    };

  if (input.description !== undefined) {
    result.description =
      input.description === null
        ? null
        : String(input.description);
  }

  if (input.priority !== undefined) {
    result.priority =
      input.priority as WorkItemPriority;
  }

  if (input.status !== undefined) {
    result.status =
      input.status as "DRAFT" | "OPEN";
  }

  if (input.dueAt !== undefined) {
    result.dueAt =
      input.dueAt as string | null;
  }

  if (input.branchId !== undefined) {
    result.branchId =
      input.branchId as string | null;
  }

  if (input.departmentId !== undefined) {
    result.departmentId =
      input.departmentId as string | null;
  }

  if (input.contactId !== undefined) {
    result.contactId =
      input.contactId as string | null;
  }

  if (
    input.ownerOrganizationUserId
      !== undefined
  ) {
    result.ownerOrganizationUserId =
      input.ownerOrganizationUserId as
        string | null;
  }

  if (
    input.assigneeOrganizationUserId
      !== undefined
  ) {
    result.assigneeOrganizationUserId =
      input.assigneeOrganizationUserId as
        string | null;
  }

  return result;
}
export function parseUpdateWorkItemBody(
  body: unknown
): UpdateWorkItemBody {
  if (!body || typeof body !== "object") {
    throw new WorkItemValidationError(
      "Request body is required"
    );
  }

  const input = body as Record<string, unknown>;
  const output: UpdateWorkItemBody = {};

  if (input.title !== undefined) {
    if (
      !isString(input.title) ||
      !input.title.trim()
    ) {
      throw new WorkItemValidationError(
        "title must not be empty"
      );
    }

    if (input.title.trim().length > 250) {
      throw new WorkItemValidationError(
        "title must not exceed 250 characters"
      );
    }

    output.title = input.title.trim();
  }

  if (input.description !== undefined) {
    validateNullableString(
      input.description,
      "description"
    );

    if (
      isString(input.description) &&
      input.description.length > 10000
    ) {
      throw new WorkItemValidationError(
        "description must not exceed 10000 characters"
      );
    }

    output.description =
      input.description === null
        ? null
        : String(input.description);
  }

  if (input.priority !== undefined) {
    if (
      !WORK_ITEM_PRIORITIES.includes(
        input.priority as WorkItemPriority
      )
    ) {
      throw new WorkItemValidationError(
        "Invalid priority"
      );
    }

    output.priority =
      input.priority as WorkItemPriority;
  }

  if (input.dueAt !== undefined) {
    validateTimestamp(
      input.dueAt,
      "dueAt"
    );

    output.dueAt =
      input.dueAt as string | null;
  }

  if (input.branchId !== undefined) {
    validateNullableString(
      input.branchId,
      "branchId"
    );

    output.branchId =
      input.branchId as string | null;
  }

  if (input.departmentId !== undefined) {
    validateNullableString(
      input.departmentId,
      "departmentId"
    );

    output.departmentId =
      input.departmentId as string | null;
  }

  if (input.contactId !== undefined) {
    validateNullableString(
      input.contactId,
      "contactId"
    );

    output.contactId =
      input.contactId as string | null;
  }

  return output;
}

export function parseAssignmentBody(
  body: unknown
): AssignmentBody {
  if (!body || typeof body !== "object") {
    throw new WorkItemValidationError(
      "Request body is required"
    );
  }

  const input =
    body as Record<string, unknown>;

  validateNullableString(
    input.ownerOrganizationUserId,
    "ownerOrganizationUserId"
  );

  validateNullableString(
    input.assigneeOrganizationUserId,
    "assigneeOrganizationUserId"
  );

  if (
    input.ownerOrganizationUserId === undefined &&
    input.assigneeOrganizationUserId === undefined
  ) {
    throw new WorkItemValidationError(
      "At least one assignment field is required"
    );
  }

  const result:
    AssignmentBody = {};

  if (
    input.ownerOrganizationUserId
      !== undefined
  ) {
    result.ownerOrganizationUserId =
      input.ownerOrganizationUserId as
        string | null;
  }

  if (
    input.assigneeOrganizationUserId
      !== undefined
  ) {
    result.assigneeOrganizationUserId =
      input.assigneeOrganizationUserId as
        string | null;
  }

  return result;
}
export function parseStatusBody(
  body: unknown
): StatusBody {
  if (!body || typeof body !== "object") {
    throw new WorkItemValidationError(
      "Request body is required"
    );
  }

  const status =
    (body as Record<string, unknown>).status;

  if (
    !WORK_ITEM_STATUSES.includes(
      status as WorkItemStatus
    )
  ) {
    throw new WorkItemValidationError(
      "Invalid work item status"
    );
  }

  return {
    status: status as WorkItemStatus
  };
}

export function parseCommentBody(
  body: unknown
) {
  if (!body || typeof body !== "object") {
    throw new WorkItemValidationError(
      "Request body is required"
    );
  }

  const value =
    (body as Record<string, unknown>).body;

  if (
    !isString(value) ||
    !value.trim()
  ) {
    throw new WorkItemValidationError(
      "Comment body is required"
    );
  }

  if (value.trim().length > 10000) {
    throw new WorkItemValidationError(
      "Comment must not exceed 10000 characters"
    );
  }

  return {
    body: value.trim()
  };
}

export function parseAttachmentBody(
  body: unknown
) {
  if (!body || typeof body !== "object") {
    throw new WorkItemValidationError(
      "Request body is required"
    );
  }

  const documentId =
    (body as Record<string, unknown>).documentId;

  if (
    !isString(documentId) ||
    !documentId
  ) {
    throw new WorkItemValidationError(
      "documentId is required"
    );
  }

  return {
    documentId
  };
}
