import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  DEFAULT_WEBSITE_THEME,
  mergeWebsiteTheme,
  parseLibraryNodeDefinition,
  parseWebsiteTheme,
  websiteThemeSchema,
  type WebsiteTheme,
} from "@custom-website-builder/node-registry";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import { slugSchema, toSlug, uuidSchema } from "../../utils/validation";
import {
  requireOrganizationMembership,
  resolveWebsiteOrganizationId,
} from "../organizations/org-access";
import { buildPageTree } from "./website-tree";
import { applyWebsiteTemplate } from "../templates/template-apply";
import { publishService } from "../publish/publish.service";

export const createWebsiteSchema = z.object({
  name: z.string().trim().min(2, "Website name must be at least 2 characters").max(160),
  slug: slugSchema.optional(),
  /** Platform template id. Optional — blank websites still allowed for existing flows. */
  templateId: z.string().trim().min(1).max(80).optional(),
});

export const updateWebsiteSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  slug: slugSchema.optional(),
}).refine((value) => value.name !== undefined || value.slug !== undefined, {
  message: "At least one field is required",
});

export const updateWebsiteThemeSchema = z.object({
  colors: websiteThemeSchema.shape.colors.partial().optional(),
  typography: websiteThemeSchema.shape.typography.partial().optional(),
  general: websiteThemeSchema.shape.general.partial().optional(),
}).refine(
  (value) => value.colors !== undefined || value.typography !== undefined || value.general !== undefined,
  { message: "At least one theme section is required" },
);

const websiteSelect = {
  id: true,
  organizationId: true,
  name: true,
  slug: true,
  theme: true,
  templateId: true,
  templateVersion: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toWebsiteDto(website: {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  theme: unknown;
  templateId: string | null;
  templateVersion: number | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: website.id,
    organizationId: website.organizationId,
    name: website.name,
    slug: website.slug,
    theme: parseWebsiteTheme(website.theme),
    templateId: website.templateId,
    templateVersion: website.templateVersion,
    createdAt: website.createdAt,
    updatedAt: website.updatedAt,
  };
}

async function ensureUniqueWebsiteSlug(organizationId: string, baseSlug: string, excludeId?: string): Promise<string> {
  let candidate = baseSlug || "website";
  let suffix = 0;

  while (true) {
    const existing = await database.website.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
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

export const websiteService = {
  async listForOrganization(userId: string, organizationId: string) {
    await requireOrganizationMembership(userId, organizationId);

    const websites = await database.website.findMany({
      where: { organizationId },
      select: websiteSelect,
      orderBy: { createdAt: "desc" },
    });

    return websites.map(toWebsiteDto);
  },

  async getForUser(userId: string, websiteId: string) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const website = await database.website.findUnique({
      where: { id: websiteId },
      select: websiteSelect,
    });

    if (!website) {
      throw new AppError(404, "Website not found");
    }

    return toWebsiteDto(website);
  },

  async create(userId: string, organizationId: string, input: z.infer<typeof createWebsiteSchema>) {
    await requireOrganizationMembership(userId, organizationId);
    const parsed = createWebsiteSchema.parse(input);
    const slug = await ensureUniqueWebsiteSlug(organizationId, parsed.slug ?? toSlug(parsed.name));

    const website = await database.website.create({
      data: {
        id: randomUUID(),
        organizationId,
        name: parsed.name,
        slug,
        theme: DEFAULT_WEBSITE_THEME,
      },
      select: websiteSelect,
    });

    if (parsed.templateId) {
      try {
        await applyWebsiteTemplate(website.id, parsed.templateId);
      } catch (error) {
        await database.website.delete({ where: { id: website.id } });
        throw error;
      }
    }

    const created = await database.website.findUnique({
      where: { id: website.id },
      select: websiteSelect,
    });

    if (!created) {
      throw new AppError(500, "Website creation failed");
    }

    return toWebsiteDto(created);
  },

  async update(userId: string, websiteId: string, input: z.infer<typeof updateWebsiteSchema>) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const parsed = updateWebsiteSchema.parse(input);
    const data: { name?: string; slug?: string } = {};

    if (parsed.name !== undefined) {
      data.name = parsed.name;
    }

    if (parsed.slug !== undefined) {
      data.slug = await ensureUniqueWebsiteSlug(organizationId, parsed.slug, websiteId);
    }

    const website = await database.website.update({
      where: { id: websiteId },
      data,
      select: websiteSelect,
    });

    return toWebsiteDto(website);
  },

  async updateTheme(userId: string, websiteId: string, input: z.infer<typeof updateWebsiteThemeSchema>) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const existing = await database.website.findUnique({
      where: { id: websiteId },
      select: { theme: true },
    });

    if (!existing) {
      throw new AppError(404, "Website not found");
    }

    const parsed = updateWebsiteThemeSchema.parse(input);
    const nextTheme: WebsiteTheme = mergeWebsiteTheme(parseWebsiteTheme(existing.theme), parsed);

    const website = await database.website.update({
      where: { id: websiteId },
      data: { theme: nextTheme },
      select: websiteSelect,
    });

    return toWebsiteDto(website);
  },

  async remove(userId: string, websiteId: string) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    await database.website.delete({ where: { id: websiteId } });
    return { success: true as const };
  },

  async getTree(userId: string, websiteId: string) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const website = await database.website.findUnique({
      where: { id: websiteId },
      select: websiteSelect,
    });

    if (!website) {
      throw new AppError(404, "Website not found");
    }

    const [pages, sections, nodes, libraryItems, mediaAssets] = await Promise.all([
      database.page.findMany({ where: { websiteId } }),
      database.section.findMany({
        where: { page: { websiteId } },
      }),
      database.node.findMany({
        where: { section: { page: { websiteId } } },
      }),
      database.libraryItem.findMany({
        where: { websiteId },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      }),
      database.mediaAsset.findMany({
        where: { websiteId },
        orderBy: { createdAt: "desc" },
        select: {
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
        },
      }),
    ]);

    return {
      ...toWebsiteDto(website),
      libraryItems: libraryItems.map((item) => ({
        id: item.id,
        websiteId: item.websiteId,
        name: item.name,
        category: item.category,
        version: item.version,
        definition: parseLibraryNodeDefinition(item.definition),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      mediaAssets,
      pages: buildPageTree(pages, sections, nodes),
      publication: await publishService.getPublicationStatus(userId, websiteId),
    };
  },

  parseId(raw: string) {
    return uuidSchema.parse(raw);
  },
};
