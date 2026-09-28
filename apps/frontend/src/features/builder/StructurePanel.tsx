"use client";

import type { ReactNode } from "react";
import { getNodeType } from "@custom-website-builder/node-registry";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WebsiteTreeNode, WebsiteTreePage, WebsiteTreeSection } from "@/features/websites/types";
import type { BuilderSelection } from "./selection";

type StructurePanelProps = {
  pages: WebsiteTreePage[];
  selection: BuilderSelection;
  onSelect: (selection: BuilderSelection) => void;
  onAddPage: (parentId: string | null) => void;
  onAddSection: (pageId: string) => void;
  onAddNode: (sectionId: string, parentId: string | null) => void;
  onDeletePage: (pageId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onReorderPage: (parentId: string | null, orderedIds: string[]) => void;
  onReorderSection: (pageId: string, orderedIds: string[]) => void;
  onReorderNode: (sectionId: string, parentId: string | null, orderedIds: string[]) => void;
};

function isSelected(selection: BuilderSelection, kind: "page" | "section" | "node", id: string) {
  return Boolean(selection && selection.kind === kind && selection.id === id);
}

function TreeRow({
  selected,
  label,
  labelClassName,
  onSelect,
  children,
}: {
  selected: boolean;
  label: string;
  labelClassName?: string;
  onSelect: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group flex flex-wrap items-center gap-0.5 rounded-md px-1.5 py-1 text-sm transition-colors",
        selected
          ? "bg-secondary text-primary ring-1 ring-primary/35"
          : "hover:bg-muted/70",
      )}
    >
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        className={cn("min-w-0 flex-1 truncate text-left", labelClassName)}
        onClick={onSelect}
      >
        {label}
      </button>
      {children}
    </div>
  );
}

