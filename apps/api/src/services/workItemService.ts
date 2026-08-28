import { prisma } from "../../../../packages/database/index.js";

import type {
  WorkItemPriority,
  WorkItemStatus
} from "../validators/workItemValidator.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  createNotification
} from "./notificationService.js";

export class WorkItemServiceError
  extends Error {
  code: string;

  constructor(
    code: string,
    message: string
  ) {
    super(message);
    this.name = "WorkItemServiceError";
    this.code = code;
  }
}

const userSummary = {
  id: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  }
} as const;

const workItemInclude = {
  branch: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },

  department: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },

  contact: {
    select: {
      id: true,
      contactType: true,
      status: true,
      firstName: true,
      lastName: true,
      organizationName: true,
      email: true
    }
  },

  createdBy: {
    select: userSummary
  },

  owner: {
    select: userSummary
  },

  assignee: {
    select: userSummary
  },

  completedBy: {
    select: userSummary
  }
} as const;

export type WorkItemFilters = {
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  branchId?: string;
  departmentId?: string;
  contactId?: string;
  ownerOrganizationUserId?: string;
  assigneeOrganizationUserId?: string;
  overdue?: boolean;
};

export type CreateWorkItemInput = {
  organizationId: string;
  userId: string;

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

export type UpdateWorkItemInput = {
  title?: string;
  description?: string | null;
  priority?: WorkItemPriority;
  dueAt?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  contactId?: string | null;
};

async function getActiveOrganizationUser(
  organizationId: string,
  userId: string
) {
  const membership =
    await prisma.organizationUser.findFirst({
      where: {
        organizationId,
        userId,
        status: "ACTIVE"
      },

      select: {
        id: true,
        organizationId: true,
        userId: true,
        branchId: true,
        departmentId: true
      }
    });

  if (!membership) {
    throw new WorkItemServiceError(
      "MEMBERSHIP_REQUIRED",
      "Active organization membership is required"
    );
  }

  return membership;
}

async function validateOrganizationUser(
  organizationId: string,
  organizationUserId?: string | null
) {
  if (!organizationUserId) {
    return null;
  }

  const membership =
    await prisma.organizationUser.findFirst({
      where: {
        id: organizationUserId,
        organizationId,
        status: "ACTIVE"
      },

      select: {
        id: true,
        organizationId: true,
        branchId: true,
        departmentId: true
      }
    });

  if (!membership) {
    throw new WorkItemServiceError(
      "INVALID_ORGANIZATION_USER",
      "Organization user is not active in this organization"
    );
  }

  return membership;
}

async function validateStructure(
  organizationId: string,
  branchId?: string | null,
  departmentId?: string | null
) {
  const branch =
    branchId
      ? await prisma.branch.findFirst({
          where: {
            id: branchId,
            organizationId
          },

          select: {
            id: true
          }
        })
      : null;

  if (branchId && !branch) {
    throw new WorkItemServiceError(
      "INVALID_BRANCH",
      "Branch does not belong to this organization"
    );
  }

  const department =
    departmentId
      ? await prisma.department.findFirst({
          where: {
            id: departmentId,
            organizationId
          },

          select: {
            id: true,
            branchId: true
          }
        })
      : null;

  if (
    departmentId &&
    !department
  ) {
    throw new WorkItemServiceError(
      "INVALID_DEPARTMENT",
      "Department does not belong to this organization"
    );
  }

  if (
    branch &&
    department?.branchId &&
    department.branchId !== branch.id
  ) {
    throw new WorkItemServiceError(
      "STRUCTURE_MISMATCH",
      "Department does not belong to the selected branch"
    );
  }
}

async function validateContact(
  organizationId: string,
  contactId?: string | null
) {
  if (!contactId) {
    return;
  }

  const contact =
    await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId
      },

      select: {
        id: true
      }
    });

  if (!contact) {
    throw new WorkItemServiceError(
      "INVALID_CONTACT",
      "Contact does not belong to this organization"
    );
  }
}

