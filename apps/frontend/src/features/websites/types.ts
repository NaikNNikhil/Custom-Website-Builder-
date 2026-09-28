import type { LibraryNodeDefinition, WebsiteTheme } from "@custom-website-builder/node-registry";

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  membershipRole?: "OWNER" | "ADMIN" | "MEMBER";
};

export type { WebsiteTheme };

export type WebsiteRecord = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  theme: WebsiteTheme;
  templateId?: string | null;
  templateVersion?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TemplateCatalogEntry = {
  id: string;
  name: string;
  description: string;
  version: number;
};

export type PageRecord = {
  id: string;
  websiteId: string;
  parentId: string | null;
  title: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SectionRecord = {
  id: string;
  pageId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type NodeRecord = {
  id: string;
  sectionId: string;
  parentId: string | null;
  type: string;
  name: string | null;
  data: Record<string, unknown>;
  sortOrder: number;
  libraryItemId?: string | null;
  libraryItemVersion?: number | null;
  libraryNodeKey?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryItemRecord = {
  id: string;
  websiteId: string;
  name: string;
  category: string | null;
  version: number;
  definition: LibraryNodeDefinition;
  createdAt: string;
  updatedAt: string;
};

export type MediaAssetRecord = {
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
  createdAt: string;
  updatedAt: string;
};

export type WebsiteTreeNode = {
  id: string;
  type: string;
  name: string | null;
  data: Record<string, unknown>;
  sortOrder: number;
  libraryItemId?: string | null;
  libraryItemVersion?: number | null;
  libraryNodeKey?: string | null;
  children: WebsiteTreeNode[];
};

export type WebsiteTreeSection = {
  id: string;
  name: string;
  sortOrder: number;
  nodes: WebsiteTreeNode[];
};

export type WebsiteTreePage = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  parentId: string | null;
  sections: WebsiteTreeSection[];
  children: WebsiteTreePage[];
};

export type PublicationStatus = {
  hasPublishedVersion: boolean;
  currentVersion: number | null;
  publishedAt: string | null;
  contentHash: string | null;
  draftContentHash: string;
  draftDiffersFromPublished: boolean;
};

export type WebsiteTree = WebsiteRecord & {
  pages: WebsiteTreePage[];
  libraryItems: LibraryItemRecord[];
  mediaAssets: MediaAssetRecord[];
  publication?: PublicationStatus;
};
