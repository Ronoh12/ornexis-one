export type SaveFileInput = {
  organizationId: string;
  storedFileName: string;
  buffer: Buffer;
};

export type SavedFile = {
  storageKey: string;
  sizeBytes: bigint;
};

export interface StorageProvider {
  save(input: SaveFileInput): Promise<SavedFile>;

  read(storageKey: string): Promise<Buffer>;

  delete(storageKey: string): Promise<void>;

  exists(storageKey: string): Promise<boolean>;
}