async function createActivity(
  organizationId: string,
  workItemId: string,
  actorOrganizationUserId: string | null,
  activityType:
    | "CREATED"
    | "UPDATED"
    | "OWNER_CHANGED"
    | "ASSIGNEE_CHANGED"
    | "PRIORITY_CHANGED"
    | "DUE_DATE_CHANGED"
    | "STATUS_CHANGED"
    | "COMMENT_ADDED"
    | "ATTACHMENT_ADDED"
    | "ATTACHMENT_REMOVED"
    | "COMPLETED"
    | "CANCELLED",
  oldValues?: object,
  newValues?: object,
  metadata?: object
) {
  return prisma.workItemActivity.create({
    data: {
      organizationId,
      workItemId,
      actorOrganizationUserId,
      activityType,

      ...(oldValues !== undefined
        ? { oldValues }
        : {}),

      ...(newValues !== undefined
        ? { newValues }
        : {}),

      ...(metadata !== undefined
        ? { metadata }
        : {})
    }
  });
}
async function notifyWorkItemAssignment(
  organizationId: string,
  workItem: {
    id: string;
    title: string;
    priority: string;
    dueAt: Date | null;
  },
  recipientOrganizationUserId: string
) {
  await createNotification({
    organizationId,

    recipientOrganizationUserId,

    type:
      "WORK_ITEM_ASSIGNED",

    title:
      "Work item assigned to you",

    message:
      `You have been assigned: ${workItem.title}`,

    priority:
      workItem.priority === "URGENT"
        ? "CRITICAL"
        : workItem.priority === "HIGH"
          ? "HIGH"
          : "NORMAL",

    sourceType:
      "WORK_ITEM",

    sourceId:
      workItem.id,

    actionUrl:
      `/work-items/${workItem.id}`,

    metadata: {
      workItemId:
        workItem.id,

      workItemTitle:
        workItem.title,

      workItemPriority:
        workItem.priority,

      ...(workItem.dueAt
        ? {
            dueAt:
              workItem.dueAt.toISOString()
          }
        : {})
    }
  });
}
export async function listWorkItems(
  organizationId: string,
  filters: WorkItemFilters = {}
) {
  const where: Record<string, unknown> = {
    organizationId
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.branchId) {
    where.branchId = filters.branchId;
  }

  if (filters.departmentId) {
    where.departmentId =
      filters.departmentId;
  }

  if (filters.contactId) {
    where.contactId =
      filters.contactId;
  }

  if (
    filters.ownerOrganizationUserId
  ) {
    where.ownerOrganizationUserId =
      filters.ownerOrganizationUserId;
  }

  if (
    filters.assigneeOrganizationUserId
  ) {
    where.assigneeOrganizationUserId =
      filters.assigneeOrganizationUserId;
  }

  if (filters.overdue === true) {
    where.dueAt = {
      lt: new Date()
    };

    where.status = {
      notIn: [
        "COMPLETED",
        "CANCELLED"
      ]
    };
  }

  return prisma.workItem.findMany({
    where,

    orderBy: [
      {
        dueAt: "asc"
      },
      {
        createdAt: "desc"
      }
    ],

    include: workItemInclude
  });
}

export async function getWorkItem(
  organizationId: string,
  workItemId: string
) {
  return prisma.workItem.findFirst({
    where: {
      id: workItemId,
      organizationId
    },

    include: workItemInclude
  });
}

