import { randomUUID } from "node:crypto";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import {
  requireOrganizationMembership,
  resolveWebsiteOrganizationId,
} from "../organizations/org-access";
import {
  buildDraftSnapshot,
  hashPublishedSnapshot,
  type PublishedWebsiteSnapshot,
} from "./draft-snapshot";
import { validateDraftSnapshot } from "./publish-validate";

export type PublicationStatus = {
  hasPublishedVersion: boolean;
  currentVersion: number | null;
  publishedAt: string | null;
  contentHash: string | null;
  draftContentHash: string;
  draftDiffersFromPublished: boolean;
};

async function loadPublicationStatus(websiteId: string): Promise<PublicationStatus> {
  const draft = await buildDraftSnapshot(websiteId);
  const draftContentHash = hashPublishedSnapshot(draft);

  const website = await database.website.findUnique({
    where: { id: websiteId },
    select: {
      currentPublishedVersionId: true,
      currentPublishedVersion: {
        select: {
          version: true,
          publishedAt: true,
          contentHash: true,
        },
      },
    },
  });

  const current = website?.currentPublishedVersion ?? null;

  return {
    hasPublishedVersion: Boolean(current),
    currentVersion: current?.version ?? null,
    publishedAt: current?.publishedAt?.toISOString() ?? null,
    contentHash: current?.contentHash ?? null,
    draftContentHash,
    draftDiffersFromPublished: !current || current.contentHash !== draftContentHash,
  };
}

export const publishService = {
  async getPublicationStatus(userId: string, websiteId: string) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);
    return loadPublicationStatus(websiteId);
  },

  async validateDraft(userId: string, websiteId: string) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const draft = await buildDraftSnapshot(websiteId);
    const validation = validateDraftSnapshot(draft);
    return {
      ok: validation.ok,
      issues: validation.issues,
      draftContentHash: hashPublishedSnapshot(draft),
    };
  },

  async publish(userId: string, websiteId: string) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const draft = await buildDraftSnapshot(websiteId);
    const validation = validateDraftSnapshot(draft);
    if (!validation.ok) {
      throw new AppError(
        400,
        `Draft validation failed: ${validation.issues[0]?.message ?? "invalid draft"}`,
      );
    }

    const contentHash = hashPublishedSnapshot(draft);
    const snapshot: PublishedWebsiteSnapshot = structuredClone(draft);

    const latest = await database.publishedVersion.findFirst({
      where: { websiteId },
      orderBy: { version: "desc" },
      select: { version: true, contentHash: true },
    });

    if (latest && latest.contentHash === contentHash) {
      // Idempotent: draft already matches latest published content
      const current = await database.website.findUnique({
        where: { id: websiteId },
        select: {
          currentPublishedVersion: {
            select: {
              id: true,
              version: true,
              contentHash: true,
              publishedAt: true,
            },
          },
        },
      });
      if (current?.currentPublishedVersion?.contentHash === contentHash) {
        return {
          publishedVersion: {
            id: current.currentPublishedVersion.id,
            version: current.currentPublishedVersion.version,
            contentHash: current.currentPublishedVersion.contentHash,
            publishedAt: current.currentPublishedVersion.publishedAt,
          },
          reused: true as const,
        };
      }
    }

    const nextVersion = (latest?.version ?? 0) + 1;
    const publishedId = randomUUID();

    try {
      await database.$transaction(async (tx) => {
        await tx.publishedVersion.create({
          data: {
            id: publishedId,
            websiteId,
            version: nextVersion,
            contentHash,
            snapshot: snapshot as object,
            publishedByUserId: userId,
          },
        });

        await tx.website.update({
          where: { id: websiteId },
          data: { currentPublishedVersionId: publishedId },
        });
      });
    } catch (error) {
      // Existing current published version remains unchanged
      throw new AppError(
        500,
        error instanceof Error ? error.message : "Publish failed; previous published version unchanged",
      );
    }

    const created = await database.publishedVersion.findUnique({
      where: { id: publishedId },
      select: {
        id: true,
        version: true,
        contentHash: true,
        publishedAt: true,
      },
    });

    if (!created) {
      throw new AppError(500, "Publish failed; previous published version unchanged");
    }

    return {
      publishedVersion: created,
      reused: false as const,
    };
  },

  async getCurrentPublished(userId: string, websiteId: string) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);
    return this.getCurrentPublishedPublic(websiteId);
  },

  /**
   * Public retrieval by website id.
   * Never returns mutable draft data.
   */
  async getCurrentPublishedPublic(websiteId: string) {
    const website = await database.website.findUnique({
      where: { id: websiteId },
      select: {
        id: true,
        name: true,
        slug: true,
        currentPublishedVersion: {
          select: {
            id: true,
            version: true,
            contentHash: true,
            publishedAt: true,
            snapshot: true,
          },
        },
      },
    });

    if (!website) {
      throw new AppError(404, "Website not found");
    }

    if (!website.currentPublishedVersion) {
      throw new AppError(404, "Website is not published");
    }

    return this.toPublicPayload(website);
  },

  /**
   * Public retrieval by website slug.
   * Only published websites are visible. Never returns draft.
   */
  async getCurrentPublishedBySlug(slug: string) {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) {
      throw new AppError(404, "Website not found");
    }

    const publishedMatches = await database.website.findMany({
      where: {
        slug: normalized,
        currentPublishedVersionId: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        currentPublishedVersion: {
          select: {
            id: true,
            version: true,
            contentHash: true,
            publishedAt: true,
            snapshot: true,
          },
        },
      },
      take: 2,
    });

    if (publishedMatches.length > 1) {
      throw new AppError(409, "Ambiguous website slug");
    }

    if (publishedMatches.length === 1 && publishedMatches[0]?.currentPublishedVersion) {
      return this.toPublicPayload(publishedMatches[0]);
    }

    const unpublished = await database.website.findFirst({
      where: { slug: normalized },
      select: { id: true },
    });

    if (unpublished) {
      throw new AppError(404, "Website is not published");
    }

    throw new AppError(404, "Website not found");
  },

  toPublicPayload(website: {
    id: string;
    name: string;
    slug: string;
    currentPublishedVersion: {
      id: string;
      version: number;
      contentHash: string;
      publishedAt: Date;
      snapshot: unknown;
    } | null;
  }) {
    if (!website.currentPublishedVersion) {
      throw new AppError(404, "Website is not published");
    }

    return {
      website: {
        id: website.id,
        name: website.name,
        slug: website.slug,
      },
      publishedVersion: {
        id: website.currentPublishedVersion.id,
        version: website.currentPublishedVersion.version,
        contentHash: website.currentPublishedVersion.contentHash,
        publishedAt: website.currentPublishedVersion.publishedAt,
        snapshot: website.currentPublishedVersion.snapshot as PublishedWebsiteSnapshot,
      },
    };
  },
};
