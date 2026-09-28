"use client";

import { useState } from "react";
import {
  getCapabilityFields,
  getNodeType,
  getValueAtPath,
  mergeNodeData,
  resolveLibraryDataForNode,
  setValueAtPath,
  validateNodeAgainstRegistry,
  type LibraryItemDefinitionView,
  type PropertyFieldDefinition,
} from "@custom-website-builder/node-registry";
import type { MediaAssetRecord, WebsiteTreeNode } from "@/features/websites/types";
import { PropertyControl } from "./PropertyControl";
import { MediaPickerDialog } from "./MediaPickerDialog";

type NodePropertyEditorProps = {
  node: WebsiteTreeNode;
  libraryLookup: Record<string, LibraryItemDefinitionView>;
  mediaAssets: MediaAssetRecord[];
  onUploadMedia: (file: File) => Promise<MediaAssetRecord>;
  onChangeData: (nodeId: string, data: Record<string, unknown>) => void;
  saveState?: "idle" | "saving" | "saved" | "error";
};

function PropertySection({
  title,
  fields,
  displayData,
  mediaAssets,
  onFieldChange,
  onOpenMediaPicker,
}: {
  title: string;
  fields: PropertyFieldDefinition[];
  displayData: Record<string, unknown>;
  mediaAssets: MediaAssetRecord[];
  onFieldChange: (field: PropertyFieldDefinition, value: unknown) => void;
  onOpenMediaPicker: () => void;
}) {
  if (!fields.length) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-lg border border-border p-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="space-y-3">
        {fields.map((field) => (
          <PropertyControl
            key={field.id}
            field={field}
            value={getValueAtPath(displayData, field.path)}
            onChange={(value) => onFieldChange(field, value)}
            mediaAssets={mediaAssets}
            onOpenMediaPicker={onOpenMediaPicker}
          />
        ))}
      </div>
    </section>
  );
}

export function NodePropertyEditor({
  node,
  libraryLookup,
  mediaAssets,
  onUploadMedia,
  onChangeData,
  saveState = "idle",
}: NodePropertyEditorProps) {
  const definition = getNodeType(node.type);
  const [error, setError] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const overrideData = (node.data ?? {}) as Record<string, unknown>;
  const libraryData = resolveLibraryDataForNode({
    libraryItemId: node.libraryItemId,
    libraryNodeKey: node.libraryNodeKey,
    lookup: libraryLookup,
  });
  const displayData = mergeNodeData(libraryData ?? {}, overrideData);

  if (!definition) {
    return <p className="text-sm text-destructive">Unsupported node type in registry.</p>;
  }

  const fields = getCapabilityFields(definition);

  function handleFieldChange(field: PropertyFieldDefinition, value: unknown) {
    const nextOverride = setValueAtPath(overrideData, field.path, value);
    // When selecting media, clear legacy src so reference stays canonical
    if (field.id === "mediaAssetId" && value) {
      nextOverride.src = "";
    }
    const merged = mergeNodeData(libraryData ?? {}, nextOverride);
    const validation = validateNodeAgainstRegistry({ type: node.type, data: merged });

    if (!validation.ok) {
      setError(validation.issues[0]?.message ?? "Invalid value");
      onChangeData(node.id, nextOverride);
      return;
    }

    setError(null);
    onChangeData(node.id, nextOverride);
  }

  return (
    <div className="space-y-3" key={node.id}>
      <p className="text-xs text-muted-foreground">{definition.description}</p>
      {node.libraryItemId ? (
        <p className="text-xs text-muted-foreground">
          Linked library instance — edits store sparse overrides only.
        </p>
      ) : null}
      {saveState === "saving" ? (
        <p className="text-xs text-muted-foreground">Saving…</p>
      ) : null}
      {saveState === "saved" ? <p className="text-xs text-muted-foreground">Saved</p> : null}
      {saveState === "error" ? <p className="text-xs text-destructive">Save failed</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <PropertySection
        title="Content"
        fields={fields.content}
        displayData={displayData}
        mediaAssets={mediaAssets}
        onFieldChange={handleFieldChange}
        onOpenMediaPicker={() => setMediaPickerOpen(true)}
      />
      <PropertySection
        title="Typography"
        fields={fields.typography}
        displayData={displayData}
        mediaAssets={mediaAssets}
        onFieldChange={handleFieldChange}
        onOpenMediaPicker={() => setMediaPickerOpen(true)}
      />
      <PropertySection
        title="Appearance"
        fields={fields.appearance}
        displayData={displayData}
        mediaAssets={mediaAssets}
        onFieldChange={handleFieldChange}
        onOpenMediaPicker={() => setMediaPickerOpen(true)}
      />
      <PropertySection
        title="Layout"
        fields={fields.layout}
        displayData={displayData}
        mediaAssets={mediaAssets}
        onFieldChange={handleFieldChange}
        onOpenMediaPicker={() => setMediaPickerOpen(true)}
      />

      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        mediaAssets={mediaAssets}
        selectedId={typeof displayData.mediaAssetId === "string" ? displayData.mediaAssetId : null}
        onSelect={(assetId) => {
          const field = fields.content.find((item) => item.id === "mediaAssetId");
          if (field) {
            handleFieldChange(field, assetId);
          }
        }}
        onUpload={onUploadMedia}
      />
    </div>
  );
}
