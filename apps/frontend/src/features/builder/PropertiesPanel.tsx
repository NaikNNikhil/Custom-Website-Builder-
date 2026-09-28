"use client";

import { getNodeType, type LibraryItemDefinitionView } from "@custom-website-builder/node-registry";
import type {
  MediaAssetRecord,
  WebsiteTreeNode,
  WebsiteTreePage,
  WebsiteTreeSection,
} from "@/features/websites/types";
import type { BuilderSelection } from "./selection";
import { NodePropertyEditor } from "./NodePropertyEditor";

type PropertiesPanelProps = {
  selection: BuilderSelection;
  selectedPage: WebsiteTreePage | null;
  selectedSection: WebsiteTreeSection | null;
  selectedNode: WebsiteTreeNode | null;
  libraryLookup: Record<string, LibraryItemDefinitionView>;
  mediaAssets: MediaAssetRecord[];
  onUploadMedia: (file: File) => Promise<MediaAssetRecord>;
  onChangeNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  onSaveToLibrary?: (nodeId: string) => void;
  onMakeIndependent?: (nodeId: string) => void;
  saveState?: "idle" | "saving" | "saved" | "error";
};

export function PropertiesPanel({
  selection,
  selectedPage,
  selectedSection,
  selectedNode,
  libraryLookup,
  mediaAssets,
  onUploadMedia,
  onChangeNodeData,
  onSaveToLibrary,
  onMakeIndependent,
  saveState = "idle",
}: PropertiesPanelProps) {
  if (!selection) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-3 py-3">
          <p className="text-sm font-medium">Properties</p>
          <p className="text-xs text-muted-foreground">Select a node to edit</p>
        </div>
        <div className="p-3 text-sm text-muted-foreground">Nothing selected.</div>
      </div>
    );
  }

  if (selection.kind === "page" && selectedPage) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-3 py-3">
          <p className="text-sm font-medium">Selected: Page</p>
          <p className="text-xs text-muted-foreground">{selectedPage.title}</p>
        </div>
        <div className="space-y-3 overflow-y-auto p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Slug:</span> /{selectedPage.slug}
          </p>
          <p className="text-muted-foreground">Page settings arrive in later phases.</p>
        </div>
      </div>
    );
  }

  if (selection.kind === "section" && selectedSection) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-3 py-3">
          <p className="text-sm font-medium">Selected: Section</p>
          <p className="text-xs text-muted-foreground">{selectedSection.name}</p>
        </div>
        <div className="space-y-3 overflow-y-auto p-3 text-sm text-muted-foreground">
          Section holds a node tree. Select a node to edit properties.
        </div>
      </div>
    );
  }

  if (selection.kind === "node" && selectedNode) {
    const definition = getNodeType(selectedNode.type);

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-3 py-3">
          <p className="text-sm font-medium">Selected: {definition?.label ?? selectedNode.type}</p>
          <p className="text-xs text-muted-foreground">type `{selectedNode.type}`</p>
          {selectedNode.libraryItemId ? (
            <p className="mt-1 text-xs text-muted-foreground">Linked to UI Library</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1">
            {onSaveToLibrary ? (
              <button
                type="button"
                className="rounded border border-border px-2 py-0.5 text-[0.7rem] hover:bg-muted"
                onClick={() => onSaveToLibrary(selectedNode.id)}
              >
                Save to UI Library
              </button>
            ) : null}
            {selectedNode.libraryItemId && onMakeIndependent ? (
              <button
                type="button"
                className="rounded border border-border px-2 py-0.5 text-[0.7rem] hover:bg-muted"
                onClick={() => onMakeIndependent(selectedNode.id)}
              >
                Make Independent
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NodePropertyEditor
            node={selectedNode}
            libraryLookup={libraryLookup}
            mediaAssets={mediaAssets}
            onUploadMedia={onUploadMedia}
            onChangeData={onChangeNodeData}
            saveState={saveState}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 text-sm text-muted-foreground">Selection no longer exists in tree.</div>
  );
}
