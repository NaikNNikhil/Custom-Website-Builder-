import { randomUUID } from "node:crypto";
import { database } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../middleware/error.middleware";
import { uuidSchema } from "../../utils/validation";
import {
  requireOrganizationMembership,
  resolveWebsiteOrganizationId,
} from "../organizations/org-access";
import { createMediaStorageProvider } from "./storage/cloudinary.provider";

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const mediaSelect = {
  id: true,
  websiteId: true,
  kind: true,
  filename: true,
  mimeType: true,
  byteSize: true,
  width: true,
  height: true,
  url: true,
  provider: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toMediaDto(asset: {
  id: string;
  websiteId: string;
  kind: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  url: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: asset.id,
    websiteId: asset.websiteId,
    kind: asset.kind,
    filename: asset.filename,
    mimeType: asset.mimeType,
    byteSize: asset.byteSize,
    width: asset.width,
    height: asset.height,
    url: asset.url,
    provider: asset.provider,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  };
}

function dataReferencesMedia(data: unknown, mediaAssetId: string): boolean {
  if (!data || typeof data !== "object") return false;
  if (Array.isArray(data)) {
    return data.some((entry) => dataReferencesMedia(entry, mediaAssetId));
  }
  const record = data as Record<string, unknown>;
  if (record.mediaAssetId === mediaAssetId) return true;
  return Object.values(record).some((value) => dataReferencesMedia(value, mediaAssetId));
}

async function resolveMediaAccess(mediaAssetId: string) {
  const asset = await database.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    select: {
      id: true,
      websiteId: true,
      provider: true,
      providerId: true,
      website: { select: { organizationId: true } },
    },
  });

  if (!asset) {
    throw new AppError(404, "Media asset not found");
  }

  return {
    mediaAssetId: asset.id,
    websiteId: asset.websiteId,
    organizationId: asset.website.organizationId,
    provider: asset.provider,
    providerId: asset.providerId,
  };
}

