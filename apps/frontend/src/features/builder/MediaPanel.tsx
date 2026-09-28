"use client";

import { useRef, useState } from "react";
import type { MediaAssetRecord } from "@/features/websites/types";

type MediaPanelProps = {
  mediaAssets: MediaAssetRecord[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (mediaAssetId: string, force: boolean) => Promise<void>;
  onSelectForPreview?: (mediaAssetId: string) => void;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPanel({ mediaAssets, onUpload, onDelete }: MediaPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (asset: MediaAssetRecord) => {
    setBusy(true);
    setError(null);
    try {
      try {
        await onDelete(asset.id, false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Delete failed";
        const confirmed = window.confirm(
          `${message}\n\nForce delete? Referencing image nodes will clear the media link and keep styles.`,
        );
        if (!confirmed) return;
        await onDelete(asset.id, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="space-y-2 border-b border-border px-3 py-3">
        <p className="text-sm font-medium">Media</p>
        <p className="text-xs text-muted-foreground">
          Website-owned assets. Image nodes reference assets — not raw Cloudinary APIs.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => void handleUpload(event.target.files?.[0])}
        />
        <button
          type="button"
          className="w-full rounded border border-border px-2 py-1.5 text-sm hover:bg-muted"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Working…" : "Upload image"}
        </button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {!mediaAssets.length ? (
          <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
        ) : (
          mediaAssets.map((asset) => (
            <article
              key={asset.id}
              className="overflow-hidden rounded-md border border-border"
              data-media-asset-id={asset.id}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url} alt={asset.filename} className="aspect-video w-full object-cover bg-muted" />
              <div className="space-y-1 p-2">
                <p className="truncate text-sm font-medium">{asset.filename}</p>
                <p className="text-[0.7rem] text-muted-foreground">
                  {asset.mimeType} · {formatBytes(asset.byteSize)}
                  {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
                </p>
                <button
                  type="button"
                  className="rounded border border-border px-2 py-0.5 text-[0.7rem] text-destructive hover:bg-muted"
                  disabled={busy}
                  onClick={() => void handleDelete(asset)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
