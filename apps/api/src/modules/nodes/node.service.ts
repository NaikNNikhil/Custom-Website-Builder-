import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  isRegisteredNodeType,
  mergeNodeData,
  parseLibraryNodeDefinition,
  resolveLibraryDataForNode,
} from "@custom-website-builder/node-registry";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import { uuidSchema } from "../../utils/validation";
import {
  requireOrganizationMembership,
  resolveNodeAccess,
  resolveSectionAccess,
} from "../organizations/org-access";
import { mediaService } from "../media/media.service";
import { reorderSchema } from "../pages/page.service";
import {
  assertNodeTypeChangeAllowed,
  assertValidNodePayload,
  defaultDataForType,
  resolveParentNodeType,
} from "./node-registry.service";

export const createNodeSchema = z.object({
  type: z
    .string()
    .trim()
    .min(1, "Node type is required")
    .max(120)
    .refine((value) => isRegisteredNodeType(value), "Unsupported node type"),
  name: z.string().trim().min(1).max(160).nullable().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  parentId: uuidSchema.nullable().optional(),
});

export const updateNodeSchema = z.object({
  type: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .refine((value) => isRegisteredNodeType(value), "Unsupported node type")
    .optional(),
  name: z.string().trim().min(1).max(160).nullable().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  parentId: uuidSchema.nullable().optional(),
}).refine(
  (value) =>
    value.type !== undefined ||
    value.name !== undefined ||
    value.data !== undefined ||
    value.parentId !== undefined,
  { message: "At least one field is required" },
);

export { reorderSchema };

