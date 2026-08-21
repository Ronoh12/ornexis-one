import { LocalStorageProvider } from "./localStorageProvider.js";

import type {
  SaveFileInput,
  StorageProvider
} from "./storageProvider.js";

const localStorageProvider =
  new LocalStorageProvider();

function getConfiguredProvider():
  StorageProvider {
  const provider =
    process.env.DOCUMENT_STORAGE_PROVIDER ??
    "LOCAL";

  switch (provider) {
    case "LOCAL":
      return localStorageProvider;

    case "S3":
      throw new Error(
        "S3 document storage is not implemented"
      );

    case "AZURE_BLOB":
      throw new Error(
        "Azure Blob document storage is not implemented"
      );

    default:
      throw new Error(
        `Unsupported document storage provider: ${provider}`
      );
  }
}

export async function saveDocumentFile(
  input: SaveFileInput
) {
  return getConfiguredProvider().save(
    input
  );
}

export async function readDocumentFile(
  storageKey: string
) {
  return getConfiguredProvider().read(
    storageKey
  );
}

export async function deleteDocumentFile(
  storageKey: string
) {
  return getConfiguredProvider().delete(
    storageKey
  );
}

export async function documentFileExists(
  storageKey: string
) {
  return getConfiguredProvider().exists(
    storageKey
  );
}