export async function createWorkItem(
  input: CreateWorkItemInput
) {
  const actor =
    await getActiveOrganizationUser(
      input.organizationId,
      input.userId
    );

  await Promise.all([
    validateStructure(
      input.organizationId,
      input.branchId,
      input.departmentId
    ),

    validateContact(
      input.organizationId,
      input.contactId
    ),

    validateOrganizationUser(
      input.organizationId,
      input.ownerOrganizationUserId
    ),

    validateOrganizationUser(
      input.organizationId,
      input.assigneeOrganizationUserId
    )
  ]);

  const workItem =
    await prisma.workItem.create({
      data: {
        organizationId:
          input.organizationId,

        createdByOrganizationUserId:
          actor.id,

        title:
          input.title,

        description:
          input.description ?? null,

        priority:
          input.priority ?? "NORMAL",

        status:
          input.status ?? "OPEN",

        dueAt:
          input.dueAt
            ? new Date(input.dueAt)
            : null,

        branchId:
          input.branchId ?? null,

        departmentId:
          input.departmentId ?? null,

        contactId:
          input.contactId ?? null,

        ownerOrganizationUserId:
          input.ownerOrganizationUserId
            ?? null,

        assigneeOrganizationUserId:
          input.assigneeOrganizationUserId
            ?? null
      },

      include: workItemInclude
    });

  await createActivity(
    input.organizationId,
    workItem.id,
    actor.id,
    "CREATED",
    undefined,
    {
      title: workItem.title,
      status: workItem.status,
      priority: workItem.priority
    }
  );

  // WORK_ITEM_CREATE_ASSIGNMENT_NOTIFICATION
  if (workItem.assigneeOrganizationUserId) {
    await notifyWorkItemAssignment(
      input.organizationId,
      workItem,
      workItem.assigneeOrganizationUserId
    );
  }

  await createAuditLog({
    organizationId:
      input.organizationId,

    userId:
      input.userId,

    action:
      "WORK_ITEM_CREATED",

    entityType:
      "WorkItem",

    entityId:
      workItem.id,

    newValues: {
      title: workItem.title,
      status: workItem.status,
      priority: workItem.priority
    }
  });

  return workItem;
}

export async function updateWorkItem(
  organizationId: string,
  userId: string,
  workItemId: string,
  input: UpdateWorkItemInput
) {
  const actor =
    await getActiveOrganizationUser(
      organizationId,
      userId
    );

  const existing =
    await prisma.workItem.findFirst({
      where: {
        id: workItemId,
        organizationId
      }
    });

  if (!existing) {
    return null;
  }

  const nextBranchId =
    input.branchId === undefined
      ? existing.branchId
      : input.branchId;

  const nextDepartmentId =
    input.departmentId === undefined
      ? existing.departmentId
      : input.departmentId;

  const nextContactId =
    input.contactId === undefined
      ? existing.contactId
      : input.contactId;

  await Promise.all([
    validateStructure(
      organizationId,
      nextBranchId,
      nextDepartmentId
    ),

    validateContact(
      organizationId,
      nextContactId
    )
  ]);

  const data: Record<string, unknown> = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.description !== undefined) {
    data.description =
      input.description;
  }

  if (input.priority !== undefined) {
    data.priority =
      input.priority;
  }

  if (input.dueAt !== undefined) {
    data.dueAt =
      input.dueAt
        ? new Date(input.dueAt)
        : null;
  }

  if (input.branchId !== undefined) {
    data.branchId =
      input.branchId;
  }

  if (
    input.departmentId !== undefined
  ) {
    data.departmentId =
      input.departmentId;
  }

  if (input.contactId !== undefined) {
    data.contactId =
      input.contactId;
  }

  const updated =
    await prisma.workItem.update({
      where: {
        id: existing.id
      },

      data,

      include: workItemInclude
    });

  if (
    input.priority !== undefined &&
    input.priority !== existing.priority
  ) {
    await createActivity(
      organizationId,
      workItemId,
      actor.id,
      "PRIORITY_CHANGED",
      {
        priority:
          existing.priority
      },
      {
        priority:
          updated.priority
      }
    );
  }

  if (
    input.dueAt !== undefined
  ) {
    await createActivity(
      organizationId,
      workItemId,
      actor.id,
      "DUE_DATE_CHANGED",
      {
        dueAt:
          existing.dueAt
      },
      {
        dueAt:
          updated.dueAt
      }
    );
  }

  await createActivity(
    organizationId,
    workItemId,
    actor.id,
    "UPDATED"
  );

  await createAuditLog({
    organizationId,
    userId,
    action:
      "WORK_ITEM_UPDATED",
    entityType:
      "WorkItem",
    entityId:
      workItemId
  });

  return updated;
}

