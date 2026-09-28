import { createHash } from "node:crypto";
import {
  parseLibraryNodeDefinition,
  parseWebsiteTheme,
  type LibraryNodeDefinition,
  type WebsiteTheme,
} from "@custom-website-builder/node-registry";
import { database } from "../../config/database";
import { buildPageTree, type BuiltPageTree } from "../websites/website-tree";

export type PublishedMediaAsset = {
  id: string;
  kind: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  url: string;
  provider: string;
};

export type PublishedLibraryItem = {
  id: string;
  name: string;
  category: string | null;
  version: number;
  definition: LibraryNodeDefinition;
};

/**
 * Immutable published website payload.
 * Self-contained — public renderer must not read mutable draft tables.
 */
export type PublishedWebsiteSnapshot = {
  schemaVersion: 1;
  website: {
    id: string;
    name: string;
    slug: string;
    theme: WebsiteTheme;
  };
  pages: BuiltPageTree[];
  libraryItems: PublishedLibraryItem[];
  mediaAssets: PublishedMediaAsset[];
};

export type DraftWebsitePayload = PublishedWebsiteSnapshot;

export function hashPublishedSnapshot(snapshot: PublishedWebsiteSnapshot): string {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export async function buildDraftSnapshot(websiteId: string): Promise<DraftWebsitePayload> {
  const website = await database.website.findUnique({
    where: { id: websiteId },
    select: {
      id: true,
      name: true,
      slug: true,
      theme: true,
    },
  });

  if (!website) {
    throw new Error("Website not found");
  }

  const [pages, sections, nodes, libraryItems, mediaAssets] = await Promise.all([
    database.page.findMany({ where: { websiteId } }),
    database.section.findMany({ where: { page: { websiteId } } }),
    database.node.findMany({ where: { section: { page: { websiteId } } } }),
    database.libraryItem.findMany({
      where: { websiteId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    database.mediaAsset.findMany({
      where: { websiteId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        kind: true,
        filename: true,
        mimeType: true,
        byteSize: true,
        width: true,
        height: true,
        url: true,
        provider: true,
      },
    }),
  ]);

  return {
    schemaVersion: 1,
    website: {
      id: website.id,
      name: website.name,
      slug: website.slug,
      theme: parseWebsiteTheme(website.theme),
    },
    pages: buildPageTree(pages, sections, nodes),
    libraryItems: libraryItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      version: item.version,
      definition: parseLibraryNodeDefinition(item.definition),
    })),
    mediaAssets,
  };
}
