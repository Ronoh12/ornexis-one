import type {
  ErrorRequestHandler
} from "express";

import multer from "multer";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (
    error instanceof multer.MulterError
  ) {
    if (
      error.code === "LIMIT_FILE_SIZE"
    ) {
      res.status(413).json({
        success: false,
        message:
          "Uploaded file exceeds the maximum allowed size"
      });

      return;
    }

    if (
      error.code === "LIMIT_FILE_COUNT" ||
      error.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid document upload request"
      });

      return;
    }

    res.status(400).json({
      success: false,
      message:
        "Document upload failed"
    });

    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};