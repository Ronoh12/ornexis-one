import crypto from "node:crypto";

import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  DocumentStatus,
  StorageProvider
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

export type DocumentListFilters = {
  status?: DocumentStatus;
  branchId?: string;
  departmentId?: string;
  mimeType?: string;
  search?: string;
};

export type CreateDocumentInput = {
  organizationId: string;
  uploadedByUserId: string;

  title: string;
  description?: string | null;

  branchId?: string | null;
  departmentId?: string | null;

  originalFileName: string;
  storedFileName: string;

  storageProvider: StorageProvider;
  storageKey: string;

  mimeType: string;
  fileExtension: string;

  sizeBytes: number;
  fileBuffer: Buffer;
};

export type UpdateDocumentInput = {
  title?: string;
  description?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  status?: DocumentStatus;
};

export class DocumentServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "DocumentServiceError";
  }
}

function serializeDocument<
  T extends {
    sizeBytes: bigint;
  }
>(document: T) {
  return {
    ...document,
    sizeBytes:
      document.sizeBytes.toString()
  };
}

async function validateBranch(
  organizationId: string,
  branchId?: string | null
) {
  if (!branchId) {
    return null;
  }

  const branch =
    await prisma.branch.findFirst({
      where: {
        id: branchId,
        organizationId
      },
      select: {
        id: true,
        organizationId: true
      }
    });

  if (!branch) {
    throw new DocumentServiceError(
      "INVALID_BRANCH",
      "Branch does not belong to this organization"
    );
  }

  return branch;
}

async function validateDepartment(
  organizationId: string,
  departmentId?: string | null
) {
  if (!departmentId) {
    return null;
  }

  const department =
    await prisma.department.findFirst({
      where: {
        id: departmentId,
        organizationId
      },
      select: {
        id: true,
        organizationId: true,
        branchId: true
      }
    });

  if (!department) {
    throw new DocumentServiceError(
      "INVALID_DEPARTMENT",
      "Department does not belong to this organization"
    );
  }

  return department;
}

export async function validateDocumentStructureAssignment(
  organizationId: string,
  branchId?: string | null,
  departmentId?: string | null
) {
  const [
    branch,
    department
  ] = await Promise.all([
    validateBranch(
      organizationId,
      branchId
    ),

    validateDepartment(
      organizationId,
      departmentId
    )
  ]);

  if (
    branch &&
    department &&
    department.branchId &&
    department.branchId !== branch.id
  ) {
    throw new DocumentServiceError(
      "STRUCTURE_MISMATCH",
      "Department does not belong to the selected branch"
    );
  }

  return {
    branch,
    department
  };
}

export function calculateSha256(
  buffer: Buffer
) {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
}

export async function listDocuments(
  organizationId: string,
  filters: DocumentListFilters = {}
) {
  const where:
    Prisma.DocumentWhereInput = {
      organizationId
    };

  if (filters.status) {
    where.status =
      filters.status;
  }

  if (filters.branchId) {
    where.branchId =
      filters.branchId;
  }

  if (filters.departmentId) {
    where.departmentId =
      filters.departmentId;
  }

  if (filters.mimeType) {
    where.mimeType =
      filters.mimeType;
  }

  if (filters.search) {
    where.OR = [
      {
        title: {
          contains:
            filters.search,
          mode: "insensitive"
        }
      },
      {
        description: {
          contains:
            filters.search,
          mode: "insensitive"
        }
      },
      {
        originalFileName: {
          contains:
            filters.search,
          mode: "insensitive"
        }
      }
    ];
  }

  const documents =
    await prisma.document.findMany({
      where,

      orderBy: {
        createdAt: "desc"
      },

      include: {
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

        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

  return documents.map(
    serializeDocument
  );
}

export async function getDocumentById(
  organizationId: string,
  documentId: string
) {
  const document =
    await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId
      },

      include: {
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

        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

  if (!document) {
    return null;
  }

  return serializeDocument(
    document
  );
}

export async function getDocumentRecord(
  organizationId: string,
  documentId: string
) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      organizationId
    }
  });
}

export async function createDocument(
  input: CreateDocumentInput
) {
  await validateDocumentStructureAssignment(
    input.organizationId,
    input.branchId,
    input.departmentId
  );

  const checksumSha256 =
    calculateSha256(
      input.fileBuffer
    );

  const document =
    await prisma.document.create({
      data: {
        organizationId:
          input.organizationId,

        uploadedByUserId:
          input.uploadedByUserId,

        title:
          input.title,

        description:
          input.description ?? null,

        branchId:
          input.branchId ?? null,

        departmentId:
          input.departmentId ?? null,

        originalFileName:
          input.originalFileName,

        storedFileName:
          input.storedFileName,

        storageProvider:
          input.storageProvider,

        storageKey:
          input.storageKey,

        mimeType:
          input.mimeType,

        fileExtension:
          input.fileExtension,

        sizeBytes:
          BigInt(
            input.sizeBytes
          ),

        checksumSha256
      },

      include: {
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

        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

  return serializeDocument(
    document
  );
}

export async function updateDocument(
  organizationId: string,
  documentId: string,
  input: UpdateDocumentInput
) {
  const existing =
    await prisma.document.findFirst({
      where: {
        id: documentId,
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

  await validateDocumentStructureAssignment(
    organizationId,
    nextBranchId,
    nextDepartmentId
  );

  const data:
    Prisma.DocumentUpdateInput = {};

  if (input.title !== undefined) {
    data.title =
      input.title;
  }

  if (
    input.description !== undefined
  ) {
    data.description =
      input.description;
  }

  if (input.status !== undefined) {
    data.status =
      input.status;
  }

  if (input.branchId !== undefined) {
    if (input.branchId === null) {
      data.branch = {
        disconnect: true
      };
    } else {
      data.branch = {
        connect: {
          id_organizationId: {
            id: input.branchId,
            organizationId
          }
        }
      };
    }
  }

  if (
    input.departmentId !== undefined
  ) {
    if (
      input.departmentId === null
    ) {
      data.department = {
        disconnect: true
      };
    } else {
      data.department = {
        connect: {
          id_organizationId: {
            id:
              input.departmentId,
            organizationId
          }
        }
      };
    }
  }

  const updated =
    await prisma.document.update({
      where: {
        id: existing.id
      },

      data,

      include: {
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

        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

  return serializeDocument(
    updated
  );
}

export async function deleteDocumentRecord(
  organizationId: string,
  documentId: string
) {
  const existing =
    await prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId
      }
    });

  if (!existing) {
    return null;
  }

  await prisma.document.delete({
    where: {
      id: existing.id
    }
  });

  return serializeDocument(
    existing
  );
}
