"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_WEBSITE_THEME,
  getDefaultNodeData,
  mergeWebsiteTheme,
  type LibraryItemDefinitionView,
  type NodeTypeId,
  type WebsiteTheme,
} from "@custom-website-builder/node-registry";
import { useAuth } from "@/providers/auth-provider";
import { websiteApi } from "@/features/websites/lib/api";
import type { WebsiteTree } from "@/features/websites/types";
import { WebsiteRenderer } from "@/features/website/renderer/WebsiteRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StructurePanel } from "./StructurePanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { ThemePanel } from "./ThemePanel";
import { LibraryPanel } from "./LibraryPanel";
import { MediaPanel } from "./MediaPanel";
import {
  findNodeInPages,
  findPageInPages,
  findSectionInPages,
  updateNodeDataInPages,
  type BuilderSelection,
} from "./selection";
import { syncPreviewToSelection, findPreviewElement } from "./previewSync";

type BuilderShellProps = {
  orgId: string;
  websiteId: string;
};

type LeftTab = "structure" | "theme" | "library" | "media";

const SAVE_DEBOUNCE_MS = 450;

export function BuilderShell({ orgId, websiteId }: BuilderShellProps) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<BuilderSelection>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("structure");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [themeSaveState, setThemeSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [publishState, setPublishState] = useState<"idle" | "validating" | "publishing" | "success" | "error">(
    "idle",
  );
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const themeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ nodeId: string; data: Record<string, unknown> } | null>(null);
  const pendingThemeRef = useRef<WebsiteTheme | null>(null);
  const previewScrollRef = useRef<HTMLElement | null>(null);

  const treeQueryKey = ["websites", websiteId, "tree"] as const;

  const treeQuery = useQuery({
    queryKey: treeQueryKey,
    queryFn: () => websiteApi.getWebsiteTree(websiteId, { accessToken: accessToken as string }),
    enabled: Boolean(accessToken && websiteId),
  });

  const pages = useMemo(() => treeQuery.data?.website.pages ?? [], [treeQuery.data]);
  const libraryItems = useMemo(() => treeQuery.data?.website.libraryItems ?? [], [treeQuery.data]);
  const mediaAssets = useMemo(() => treeQuery.data?.website.mediaAssets ?? [], [treeQuery.data]);
  const theme = treeQuery.data?.website.theme ?? DEFAULT_WEBSITE_THEME;
  const websiteName = treeQuery.data?.website.name ?? "Website";
  const websiteSlug = treeQuery.data?.website.slug;
  const publication = treeQuery.data?.website.publication;

  const publicationLabel = !publication?.hasPublishedVersion
    ? "Not published"
    : publication.draftDiffersFromPublished
      ? `Unpublished changes (live v${publication.currentVersion})`
      : `Published v${publication.currentVersion}`;

  const libraryLookup = useMemo(() => {
    const lookup: Record<string, LibraryItemDefinitionView> = {};
    for (const item of libraryItems) {
      lookup[item.id] = {
        id: item.id,
        version: item.version,
        definition: item.definition,
      };
    }
    return lookup;
  }, [libraryItems]);

  const selectedNode =
    selection?.kind === "node" ? findNodeInPages(pages, selection.id)?.node ?? null : null;
  const selectedPage =
    selection?.kind === "page" ? findPageInPages(pages, selection.id) : null;
  const selectedSection =
    selection?.kind === "section" ? findSectionInPages(pages, selection.id)?.section ?? null : null;

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (themeTimerRef.current) clearTimeout(themeTimerRef.current);
    };
  }, []);

  // Tree / preview / Properties share `selection`. On change: scroll preview + flash target.
  useEffect(() => {
    if (!selection || previewMode) {
      return;
    }

    const container = previewScrollRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    let cleanupSync: (() => void) | undefined;
    let retryFrame = 0;

    const attempt = () => {
      if (cancelled) return false;
      if (!findPreviewElement(container, selection)) return false;
      cleanupSync?.();
      cleanupSync = syncPreviewToSelection(container, selection);
      return true;
    };

    if (!attempt()) {
      // One paint retry covers newly mounted nodes after create/select.
      retryFrame = requestAnimationFrame(() => {
        attempt();
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(retryFrame);
      cleanupSync?.();
    };
  }, [selection, previewMode]);

  const invalidateTree = async () => {
    await queryClient.invalidateQueries({ queryKey: treeQueryKey });
  };

  const requireToken = () => {
    if (!accessToken) throw new Error("Authentication required");
    return accessToken;
  };

  const persistNodeData = async (nodeId: string, data: Record<string, unknown>) => {
    setSaveState("saving");
    try {
      await websiteApi.updateNode(nodeId, { data }, { accessToken: requireToken() });
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1200);
    } catch {
      setSaveState("error");
    }
  };

  const persistTheme = async (nextTheme: WebsiteTheme) => {
    setThemeSaveState("saving");
    try {
      await websiteApi.updateWebsiteTheme(
        websiteId,
        {
          colors: nextTheme.colors,
          typography: nextTheme.typography,
          general: nextTheme.general,
        },
        { accessToken: requireToken() },
      );
      setThemeSaveState("saved");
      window.setTimeout(() => setThemeSaveState("idle"), 1200);
    } catch {
      setThemeSaveState("error");
    }
  };

  const handleChangeNodeData = (nodeId: string, data: Record<string, unknown>) => {
    queryClient.setQueryData<{ website: WebsiteTree }>(treeQueryKey, (current) => {
      if (!current) return current;
      return {
        website: {
          ...current.website,
          pages: updateNodeDataInPages(current.website.pages, nodeId, data),
        },
      };
    });

    pendingSaveRef.current = { nodeId, data };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const pending = pendingSaveRef.current;
      if (!pending) return;
      void persistNodeData(pending.nodeId, pending.data);
    }, SAVE_DEBOUNCE_MS);
  };

  const handleThemeChange = (patch: Partial<{
    colors: Partial<WebsiteTheme["colors"]>;
    typography: Partial<WebsiteTheme["typography"]>;
    general: Partial<WebsiteTheme["general"]>;
  }>) => {
    const nextTheme = mergeWebsiteTheme(theme, patch);
    queryClient.setQueryData<{ website: WebsiteTree }>(treeQueryKey, (current) => {
      if (!current) return current;
      return {
        website: {
          ...current.website,
          theme: nextTheme,
        },
      };
    });

    pendingThemeRef.current = nextTheme;
    if (themeTimerRef.current) clearTimeout(themeTimerRef.current);
    themeTimerRef.current = setTimeout(() => {
      const pending = pendingThemeRef.current;
      if (!pending) return;
      void persistTheme(pending);
    }, SAVE_DEBOUNCE_MS);
  };

  const createPageMutation = useMutation({
    mutationFn: (parentId: string | null) =>
      websiteApi.createPage(
        websiteId,
        { title: parentId ? "Child page" : "New page", parentId },
        { accessToken: requireToken() },
      ),
    onSuccess: async (result) => {
      await invalidateTree();
      setSelection({ kind: "page", id: result.page.id });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (pageId: string) => websiteApi.deletePage(pageId, { accessToken: requireToken() }),
    onSuccess: async () => {
      setSelection(null);
      await invalidateTree();
    },
  });

  const reorderPagesMutation = useMutation({
    mutationFn: (input: { parentId: string | null; orderedIds: string[] }) =>
      websiteApi.reorderPages(websiteId, input, { accessToken: requireToken() }),
    onSuccess: invalidateTree,
  });

  const createSectionMutation = useMutation({
    mutationFn: (pageId: string) =>
      websiteApi.createSection(pageId, { name: "New section" }, { accessToken: requireToken() }),
    onSuccess: async (result) => {
      await invalidateTree();
      setSelection({ kind: "section", id: result.section.id });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) =>
      websiteApi.deleteSection(sectionId, { accessToken: requireToken() }),
    onSuccess: async () => {
      setSelection(null);
      await invalidateTree();
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (input: { pageId: string; orderedIds: string[] }) =>
      websiteApi.reorderSections(input.pageId, { orderedIds: input.orderedIds }, { accessToken: requireToken() }),
    onSuccess: invalidateTree,
  });

  const createNodeMutation = useMutation({
    mutationFn: (input: { sectionId: string; parentId: string | null; type: NodeTypeId }) =>
      websiteApi.createNode(
        input.sectionId,
        {
          type: input.type,
          name: input.type,
          parentId: input.parentId,
          data: getDefaultNodeData(input.type) as Record<string, unknown>,
        },
        { accessToken: requireToken() },
      ),
    onSuccess: async (result) => {
      await invalidateTree();
      setSelection({ kind: "node", id: result.node.id });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: (nodeId: string) => websiteApi.deleteNode(nodeId, { accessToken: requireToken() }),
    onSuccess: async () => {
      setSelection(null);
      await invalidateTree();
    },
  });

  const reorderNodesMutation = useMutation({
    mutationFn: (input: { sectionId: string; parentId: string | null; orderedIds: string[] }) =>
      websiteApi.reorderNodes(input.sectionId, input, { accessToken: requireToken() }),
    onSuccess: invalidateTree,
  });

  const useLibraryMutation = useMutation({
    mutationFn: (input: { libraryItemId: string; sectionId: string; parentId: string | null }) =>
      websiteApi.useLibraryItem(
        input.libraryItemId,
        { sectionId: input.sectionId, parentId: input.parentId },
        { accessToken: requireToken() },
      ),
    onSuccess: async (result) => {
      await invalidateTree();
      setSelection({ kind: "node", id: result.node.id });
      setLeftTab("structure");
    },
  });

  const saveToLibraryMutation = useMutation({
    mutationFn: (input: { nodeId: string; name: string; category: string | null }) =>
      websiteApi.saveNodeToLibrary(
        input.nodeId,
        { name: input.name, category: input.category },
        { accessToken: requireToken() },
      ),
    onSuccess: async () => {
      await invalidateTree();
      setLeftTab("library");
    },
  });

  const makeIndependentMutation = useMutation({
    mutationFn: (nodeId: string) =>
      websiteApi.makeNodeIndependent(nodeId, { accessToken: requireToken() }),
    onSuccess: invalidateTree,
  });

  const handlePublish = async () => {
    setPublishMessage(null);
    setPublishState("validating");
    try {
      const validation = await websiteApi.validateWebsiteDraft(websiteId, {
        accessToken: requireToken(),
      });
      if (!validation.ok) {
        setPublishState("error");
        setPublishMessage(validation.issues[0]?.message ?? "Draft validation failed");
        return;
      }

      setPublishState("publishing");
      const result = await websiteApi.publishWebsite(websiteId, {
        accessToken: requireToken(),
      });
      await invalidateTree();
      setPublishState("success");
      setPublishMessage(
        result.reused
          ? `Already published as v${result.publishedVersion.version}`
          : `Published v${result.publishedVersion.version}`,
      );
      window.setTimeout(() => {
        setPublishState("idle");
        setPublishMessage(null);
      }, 2500);
    } catch (error) {
      setPublishState("error");
      setPublishMessage(error instanceof Error ? error.message : "Publish failed");
    }
  };

  const handleSaveToLibrary = (nodeId: string) => {
    const name = window.prompt("Library item name");
    if (!name?.trim()) return;
    const categoryRaw = window.prompt("Category (optional)", "");
    if (categoryRaw === null) return;
    saveToLibraryMutation.mutate({
      nodeId,
      name: name.trim(),
      category: categoryRaw.trim() ? categoryRaw.trim() : null,
    });
  };

  const uploadMedia = async (file: File) => {
    const result = await websiteApi.uploadMediaAsset(websiteId, file, {
      accessToken: requireToken(),
    });
    await invalidateTree();
    return result.mediaAsset;
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-sidebar/90 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-primary/80">
            Website builder
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight">{websiteName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge
              variant={
                !publication?.hasPublishedVersion
                  ? "secondary"
                  : publication.draftDiffersFromPublished
                    ? "warning"
                    : "success"
              }
              data-publication-status={
                !publication?.hasPublishedVersion
                  ? "unpublished"
                  : publication.draftDiffersFromPublished
                    ? "dirty"
                    : "published"
              }
            >
              {publicationLabel}
            </Badge>
            {saveState === "saving" || themeSaveState === "saving" ? (
              <span className="text-xs text-muted-foreground">Saving…</span>
            ) : null}
            {saveState === "saved" || themeSaveState === "saved" ? (
              <span className="text-xs text-primary">Saved</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {publishMessage ? (
            <p
              className={`max-w-[14rem] truncate text-xs ${
                publishState === "error" ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {publishMessage}
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant={previewMode ? "secondary" : "outline"}
            onClick={() => setPreviewMode((value) => !value)}
          >
            {previewMode ? "Exit preview" : "Preview"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={publishState === "validating" || publishState === "publishing"}
            onClick={() => void handlePublish()}
          >
            {publishState === "validating"
              ? "Validating…"
              : publishState === "publishing"
                ? "Publishing…"
                : "Publish"}
          </Button>
          {publication?.hasPublishedVersion && websiteSlug ? (
            <Link
              href={`/site/${encodeURIComponent(websiteSlug)}`}
              target="_blank"
              rel="noreferrer"
              data-public-site-link="true"
              className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
            >
              View public site
            </Link>
          ) : null}
          <Link
            href={`/dashboard/customer/orgs/${orgId}`}
            className="inline-flex h-7 items-center rounded-lg px-2.5 text-[0.8rem] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Back
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {previewMode ? null : (
          <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-r border-border bg-card md:w-80">
            <div className="grid grid-cols-4 gap-1 border-b border-border bg-secondary/40 p-1.5">
              {(
                [
                  ["structure", "Structure"],
                  ["theme", "Theme"],
                  ["library", "Library"],
                  ["media", "Media"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`rounded-md px-1 py-1.5 text-[0.7rem] font-medium transition-colors sm:text-xs ${
                    leftTab === id
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                  }`}
                  onClick={() => setLeftTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {leftTab === "structure" ? (
              <StructurePanel
                pages={pages}
                selection={selection}
                onSelect={setSelection}
                onAddPage={(parentId) => createPageMutation.mutate(parentId)}
                onAddSection={(pageId) => createSectionMutation.mutate(pageId)}
                onAddNode={(sectionId, parentId) =>
                  createNodeMutation.mutate({
                    sectionId,
                    parentId,
                    type: parentId ? "heading" : "container",
                  })
                }
                onDeletePage={(pageId) => deletePageMutation.mutate(pageId)}
                onDeleteSection={(sectionId) => deleteSectionMutation.mutate(sectionId)}
                onDeleteNode={(nodeId) => deleteNodeMutation.mutate(nodeId)}
                onReorderPage={(parentId, orderedIds) =>
                  reorderPagesMutation.mutate({ parentId, orderedIds })
                }
                onReorderSection={(pageId, orderedIds) =>
                  reorderSectionsMutation.mutate({ pageId, orderedIds })
                }
                onReorderNode={(sectionId, parentId, orderedIds) =>
                  reorderNodesMutation.mutate({ sectionId, parentId, orderedIds })
                }
              />
            ) : null}
            {leftTab === "theme" ? (
              <ThemePanel theme={theme} onChange={handleThemeChange} saveState={themeSaveState} />
            ) : null}
            {leftTab === "library" ? (
              <LibraryPanel
                libraryItems={libraryItems}
                pages={pages}
                selection={selection}
                onUseItem={(libraryItemId, sectionId, parentId) =>
                  useLibraryMutation.mutate({ libraryItemId, sectionId, parentId })
                }
                onDeleteItem={async (libraryItemId, force) => {
                  await websiteApi.deleteLibraryItem(libraryItemId, force, {
                    accessToken: requireToken(),
                  });
                  await invalidateTree();
                }}
                onUpdateItem={async (libraryItemId, patch) => {
                  await websiteApi.updateLibraryItem(libraryItemId, patch, {
                    accessToken: requireToken(),
                  });
                  await invalidateTree();
                }}
              />
            ) : null}
            {leftTab === "media" ? (
              <MediaPanel
                mediaAssets={mediaAssets}
                onUpload={async (file) => {
                  await uploadMedia(file);
                }}
                onDelete={async (mediaAssetId, force) => {
                  await websiteApi.deleteMediaAsset(mediaAssetId, force, {
                    accessToken: requireToken(),
                  });
                  await invalidateTree();
                }}
              />
            ) : null}
          </aside>
        )}

        <main
          ref={previewScrollRef}
          className="min-w-0 flex-1 overflow-y-auto bg-[color-mix(in_srgb,var(--muted)_35%,transparent)]"
        >
          <div className="mx-auto min-h-full max-w-5xl px-4 py-6 sm:px-6 md:py-8">
            {previewMode ? (
              <p className="mb-3 text-xs text-muted-foreground">Previewing current draft</p>
            ) : null}
            {treeQuery.isError ? (
              <p className="text-sm text-destructive">Unable to load website tree.</p>
            ) : (
            <div className="min-h-[70vh] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {/* Preview surface: Website Theme owns content colors — not application palette. */}
              <WebsiteRenderer
                  pages={pages}
                  theme={theme}
                  libraryItems={libraryItems}
                  mediaAssets={mediaAssets}
                  interaction={
                    previewMode
                      ? null
                      : {
                          selectedNodeId: selection?.kind === "node" ? selection.id : null,
                          onSelectNode: (nodeId) => setSelection({ kind: "node", id: nodeId }),
                        }
                  }
                />
              </div>
            )}
          </div>
        </main>

        {previewMode ? null : (
          <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-border bg-card md:w-80">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-primary/80">
                Properties
              </p>
            </div>
            <PropertiesPanel
              selection={selection}
              selectedPage={selectedPage}
              selectedSection={selectedSection}
              selectedNode={selectedNode}
              libraryLookup={libraryLookup}
              mediaAssets={mediaAssets}
              onUploadMedia={uploadMedia}
              onChangeNodeData={handleChangeNodeData}
              onSaveToLibrary={handleSaveToLibrary}
              onMakeIndependent={(nodeId) => makeIndependentMutation.mutate(nodeId)}
              saveState={saveState}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
