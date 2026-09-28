import { getNodeType } from "./registry";

/**
 * Resolve platform HTML tag for a node.
 * Node identity stays separate from the chosen tag.
 */
export function resolveHtmlTag(type: string, data: unknown): string | null {
  const definition = getNodeType(type);
  if (!definition) {
    return null;
  }

  const { html } = definition;

  if (type === "heading" && data && typeof data === "object" && "level" in data) {
    const level = (data as { level?: unknown }).level;
    if (typeof level === "number" && level >= 1 && level <= 6) {
      return `h${level}`;
    }
  }

  if (type === "button" && data && typeof data === "object" && "href" in data) {
    const href = (data as { href?: unknown }).href;
    if (typeof href === "string" && href.trim().length > 0) {
      return "a";
    }
    return "button";
  }

  if (html.tagFromDataField && html.allowedTags?.length && data && typeof data === "object") {
    const value = (data as Record<string, unknown>)[html.tagFromDataField];
    if (typeof value === "string" && html.allowedTags.includes(value)) {
      return value;
    }
  }

  return html.defaultTag;
}
