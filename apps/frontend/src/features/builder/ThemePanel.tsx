"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WebsiteTheme } from "@custom-website-builder/node-registry";

type ThemePanelProps = {
  theme: WebsiteTheme;
  onChange: (patch: Partial<{
    colors: Partial<WebsiteTheme["colors"]>;
    typography: Partial<WebsiteTheme["typography"]>;
    general: Partial<WebsiteTheme["general"]>;
  }>) => void;
  saveState?: "idle" | "saving" | "saved" | "error";
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          className="h-9 w-12 cursor-pointer p-1"
          value={/^#/.test(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
        />
        <Input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}

export function ThemePanel({ theme, onChange, saveState = "idle" }: ThemePanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-3">
        <p className="text-sm font-medium">Website theme</p>
        <p className="text-xs text-muted-foreground">Global design for this website only</p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {saveState === "saving" ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
        {saveState === "saved" ? <p className="text-xs text-muted-foreground">Saved</p> : null}
        {saveState === "error" ? <p className="text-xs text-destructive">Save failed</p> : null}

        <section className="space-y-3 rounded-lg border border-border p-3">
          <h3 className="text-sm font-medium">Colors</h3>
          <ColorField
            label="Primary"
            value={theme.colors.primary}
            onChange={(primary) => onChange({ colors: { primary } })}
          />
          <ColorField
            label="Secondary"
            value={theme.colors.secondary}
            onChange={(secondary) => onChange({ colors: { secondary } })}
          />
          <ColorField
            label="Background"
            value={theme.colors.background}
            onChange={(background) => onChange({ colors: { background } })}
          />
          <ColorField
            label="Surface"
            value={theme.colors.surface}
            onChange={(surface) => onChange({ colors: { surface } })}
          />
          <ColorField
            label="Text"
            value={theme.colors.text}
            onChange={(text) => onChange({ colors: { text } })}
          />
          <ColorField
            label="Muted text"
            value={theme.colors.mutedText}
            onChange={(mutedText) => onChange({ colors: { mutedText } })}
          />
          <ColorField
            label="Border"
            value={theme.colors.border}
            onChange={(border) => onChange({ colors: { border } })}
          />
        </section>

        <section className="space-y-3 rounded-lg border border-border p-3">
          <h3 className="text-sm font-medium">Typography</h3>
          <div className="space-y-1.5">
            <Label htmlFor="heading-font">Heading font</Label>
            <Input
              id="heading-font"
              value={theme.typography.headingFont}
              onChange={(event) => onChange({ typography: { headingFont: event.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body-font">Body font</Label>
            <Input
              id="body-font"
              value={theme.typography.bodyFont}
              onChange={(event) => onChange({ typography: { bodyFont: event.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="base-size">Base font size</Label>
            <Input
              id="base-size"
              value={theme.typography.baseFontSize}
              onChange={(event) => onChange({ typography: { baseFontSize: event.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="heading-weight">Heading weight</Label>
            <select
              id="heading-weight"
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              value={theme.typography.headingWeight}
              onChange={(event) =>
                onChange({
                  typography: {
                    headingWeight: event.target.value as WebsiteTheme["typography"]["headingWeight"],
                  },
                })
              }
            >
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-border p-3">
          <h3 className="text-sm font-medium">General</h3>
          <div className="space-y-1.5">
            <Label htmlFor="radius">Border radius</Label>
            <Input
              id="radius"
              value={theme.general.borderRadius}
              onChange={(event) => onChange({ general: { borderRadius: event.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="spacing">Spacing</Label>
            <Input
              id="spacing"
              value={theme.general.spacing}
              onChange={(event) => onChange({ general: { spacing: event.target.value } })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
