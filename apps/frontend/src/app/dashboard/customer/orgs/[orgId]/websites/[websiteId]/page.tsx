"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { websiteApi } from "@/features/websites/lib/api";
import type { WebsiteTreeNode, WebsiteTreePage, WebsiteTreeSection } from "@/features/websites/types";
import { WebsiteRenderer } from "@/features/website/renderer/WebsiteRenderer";
import { getDefaultNodeData, getNodeType, type NodeTypeId } from "@custom-website-builder/node-registry";

function moveItem<T extends { id: string }>(items: T[], id: string, direction: -1 | 1): string[] | null {
  const index = items.findIndex((item) => item.id === id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) {
    return null;
  }

  const ordered = items.map((item) => item.id);
  const [removed] = ordered.splice(index, 1);
  ordered.splice(nextIndex, 0, removed);
  return ordered;
}

function NodeTree({
  nodes,
  sectionId,
  parentId,
  onCreateChild,
  onDelete,
  onReorder,
}: {
  nodes: WebsiteTreeNode[];
  sectionId: string;
  parentId: string | null;
  onCreateChild: (sectionId: string, parentId: string | null) => void;
  onDelete: (nodeId: string) => void;
  onReorder: (sectionId: string, parentId: string | null, orderedIds: string[]) => void;
}) {
  return (
    <ul className="space-y-2 border-l border-border pl-3">
      {nodes.map((node) => (
        <li key={node.id} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">{node.name ?? node.type}</span>
            <span className="text-muted-foreground">({node.type})</span>
            {getNodeType(node.type)?.children.kind !== "none" ? (
              <Button size="xs" variant="outline" onClick={() => onCreateChild(sectionId, node.id)}>
                Add child
              </Button>
            ) : null}
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                const orderedIds = moveItem(nodes, node.id, -1);
                if (orderedIds) onReorder(sectionId, parentId, orderedIds);
              }}
            >
              Up
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                const orderedIds = moveItem(nodes, node.id, 1);
                if (orderedIds) onReorder(sectionId, parentId, orderedIds);
              }}
            >
              Down
            </Button>
            <Button size="xs" variant="outline" onClick={() => onDelete(node.id)}>
              Delete
            </Button>
          </div>
          {node.children.length ? (
            <NodeTree
              nodes={node.children}
              sectionId={sectionId}
              parentId={node.id}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              onReorder={onReorder}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SectionPanel({
  section,
  siblings,
  onCreateNode,
  onDeleteSection,
  onReorderSections,
  onDeleteNode,
  onReorderNodes,
}: {
  section: WebsiteTreeSection;
  siblings: WebsiteTreeSection[];
  onCreateNode: (sectionId: string, parentId: string | null) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderSections: (orderedIds: string[]) => void;
  onDeleteNode: (nodeId: string) => void;
  onReorderNodes: (sectionId: string, parentId: string | null, orderedIds: string[]) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{section.name}</p>
        <Button size="xs" variant="outline" onClick={() => onCreateNode(section.id, null)}>
          Add node
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            const orderedIds = moveItem(siblings, section.id, -1);
            if (orderedIds) onReorderSections(orderedIds);
          }}
        >
          Up
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            const orderedIds = moveItem(siblings, section.id, 1);
            if (orderedIds) onReorderSections(orderedIds);
          }}
        >
          Down
        </Button>
        <Button size="xs" variant="outline" onClick={() => onDeleteSection(section.id)}>
          Delete
        </Button>
      </div>
      {section.nodes.length ? (
        <NodeTree
          nodes={section.nodes}
          sectionId={section.id}
          parentId={null}
          onCreateChild={onCreateNode}
          onDelete={onDeleteNode}
          onReorder={onReorderNodes}
        />
      ) : (
        <p className="text-sm text-muted-foreground">No nodes yet.</p>
      )}
    </div>
  );
}

