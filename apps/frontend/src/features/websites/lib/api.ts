import { apiRequest } from "@/features/auth/lib/api";
import type { WebsiteTheme } from "@custom-website-builder/node-registry";
import type {
  LibraryItemRecord,
  MediaAssetRecord,
  NodeRecord,
  OrganizationRecord,
  PageRecord,
  PublicationStatus,
  SectionRecord,
  TemplateCatalogEntry,
  WebsiteRecord,
  WebsiteTree,
} from "../types";

type RequestOptions = { accessToken: string };

export type PublicPublishedSite = {
  website: {
    id: string;
    name: string;
    slug: string;
  };
  publishedVersion: {
    id: string;
    version: number;
    contentHash: string;
    publishedAt: string;
    snapshot: {
      schemaVersion: 1;
      website: {
        id: string;
        name: string;
        slug: string;
        theme: WebsiteTheme;
      };
      pages: WebsiteTree["pages"];
      libraryItems: Array<{
        id: string;
        name: string;
        category: string | null;
        version: number;
        definition: LibraryItemRecord["definition"];
      }>;
      mediaAssets: Array<{
        id: string;
        kind: string;
        filename: string;
        mimeType: string;
        byteSize: number;
        width: number | null;
        height: number | null;
        url: string;
        provider: string;
      }>;
    };
  };
};

