import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  RequestActivityType,
  RequestPriority,
  RequestStatus
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import type {
  AddRequestCommentInput,
  AssignRequestInput,
  ChangeRequestPriorityInput,
  ChangeRequestStatusInput,
  CreateRequestInput,
  CreateRequestTypeInput,
  RequestListQuery,
  UpdateRequestInput,
  UpdateRequestTypeInput,
} from "../validators/requestValidator";

type DbClient = Prisma.TransactionClient | typeof prisma;

type RequestActor = {
  organizationId: string;
  organizationUserId: string;
};

const requestInclude = {
  requestType: true,
  requester: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
  assignedTo: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
  branch: true,
  department: true,
  contact: true,
} satisfies Prisma.RequestInclude;

const requestTypeInclude = {
  defaultAssignee: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
  defaultDepartment: true,
} satisfies Prisma.RequestTypeInclude;

const allowedStatusTransitions: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: [RequestStatus.SUBMITTED, RequestStatus.CANCELLED],

  SUBMITTED: [
    RequestStatus.IN_REVIEW,
    RequestStatus.CANCELLED,
  ],

  IN_REVIEW: [
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.CANCELLED,
  ],

  APPROVED: [
    RequestStatus.IN_FULFILMENT,
    RequestStatus.CANCELLED,
  ],

  REJECTED: [],

  IN_FULFILMENT: [
    RequestStatus.COMPLETED,
    RequestStatus.CANCELLED,
  ],

  COMPLETED: [],

  CANCELLED: [],
};

function requestNumberPrefix(date = new Date()) {
  return `REQ-${date.getUTCFullYear()}`;
}

async function nextRequestNumber(
  tx: Prisma.TransactionClient,
  organizationId: string,
) {
  const prefix = requestNumberPrefix();

  const latest = await tx.request.findFirst({
    where: {
      organizationId,
      requestNumber: {
        startsWith: `${prefix}-`,
      },
    },
    orderBy: {
      requestNumber: "desc",
    },
    select: {
      requestNumber: true,
    },
  });

  let nextSequence = 1;

  if (latest?.requestNumber) {
    const current = Number(latest.requestNumber.split("-").pop());

    if (Number.isFinite(current)) {
      nextSequence = current + 1;
    }
  }

  return `${prefix}-${String(nextSequence).padStart(6, "0")}`;
}

async function ensureRequestType(
  db: DbClient,
  organizationId: string,
  requestTypeId: string,
  activeOnly = false,
) {
  const requestType = await db.requestType.findFirst({
    where: {
      id: requestTypeId,
      organizationId,
      ...(activeOnly ? { isActive: true } : {}),
    },
  });

  if (!requestType) {
    throw new Error(
      activeOnly
        ? "Active request type not found"
        : "Request type not found",
    );
  }

  return requestType;
}

async function ensureOrganizationUser(
  db: DbClient,
  organizationId: string,
  organizationUserId: string,
) {
  const organizationUser = await db.organizationUser.findFirst({
    where: {
      id: organizationUserId,
      organizationId,
      status: "ACTIVE",
    },
  });

  if (!organizationUser) {
    throw new Error("Active organization user not found");
  }

  return organizationUser;
}

async function ensureDepartment(
  db: DbClient,
  organizationId: string,
  departmentId: string,
) {
  const department = await db.department.findFirst({
    where: {
      id: departmentId,
      organizationId,
    },
  });

  if (!department) {
    throw new Error("Department not found");
  }

  return department;
}