function PagePanel({
  page,
  siblings,
  depth,
  onCreateChildPage,
  onCreateSection,
  onDeletePage,
  onReorderPages,
  onCreateNode,
  onDeleteSection,
  onReorderSections,
  onDeleteNode,
  onReorderNodes,
}: {
  page: WebsiteTreePage;
  siblings: WebsiteTreePage[];
  depth: number;
  onCreateChildPage: (parentId: string) => void;
  onCreateSection: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onReorderPages: (parentId: string | null, orderedIds: string[]) => void;
  onCreateNode: (sectionId: string, parentId: string | null) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderSections: (pageId: string, orderedIds: string[]) => void;
  onDeleteNode: (nodeId: string) => void;
  onReorderNodes: (sectionId: string, parentId: string | null, orderedIds: string[]) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4" style={{ marginLeft: depth * 12 }}>
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <p className="font-medium">{page.title}</p>
          <p className="text-sm text-muted-foreground">/{page.slug}</p>
        </div>
        <Button size="xs" variant="outline" onClick={() => onCreateChildPage(page.id)}>
          Add child page
        </Button>
        <Button size="xs" variant="outline" onClick={() => onCreateSection(page.id)}>
          Add section
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            const orderedIds = moveItem(siblings, page.id, -1);
            if (orderedIds) onReorderPages(page.parentId, orderedIds);
          }}
        >
          Up
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            const orderedIds = moveItem(siblings, page.id, 1);
            if (orderedIds) onReorderPages(page.parentId, orderedIds);
          }}
        >
          Down
        </Button>
        <Button size="xs" variant="outline" onClick={() => onDeletePage(page.id)}>
          Delete
        </Button>
      </div>

      <div className="space-y-3">
        {page.sections.map((section) => (
          <SectionPanel
            key={section.id}
            section={section}
            siblings={page.sections}
            onCreateNode={onCreateNode}
            onDeleteSection={onDeleteSection}
            onReorderSections={(orderedIds) => onReorderSections(page.id, orderedIds)}
            onDeleteNode={onDeleteNode}
            onReorderNodes={onReorderNodes}
          />
        ))}
      </div>

      {page.children.map((child) => (
        <PagePanel
          key={child.id}
          page={child}
          siblings={page.children}
          depth={depth + 1}
          onCreateChildPage={onCreateChildPage}
          onCreateSection={onCreateSection}
          onDeletePage={onDeletePage}
          onReorderPages={onReorderPages}
          onCreateNode={onCreateNode}
          onDeleteSection={onDeleteSection}
          onReorderSections={onReorderSections}
          onDeleteNode={onDeleteNode}
          onReorderNodes={onReorderNodes}
        />
      ))}
    </div>
  );
}

