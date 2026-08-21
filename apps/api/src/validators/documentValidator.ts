import path from "node:path";

const DOCUMENT_STATUSES = [
  "ACTIVE",
  "ARCHIVED"
] as const;

export type DocumentStatusValue =
  (typeof DOCUMENT_STATUSES)[number];

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",

  "image/jpeg",
  "image/png",

  "text/plain",
  "text/csv",

  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

const MIME_EXTENSION_MAP:
  Record<string, readonly string[]> = {
    "application/pdf": [".pdf"],

    "image/jpeg": [
      ".jpg",
      ".jpeg"
    ],

    "image/png": [".png"],

    "text/plain": [".txt"],

    "text/csv": [".csv"],

    "application/msword": [
      ".doc"
    ],

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      [".docx"],

    "application/vnd.ms-excel": [
      ".xls"
    ],

    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      [".xlsx"]
  };

const FORBIDDEN_EXTENSIONS = new Set([
  ".exe",
  ".com",
  ".bat",
  ".cmd",
  ".ps1",
  ".sh",
  ".js",
  ".mjs",
  ".cjs",
  ".vbs",
  ".scr",
  ".msi"
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    UUID_PATTERN.test(value)
  );
}

export function normalizeOptionalUuid(
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

  if (value === null || value === "") {
    return {
      success: true,
      value: null
    };
  }

  if (!isValidUuid(value)) {
    return {
      success: false,
      message:
        `A valid ${fieldName} is required`
    };
  }

  return {
    success: true,
    value
  };
}

export function normalizeDocumentStatus(
  value: unknown
):
  | {
      success: true;
      value?: DocumentStatusValue;
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

  if (
    typeof value !== "string" ||
    !DOCUMENT_STATUSES.includes(
      value as DocumentStatusValue
    )
  ) {
    return {
      success: false,
      message:
        "Invalid document status"
    };
  }

  return {
    success: true,
    value:
      value as DocumentStatusValue
  };
}

export function normalizeDocumentTitle(
  value: unknown
):
  | {
      success: true;
      value?: string;
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

  if (typeof value !== "string") {
    return {
      success: false,
      message:
        "Document title must be a string"
    };
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return {
      success: false,
      message:
        "Document title cannot be empty"
    };
  }

  if (normalized.length > 255) {
    return {
      success: false,
      message:
        "Document title is too long"
    };
  }

  return {
    success: true,
    value: normalized
  };
}

export function normalizeDescription(
  value: unknown
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
        "Document description must be a string"
    };
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return {
      success: true,
      value: null
    };
  }

  if (normalized.length > 5000) {
    return {
      success: false,
      message:
        "Document description is too long"
    };
  }

  return {
    success: true,
    value: normalized
  };
}

export function validateUploadedFile(
  file: Express.Multer.File
):
  | {
      success: true;
      extension: string;
      originalFileName: string;
    }
  | {
      success: false;
      message: string;
    } {
  if (
    !file.originalname ||
    !file.mimetype ||
    !file.buffer
  ) {
    return {
      success: false,
      message:
        "Invalid uploaded file"
    };
  }

  const extension =
    path.extname(
      file.originalname
    ).toLowerCase();

  if (!extension) {
    return {
      success: false,
      message:
        "File extension is required"
    };
  }

  if (
    FORBIDDEN_EXTENSIONS.has(
      extension
    )
  ) {
    return {
      success: false,
      message:
        "Unsupported file type"
    };
  }

  if (
    !ALLOWED_MIME_TYPES.has(
      file.mimetype
    )
  ) {
    return {
      success: false,
      message:
        "Unsupported file type"
    };
  }

  const allowedExtensions =
    MIME_EXTENSION_MAP[
      file.mimetype
    ];

  if (
    !allowedExtensions ||
    !allowedExtensions.includes(
      extension
    )
  ) {
    return {
      success: false,
      message:
        "File extension does not match MIME type"
    };
  }

  const safeOriginalFileName =
    path.basename(
      file.originalname
    );

  if (
    !safeOriginalFileName ||
    safeOriginalFileName.length > 255
  ) {
    return {
      success: false,
      message:
        "Invalid file name"
    };
  }

  return {
    success: true,
    extension,
    originalFileName:
      safeOriginalFileName
  };
}

export function validateDocumentSearch(
  value: unknown
):
  | {
      success: true;
      value?: string;
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

  if (typeof value !== "string") {
    return {
      success: false,
      message:
        "Invalid document search"
    };
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return {
      success: true
    };
  }

  if (normalized.length > 200) {
    return {
      success: false,
      message:
        "Document search is too long"
    };
  }

  return {
    success: true,
    value: normalized
  };
}

export function validateMimeTypeFilter(
  value: unknown
):
  | {
      success: true;
      value?: string;
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

  if (
    typeof value !== "string" ||
    !ALLOWED_MIME_TYPES.has(value)
  ) {
    return {
      success: false,
      message:
        "Invalid MIME type"
    };
  }

  return {
    success: true,
    value
  };
}

export function defaultDocumentTitle(
  originalFileName: string
) {
  const extension =
    path.extname(
      originalFileName
    );

  const baseName =
    path.basename(
      originalFileName,
      extension
    );

  const normalized =
    baseName
      .replace(
        /[_-]+/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return (
    normalized ||
    "Untitled Document"
  ).slice(0, 255);
}