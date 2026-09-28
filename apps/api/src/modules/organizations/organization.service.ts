import { randomUUID } from "node:crypto";
import { z } from "zod";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import { slugSchema, toSlug, uuidSchema } from "../../utils/validation";
import { requireOrganizationMembership } from "./org-access";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name must be at least 2 characters").max(160),
  slug: slugSchema.optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  slug: slugSchema.optional(),
}).refine((value) => value.name !== undefined || value.slug !== undefined, {
  message: "At least one field is required",
});

async function ensureUniqueOrganizationSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let candidate = baseSlug || "organization";
  let suffix = 0;

  while (true) {
    const existing = await database.organization.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    suffix += 1;
    candidate = `${baseSlug.slice(0, Math.max(1, 160 - String(suffix).length - 1))}-${suffix}`;
  }
}

const organizationSelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const organizationService = {
  async listForUser(userId: string) {
    const memberships = await database.organizationMember.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        organization: { select: organizationSelect },
      },
    });

    return memberships.map((membership) => ({
      ...membership.organization,
      membershipRole: membership.role,
    }));
  },

  async getForUser(userId: string, organizationId: string) {
    await requireOrganizationMembership(userId, organizationId);

    const organization = await database.organization.findUnique({
      where: { id: organizationId },
      select: organizationSelect,
    });

    if (!organization) {
      throw new AppError(404, "Organization not found");
    }

    return organization;
  },

  async create(userId: string, input: z.infer<typeof createOrganizationSchema>) {
    const parsed = createOrganizationSchema.parse(input);
    const slug = await ensureUniqueOrganizationSlug(parsed.slug ?? toSlug(parsed.name));

    return database.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          id: randomUUID(),
          name: parsed.name,
          slug,
        },
        select: organizationSelect,
      });

      await tx.organizationMember.create({
        data: {
          id: randomUUID(),
          organizationId: organization.id,
          userId,
          role: "OWNER",
        },
      });

      return organization;
    });
  },

  async update(userId: string, organizationId: string, input: z.infer<typeof updateOrganizationSchema>) {
    const membership = await requireOrganizationMembership(userId, organizationId);
    if (membership.role === "MEMBER") {
      throw new AppError(403, "Forbidden");
    }

    const parsed = updateOrganizationSchema.parse(input);
    const data: { name?: string; slug?: string } = {};

    if (parsed.name !== undefined) {
      data.name = parsed.name;
    }

    if (parsed.slug !== undefined) {
      data.slug = await ensureUniqueOrganizationSlug(parsed.slug, organizationId);
    }

    return database.organization.update({
      where: { id: organizationId },
      data,
      select: organizationSelect,
    });
  },

  parseOrganizationId(raw: string) {
    return uuidSchema.parse(raw);
  },
};
