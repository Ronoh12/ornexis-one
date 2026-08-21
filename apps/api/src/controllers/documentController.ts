import crypto from "node:crypto";
import type {
  Request,
  Response
} from "express";

import {
  StorageProvider
} from "../../../../packages/database/generated/client/enums.js";

import {
  createDocument,
  deleteDocumentRecord,
  DocumentServiceError,
  getDocumentById,
  getDocumentRecord,
  listDocuments,
  updateDocument,
  validateDocumentStructureAssignment
} from "../services/documentService.js";

import {
  deleteDocumentFile,
  readDocumentFile,
  saveDocumentFile
} from "../services/storage/storageService.js";

import {
  createAuditLog
} from "../services/auditService.js";

import {
  defaultDocumentTitle,
  isValidUuid,
  normalizeDescription,
  normalizeDocumentStatus,
  normalizeDocumentTitle,
  normalizeOptionalUuid,
  validateDocumentSearch,
  validateMimeTypeFilter,
  validateUploadedFile
} from "../validators/documentValidator.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId?: string;
    organizationId?: string;
  };
};

function getAuth(
  req: Request
) {
  return (
    req as AuthenticatedRequest
  ).auth;
}

function handleServiceError(
  error: unknown,
  res: Response
) {
  if (
    error instanceof
    DocumentServiceError
  ) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  return null;
}

export async function listOrganizationDocuments(
  req: Request,
  res: Response
) {
  const organizationId =
    getAuth(req)?.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  const searchResult =
    validateDocumentSearch(
      req.query.search
    );

  if (!searchResult.success) {
    return res.status(400).json({
      success: false,
      message: searchResult.message
    });
  }

  const statusResult =
    normalizeDocumentStatus(
      req.query.status
    );

  if (!statusResult.success) {
    return res.status(400).json({
      success: false,
      message: statusResult.message
    });
  }

  const branchResult =
    normalizeOptionalUuid(
      req.query.branchId,
      "branch ID"
    );

  if (!branchResult.success) {
    return res.status(400).json({
      success: false,
      message: branchResult.message
    });
  }

  const departmentResult =
    normalizeOptionalUuid(
      req.query.departmentId,
      "department ID"
    );

  if (!departmentResult.success) {
    return res.status(400).json({
      success: false,
      message:
        departmentResult.message
    });
  }

  const mimeResult =
    validateMimeTypeFilter(
      req.query.mimeType
    );

  if (!mimeResult.success) {
    return res.status(400).json({
      success: false,
      message: mimeResult.message
    });
  }

  const documents =
    await listDocuments(
      organizationId,
      {
        ...(searchResult.value
          ? {
              search:
                searchResult.value
            }
          : {}),

        ...(statusResult.value
          ? {
              status:
                statusResult.value
            }
          : {}),

        ...(branchResult.value
          ? {
              branchId:
                branchResult.value
            }
          : {}),

        ...(departmentResult.value
          ? {
              departmentId:
                departmentResult.value
            }
          : {}),

        ...(mimeResult.value
          ? {
              mimeType:
                mimeResult.value
            }
          : {})
      }
    );

  return res.json({
    success: true,
    data: documents
  });
}

export async function getOrganizationDocument(
  req: Request,
  res: Response
) {
  const organizationId =
    getAuth(req)?.organizationId;

  const documentId =
    req.params.id;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (!isValidUuid(documentId)) {
    return res.status(400).json({
      success: false,
      message:
        "A valid document ID is required"
    });
  }

  const document =
    await getDocumentById(
      organizationId,
      documentId
    );

  if (!document) {
    return res.status(404).json({
      success: false,
      message: "Document not found"
    });
  }

  return res.json({
    success: true,
    data: document
  });
}