const nodeSelect = {
  id: true,
  sectionId: true,
  parentId: true,
  type: true,
  name: true,
  data: true,
  sortOrder: true,
  libraryItemId: true,
  libraryItemVersion: true,
  libraryNodeKey: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function assertMediaAssetReference(
  websiteId: string,
  data: Record<string, unknown> | undefined,
) {
  const mediaAssetId = data?.mediaAssetId;
  if (mediaAssetId === undefined || mediaAssetId === null || mediaAssetId === "") {
    return;
  }
  if (typeof mediaAssetId !== "string") {
    throw new AppError(400, "mediaAssetId must be a UUID string or null");
  }
  await mediaService.assertMediaBelongsToWebsite(mediaAssetId, websiteId);
}

async function assertValidNodeParent(
  sectionId: string,
  nodeId: string | null | undefined,
  parentId: string | null | undefined,
) {
  if (parentId === undefined) {
    return;
  }

  if (parentId === null) {
    return;
  }

  if (nodeId && parentId === nodeId) {
    throw new AppError(400, "Node cannot be its own parent");
  }

  const parent = await database.node.findUnique({
    where: { id: parentId },
    select: { id: true, sectionId: true, parentId: true },
  });

  if (!parent || parent.sectionId !== sectionId) {
    throw new AppError(400, "Parent node must belong to the same section");
  }

  if (!nodeId) {
    return;
  }

  let cursor: string | null = parent.parentId;
  const visited = new Set<string>([parent.id]);

  while (cursor) {
    if (cursor === nodeId) {
      throw new AppError(400, "Cannot move node under its descendant");
    }

    if (visited.has(cursor)) {
      break;
    }

    visited.add(cursor);
    const next = await database.node.findUnique({
      where: { id: cursor },
      select: { parentId: true },
    });
    cursor = next?.parentId ?? null;
  }
}

export const nodeService = {
  async listForSection(userId: string, sectionId: string) {
    const access = await resolveSectionAccess(sectionId);
    await requireOrganizationMembership(userId, access.organizationId);

    return database.node.findMany({
      where: { sectionId },
      select: nodeSelect,
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    });
  },

  async create(userId: string, sectionId: string, input: z.infer<typeof createNodeSchema>) {
    const access = await resolveSectionAccess(sectionId);
    await requireOrganizationMembership(userId, access.organizationId);

    const parsed = createNodeSchema.parse(input);
    const parentId = parsed.parentId ?? null;
    await assertValidNodeParent(sectionId, null, parentId);

    const parentType = await resolveParentNodeType(sectionId, parentId);
    const normalizedData = assertValidNodePayload({
      type: parsed.type,
      data: parsed.data ?? defaultDataForType(parsed.type),
      parentType,
    });
    await assertMediaAssetReference(
      access.websiteId,
      normalizedData as Record<string, unknown>,
    );

    const siblingCount = await database.node.count({
      where: { sectionId, parentId },
    });

    return database.node.create({
      data: {
        id: randomUUID(),
        sectionId,
        parentId,
        type: parsed.type,
        name: parsed.name ?? null,
        data: normalizedData as object,
        sortOrder: siblingCount,
      },
      select: nodeSelect,
    });
  },

  async update(userId: string, nodeId: string, input: z.infer<typeof updateNodeSchema>) {
    const access = await resolveNodeAccess(nodeId);
    await requireOrganizationMembership(userId, access.organizationId);

    const existing = await database.node.findUnique({
      where: { id: nodeId },
      select: nodeSelect,
    });

    if (!existing) {
      throw new AppError(404, "Node not found");
    }

    const parsed = updateNodeSchema.parse(input);

    if (parsed.parentId !== undefined) {
      await assertValidNodeParent(access.sectionId, nodeId, parsed.parentId);
    }

    const nextType = parsed.type ?? existing.type;
    const nextParentId = parsed.parentId !== undefined ? parsed.parentId : existing.parentId;
    const overrideData =
      parsed.data !== undefined ? parsed.data : (existing.data as Record<string, unknown>);

    if (parsed.type !== undefined && parsed.type !== existing.type) {
      await assertNodeTypeChangeAllowed(nodeId, parsed.type);
    }

    let dataForValidation: Record<string, unknown> = overrideData;
    if (existing.libraryItemId && existing.libraryNodeKey) {
      const libraryItem = await database.libraryItem.findUnique({
        where: { id: existing.libraryItemId },
        select: { id: true, version: true, definition: true, websiteId: true },
      });
      if (libraryItem) {
        const siblings = await database.libraryItem.findMany({
          where: { websiteId: libraryItem.websiteId },
          select: { id: true, version: true, definition: true },
        });
        const lookup = new Map(
          siblings.map((item) => [
            item.id,
            {
              id: item.id,
              version: item.version,
              definition: parseLibraryNodeDefinition(item.definition),
            },
          ]),
        );
        const libraryData = resolveLibraryDataForNode({
          libraryItemId: existing.libraryItemId,
          libraryNodeKey: existing.libraryNodeKey,
          lookup,
        });
        dataForValidation = mergeNodeData(libraryData ?? {}, overrideData);
      }
    }

    const parentType = await resolveParentNodeType(access.sectionId, nextParentId);
    const normalizedForValidation = assertValidNodePayload({
      type: nextType,
      data: dataForValidation,
      parentType,
    });
    await assertMediaAssetReference(
      access.websiteId,
      normalizedForValidation as Record<string, unknown>,
    );

    // Linked instances store sparse overrides only (do not bake library/defaults into data).
    const dataToStore = existing.libraryItemId
      ? (overrideData as object)
      : (normalizedForValidation as object);

    const siblingCount =
      parsed.parentId !== undefined
        ? await database.node.count({
            where: {
              sectionId: access.sectionId,
              parentId: parsed.parentId,
              id: { not: nodeId },
            },
          })
        : undefined;

    return database.node.update({
      where: { id: nodeId },
      data: {
        ...(parsed.type !== undefined ? { type: parsed.type } : {}),
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        data: dataToStore,
        ...(parsed.parentId !== undefined
          ? { parentId: parsed.parentId, sortOrder: siblingCount }
          : {}),
      },
      select: nodeSelect,
    });
  },

  async remove(userId: string, nodeId: string) {
    const access = await resolveNodeAccess(nodeId);
    await requireOrganizationMembership(userId, access.organizationId);

    await database.node.delete({ where: { id: nodeId } });
    return { success: true as const };
  },

  async reorder(userId: string, sectionId: string, parentId: string | null, orderedIds: string[]) {
    const access = await resolveSectionAccess(sectionId);
    await requireOrganizationMembership(userId, access.organizationId);

    const siblings = await database.node.findMany({
      where: { sectionId, parentId },
      select: { id: true },
    });

    const siblingIds = new Set(siblings.map((node) => node.id));
    if (siblingIds.size !== orderedIds.length || orderedIds.some((id) => !siblingIds.has(id))) {
      throw new AppError(400, "orderedIds must include every sibling node exactly once");
    }

    await database.$transaction(
      orderedIds.map((id, index) =>
        database.node.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return database.node.findMany({
      where: { sectionId, parentId },
      select: nodeSelect,
      orderBy: { sortOrder: "asc" },
    });
  },

  parseId(raw: string) {
    return uuidSchema.parse(raw);
  },
};
