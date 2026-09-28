import { z } from "zod";

/**
 * Base/desktop style overrides for a node.
 * Only set keys count as instance overrides — unset inherits later Theme/UI Library defaults.
 * Responsive breakpoints can later wrap or extend this without changing content fields.
 */
export const nodeStylesSchema = z
  .object({
    fontFamily: z.string().trim().max(120).optional(),
    fontSize: z.string().trim().max(40).optional(),
    fontWeight: z.enum(["400", "500", "600", "700"]).optional(),
    color: z.string().trim().max(40).optional(),
    textAlign: z.enum(["start", "center", "end"]).optional(),
    lineHeight: z.string().trim().max(40).optional(),
    background: z.string().trim().max(80).optional(),
    border: z.string().trim().max(80).optional(),
    borderRadius: z.string().trim().max(40).optional(),
    opacity: z.number().min(0).max(1).optional(),
    width: z.string().trim().max(40).optional(),
    height: z.string().trim().max(40).optional(),
    padding: z.string().trim().max(40).optional(),
    margin: z.string().trim().max(40).optional(),
  })
  .default({});

export type NodeStyles = z.infer<typeof nodeStylesSchema>;

/** Framework-agnostic CSS property map for renderers. */
export function stylesToCss(styles?: NodeStyles | null): Record<string, string | number> {
  if (!styles) {
    return {};
  }

  const css: Record<string, string | number> = {};

  if (styles.fontFamily) css.fontFamily = styles.fontFamily;
  if (styles.fontSize) css.fontSize = styles.fontSize;
  if (styles.fontWeight) css.fontWeight = styles.fontWeight;
  if (styles.color) css.color = styles.color;
  if (styles.textAlign) {
    css.textAlign = styles.textAlign === "start" ? "left" : styles.textAlign === "end" ? "right" : "center";
  }
  if (styles.lineHeight) css.lineHeight = styles.lineHeight;
  if (styles.background) css.background = styles.background;
  if (styles.border) css.border = styles.border;
  if (styles.borderRadius) css.borderRadius = styles.borderRadius;
  if (styles.opacity !== undefined) css.opacity = styles.opacity;
  if (styles.width) css.width = styles.width;
  if (styles.height) css.height = styles.height;
  if (styles.padding) css.padding = styles.padding;
  if (styles.margin) css.margin = styles.margin;

  return css;
}

/**
 * Normalize legacy `{ align }` into `styles.textAlign` while keeping parse tolerant.
 */
export function migrateLegacyNodeData(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const data = { ...(raw as Record<string, unknown>) };
  const legacyAlign = data.align;
  if (legacyAlign === "start" || legacyAlign === "center" || legacyAlign === "end") {
    const styles =
      data.styles && typeof data.styles === "object" && !Array.isArray(data.styles)
        ? { ...(data.styles as Record<string, unknown>) }
        : {};
    if (styles.textAlign === undefined) {
      styles.textAlign = legacyAlign;
    }
    data.styles = styles;
    delete data.align;
  }

  return data;
}
