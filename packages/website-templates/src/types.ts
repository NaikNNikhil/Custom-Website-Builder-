import type { WebsiteTheme } from "@custom-website-builder/node-registry";

/**
 * Platform template catalog entry (summary).
 * Full blueprint lives in code — not org/website-owned DB rows.
 */
export type TemplateCatalogEntry = {
  id: string;
  name: string;
  description: string;
  version: number;
};

/**
 * Template-local library node. `libraryItemKey` remaps to real UUIDs on website copy.
 */
export type TemplateLibraryNode = {
  key: string;
  type: string;
  name?: string | null;
  data: Record<string, unknown>;
  children: TemplateLibraryNode[];
  libraryItemKey?: string | null;
};

export type TemplateLibraryItem = {
  /** Stable key within the template (not a DB id). */
  key: string;
  name: string;
  category?: string | null;
  definition: TemplateLibraryNode;
};

/**
 * Template media blueprint. Copied into website-owned MediaAsset rows
 * with provider "template" — no cross-tenant MediaAsset FKs.
 */
export type TemplateMediaAsset = {
  key: string;
  kind: "image";
  filename: string;
  url: string;
  mimeType: string;
  byteSize: number;
  width?: number | null;
  height?: number | null;
};

export type TemplateNode = {
  type: string;
  name?: string | null;
  /**
   * Node data. May include `mediaAssetKey` (template-local);
   * remapped to `mediaAssetId` on copy.
   */
  data: Record<string, unknown>;
  /** Link to template library item key (becomes website libraryItemId). */
  libraryItemKey?: string | null;
  libraryNodeKey?: string | null;
  children?: TemplateNode[];
};

export type TemplateSection = {
  name: string;
  sortOrder: number;
  nodes: TemplateNode[];
};

export type TemplatePage = {
  title: string;
  slug: string;
  sortOrder: number;
  sections: TemplateSection[];
  children?: TemplatePage[];
};

export type WebsiteTemplateDefinition = TemplateCatalogEntry & {
  theme: WebsiteTheme;
  libraryItems: TemplateLibraryItem[];
  mediaAssets: TemplateMediaAsset[];
  pages: TemplatePage[];
};