export async function updateAssignment(
  organizationId: string,
  userId: string,
  workItemId: string,
  input: {
    ownerOrganizationUserId?:
      string | null;

    assigneeOrganizationUserId?:
      string | null;
  }
) {
  const actor =
    await getActiveOrganizationUser(
      organizationId,
      userId
    );

  const existing =
    await prisma.workItem.findFirst({
      where: {
        id: workItemId,
        organizationId
      }
    });

  if (!existing) {
    return null;
  }

  if (
    input.ownerOrganizationUserId
      !== undefined
  ) {
    await validateOrganizationUser(
      organizationId,
      input.ownerOrganizationUserId
    );
  }

  if (
    input.assigneeOrganizationUserId
      !== undefined
  ) {
    await validateOrganizationUser(
      organizationId,
      input.assigneeOrganizationUserId
    );
  }

  const updated =
    await prisma.workItem.update({
      where: {
        id: existing.id
      },

      data: {
        ...(input.ownerOrganizationUserId
          !== undefined
          ? {
              ownerOrganizationUserId:
                input.ownerOrganizationUserId
            }
          : {}),

        ...(input.assigneeOrganizationUserId
          !== undefined
          ? {
              assigneeOrganizationUserId:
                input.assigneeOrganizationUserId
            }
          : {})
      },

      include: workItemInclude
    });

  if (
    input.ownerOrganizationUserId
      !== undefined &&
    input.ownerOrganizationUserId
      !== existing.ownerOrganizationUserId
  ) {
    await createActivity(
      organizationId,
      workItemId,
      actor.id,
      "OWNER_CHANGED",
      {
        ownerOrganizationUserId:
          existing.ownerOrganizationUserId
      },
      {
        ownerOrganizationUserId:
          updated.ownerOrganizationUserId
      }
    );

    await createAuditLog({
      organizationId,
      userId,
      action:
        "WORK_ITEM_OWNER_CHANGED",
      entityType:
        "WorkItem",
      entityId:
        workItemId
    });
  }

  if (
    input.assigneeOrganizationUserId
      !== undefined &&
    input.assigneeOrganizationUserId
      !== existing.assigneeOrganizationUserId
  ) {
    await createActivity(
      organizationId,
      workItemId,
      actor.id,
      "ASSIGNEE_CHANGED",
      {
        assigneeOrganizationUserId:
          existing.assigneeOrganizationUserId
      },
      {
        assigneeOrganizationUserId:
          updated.assigneeOrganizationUserId
      }
    );

    await createAuditLog({
      organizationId,
      userId,
      action:
        "WORK_ITEM_ASSIGNEE_CHANGED",
      entityType:
        "WorkItem",
      entityId:
        workItemId
    });

    // WORK_ITEM_ASSIGNEE_CHANGE_NOTIFICATION
    if (updated.assigneeOrganizationUserId) {
      await notifyWorkItemAssignment(
        organizationId,
        updated,
        updated.assigneeOrganizationUserId
      );
    }
  }

  return updated;
}

const allowedTransitions:
  Record<
    WorkItemStatus,
    WorkItemStatus[]
  > = {
    DRAFT: [
      "OPEN",
      "CANCELLED"
    ],

    OPEN: [
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED"
    ],

    IN_PROGRESS: [
      "BLOCKED",
      "COMPLETED",
      "CANCELLED"
    ],

    BLOCKED: [
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED"
    ],

    COMPLETED: [],

    CANCELLED: []
  };

