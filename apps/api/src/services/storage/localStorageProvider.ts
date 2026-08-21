import path from "node:path";
import {
  access,
  mkdir,
  readFile,
  unlink,
  writeFile
} from "node:fs/promises";

import type {
  SaveFileInput,
  SavedFile,
  StorageProvider
} from "./storageProvider.js";

function getStorageRoot() {
  return path.resolve(
    process.cwd(),
    process.env.DOCUMENT_STORAGE_LOCAL_ROOT ?? "uploads"
  );
}

function resolveStorageKey(storageKey: string) {
  const storageRoot = getStorageRoot();

  const resolvedPath = path.resolve(
    storageRoot,
    storageKey
  );

  const relativePath = path.relative(
    storageRoot,
    resolvedPath
  );

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Invalid storage key");
  }

  return resolvedPath;
}

export class LocalStorageProvider
  implements StorageProvider
{
  async save(
    input: SaveFileInput
  ): Promise<SavedFile> {
    const storageKey = path
      .join(
        "organizations",
        input.organizationId,
        "documents",
        input.storedFileName
      )
      .replaceAll("\\", "/");

    const absolutePath =
      resolveStorageKey(storageKey);

    await mkdir(
      path.dirname(absolutePath),
      {
        recursive: true
      }
    );

    await writeFile(
      absolutePath,
      input.buffer
    );

    return {
      storageKey,
      sizeBytes: BigInt(input.buffer.length)
    };
  }

  async read(
    storageKey: string
  ): Promise<Buffer> {
    const absolutePath =
      resolveStorageKey(storageKey);

    return readFile(absolutePath);
  }

  async delete(
    storageKey: string
  ): Promise<void> {
    const absolutePath =
      resolveStorageKey(storageKey);

    try {
      await unlink(absolutePath);
    } catch (error) {
      const nodeError =
        error as NodeJS.ErrnoException;

      if (nodeError.code !== "ENOENT") {
        throw error;
      }
    }
  }

  async exists(
    storageKey: string
  ): Promise<boolean> {
    const absolutePath =
      resolveStorageKey(storageKey);

    try {
      await access(absolutePath);

      return true;
    } catch {
      return false;
    }
  }
}