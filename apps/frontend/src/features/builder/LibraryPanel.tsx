"use client";

import { useMemo, useState } from "react";
import type { LibraryItemRecord, WebsiteTreePage } from "@/features/websites/types";
import { type BuilderSelection } from "./selection";

type LibraryPanelProps = {
  libraryItems: LibraryItemRecord[];
  pages: WebsiteTreePage[];
  selection: BuilderSelection;
  onUseItem: (libraryItemId: string, sectionId: string, parentId: string | null) => void;
  onDeleteItem: (libraryItemId: string, force: boolean) => Promise<void>;
  onUpdateItem: (
    libraryItemId: string,
    patch: { name?: string; category?: string | null },
  ) => Promise<void>;
};

function resolveInsertTarget(
  pages: WebsiteTreePage[],
  selection: BuilderSelection,
): { sectionId: string; parentId: string | null } | null {
  if (!selection) return null;
  if (selection.kind === "section") {
    return { sectionId: selection.id, parentId: null };
  }
  if (selection.kind === "node") {
    for (const page of pages) {
      for (const section of page.sections) {
        const walk = (
          nodes: { id: string; children: unknown[] }[],
          parentId: string | null,
        ): string | null | undefined => {
          for (const node of nodes) {
            if (node.id === selection.id) return parentId === null ? null : parentId;
            const nested = walk(node.children as { id: string; children: unknown[] }[], node.id);
            if (nested !== undefined) return nested;
          }
          return undefined;
        };
        const foundParent = walk(section.nodes, null);
        if (foundParent !== undefined) {
          // Insert as sibling under same parent when a node is selected
          return { sectionId: section.id, parentId: foundParent };
        }
      }
      const nested = resolveInsertTarget(page.children, selection);
      if (nested) return nested;
    }
  }
  if (selection.kind === "page") {
    for (const page of pages) {
      if (page.id === selection.id && page.sections[0]) {
        return { sectionId: page.sections[0].id, parentId: null };
      }
      const nested = resolveInsertTarget(page.children, selection);
      if (nested) return nested;
    }
  }
  return null;
}

export function LibraryPanel({
  libraryItems,
  pages,
  selection,
  onUseItem,
  onDeleteItem,
  onUpdateItem,
}: LibraryPanelProps) {
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const insertTarget = useMemo(() => resolveInsertTarget(pages, selection), [pages, selection]);

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = libraryItems.filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.category ?? "").toLowerCase().includes(q)
      );
    });
    const map = new Map<string, LibraryItemRecord[]>();
    for (const item of filtered) {
      const key = item.category?.trim() || "Uncategorized";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [libraryItems, filter]);

  const handleUse = (itemId: string) => {
    if (!insertTarget) {
      window.alert("Select a section (or node) as insert target first.");
      return;
    }
    onUseItem(itemId, insertTarget.sectionId, insertTarget.parentId);
  };

  const handleDelete = async (item: LibraryItemRecord) => {
    setBusyId(item.id);
    try {
      try {
        await onDeleteItem(item.id, false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed";
        const confirmed = window.confirm(
          `${message}\n\nForce delete? Linked instances will be detached and keep current appearance.`,
        );
        if (!confirmed) return;
        await onDeleteItem(item.id, true);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleRename = async (item: LibraryItemRecord) => {
    const name = window.prompt("Library item name", item.name);
    if (!name || !name.trim() || name.trim() === item.name) return;
    const categoryRaw = window.prompt("Category (optional)", item.category ?? "");
    if (categoryRaw === null) return;
    setBusyId(item.id);
    try {
      await onUpdateItem(item.id, {
        name: name.trim(),
        category: categoryRaw.trim() ? categoryRaw.trim() : null,
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="space-y-2 border-b border-border px-3 py-3">
        <p className="text-sm font-medium">UI Library</p>
        <p className="text-xs text-muted-foreground">
          Website-owned reusable node definitions. Insert stays linked until Make Independent.
        </p>
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter by name or category"
          className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm"
        />
        <p className="text-[0.7rem] text-muted-foreground">
          {insertTarget
            ? "Insert target ready."
            : "Select a section/node to set insert target."}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {!grouped.length ? (
          <p className="text-sm text-muted-foreground">
            No library items yet. Select a node and use Save to UI Library.
          </p>
        ) : (
          grouped.map(([category, items]) => (
            <section key={category} className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {category}
              </h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-border px-2 py-2 text-sm"
                    data-library-item-id={item.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-[0.7rem] text-muted-foreground">
                          {item.definition.type}
                          {item.definition.children.length ? " · composite" : " · atomic"} · v
                          {item.version}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="rounded border border-border px-2 py-0.5 text-[0.7rem] hover:bg-muted"
                        disabled={busyId === item.id}
                        onClick={() => handleUse(item.id)}
                      >
                        Use
                      </button>
                      <button
                        type="button"
                        className="rounded border border-border px-2 py-0.5 text-[0.7rem] hover:bg-muted"
                        disabled={busyId === item.id}
                        onClick={() => void handleRename(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded border border-border px-2 py-0.5 text-[0.7rem] text-destructive hover:bg-muted"
                        disabled={busyId === item.id}
                        onClick={() => void handleDelete(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