export const websiteApi = {
  listOrganizations: ({ accessToken }: RequestOptions) =>
    apiRequest<{ organizations: OrganizationRecord[] }>("/api/organizations", {
      method: "GET",
      accessToken,
    }),

  createOrganization: (body: { name: string; slug?: string }, { accessToken }: RequestOptions) =>
    apiRequest<{ organization: OrganizationRecord }>("/api/organizations", {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  getOrganization: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ organization: OrganizationRecord }>(`/api/organizations/${id}`, {
      method: "GET",
      accessToken,
    }),

  listWebsites: (organizationId: string, { accessToken }: RequestOptions) =>
    apiRequest<{ websites: WebsiteRecord[] }>(`/api/organizations/${organizationId}/websites`, {
      method: "GET",
      accessToken,
    }),

  createWebsite: (
    organizationId: string,
    body: { name: string; slug?: string; templateId?: string },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ website: WebsiteRecord }>(`/api/organizations/${organizationId}/websites`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  listTemplates: ({ accessToken }: RequestOptions) =>
    apiRequest<{ templates: TemplateCatalogEntry[] }>("/api/templates", {
      method: "GET",
      accessToken,
    }),

  getWebsite: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ website: WebsiteRecord }>(`/api/websites/${id}`, {
      method: "GET",
      accessToken,
    }),

  updateWebsite: (
    id: string,
    body: { name?: string; slug?: string },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ website: WebsiteRecord }>(`/api/websites/${id}`, {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(body),
    }),

  deleteWebsite: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ success: boolean }>(`/api/websites/${id}`, {
      method: "DELETE",
      accessToken,
    }),

  getWebsiteTree: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ website: WebsiteTree }>(`/api/websites/${id}/tree`, {
      method: "GET",
      accessToken,
    }),

  getPublicationStatus: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ publication: PublicationStatus }>(`/api/websites/${id}/publication`, {
      method: "GET",
      accessToken,
    }),

  validateWebsiteDraft: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{
      ok: boolean;
      issues: { path: string; message: string }[];
      draftContentHash: string;
    }>(`/api/websites/${id}/validate`, {
      method: "POST",
      accessToken,
    }),

  publishWebsite: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{
      publishedVersion: {
        id: string;
        version: number;
        contentHash: string;
        publishedAt: string;
      };
      reused: boolean;
    }>(`/api/websites/${id}/publish`, {
      method: "POST",
      accessToken,
    }),

  getPublishedWebsite: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<PublicPublishedSite>(`/api/websites/${id}/published`, {
      method: "GET",
      accessToken,
    }),

  /** Public published-only payload. No auth. Never draft. */
  getPublicSiteBySlug: (slug: string) =>
    apiRequest<PublicPublishedSite>(`/api/public/sites/${encodeURIComponent(slug)}`, {
      method: "GET",
    }),

  updateWebsiteTheme: (
    id: string,
    body: Partial<{
      colors: Partial<WebsiteTheme["colors"]>;
      typography: Partial<WebsiteTheme["typography"]>;
      general: Partial<WebsiteTheme["general"]>;
    }>,
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ website: WebsiteRecord }>(`/api/websites/${id}/theme`, {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(body),
    }),

  createPage: (
    websiteId: string,
    body: { title: string; slug?: string; parentId?: string | null },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ page: PageRecord }>(`/api/websites/${websiteId}/pages`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  updatePage: (
    id: string,
    body: { title?: string; slug?: string; parentId?: string | null },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ page: PageRecord }>(`/api/pages/${id}`, {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(body),
    }),

  deletePage: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ success: boolean }>(`/api/pages/${id}`, {
      method: "DELETE",
      accessToken,
    }),

  reorderPages: (
    websiteId: string,
    body: { parentId: string | null; orderedIds: string[] },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ pages: PageRecord[] }>(`/api/websites/${websiteId}/pages/reorder`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  createSection: (pageId: string, body: { name: string }, { accessToken }: RequestOptions) =>
    apiRequest<{ section: SectionRecord }>(`/api/pages/${pageId}/sections`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  updateSection: (id: string, body: { name: string }, { accessToken }: RequestOptions) =>
    apiRequest<{ section: SectionRecord }>(`/api/sections/${id}`, {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(body),
    }),

  deleteSection: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ success: boolean }>(`/api/sections/${id}`, {
      method: "DELETE",
      accessToken,
    }),

  reorderSections: (
    pageId: string,
    body: { orderedIds: string[] },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ sections: SectionRecord[] }>(`/api/pages/${pageId}/sections/reorder`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  createNode: (
    sectionId: string,
    body: {
      type: string;
      name?: string | null;
      data?: Record<string, unknown>;
      parentId?: string | null;
    },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ node: NodeRecord }>(`/api/sections/${sectionId}/nodes`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  updateNode: (
    id: string,
    body: {
      type?: string;
      name?: string | null;
      data?: Record<string, unknown>;
      parentId?: string | null;
    },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ node: NodeRecord }>(`/api/nodes/${id}`, {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(body),
    }),

  deleteNode: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{ success: boolean }>(`/api/nodes/${id}`, {
      method: "DELETE",
      accessToken,
    }),

  reorderNodes: (
    sectionId: string,
    body: { parentId: string | null; orderedIds: string[] },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ nodes: NodeRecord[] }>(`/api/sections/${sectionId}/nodes/reorder`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  listLibraryItems: (websiteId: string, { accessToken }: RequestOptions) =>
    apiRequest<{ libraryItems: LibraryItemRecord[] }>(`/api/websites/${websiteId}/library`, {
      method: "GET",
      accessToken,
    }),

  createLibraryItem: (
    websiteId: string,
    body: { name: string; category?: string | null; definition: unknown },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ libraryItem: LibraryItemRecord }>(`/api/websites/${websiteId}/library`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  updateLibraryItem: (
    id: string,
    body: { name?: string; category?: string | null; definition?: unknown },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ libraryItem: LibraryItemRecord }>(`/api/library-items/${id}`, {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(body),
    }),

  getLibraryItemUsage: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{
      usage: {
        libraryItemId: string;
        instanceRootCount: number;
        nodeCount: number;
        referencedByLibraryItems: { id: string; name: string }[];
        canDeleteSafely: boolean;
      };
    }>(`/api/library-items/${id}/usage`, {
      method: "GET",
      accessToken,
    }),

  deleteLibraryItem: (id: string, force: boolean, { accessToken }: RequestOptions) =>
    apiRequest<{ success: boolean; detached: boolean }>(
      `/api/library-items/${id}?force=${force ? "true" : "false"}`,
      {
        method: "DELETE",
        accessToken,
      },
    ),

  useLibraryItem: (
    id: string,
    body: { sectionId: string; parentId?: string | null },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ node: NodeRecord }>(`/api/library-items/${id}/use`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  saveNodeToLibrary: (
    nodeId: string,
    body: { name: string; category?: string | null },
    { accessToken }: RequestOptions,
  ) =>
    apiRequest<{ libraryItem: LibraryItemRecord }>(`/api/nodes/${nodeId}/save-to-library`, {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    }),

  makeNodeIndependent: (nodeId: string, { accessToken }: RequestOptions) =>
    apiRequest<{ node: NodeRecord }>(`/api/nodes/${nodeId}/make-independent`, {
      method: "POST",
      accessToken,
    }),

  listMediaAssets: (websiteId: string, { accessToken }: RequestOptions) =>
    apiRequest<{ mediaAssets: MediaAssetRecord[] }>(`/api/websites/${websiteId}/media`, {
      method: "GET",
      accessToken,
    }),

  uploadMediaAsset: (websiteId: string, file: File, { accessToken }: RequestOptions) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest<{ mediaAsset: MediaAssetRecord }>(`/api/websites/${websiteId}/media`, {
      method: "POST",
      accessToken,
      body,
    });
  },

  getMediaAssetUsage: (id: string, { accessToken }: RequestOptions) =>
    apiRequest<{
      usage: {
        mediaAssetId: string;
        nodeCount: number;
        libraryItemCount: number;
        canDeleteSafely: boolean;
      };
    }>(`/api/media/${id}/usage`, {
      method: "GET",
      accessToken,
    }),

  deleteMediaAsset: (id: string, force: boolean, { accessToken }: RequestOptions) =>
    apiRequest<{ success: boolean; detached: boolean }>(
      `/api/media/${id}?force=${force ? "true" : "false"}`,
      {
        method: "DELETE",
        accessToken,
      },
    ),
};