export default function WebsiteStructurePage() {
  const params = useParams<{ orgId: string; websiteId: string }>();
  const { orgId, websiteId } = params;
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [pageTitle, setPageTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const treeQuery = useQuery({
    queryKey: ["websites", websiteId, "tree"],
    queryFn: () => websiteApi.getWebsiteTree(websiteId, { accessToken: accessToken as string }),
    enabled: Boolean(accessToken && websiteId),
  });

  const invalidateTree = async () => {
    await queryClient.invalidateQueries({ queryKey: ["websites", websiteId, "tree"] });
  };

  const requireToken = () => {
    if (!accessToken) throw new Error("Authentication required");
    return accessToken;
  };

  const createPageMutation = useMutation({
    mutationFn: (input: { title: string; parentId?: string | null }) =>
      websiteApi.createPage(websiteId, input, { accessToken: requireToken() }),
    onSuccess: async () => {
      setPageTitle("");
      setError(null);
      await invalidateTree();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to create page");
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (pageId: string) => websiteApi.deletePage(pageId, { accessToken: requireToken() }),
    onSuccess: invalidateTree,
  });

  const reorderPagesMutation = useMutation({
    mutationFn: (input: { parentId: string | null; orderedIds: string[] }) =>
      websiteApi.reorderPages(websiteId, input, { accessToken: requireToken() }),
    onSuccess: invalidateTree,
  });

  const createSectionMutation = useMutation({
    mutationFn: (pageId: string) =>
      websiteApi.createSection(pageId, { name: "New section" }, { accessToken: requireToken() }),
    onSuccess: invalidateTree,
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => websiteApi.deleteSection(sectionId, { accessToken: requireToken() }),
    onSuccess: invalidateTree,
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
    onSuccess: invalidateTree,
  });

  const deleteNodeMutation = useMutation({
    mutationFn: (nodeId: string) => websiteApi.deleteNode(nodeId, { accessToken: requireToken() }),
    onSuccess: invalidateTree,
  });

  const reorderNodesMutation = useMutation({
    mutationFn: (input: { sectionId: string; parentId: string | null; orderedIds: string[] }) =>
      websiteApi.reorderNodes(input.sectionId, input, { accessToken: requireToken() }),
    onSuccess: invalidateTree,
  });

  const pages = useMemo(() => treeQuery.data?.website.pages ?? [], [treeQuery.data]);

  if (isLoading) {
    return <main className="p-6">Loading...</main>;
  }

  if (!isAuthenticated || !user) {
    redirect("/login");
  }

  if (user.permissions.includes("admin:access")) {
    redirect("/dashboard/admin");
  }

  function onCreatePage(event: FormEvent) {
    event.preventDefault();
    if (!pageTitle.trim()) {
      setError("Page title is required");
      return;
    }
    createPageMutation.mutate({ title: pageTitle.trim(), parentId: null });
  }

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <Link
            href={`/dashboard/customer/orgs/${orgId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Websites
          </Link>
          <Link
            href={`/dashboard/customer/orgs/${orgId}/websites/${websiteId}/builder`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Open builder →
          </Link>
          <h1 className="text-3xl font-semibold">{treeQuery.data?.website.name ?? "Website structure"}</h1>
          <p className="text-sm text-muted-foreground">
            Manage pages, sections, and nested nodes. Tree response is generic hierarchy data.
          </p>
        </div>

        <form onSubmit={onCreatePage} className="space-y-3 rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium">Create root page</p>
          <Input
            value={pageTitle}
            onChange={(event) => setPageTitle(event.target.value)}
            placeholder="Page title"
            aria-label="Page title"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={createPageMutation.isPending}>
            {createPageMutation.isPending ? "Creating..." : "Create page"}
          </Button>
        </form>

        {treeQuery.isError ? <p className="text-sm text-destructive">Unable to load website tree.</p> : null}

        <section className="space-y-4">
          {pages.length ? (
            pages.map((page) => (
              <PagePanel
                key={page.id}
                page={page}
                siblings={pages}
                depth={0}
                onCreateChildPage={(parentId) =>
                  createPageMutation.mutate({ title: "Child page", parentId })
                }
                onCreateSection={(pageId) => createSectionMutation.mutate(pageId)}
                onDeletePage={(pageId) => deletePageMutation.mutate(pageId)}
                onReorderPages={(parentId, orderedIds) =>
                  reorderPagesMutation.mutate({ parentId, orderedIds })
                }
                onCreateNode={(sectionId, parentId) =>
                  createNodeMutation.mutate({
                    sectionId,
                    parentId,
                    type: parentId ? "heading" : "container",
                  })
                }
                onDeleteSection={(sectionId) => deleteSectionMutation.mutate(sectionId)}
                onReorderSections={(pageId, orderedIds) =>
                  reorderSectionsMutation.mutate({ pageId, orderedIds })
                }
                onDeleteNode={(nodeId) => deleteNodeMutation.mutate(nodeId)}
                onReorderNodes={(sectionId, parentId, orderedIds) =>
                  reorderNodesMutation.mutate({ sectionId, parentId, orderedIds })
                }
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No pages yet.</p>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Live renderer preview</h2>
            <p className="text-sm text-muted-foreground">
              Generic registry-driven render of the stored hierarchy. Not the full builder.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-6">
            <WebsiteRenderer
              pages={pages}
              theme={treeQuery.data?.website.theme}
              libraryItems={treeQuery.data?.website.libraryItems}
              mediaAssets={treeQuery.data?.website.mediaAssets}
            />
          </div>
        </section>

        {treeQuery.data ? (
          <details className="rounded-xl border border-border bg-card p-4">
            <summary className="cursor-pointer text-sm font-medium">Raw hierarchy JSON</summary>
            <pre className="mt-3 overflow-auto text-xs text-muted-foreground">
              {JSON.stringify(treeQuery.data.website, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </main>
  );
}