export async function uploadDocument(
  req: Request,
  res: Response
) {
  const auth =
    getAuth(req);

  const userId =
    auth?.userId;

  const organizationId =
    auth?.organizationId;

  if (!userId || !organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "File is required"
    });
  }

  const fileResult =
    validateUploadedFile(
      req.file
    );

  if (!fileResult.success) {
    return res.status(400).json({
      success: false,
      message: fileResult.message
    });
  }

  const titleResult =
    normalizeDocumentTitle(
      req.body.title
    );

  if (!titleResult.success) {
    return res.status(400).json({
      success: false,
      message: titleResult.message
    });
  }

  const descriptionResult =
    normalizeDescription(
      req.body.description
    );

  if (!descriptionResult.success) {
    return res.status(400).json({
      success: false,
      message:
        descriptionResult.message
    });
  }

  const branchResult =
    normalizeOptionalUuid(
      req.body.branchId,
      "branch ID"
    );

  if (!branchResult.success) {
    return res.status(400).json({
      success: false,
      message: branchResult.message
    });
  }

  const departmentResult =
    normalizeOptionalUuid(
      req.body.departmentId,
      "department ID"
    );

  if (!departmentResult.success) {
    return res.status(400).json({
      success: false,
      message:
        departmentResult.message
    });
  }

  try {
    await validateDocumentStructureAssignment(
      organizationId,
      branchResult.value,
      departmentResult.value
    );
  } catch (error) {
    const handled =
      handleServiceError(
        error,
        res
      );

    if (handled) {
      return handled;
    }

    throw error;
  }

  const storedFileName =
    `${crypto.randomUUID()}${fileResult.extension}`;

  const savedFile =
    await saveDocumentFile({
      organizationId,
      storedFileName,
      buffer: req.file.buffer
    });

  try {
    const document =
      await createDocument({
        organizationId,
        uploadedByUserId:
          userId,

        title:
          titleResult.value ??
          defaultDocumentTitle(
            fileResult.originalFileName
          ),

        ...(descriptionResult.value !==
        undefined
          ? {
              description:
                descriptionResult.value
            }
          : {}),

        ...(branchResult.value !==
        undefined
          ? {
              branchId:
                branchResult.value
            }
          : {}),

        ...(departmentResult.value !==
        undefined
          ? {
              departmentId:
                departmentResult.value
            }
          : {}),

        originalFileName:
          fileResult.originalFileName,

        storedFileName,

        storageProvider:
          StorageProvider.LOCAL,

        storageKey:
          savedFile.storageKey,

        mimeType:
          req.file.mimetype,

        fileExtension:
          fileResult.extension,

        sizeBytes:
          req.file.size,

        fileBuffer:
          req.file.buffer
      });

    await createAuditLog({
      organizationId,
      userId,
      action:
        "DOCUMENT_UPLOADED",
      entityType:
        "DOCUMENT",
      entityId:
        document.id,

      newValues: {
        title:
          document.title,

        originalFileName:
          document.originalFileName,

        mimeType:
          document.mimeType,

        sizeBytes:
          document.sizeBytes,

        branchId:
          document.branchId,

        departmentId:
          document.departmentId,

        storageProvider:
          document.storageProvider,

        checksumSha256:
          document.checksumSha256
      },

      ...(req.ip
        ? {
            ipAddress: req.ip
          }
        : {}),

      ...(req.headers["user-agent"]
        ? {
            userAgent:
              req.headers[
                "user-agent"
              ]
          }
        : {})
    });

    return res.status(201).json({
      success: true,
      message:
        "Document uploaded successfully",
      data: document
    });
  } catch (error) {
    await deleteDocumentFile(
      savedFile.storageKey
    );

    const handled =
      handleServiceError(
        error,
        res
      );

    if (handled) {
      return handled;
    }

    throw error;
  }
}

export async function updateOrganizationDocument(
  req: Request,
  res: Response
) {
  const auth =
    getAuth(req);

  const userId =
    auth?.userId;

  const organizationId =
    auth?.organizationId;

  const documentId =
    req.params.id;

  if (!userId || !organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (!isValidUuid(documentId)) {
    return res.status(400).json({
      success: false,
      message:
        "A valid document ID is required"
    });
  }

  const allowedFields =
    new Set([
      "title",
      "description",
      "status",
      "branchId",
      "departmentId"
    ]);

  for (
    const field of
    Object.keys(req.body)
  ) {
    if (!allowedFields.has(field)) {
      return res.status(400).json({
        success: false,
        message:
          `Field "${field}" cannot be updated`
      });
    }
  }

  if (
    Object.keys(req.body).length ===
    0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "At least one update field is required"
    });
  }

  const titleResult =
    normalizeDocumentTitle(
      req.body.title
    );

  if (!titleResult.success) {
    return res.status(400).json({
      success: false,
      message: titleResult.message
    });
  }

  const descriptionResult =
    normalizeDescription(
      req.body.description
    );

  if (!descriptionResult.success) {
    return res.status(400).json({
      success: false,
      message:
        descriptionResult.message
    });
  }

  const statusResult =
    normalizeDocumentStatus(
      req.body.status
    );

  if (!statusResult.success) {
    return res.status(400).json({
      success: false,
      message: statusResult.message
    });
  }

  const branchResult =
    normalizeOptionalUuid(
      req.body.branchId,
      "branch ID"
    );

  if (!branchResult.success) {
    return res.status(400).json({
      success: false,
      message: branchResult.message
    });
  }

  const departmentResult =
    normalizeOptionalUuid(
      req.body.departmentId,
      "department ID"
    );

  if (!departmentResult.success) {
    return res.status(400).json({
      success: false,
      message:
        departmentResult.message
    });
  }

  const existing =
    await getDocumentById(
      organizationId,
      documentId
    );

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Document not found"
    });
  }

  try {
    const updated =
      await updateDocument(
        organizationId,
        documentId,
        {
          ...(titleResult.value !==
          undefined
            ? {
                title:
                  titleResult.value
              }
            : {}),

          ...(descriptionResult.value !==
          undefined
            ? {
                description:
                  descriptionResult.value
              }
            : {}),

          ...(statusResult.value !==
          undefined
            ? {
                status:
                  statusResult.value
              }
            : {}),

          ...(branchResult.value !==
          undefined
            ? {
                branchId:
                  branchResult.value
              }
            : {}),

          ...(departmentResult.value !==
          undefined
            ? {
                departmentId:
                  departmentResult.value
              }
            : {})
        }
      );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    await createAuditLog({
      organizationId,
      userId,
      action:
        "DOCUMENT_UPDATED",
      entityType:
        "DOCUMENT",
      entityId:
        documentId,

      oldValues: {
        title:
          existing.title,
        description:
          existing.description,
        status:
          existing.status,
        branchId:
          existing.branchId,
        departmentId:
          existing.departmentId
      },

      newValues: {
        title:
          updated.title,
        description:
          updated.description,
        status:
          updated.status,
        branchId:
          updated.branchId,
        departmentId:
          updated.departmentId
      },

      ...(req.ip
        ? {
            ipAddress: req.ip
          }
        : {}),

      ...(req.headers["user-agent"]
        ? {
            userAgent:
              req.headers[
                "user-agent"
              ]
          }
        : {})
    });

    return res.json({
      success: true,
      message:
        "Document updated successfully",
      data: updated
    });
  } catch (error) {
    const handled =
      handleServiceError(
        error,
        res
      );

    if (handled) {
      return handled;
    }

    throw error;
  }
}