async function ensureBranch(
  db: DbClient,
  organizationId: string,
  branchId: string,
) {
  const branch = await db.branch.findFirst({
    where: {
      id: branchId,
      organizationId,
    },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  return branch;
}

async function ensureContact(
  db: DbClient,
  organizationId: string,
  contactId: string,
) {
  const contact = await db.contact.findFirst({
    where: {
      id: contactId,
      organizationId,
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  return contact;
}

async function ensureRequest(
  db: DbClient,
  organizationId: string,
  requestId: string,
) {
  const request = await db.request.findFirst({
    where: {
      id: requestId,
      organizationId,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  return request;
}

async function createActivity(
  tx: Prisma.TransactionClient,
  actor: RequestActor,
  requestId: string,
  activityType: RequestActivityType,
  options?: {
    oldValues?: Prisma.InputJsonValue;
    newValues?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return tx.requestActivity.create({
    data: {
      organizationId: actor.organizationId,
      requestId,
      actorOrganizationUserId: actor.organizationUserId,
      activityType,
      ...(options?.oldValues !== undefined
        ? { oldValues: options.oldValues }
        : {}),
      ...(options?.newValues !== undefined
        ? { newValues: options.newValues }
        : {}),
      ...(options?.metadata !== undefined
        ? { metadata: options.metadata }
        : {}),
    },
  });
}

export async function createRequestType(
  actor: RequestActor,
  input: CreateRequestTypeInput,
) {
  if (input.defaultAssigneeOrganizationUserId) {
    await ensureOrganizationUser(
      prisma,
      actor.organizationId,
      input.defaultAssigneeOrganizationUserId,
    );
  }

  if (input.defaultDepartmentId) {
    await ensureDepartment(
      prisma,
      actor.organizationId,
      input.defaultDepartmentId,
    );
  }

  return prisma.requestType.create({
    data: {
      organizationId: actor.organizationId,
      name: input.name,
      code: input.code,
      description: input.description ?? null,

      ...(input.formSchema !== undefined
        ? {
            formSchema:
              input.formSchema === null
                ? Prisma.JsonNull
                : (input.formSchema as Prisma.InputJsonValue),
          }
        : {}),

      defaultPriority:
        input.defaultPriority ?? RequestPriority.NORMAL,

      defaultAssigneeOrganizationUserId:
        input.defaultAssigneeOrganizationUserId ?? null,

      defaultDepartmentId:
        input.defaultDepartmentId ?? null,

      isActive: input.isActive ?? true,
    },
    include: requestTypeInclude,
  });
}

export async function listRequestTypes(
  organizationId: string,
  includeInactive = false,
) {
  return prisma.requestType.findMany({
    where: {
      organizationId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: requestTypeInclude,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function getRequestType(
  organizationId: string,
  requestTypeId: string,
) {
  const requestType = await prisma.requestType.findFirst({
    where: {
      id: requestTypeId,
      organizationId,
    },
    include: requestTypeInclude,
  });

  if (!requestType) {
    throw new Error("Request type not found");
  }

  return requestType;
}

export async function updateRequestType(
  actor: RequestActor,
  requestTypeId: string,
  input: UpdateRequestTypeInput,
) {
  await ensureRequestType(
    prisma,
    actor.organizationId,
    requestTypeId,
  );

  if (input.defaultAssigneeOrganizationUserId) {
    await ensureOrganizationUser(
      prisma,
      actor.organizationId,
      input.defaultAssigneeOrganizationUserId,
    );
  }

  if (input.defaultDepartmentId) {
    await ensureDepartment(
      prisma,
      actor.organizationId,
      input.defaultDepartmentId,
    );
  }

  return prisma.requestType.update({
    where: {
      id_organizationId: {
        id: requestTypeId,
        organizationId: actor.organizationId,
      },
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),

      ...(input.formSchema !== undefined
        ? {
            formSchema:
              input.formSchema === null
                ? Prisma.JsonNull
                : (input.formSchema as Prisma.InputJsonValue),
          }
        : {}),

      ...(input.defaultPriority !== undefined
        ? { defaultPriority: input.defaultPriority }
        : {}),

      ...(input.defaultAssigneeOrganizationUserId !== undefined
        ? {
            defaultAssigneeOrganizationUserId:
              input.defaultAssigneeOrganizationUserId,
          }
        : {}),

      ...(input.defaultDepartmentId !== undefined
        ? {
            defaultDepartmentId: input.defaultDepartmentId,
          }
        : {}),

      ...(input.isActive !== undefined
        ? { isActive: input.isActive }
        : {}),
    },
    include: requestTypeInclude,
  });
}

export async function createRequest(
  actor: RequestActor,
  input: CreateRequestInput,
) {
  const requestType = await ensureRequestType(
    prisma,
    actor.organizationId,
    input.requestTypeId,
    true,
  );

  const assignedToOrganizationUserId =
    input.assignedToOrganizationUserId !== undefined
      ? input.assignedToOrganizationUserId
      : requestType.defaultAssigneeOrganizationUserId;

  const departmentId =
    input.departmentId !== undefined
      ? input.departmentId
      : requestType.defaultDepartmentId;

  if (assignedToOrganizationUserId) {
    await ensureOrganizationUser(
      prisma,
      actor.organizationId,
      assignedToOrganizationUserId,
    );
  }

  if (departmentId) {
    await ensureDepartment(
      prisma,
      actor.organizationId,
      departmentId,
    );
  }

  if (input.branchId) {
    await ensureBranch(
      prisma,
      actor.organizationId,
      input.branchId,
    );
  }

  if (input.contactId) {
    await ensureContact(
      prisma,
      actor.organizationId,
      input.contactId,
    );
  }

  return prisma.$transaction(async (tx) => {
    const requestNumber = await nextRequestNumber(
      tx,
      actor.organizationId,
    );

    const initialStatus = input.submit
      ? RequestStatus.SUBMITTED
      : RequestStatus.DRAFT;

    const request = await tx.request.create({
      data: {
        organizationId: actor.organizationId,
        requestTypeId: requestType.id,
        requestNumber,

        requesterOrganizationUserId:
          actor.organizationUserId,

        assignedToOrganizationUserId,

        branchId: input.branchId ?? null,
        departmentId,
        contactId: input.contactId ?? null,

        title: input.title,
        description: input.description ?? null,

        ...(input.formData !== undefined
          ? {
              formData:
                input.formData === null
                  ? Prisma.JsonNull
                  : (input.formData as Prisma.InputJsonValue),
            }
          : {}),

        priority:
          input.priority ?? requestType.defaultPriority,

        status: initialStatus,

        dueAt: input.dueAt ?? null,

        submittedAt: input.submit ? new Date() : null,
      },
      include: requestInclude,
    });

    await createActivity(
      tx,
      actor,
      request.id,
      RequestActivityType.CREATED,
      {
        newValues: {
          requestNumber: request.requestNumber,
          title: request.title,
          status: request.status,
          priority: request.priority,
          requestTypeId: request.requestTypeId,
        },
      },
    );

    if (input.submit) {
      await createActivity(
        tx,
        actor,
        request.id,
        RequestActivityType.SUBMITTED,
        {
          oldValues: {
            status: RequestStatus.DRAFT,
          },
          newValues: {
            status: RequestStatus.SUBMITTED,
          },
        },
      );
    }

    if (assignedToOrganizationUserId) {
      await createActivity(
        tx,
        actor,
        request.id,
        RequestActivityType.ASSIGNED,
        {
          newValues: {
            assignedToOrganizationUserId,
          },
        },
      );
    }

    return request;
  });
}

export async function listRequests(
  organizationId: string,
  query: RequestListQuery,
) {
  const where: Prisma.RequestWhereInput = {
    organizationId,

    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.requestTypeId
      ? { requestTypeId: query.requestTypeId }
      : {}),

    ...(query.requesterOrganizationUserId
      ? {
          requesterOrganizationUserId:
            query.requesterOrganizationUserId,
        }
      : {}),

    ...(query.assignedToOrganizationUserId
      ? {
          assignedToOrganizationUserId:
            query.assignedToOrganizationUserId,
        }
      : {}),

    ...(query.branchId ? { branchId: query.branchId } : {}),
    ...(query.departmentId
      ? { departmentId: query.departmentId }
      : {}),
    ...(query.contactId ? { contactId: query.contactId } : {}),

    ...(query.search
      ? {
          OR: [
            {
              title: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              requestNumber: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await prisma.$transaction([
    prisma.request.findMany({
      where,
      include: requestInclude,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: query.limit,
    }),

    prisma.request.count({
      where,
    }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function getRequest(
  organizationId: string,
  requestId: string,
) {
  const request = await prisma.request.findFirst({
    where: {
      id: requestId,
      organizationId,
    },
    include: {
      ...requestInclude,

      comments: {
        include: {
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },

      activities: {
        include: {
          actor: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  return request;
}

export async function updateRequest(
  actor: RequestActor,
  requestId: string,
  input: UpdateRequestInput,
) {
  const existing = await ensureRequest(
    prisma,
    actor.organizationId,
    requestId,
  );

  if (
    existing.status === RequestStatus.COMPLETED ||
    existing.status === RequestStatus.CANCELLED
  ) {
    throw new Error("Closed requests cannot be edited");
  }

  if (input.departmentId) {
    await ensureDepartment(
      prisma,
      actor.organizationId,
      input.departmentId,
    );
  }

  if (input.branchId) {
    await ensureBranch(
      prisma,
      actor.organizationId,
      input.branchId,
    );
  }

  if (input.contactId) {
    await ensureContact(
      prisma,
      actor.organizationId,
      input.contactId,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.request.update({
      where: {
        id_organizationId: {
          id: requestId,
          organizationId: actor.organizationId,
        },
      },
      data: {
        ...(input.title !== undefined
          ? { title: input.title }
          : {}),

        ...(input.description !== undefined
          ? { description: input.description }
          : {}),

        ...(input.formData !== undefined
          ? {
              formData:
                input.formData === null
                  ? Prisma.JsonNull
                  : (input.formData as Prisma.InputJsonValue),
            }
          : {}),

        ...(input.branchId !== undefined
          ? { branchId: input.branchId }
          : {}),

        ...(input.departmentId !== undefined
          ? { departmentId: input.departmentId }
          : {}),

        ...(input.contactId !== undefined
          ? { contactId: input.contactId }
          : {}),

        ...(input.dueAt !== undefined
          ? { dueAt: input.dueAt }
          : {}),
      },
      include: requestInclude,
    });

    await createActivity(
      tx,
      actor,
      requestId,
      RequestActivityType.UPDATED,
      {
        oldValues: {
          title: existing.title,
          description: existing.description,
          branchId: existing.branchId,
          departmentId: existing.departmentId,
          contactId: existing.contactId,
          dueAt: existing.dueAt?.toISOString() ?? null,
        },
        newValues: {
          title: updated.title,
          description: updated.description,
          branchId: updated.branchId,
          departmentId: updated.departmentId,
          contactId: updated.contactId,
          dueAt: updated.dueAt?.toISOString() ?? null,
        },
      },
    );

    return updated;
  });
}

export async function assignRequest(
  actor: RequestActor,
  requestId: string,
  input: AssignRequestInput,
) {
  const existing = await ensureRequest(
    prisma,
    actor.organizationId,
    requestId,
  );

  if (input.assignedToOrganizationUserId) {
    await ensureOrganizationUser(
      prisma,
      actor.organizationId,
      input.assignedToOrganizationUserId,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.request.update({
      where: {
        id_organizationId: {
          id: requestId,
          organizationId: actor.organizationId,
        },
      },
      data: {
        assignedToOrganizationUserId:
          input.assignedToOrganizationUserId,
      },
      include: requestInclude,
    });

    await createActivity(
      tx,
      actor,
      requestId,
      RequestActivityType.ASSIGNED,
      {
        oldValues: {
          assignedToOrganizationUserId:
            existing.assignedToOrganizationUserId,
        },
        newValues: {
          assignedToOrganizationUserId:
            updated.assignedToOrganizationUserId,
        },
      },
    );

    return updated;
  });
}

export async function changeRequestPriority(
  actor: RequestActor,
  requestId: string,
  input: ChangeRequestPriorityInput,
) {
  const existing = await ensureRequest(
    prisma,
    actor.organizationId,
    requestId,
  );

  if (existing.priority === input.priority) {
    return getRequest(actor.organizationId, requestId);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.request.update({
      where: {
        id_organizationId: {
          id: requestId,
          organizationId: actor.organizationId,
        },
      },
      data: {
        priority: input.priority,
      },
      include: requestInclude,
    });

    await createActivity(
      tx,
      actor,
      requestId,
      RequestActivityType.PRIORITY_CHANGED,
      {
        oldValues: {
          priority: existing.priority,
        },
        newValues: {
          priority: updated.priority,
        },
      },
    );

    return updated;
  });
}

export async function changeRequestStatus(
  actor: RequestActor,
  requestId: string,
  input: ChangeRequestStatusInput,
) {
  const existing = await ensureRequest(
    prisma,
    actor.organizationId,
    requestId,
  );

  if (existing.status === input.status) {
    return getRequest(actor.organizationId, requestId);
  }

  const allowed = allowedStatusTransitions[existing.status] ?? [];

  if (!allowed.includes(input.status)) {
    throw new Error(
      `Invalid request status transition: ${existing.status} -> ${input.status}`,
    );
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.request.update({
      where: {
        id_organizationId: {
          id: requestId,
          organizationId: actor.organizationId,
        },
      },
      data: {
        status: input.status,

        ...(input.status === RequestStatus.SUBMITTED
          ? { submittedAt: now }
          : {}),

        ...(input.status === RequestStatus.COMPLETED
          ? { completedAt: now }
          : {}),

        ...(input.status === RequestStatus.CANCELLED
          ? { cancelledAt: now }
          : {}),
      },
      include: requestInclude,
    });

    await createActivity(
      tx,
      actor,
      requestId,
      RequestActivityType.STATUS_CHANGED,
      {
        oldValues: {
          status: existing.status,
        },
        newValues: {
          status: updated.status,
        },
      },
    );

    if (input.status === RequestStatus.SUBMITTED) {
      await createActivity(
        tx,
        actor,
        requestId,
        RequestActivityType.SUBMITTED,
      );
    }

    if (input.status === RequestStatus.COMPLETED) {
      await createActivity(
        tx,
        actor,
        requestId,
        RequestActivityType.COMPLETED,
      );
    }

    if (input.status === RequestStatus.CANCELLED) {
      await createActivity(
        tx,
        actor,
        requestId,
        RequestActivityType.CANCELLED,
      );
    }

    return updated;
  });
}

export async function addRequestComment(
  actor: RequestActor,
  requestId: string,
  input: AddRequestCommentInput,
) {
  await ensureRequest(
    prisma,
    actor.organizationId,
    requestId,
  );

  return prisma.$transaction(async (tx) => {
    const comment = await tx.requestComment.create({
      data: {
        organizationId: actor.organizationId,
        requestId,
        authorOrganizationUserId:
          actor.organizationUserId,
        body: input.body,
      },
      include: {
        author: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    await createActivity(
      tx,
      actor,
      requestId,
      RequestActivityType.COMMENT_ADDED,
      {
        metadata: {
          commentId: comment.id,
        },
      },
    );

    return comment;
  });
}

export async function listRequestActivities(
  organizationId: string,
  requestId: string,
) {
  await ensureRequest(
    prisma,
    organizationId,
    requestId,
  );

  return prisma.requestActivity.findMany({
    where: {
      organizationId,
      requestId,
    },
    include: {
      actor: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

/* ============================================================
   REQUEST ATTACHMENTS
============================================================ */

async function ensureRequestDocument(
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
        description: true,
        originalFileName: true,
        mimeType: true,
        fileExtension: true,
        sizeBytes: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

  if (!document) {
    throw new Error(
      "Document is not available in this organization"
    );
  }

  return document;
}

export async function attachRequestDocument(
  actor: RequestActor,
  requestId: string,
  documentId: string
) {
  await ensureRequest(
    prisma,
    actor.organizationId,
    requestId
  );

  await ensureRequestDocument(
    actor.organizationId,
    documentId
  );

  return prisma.$transaction(async (tx) => {
    const attachment =
      await tx.entityAttachment.upsert({
        where: {
          organizationId_documentId_entityType_entityId: {
            organizationId:
              actor.organizationId,
            documentId,
            entityType: "REQUEST",
            entityId: requestId
          }
        },

        update: {},

        create: {
          organizationId:
            actor.organizationId,
          documentId,
          entityType: "REQUEST",
          entityId: requestId,
          attachedByOrganizationUserId:
            actor.organizationUserId
        }
      });

    await createActivity(
      tx,
      actor,
      requestId,
      RequestActivityType.ATTACHMENT_ADDED,
      {
        metadata: {
          attachmentId: attachment.id,
          documentId
        }
      }
    );

    return attachment;
  });
}

export async function listRequestAttachments(
  organizationId: string,
  requestId: string
) {
  await ensureRequest(
    prisma,
    organizationId,
    requestId
  );

  const attachments =
    await prisma.entityAttachment.findMany({
      where: {
        organizationId,
        entityType: "REQUEST",
        entityId: requestId
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

export async function removeRequestAttachment(
  actor: RequestActor,
  requestId: string,
  attachmentId: string
) {
  await ensureRequest(
    prisma,
    actor.organizationId,
    requestId
  );

  return prisma.$transaction(async (tx) => {
    const attachment =
      await tx.entityAttachment.findFirst({
        where: {
          id: attachmentId,
          organizationId:
            actor.organizationId,
          entityType: "REQUEST",
          entityId: requestId
        }
      });

    if (!attachment) {
      throw new Error(
        "Request attachment not found"
      );
    }

    await tx.entityAttachment.delete({
      where: {
        id: attachment.id
      }
    });

    await createActivity(
      tx,
      actor,
      requestId,
      RequestActivityType.ATTACHMENT_REMOVED,
      {
        metadata: {
          attachmentId:
            attachment.id,
          documentId:
            attachment.documentId
        }
      }
    );

    return attachment;
  });
}
