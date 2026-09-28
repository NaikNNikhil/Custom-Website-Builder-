"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PropertyFieldDefinition } from "@custom-website-builder/node-registry";
import type { MediaAssetRecord } from "@/features/websites/types";

type PropertyControlProps = {
  field: PropertyFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  mediaAssets?: MediaAssetRecord[];
  onOpenMediaPicker?: () => void;
};

function toInputString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

export function PropertyControl({
  field,
  value,
  onChange,
  mediaAssets = [],
  onOpenMediaPicker,
}: PropertyControlProps) {
  const id = `prop-${field.id}`;
  const stringValue = toInputString(value);

  if (field.control === "mediaAsset") {
    const assetId = typeof value === "string" ? value : null;
    const asset = assetId ? mediaAssets.find((item) => item.id === assetId) : null;

    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{field.label}</Label>
        {asset ? (
          <div className="overflow-hidden rounded-md border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.url} alt={asset.filename} className="aspect-video w-full object-cover" />
            <p className="truncate px-2 py-1 text-xs">{asset.filename}</p>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border px-2 py-3 text-xs text-muted-foreground">
            No media selected
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            id={id}
            className="rounded border border-border px-2 py-0.5 text-[0.7rem] hover:bg-muted"
            onClick={() => onOpenMediaPicker?.()}
          >
            {asset ? "Replace" : "Choose media"}
          </button>
          {asset ? (
            <button
              type="button"
              className="rounded border border-border px-2 py-0.5 text-[0.7rem] hover:bg-muted"
              onClick={() => onChange(null)}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{field.label}</Label>

      {field.control === "textarea" ? (
        <Textarea
          id={id}
          value={stringValue}
          placeholder={field.placeholder}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {field.control === "text" || field.control === "url" ? (
        <Input
          id={id}
          type={field.control === "url" ? "url" : "text"}
          value={stringValue}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {field.control === "color" ? (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type="color"
            className="h-9 w-12 cursor-pointer p-1"
            value={stringValue && /^#/.test(stringValue) ? stringValue : "#000000"}
            onChange={(event) => onChange(event.target.value)}
          />
          <Input
            type="text"
            value={stringValue}
            placeholder="#000000 or css color"
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      ) : null}

      {field.control === "number" ? (
        <Input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={stringValue}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "") {
              onChange(undefined);
              return;
            }
            const parsed = Number(next);
            onChange(Number.isFinite(parsed) ? parsed : undefined);
          }}
        />
      ) : null}

      {field.control === "select" ? (
        <select
          id={id}
          className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={stringValue}
          onChange={(event) => {
            const next = event.target.value;
            if (field.id === "level") {
              onChange(Number(next));
              return;
            }
            onChange(next === "" ? undefined : next);
          }}
        >
          <option value="">Default</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
