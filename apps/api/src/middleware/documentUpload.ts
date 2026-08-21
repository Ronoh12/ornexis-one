import multer from "multer";

const DEFAULT_MAX_FILE_SIZE =
  10 * 1024 * 1024;

function getMaximumFileSize() {
  const configuredValue =
    process.env.DOCUMENT_MAX_FILE_SIZE_BYTES;

  if (!configuredValue) {
    return DEFAULT_MAX_FILE_SIZE;
  }

  const parsedValue =
    Number(configuredValue);

  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    return DEFAULT_MAX_FILE_SIZE;
  }

  return parsedValue;
}

export const documentUpload =
  multer({
    storage: multer.memoryStorage(),

    limits: {
      fileSize: getMaximumFileSize(),
      files: 1
    }
  });