export async function downloadOrganizationDocument(
  req: Request,
  res: Response
) {
  const auth =
    getAuth(req);

  const userId =
    auth?.userId;

  const organizationId =
    auth?.organizationId;

  const documentId =
    req.params.id;

  if (!userId || !organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (!isValidUuid(documentId)) {
    return res.status(400).json({
      success: false,
      message:
        "A valid document ID is required"
    });
  }

  const document =
    await getDocumentRecord(
      organizationId,
      documentId
    );

  if (!document) {
    return res.status(404).json({
      success: false,
      message: "Document not found"
    });
  }

  const buffer =
    await readDocumentFile(
      document.storageKey
    );

  await createAuditLog({
    organizationId,
    userId,
    action:
      "DOCUMENT_DOWNLOADED",
    entityType:
      "DOCUMENT",
    entityId:
      document.id,

    newValues: {
      title:
        document.title,
      originalFileName:
        document.originalFileName,
      mimeType:
        document.mimeType
    },

    ...(req.ip
      ? {
          ipAddress: req.ip
        }
      : {}),

    ...(req.headers["user-agent"]
      ? {
          userAgent:
            req.headers[
              "user-agent"
            ]
        }
      : {})
  });

  res.setHeader(
    "Content-Type",
    document.mimeType
  );

  res.setHeader(
    "Content-Length",
    buffer.length.toString()
  );

  res.attachment(
    document.originalFileName
  );

  return res.send(buffer);
}

export async function deleteOrganizationDocument(
  req: Request,
  res: Response
) {
  const auth =
    getAuth(req);

  const userId =
    auth?.userId;

  const organizationId =
    auth?.organizationId;

  const documentId =
    req.params.id;

  if (!userId || !organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (!isValidUuid(documentId)) {
    return res.status(400).json({
      success: false,
      message:
        "A valid document ID is required"
    });
  }

  const existing =
    await getDocumentRecord(
      organizationId,
      documentId
    );

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Document not found"
    });
  }

  await deleteDocumentFile(
    existing.storageKey
  );

  const deleted =
    await deleteDocumentRecord(
      organizationId,
      documentId
    );

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Document not found"
    });
  }

  await createAuditLog({
    organizationId,
    userId,
    action:
      "DOCUMENT_DELETED",
    entityType:
      "DOCUMENT",
    entityId:
      documentId,

    oldValues: {
      title:
        deleted.title,
      originalFileName:
        deleted.originalFileName,
      mimeType:
        deleted.mimeType,
      sizeBytes:
        deleted.sizeBytes,
      checksumSha256:
        deleted.checksumSha256,
      branchId:
        deleted.branchId,
      departmentId:
        deleted.departmentId
    },

    ...(req.ip
      ? {
          ipAddress: req.ip
        }
      : {}),

    ...(req.headers["user-agent"]
      ? {
          userAgent:
            req.headers[
              "user-agent"
            ]
        }
      : {})
  });

  return res.json({
    success: true,
    message:
      "Document deleted successfully",
    data: deleted
  });
}