export async function changeStatus(
  organizationId: string,
  userId: string,
  workItemId: string,
  status: WorkItemStatus
) {
  const actor =
    await getActiveOrganizationUser(
      organizationId,
      userId
    );

  const existing =
    await prisma.workItem.findFirst({
      where: {
        id: workItemId,
        organizationId
      }
    });

  if (!existing) {
    return null;
  }

  if (
    !allowedTransitions[
      existing.status
    ].includes(status)
  ) {
    throw new WorkItemServiceError(
      "INVALID_STATUS_TRANSITION",
      `Cannot change work item from ${existing.status} to ${status}`
    );
  }

  const now = new Date();

  const data:
    Record<string, unknown> = {
      status
    };

  if (
    status === "IN_PROGRESS" &&
    !existing.startedAt
  ) {
    data.startedAt = now;
  }

  if (status === "COMPLETED") {
    data.completedAt = now;
    data.completedByOrganizationUserId =
      actor.id;
  }

  if (status === "CANCELLED") {
    data.cancelledAt = now;
  }

  const updated =
    await prisma.workItem.update({
      where: {
        id: existing.id
      },

      data,

      include: workItemInclude
    });

  await createActivity(
    organizationId,
    workItemId,
    actor.id,
    status === "COMPLETED"
      ? "COMPLETED"
      : (
          status === "CANCELLED"
            ? "CANCELLED"
            : "STATUS_CHANGED"
        ),
    {
      status:
        existing.status
    },
    {
      status:
        updated.status
    }
  );

  await createAuditLog({
    organizationId,
    userId,

    action:
      status === "COMPLETED"
        ? "WORK_ITEM_COMPLETED"
        : (
            status === "CANCELLED"
              ? "WORK_ITEM_CANCELLED"
              : "WORK_ITEM_STATUS_CHANGED"
          ),

    entityType:
      "WorkItem",

    entityId:
      workItemId,

    oldValues: {
      status:
        existing.status
    },

    newValues: {
      status:
        updated.status
    }
  });

  return updated;
}

export async function addComment(
  organizationId: string,
  userId: string,
  workItemId: string,
  body: string
) {
  const actor =
    await getActiveOrganizationUser(
      organizationId,
      userId
    );

  const workItem =
    await prisma.workItem.findFirst({
      where: {
        id: workItemId,
        organizationId
      },

      select: {
        id: true
      }
    });

  if (!workItem) {
    return null;
  }

  const comment =
    await prisma.workItemComment.create({
      data: {
        organizationId,
        workItemId,
        authorOrganizationUserId:
          actor.id,
        body
      }
    });

  await createActivity(
    organizationId,
    workItemId,
    actor.id,
    "COMMENT_ADDED",
    undefined,
    {
      commentId:
        comment.id
    }
  );

  await createAuditLog({
    organizationId,
    userId,
    action:
      "WORK_ITEM_COMMENT_ADDED",
    entityType:
      "WorkItemComment",
    entityId:
      comment.id
  });

  return comment;
}

export async function listComments(
  organizationId: string,
  workItemId: string
) {
  const workItem =
    await prisma.workItem.findFirst({
      where: {
        id: workItemId,
        organizationId
      },

      select: {
        id: true
      }
    });

  if (!workItem) {
    return null;
  }

  return prisma.workItemComment.findMany({
    where: {
      organizationId,
      workItemId
    },

    orderBy: {
      createdAt: "asc"
    },

    include: {
      author: {
        select: userSummary
      }
    }
  });
}

export async function listActivity(
  organizationId: string,
  workItemId: string
) {
  const workItem =
    await prisma.workItem.findFirst({
      where: {
        id: workItemId,
        organizationId
      },

      select: {
        id: true
      }
    });

  if (!workItem) {
    return null;
  }

  return prisma.workItemActivity.findMany({
    where: {
      organizationId,
      workItemId
    },

    orderBy: {
      createdAt: "desc"
    },

    include: {
      actor: {
        select: userSummary
      }
    }
  });
}

async function validateDocument(
  organizationId: string,
  documentId: string
) {
  const document =
    await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId,
        status: "ACTIVE"
      },

      select: {
        id: true,
        title: true,
        originalFileName: true,
        mimeType: true,
        sizeBytes: true
      }
    });

  if (!document) {
    throw new WorkItemServiceError(
      "INVALID_DOCUMENT",
      "Document is not available in this organization"
    );
  }

  return document;
}