function NodeBranch({
  nodes,
  sectionId,
  parentId,
  selection,
  depth,
  onSelect,
  onAddNode,
  onDeleteNode,
  onReorderNode,
}: {
  nodes: WebsiteTreeNode[];
  sectionId: string;
  parentId: string | null;
  selection: BuilderSelection;
  depth: number;
  onSelect: (selection: BuilderSelection) => void;
  onAddNode: (sectionId: string, parentId: string | null) => void;
  onDeleteNode: (nodeId: string) => void;
  onReorderNode: (sectionId: string, parentId: string | null, orderedIds: string[]) => void;
}) {
  if (!nodes.length) {
    return null;
  }

  return (
    <ul
      className={cn(
        "relative ml-2 space-y-0.5 border-l border-primary/20 pl-3",
        depth === 0 && "mt-1",
      )}
      role="group"
    >
      {nodes.map((node, index) => {
        const definition = getNodeType(node.type);
        const selected = isSelected(selection, "node", node.id);
        const canNest = definition?.children.kind !== "none";
        return (
          <li key={node.id} className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-3 top-[0.9rem] h-px w-2.5 bg-primary/25"
            />
            <TreeRow
              selected={selected}
              label={definition?.label ?? node.type}
              onSelect={() => onSelect({ kind: "node", id: node.id })}
            >
              {canNest ? (
                <Button size="xs" variant="ghost" onClick={() => onAddNode(sectionId, node.id)}>
                  +
                </Button>
              ) : null}
              <Button
                size="xs"
                variant="ghost"
                disabled={index === 0}
                onClick={() => {
                  const ordered = nodes.map((item) => item.id);
                  const next = [...ordered];
                  const [item] = next.splice(index, 1);
                  next.splice(index - 1, 0, item);
                  onReorderNode(sectionId, parentId, next);
                }}
              >
                ↑
              </Button>
              <Button
                size="xs"
                variant="ghost"
                disabled={index === nodes.length - 1}
                onClick={() => {
                  const ordered = nodes.map((item) => item.id);
                  const next = [...ordered];
                  const [item] = next.splice(index, 1);
                  next.splice(index + 1, 0, item);
                  onReorderNode(sectionId, parentId, next);
                }}
              >
                ↓
              </Button>
              <Button size="xs" variant="ghost" onClick={() => onDeleteNode(node.id)}>
                ×
              </Button>
            </TreeRow>
            {node.children.length ? (
              <NodeBranch
                nodes={node.children}
                sectionId={sectionId}
                parentId={node.id}
                selection={selection}
                depth={depth + 1}
                onSelect={onSelect}
                onAddNode={onAddNode}
                onDeleteNode={onDeleteNode}
                onReorderNode={onReorderNode}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function SectionBranch({
  section,
  pageId,
  sections,
  selection,
  onSelect,
  onAddNode,
  onDeleteSection,
  onDeleteNode,
  onReorderSection,
  onReorderNode,
}: {
  section: WebsiteTreeSection;
  pageId: string;
  sections: WebsiteTreeSection[];
  selection: BuilderSelection;
  onSelect: (selection: BuilderSelection) => void;
  onAddNode: (sectionId: string, parentId: string | null) => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onReorderSection: (pageId: string, orderedIds: string[]) => void;
  onReorderNode: (sectionId: string, parentId: string | null, orderedIds: string[]) => void;
}) {
  const selected = isSelected(selection, "section", section.id);
  const index = sections.findIndex((item) => item.id === section.id);

  return (
    <div className="relative border-b border-border/70 pb-2.5 last:border-b-0 last:pb-0">
      <div className="absolute bottom-0 left-0 top-2 w-0.5 rounded-full bg-primary/30" aria-hidden="true" />
      <div className="pl-2.5">
        <TreeRow
          selected={selected}
          label={`Section · ${section.name}`}
          labelClassName="font-medium"
          onSelect={() => onSelect({ kind: "section", id: section.id })}
        >
          <Button size="xs" variant="ghost" onClick={() => onAddNode(section.id, null)}>
            +Node
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={index <= 0}
            onClick={() => {
              const ordered = sections.map((item) => item.id);
              const next = [...ordered];
              const [item] = next.splice(index, 1);
              next.splice(index - 1, 0, item);
              onReorderSection(pageId, next);
            }}
          >
            ↑
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={index >= sections.length - 1}
            onClick={() => {
              const ordered = sections.map((item) => item.id);
              const next = [...ordered];
              const [item] = next.splice(index, 1);
              next.splice(index + 1, 0, item);
              onReorderSection(pageId, next);
            }}
          >
            ↓
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onDeleteSection(section.id)}>
            ×
          </Button>
        </TreeRow>
        <NodeBranch
          nodes={section.nodes}
          sectionId={section.id}
          parentId={null}
          selection={selection}
          depth={0}
          onSelect={onSelect}
          onAddNode={onAddNode}
          onDeleteNode={onDeleteNode}
          onReorderNode={onReorderNode}
        />
      </div>
    </div>
  );
}

function PageBranch({
  page,
  siblings,
  selection,
  depth,
  onSelect,
  onAddPage,
  onAddSection,
  onAddNode,
  onDeletePage,
  onDeleteSection,
  onDeleteNode,
  onReorderPage,
  onReorderSection,
  onReorderNode,
}: {
  page: WebsiteTreePage;
  siblings: WebsiteTreePage[];
  selection: BuilderSelection;
  depth: number;
  onSelect: (selection: BuilderSelection) => void;
  onAddPage: (parentId: string | null) => void;
  onAddSection: (pageId: string) => void;
  onAddNode: (sectionId: string, parentId: string | null) => void;
  onDeletePage: (pageId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onReorderPage: (parentId: string | null, orderedIds: string[]) => void;
  onReorderSection: (pageId: string, orderedIds: string[]) => void;
  onReorderNode: (sectionId: string, parentId: string | null, orderedIds: string[]) => void;
}) {
  const selected = isSelected(selection, "page", page.id);
  const index = siblings.findIndex((item) => item.id === page.id);

  return (
    <div className={cn("space-y-2", depth > 0 && "ml-2 border-l border-border/80 pl-2")}>
      <TreeRow
        selected={selected}
        label={`Page · ${page.title}`}
        labelClassName="font-semibold"
        onSelect={() => onSelect({ kind: "page", id: page.id })}
      >
        <Button size="xs" variant="ghost" onClick={() => onAddPage(page.id)}>
          +Page
        </Button>
        <Button size="xs" variant="ghost" onClick={() => onAddSection(page.id)}>
          +Sec
        </Button>
        <Button
          size="xs"
          variant="ghost"
          disabled={index <= 0}
          onClick={() => {
            const ordered = siblings.map((item) => item.id);
            const next = [...ordered];
            const [item] = next.splice(index, 1);
            next.splice(index - 1, 0, item);
            onReorderPage(page.parentId, next);
          }}
        >
          ↑
        </Button>
        <Button
          size="xs"
          variant="ghost"
          disabled={index >= siblings.length - 1}
          onClick={() => {
            const ordered = siblings.map((item) => item.id);
            const next = [...ordered];
            const [item] = next.splice(index, 1);
            next.splice(index + 1, 0, item);
            onReorderPage(page.parentId, next);
          }}
        >
          ↓
        </Button>
        <Button size="xs" variant="ghost" onClick={() => onDeletePage(page.id)}>
          ×
        </Button>
      </TreeRow>

      <div className="space-y-2.5 pl-0.5">
        {page.sections.map((section) => (
          <SectionBranch
            key={section.id}
            section={section}
            pageId={page.id}
            sections={page.sections}
            selection={selection}
            onSelect={onSelect}
            onAddNode={onAddNode}
            onDeleteSection={onDeleteSection}
            onDeleteNode={onDeleteNode}
            onReorderSection={onReorderSection}
            onReorderNode={onReorderNode}
          />
        ))}
      </div>

      {page.children.map((child) => (
        <PageBranch
          key={child.id}
          page={child}
          siblings={page.children}
          selection={selection}
          depth={depth + 1}
          onSelect={onSelect}
          onAddPage={onAddPage}
          onAddSection={onAddSection}
          onAddNode={onAddNode}
          onDeletePage={onDeletePage}
          onDeleteSection={onDeleteSection}
          onDeleteNode={onDeleteNode}
          onReorderPage={onReorderPage}
          onReorderSection={onReorderSection}
          onReorderNode={onReorderNode}
        />
      ))}
    </div>
  );
}

export function StructurePanel(props: StructurePanelProps) {
  const { pages, onAddPage } = props;

  return (
    // Fill remaining aside height under tab strip; h-full would overflow and clip last rows.
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-3">
        <div>
          <p className="text-sm font-medium">Structure</p>
          <p className="text-xs text-muted-foreground">Pages · sections · nodes</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => onAddPage(null)}>
          Add page
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 pb-5">
        {pages.length ? (
          pages.map((page) => (
            <PageBranch key={page.id} page={page} siblings={pages} depth={0} {...props} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No pages yet. Add a page to start.</p>
        )}
      </div>
    </div>
  );
}
