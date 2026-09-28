export type StorageUploadInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  /** Provider folder / prefix hint (website-scoped path recommended). */
  folder: string;
};

export type StorageUploadResult = {
  provider: string;
  providerId: string;
  url: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  /** Opaque provider extras — not part of the public Media Asset contract. */
  providerMeta: Record<string, unknown>;
};

/**
 * Provider-independent storage boundary.
 * V1: Cloudinary. Future: S3 / others without changing Media Asset / Node models.
 */
export interface MediaStorageProvider {
  readonly name: string;
  uploadImage(input: StorageUploadInput): Promise<StorageUploadResult>;
  deleteObject(providerId: string): Promise<void>;
}
