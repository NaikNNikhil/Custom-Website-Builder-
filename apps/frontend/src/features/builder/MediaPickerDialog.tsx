"use client";

import { useMemo, useRef, useState } from "react";
import type { MediaAssetRecord } from "@/features/websites/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MediaPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaAssets: MediaAssetRecord[];
  selectedId?: string | null;
  onSelect: (assetId: string) => void;
  onUpload: (file: File) => Promise<MediaAssetRecord>;
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  mediaAssets,
  selectedId,
  onSelect,
  onUpload,
}: MediaPickerDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return mediaAssets;
    return mediaAssets.filter((asset) => asset.filename.toLowerCase().includes(q));
  }, [mediaAssets, filter]);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const asset = await onUpload(file);
      onSelect(asset.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose media</DialogTitle>
          <DialogDescription>Select a website media asset or upload a new image.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by filename"
            className="h-8 min-w-[12rem] flex-1 rounded-md border border-border bg-background px-2 text-sm"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
          />
          <button
            type="button"
            className="rounded border border-border px-2 py-1 text-sm hover:bg-muted"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading…" : "Upload"}
          </button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="max-h-[50vh] overflow-y-auto">
          {!filtered.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No media assets yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filtered.map((asset) => {
                const selected = asset.id === selectedId;
                return (
                  <li key={asset.id}>
                    <button
                      type="button"
                      className={`w-full overflow-hidden rounded-md border text-left ${
                        selected ? "border-primary ring-2 ring-primary/30" : "border-border"
                      }`}
                      onClick={() => {
                        onSelect(asset.id);
                        onOpenChange(false);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        className="aspect-square w-full object-cover bg-muted"
                      />
                      <p className="truncate px-2 py-1 text-[0.7rem]">{asset.filename}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
