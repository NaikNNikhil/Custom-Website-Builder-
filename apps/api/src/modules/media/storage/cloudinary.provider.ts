import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { Readable } from "node:stream";
import { env } from "../../../config/env";
import { AppError } from "../../../middleware/error.middleware";
import type {
  MediaStorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from "./storage.types";

function assertCloudinaryConfigured() {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new AppError(
      503,
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
}

function configureCloudinary() {
  assertCloudinaryConfigured();
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

export class CloudinaryStorageProvider implements MediaStorageProvider {
  readonly name = "cloudinary";

  async uploadImage(input: StorageUploadInput): Promise<StorageUploadResult> {
    configureCloudinary();

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: input.folder,
          resource_type: "image",
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve(uploaded);
        },
      );

      Readable.from(input.buffer).pipe(upload);
    });

    return {
      provider: this.name,
      providerId: result.public_id,
      url: result.secure_url,
      mimeType: input.mimeType,
      byteSize: result.bytes ?? input.buffer.byteLength,
      width: result.width ?? null,
      height: result.height ?? null,
      providerMeta: {
        format: result.format ?? null,
        resourceType: result.resource_type ?? "image",
      },
    };
  }

  async deleteObject(providerId: string): Promise<void> {
    configureCloudinary();
    await cloudinary.uploader.destroy(providerId, { resource_type: "image" });
  }
}

export function createMediaStorageProvider(): MediaStorageProvider {
  return new CloudinaryStorageProvider();
}