export async function attachDocument(
  organizationId: string,
  userId: string,
  entityType:
    "WORK_ITEM" | "CONTACT",
  entityId: string,
  documentId: string
) {
  const actor =
    await getActiveOrganizationUser(
      organizationId,
      userId
    );

  if (entityType === "WORK_ITEM") {
    const workItem =
      await prisma.workItem.findFirst({
        where: {
          id: entityId,
          organizationId
        },

        select: {
          id: true
        }
      });

    if (!workItem) {
      return null;
    }
  } else {
    const contact =
      await prisma.contact.findFirst({
        where: {
          id: entityId,
          organizationId
        },

        select: {
          id: true
        }
      });

    if (!contact) {
      return null;
    }
  }

  await validateDocument(
    organizationId,
    documentId
  );

  const attachment =
    await prisma.entityAttachment.upsert({
      where: {
        organizationId_documentId_entityType_entityId: {
          organizationId,
          documentId,
          entityType,
          entityId
        }
      },

      update: {},

      create: {
        organizationId,
        documentId,
        entityType,
        entityId,
        attachedByOrganizationUserId:
          actor.id
      }
    });

  if (entityType === "WORK_ITEM") {
    await createActivity(
      organizationId,
      entityId,
      actor.id,
      "ATTACHMENT_ADDED",
      undefined,
      {
        attachmentId:
          attachment.id,
        documentId
      }
    );
  }

  await createAuditLog({
    organizationId,
    userId,

    action:
      entityType === "WORK_ITEM"
        ? "WORK_ITEM_ATTACHMENT_ADDED"
        : "CONTACT_ATTACHMENT_ADDED",

    entityType:
      "EntityAttachment",

    entityId:
      attachment.id
  });

  return attachment;
}

export async function listAttachments(
  organizationId: string,
  entityType:
    "WORK_ITEM" | "CONTACT",
  entityId: string
) {
  if (entityType === "WORK_ITEM") {
    const exists =
      await prisma.workItem.findFirst({
        where: {
          id: entityId,
          organizationId
        },

        select: {
          id: true
        }
      });

    if (!exists) {
      return null;
    }
  } else {
    const exists =
      await prisma.contact.findFirst({
        where: {
          id: entityId,
          organizationId
        },

        select: {
          id: true
        }
      });

    if (!exists) {
      return null;
    }
  }

  const attachments =
    await prisma.entityAttachment.findMany({
      where: {
        organizationId,
        entityType,
        entityId
      },

      orderBy: {
        createdAt: "desc"
      },

      include: {
        document: {
          select: {
            id: true,
            title: true,
            description: true,
            originalFileName: true,
            mimeType: true,
            fileExtension: true,
            sizeBytes: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

  return attachments.map(
    (attachment) => ({
      ...attachment,

      document: {
        ...attachment.document,
        sizeBytes:
          attachment.document.sizeBytes.toString()
      }
    })
  );
}
export async function removeAttachment(
  organizationId: string,
  userId: string,
  entityType:
    "WORK_ITEM" | "CONTACT",
  entityId: string,
  attachmentId: string
) {
  const actor =
    await getActiveOrganizationUser(
      organizationId,
      userId
    );

  const attachment =
    await prisma.entityAttachment.findFirst({
      where: {
        id: attachmentId,
        organizationId,
        entityType,
        entityId
      }
    });

  if (!attachment) {
    return null;
  }

  await prisma.entityAttachment.delete({
    where: {
      id: attachment.id
    }
  });

  if (entityType === "WORK_ITEM") {
    await createActivity(
      organizationId,
      entityId,
      actor.id,
      "ATTACHMENT_REMOVED",
      {
        attachmentId:
          attachment.id,
        documentId:
          attachment.documentId
      }
    );
  }

  await createAuditLog({
    organizationId,
    userId,

    action:
      entityType === "WORK_ITEM"
        ? "WORK_ITEM_ATTACHMENT_REMOVED"
        : "CONTACT_ATTACHMENT_REMOVED",

    entityType:
      "EntityAttachment",

    entityId:
      attachment.id
  });

  return attachment;
}
