import { randomUUID } from "node:crypto";
import { z } from "zod";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import { uuidSchema } from "../../utils/validation";
import {
  requireOrganizationMembership,
  resolvePageAccess,
  resolveSectionAccess,
} from "../organizations/org-access";
import { reorderSchema } from "../pages/page.service";

export const createSectionSchema = z.object({
  name: z.string().trim().min(1, "Section name is required").max(160),
});

export const updateSectionSchema = z.object({
  name: z.string().trim().min(1).max(160),
});

export { reorderSchema };

const sectionSelect = {
  id: true,
  pageId: true,
  name: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const sectionService = {
  async listForPage(userId: string, pageId: string) {
    const access = await resolvePageAccess(pageId);
    await requireOrganizationMembership(userId, access.organizationId);

    return database.section.findMany({
      where: { pageId },
      select: sectionSelect,
      orderBy: { sortOrder: "asc" },
    });
  },

  async create(userId: string, pageId: string, input: z.infer<typeof createSectionSchema>) {
    const access = await resolvePageAccess(pageId);
    await requireOrganizationMembership(userId, access.organizationId);

    const parsed = createSectionSchema.parse(input);
    const count = await database.section.count({ where: { pageId } });

    return database.section.create({
      data: {
        id: randomUUID(),
        pageId,
        name: parsed.name,
        sortOrder: count,
      },
      select: sectionSelect,
    });
  },

  async update(userId: string, sectionId: string, input: z.infer<typeof updateSectionSchema>) {
    const access = await resolveSectionAccess(sectionId);
    await requireOrganizationMembership(userId, access.organizationId);

    const parsed = updateSectionSchema.parse(input);

    return database.section.update({
      where: { id: sectionId },
      data: { name: parsed.name },
      select: sectionSelect,
    });
  },

  async remove(userId: string, sectionId: string) {
    const access = await resolveSectionAccess(sectionId);
    await requireOrganizationMembership(userId, access.organizationId);

    await database.section.delete({ where: { id: sectionId } });
    return { success: true as const };
  },

  async reorder(userId: string, pageId: string, orderedIds: string[]) {
    const access = await resolvePageAccess(pageId);
    await requireOrganizationMembership(userId, access.organizationId);

    const sections = await database.section.findMany({
      where: { pageId },
      select: { id: true },
    });

    const sectionIds = new Set(sections.map((section) => section.id));
    if (sectionIds.size !== orderedIds.length || orderedIds.some((id) => !sectionIds.has(id))) {
      throw new AppError(400, "orderedIds must include every section exactly once");
    }

    await database.$transaction(
      orderedIds.map((id, index) =>
        database.section.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return database.section.findMany({
      where: { pageId },
      select: sectionSelect,
      orderBy: { sortOrder: "asc" },
    });
  },

  parseId(raw: string) {
    return uuidSchema.parse(raw);
  },
};
