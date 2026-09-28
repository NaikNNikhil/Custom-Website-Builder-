import { z } from "zod";
import type { NodeStyles } from "./styles";

/**
 * Website-owned design language.
 * Extensible object; V1 ships focused color/typography/general defaults.
 * Future breakpoints can wrap values without moving theme off the Website.
 */
export const websiteThemeSchema = z.object({
  colors: z.object({
    primary: z.string().trim().min(1).max(40),
    secondary: z.string().trim().min(1).max(40),
    background: z.string().trim().min(1).max(40),
    surface: z.string().trim().min(1).max(40),
    text: z.string().trim().min(1).max(40),
    mutedText: z.string().trim().min(1).max(40),
    border: z.string().trim().min(1).max(40),
  }),
  typography: z.object({
    headingFont: z.string().trim().min(1).max(120),
    bodyFont: z.string().trim().min(1).max(120),
    baseFontSize: z.string().trim().min(1).max(40),
    headingWeight: z.enum(["400", "500", "600", "700"]),
  }),
  general: z.object({
    borderRadius: z.string().trim().min(1).max(40),
    spacing: z.string().trim().min(1).max(40),
  }),
});

export type WebsiteTheme = z.infer<typeof websiteThemeSchema>;

export const DEFAULT_WEBSITE_THEME: WebsiteTheme = {
  colors: {
    primary: "#171717",
    secondary: "#525252",
    background: "#ffffff",
    surface: "#f5f5f5",
    text: "#171717",
    mutedText: "#737373",
    border: "#e5e5e5",
  },
  typography: {
    headingFont: "Georgia, serif",
    bodyFont: "system-ui, sans-serif",
    baseFontSize: "1rem",
    headingWeight: "600",
  },
  general: {
    borderRadius: "8px",
    spacing: "1rem",
  },
};

export function parseWebsiteTheme(raw: unknown): WebsiteTheme {
  const parsed = websiteThemeSchema.safeParse(raw);
  if (!parsed.success) {
    return structuredClone(DEFAULT_WEBSITE_THEME);
  }
  return parsed.data;
}

export function mergeWebsiteTheme(
  current: WebsiteTheme,
  patch: Partial<{
    colors: Partial<WebsiteTheme["colors"]>;
    typography: Partial<WebsiteTheme["typography"]>;
    general: Partial<WebsiteTheme["general"]>;
  }>,
): WebsiteTheme {
  return websiteThemeSchema.parse({
    colors: { ...current.colors, ...patch.colors },
    typography: { ...current.typography, ...patch.typography },
    general: { ...current.general, ...patch.general },
  });
}

/**
 * Map theme tokens → baseline node styles for a type.
 * UI Library layer inserts between theme and node overrides.
 */
export function themeStylesForNodeType(nodeType: string, theme: WebsiteTheme): Partial<NodeStyles> {
  switch (nodeType) {
    case "heading":
      return {
        fontFamily: theme.typography.headingFont,
        fontWeight: theme.typography.headingWeight,
        color: theme.colors.text,
        borderRadius: theme.general.borderRadius,
      };
    case "text":
      return {
        fontFamily: theme.typography.bodyFont,
        fontSize: theme.typography.baseFontSize,
        color: theme.colors.text,
        lineHeight: "1.5",
      };
    case "button":
      return {
        fontFamily: theme.typography.bodyFont,
        background: theme.colors.primary,
        color: "#ffffff",
        borderRadius: theme.general.borderRadius,
        padding: theme.general.spacing,
        fontWeight: "500",
      };
    case "link":
      return {
        fontFamily: theme.typography.bodyFont,
        color: theme.colors.primary,
      };
    case "container":
      return {
        borderRadius: theme.general.borderRadius,
      };
    case "image":
      return {
        borderRadius: theme.general.borderRadius,
        width: "100%",
      };
    case "spacer":
      return {};
    default:
      return {
        color: theme.colors.text,
        fontFamily: theme.typography.bodyFont,
      };
  }
}

function definedEntries<T extends Record<string, unknown>>(value: T | null | undefined): Partial<T> {
  if (!value) return {};
  const next: Partial<T> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined && entry !== null && entry !== "") {
      (next as Record<string, unknown>)[key] = entry;
    }
  }
  return next;
}

export type StyleResolutionInput = {
  nodeType: string;
  nodeStyles?: NodeStyles | null;
  theme?: WebsiteTheme | null;
  /** Website UI Library configured styles for this node (already resolved nested refs). */
  libraryStyles?: Partial<NodeStyles> | null;
};

/**
 * Central effective-style resolution.
 * Order: Theme → UI Library → Node override (sparse merge; more specific wins).
 */
export function resolveEffectiveStyles(input: StyleResolutionInput): NodeStyles {
  const theme = input.theme ?? DEFAULT_WEBSITE_THEME;
  const fromTheme = themeStylesForNodeType(input.nodeType, theme);
  const fromLibrary = definedEntries(input.libraryStyles ?? undefined);
  const fromNode = definedEntries(input.nodeStyles ?? undefined);

  return {
    ...fromTheme,
    ...fromLibrary,
    ...fromNode,
  };
}
