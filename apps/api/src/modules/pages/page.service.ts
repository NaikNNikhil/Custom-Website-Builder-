import { randomUUID } from "node:crypto";
import { z } from "zod";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import { slugSchema, toSlug, uuidSchema } from "../../utils/validation";
import {
  requireOrganizationMembership,
  resolvePageAccess,
  resolveWebsiteOrganizationId,
} from "../organizations/org-access";

export const createPageSchema = z.object({
  title: z.string().trim().min(1, "Page title is required").max(160),
  slug: slugSchema.optional(),
  parentId: uuidSchema.nullable().optional(),
});

export const updatePageSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  slug: slugSchema.optional(),
  parentId: uuidSchema.nullable().optional(),
}).refine((value) => value.title !== undefined || value.slug !== undefined || value.parentId !== undefined, {
  message: "At least one field is required",
});

export const reorderSchema = z.object({
  orderedIds: z.array(uuidSchema).min(1, "orderedIds is required"),
});

const pageSelect = {
  id: true,
  websiteId: true,
  parentId: true,
  title: true,
  slug: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function ensureUniquePageSlug(websiteId: string, baseSlug: string, excludeId?: string): Promise<string> {
  let candidate = baseSlug || "page";
  let suffix = 0;

  while (true) {
    const existing = await database.page.findUnique({
      where: {
        websiteId_slug: {
          websiteId,
          slug: candidate,
        },
      },
    });

    if (!existing || existing.id === excludeId) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug.slice(0, Math.max(1, 160 - String(suffix).length - 1))}-${suffix}`;
  }
}

async function assertValidPageParent(websiteId: string, pageId: string | null | undefined, parentId: string | null | undefined) {
  if (parentId === undefined) {
    return;
  }

  if (parentId === null) {
    return;
  }

  if (pageId && parentId === pageId) {
    throw new AppError(400, "Page cannot be its own parent");
  }

  const parent = await database.page.findUnique({
    where: { id: parentId },
    select: { id: true, websiteId: true, parentId: true },
  });

  if (!parent || parent.websiteId !== websiteId) {
    throw new AppError(400, "Parent page must belong to the same website");
  }

  if (!pageId) {
    return;
  }

  let cursor: string | null = parent.parentId;
  const visited = new Set<string>([parent.id]);

  while (cursor) {
    if (cursor === pageId) {
      throw new AppError(400, "Cannot move page under its descendant");
    }

    if (visited.has(cursor)) {
      break;
    }

    visited.add(cursor);
    const next = await database.page.findUnique({
      where: { id: cursor },
      select: { parentId: true },
    });
    cursor = next?.parentId ?? null;
  }
}

export const pageService = {
  async listForWebsite(userId: string, websiteId: string) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    return database.page.findMany({
      where: { websiteId },
      select: pageSelect,
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    });
  },

  async create(userId: string, websiteId: string, input: z.infer<typeof createPageSchema>) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const parsed = createPageSchema.parse(input);
    const parentId = parsed.parentId ?? null;
    await assertValidPageParent(websiteId, null, parentId);

    const siblingCount = await database.page.count({
      where: { websiteId, parentId },
    });

    const slug = await ensureUniquePageSlug(websiteId, parsed.slug ?? toSlug(parsed.title));

    return database.page.create({
      data: {
        id: randomUUID(),
        websiteId,
        parentId,
        title: parsed.title,
        slug,
        sortOrder: siblingCount,
      },
      select: pageSelect,
    });
  },

  async update(userId: string, pageId: string, input: z.infer<typeof updatePageSchema>) {
    const access = await resolvePageAccess(pageId);
    await requireOrganizationMembership(userId, access.organizationId);

    const parsed = updatePageSchema.parse(input);
    const data: { title?: string; slug?: string; parentId?: string | null; sortOrder?: number } = {};

    if (parsed.title !== undefined) {
      data.title = parsed.title;
    }

    if (parsed.slug !== undefined) {
      data.slug = await ensureUniquePageSlug(access.websiteId, parsed.slug, pageId);
    }

    if (parsed.parentId !== undefined) {
      await assertValidPageParent(access.websiteId, pageId, parsed.parentId);
      data.parentId = parsed.parentId;

      const siblingCount = await database.page.count({
        where: {
          websiteId: access.websiteId,
          parentId: parsed.parentId,
          id: { not: pageId },
        },
      });
      data.sortOrder = siblingCount;
    }

    return database.page.update({
      where: { id: pageId },
      data,
      select: pageSelect,
    });
  },

  async remove(userId: string, pageId: string) {
    const access = await resolvePageAccess(pageId);
    await requireOrganizationMembership(userId, access.organizationId);

    await database.page.delete({ where: { id: pageId } });
    return { success: true as const };
  },

  async reorder(userId: string, websiteId: string, parentId: string | null, orderedIds: string[]) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const siblings = await database.page.findMany({
      where: { websiteId, parentId },
      select: { id: true },
    });

    const siblingIds = new Set(siblings.map((page) => page.id));
    if (siblingIds.size !== orderedIds.length || orderedIds.some((id) => !siblingIds.has(id))) {
      throw new AppError(400, "orderedIds must include every sibling page exactly once");
    }

    await database.$transaction(
      orderedIds.map((id, index) =>
        database.page.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return database.page.findMany({
      where: { websiteId, parentId },
      select: pageSelect,
      orderBy: { sortOrder: "asc" },
    });
  },

  parseId(raw: string) {
    return uuidSchema.parse(raw);
  },
};