export const mediaService = {
  async listForWebsite(userId: string, websiteId: string) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const assets = await database.mediaAsset.findMany({
      where: { websiteId },
      select: mediaSelect,
      orderBy: { createdAt: "desc" },
    });

    return assets.map(toMediaDto);
  },

  async getById(userId: string, mediaAssetId: string) {
    const access = await resolveMediaAccess(mediaAssetId);
    await requireOrganizationMembership(userId, access.organizationId);

    const asset = await database.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: mediaSelect,
    });
    if (!asset) {
      throw new AppError(404, "Media asset not found");
    }
    return toMediaDto(asset);
  },

  async upload(
    userId: string,
    websiteId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new AppError(400, "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF");
    }

    if (file.size <= 0 || file.size > env.mediaMaxUploadBytes) {
      throw new AppError(
        400,
        `File exceeds max upload size of ${env.mediaMaxUploadBytes} bytes`,
      );
    }

    const storage = createMediaStorageProvider();
    const folder = `${env.cloudinaryFolder}/websites/${websiteId}`;
    const uploaded = await storage.uploadImage({
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      folder,
    });

    try {
      const asset = await database.mediaAsset.create({
        data: {
          id: randomUUID(),
          websiteId,
          kind: "image",
          filename: file.originalname.slice(0, 255),
          mimeType: uploaded.mimeType,
          byteSize: uploaded.byteSize,
          width: uploaded.width,
          height: uploaded.height,
          url: uploaded.url,
          provider: uploaded.provider,
          providerId: uploaded.providerId,
          providerMeta: uploaded.providerMeta as object,
        },
        select: mediaSelect,
      });
      return toMediaDto(asset);
    } catch (error) {
      try {
        await storage.deleteObject(uploaded.providerId);
      } catch {
        // best-effort cleanup
      }
      throw error;
    }
  },

  async usage(userId: string, mediaAssetId: string) {
    const access = await resolveMediaAccess(mediaAssetId);
    await requireOrganizationMembership(userId, access.organizationId);

    const [nodes, libraryItems] = await Promise.all([
      database.node.findMany({
        where: { section: { page: { websiteId: access.websiteId } } },
        select: { id: true, type: true, data: true },
      }),
      database.libraryItem.findMany({
        where: { websiteId: access.websiteId },
        select: { id: true, name: true, definition: true },
      }),
    ]);

    const nodeRefs = nodes.filter((node) => dataReferencesMedia(node.data, mediaAssetId));
    const libraryRefs = libraryItems.filter((item) =>
      dataReferencesMedia(item.definition, mediaAssetId),
    );

    return {
      mediaAssetId,
      nodeCount: nodeRefs.length,
      libraryItemCount: libraryRefs.length,
      canDeleteSafely: nodeRefs.length === 0 && libraryRefs.length === 0,
      nodes: nodeRefs.map((node) => ({ id: node.id, type: node.type })),
      libraryItems: libraryRefs.map((item) => ({ id: item.id, name: item.name })),
    };
  },

  async remove(userId: string, mediaAssetId: string, force = false) {
    const access = await resolveMediaAccess(mediaAssetId);
    await requireOrganizationMembership(userId, access.organizationId);

    const usage = await this.usage(userId, mediaAssetId);
    if (!usage.canDeleteSafely && !force) {
      throw new AppError(
        409,
        `Media asset is in use (${usage.nodeCount} node(s), ${usage.libraryItemCount} library item(s)). Confirm force delete to clear references.`,
      );
    }

    if (force && !usage.canDeleteSafely) {
      const nodes = await database.node.findMany({
        where: { section: { page: { websiteId: access.websiteId } } },
        select: { id: true, data: true },
      });

      await database.$transaction(
        nodes
          .filter((node) => dataReferencesMedia(node.data, mediaAssetId))
          .map((node) => {
            const data = { ...(node.data as Record<string, unknown>) };
            if (data.mediaAssetId === mediaAssetId) {
              data.mediaAssetId = null;
              // Clear legacy src if it pointed at nothing meaningful after detach
              if (typeof data.src === "string") {
                data.src = "";
              }
            }
            return database.node.update({
              where: { id: node.id },
              data: { data: data as object },
            });
          }),
      );

      // Library definitions: clear mediaAssetId fields (preserve tree/styles)
      const libraryItems = await database.libraryItem.findMany({
        where: { websiteId: access.websiteId },
        select: { id: true, definition: true, version: true },
      });

      function scrubDefinition(value: unknown): unknown {
        if (!value || typeof value !== "object") return value;
        if (Array.isArray(value)) return value.map(scrubDefinition);
        const record = { ...(value as Record<string, unknown>) };
        if (record.mediaAssetId === mediaAssetId) {
          record.mediaAssetId = null;
          if (typeof record.src === "string") record.src = "";
        }
        if (record.data && typeof record.data === "object") {
          record.data = scrubDefinition(record.data);
        }
        if (Array.isArray(record.children)) {
          record.children = record.children.map(scrubDefinition);
        }
        return record;
      }

      for (const item of libraryItems) {
        if (!dataReferencesMedia(item.definition, mediaAssetId)) continue;
        await database.libraryItem.update({
          where: { id: item.id },
          data: {
            definition: scrubDefinition(item.definition) as object,
            version: item.version + 1,
          },
        });
      }
    }

    const storage = createMediaStorageProvider();
    try {
      await storage.deleteObject(access.providerId);
    } catch {
      // DB delete still proceeds; orphaned provider object is acceptable for V1 cleanup retry
    }

    await database.mediaAsset.delete({ where: { id: mediaAssetId } });
    return { success: true as const, detached: !usage.canDeleteSafely || force };
  },

  /** Validate that mediaAssetId belongs to website (for node updates). */
  async assertMediaBelongsToWebsite(mediaAssetId: string, websiteId: string) {
    const asset = await database.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: { id: true, websiteId: true },
    });
    if (!asset || asset.websiteId !== websiteId) {
      throw new AppError(400, "Media asset must belong to the same website");
    }
  },

  parseId(raw: string) {
    return uuidSchema.parse(raw);
  },
};
