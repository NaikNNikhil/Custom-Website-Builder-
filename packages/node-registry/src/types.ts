import type { z } from "zod";
import type { PropertyCategory } from "./properties";

/** Stable platform node identity. Not an HTML tag. */
export type NodeTypeId =
  | "container"
  | "heading"
  | "text"
  | "image"
  | "button"
  | "link"
  | "spacer";

export type NodeCategory = "structure" | "content" | "media" | "action";

/**
 * Platform-controlled HTML semantics for a node type.
 * Users do not edit raw HTML; registry chooses tags.
 */
export type HtmlSemantics = {
  defaultTag: string;
  tagFromDataField?: string;
  allowedTags?: readonly string[];
};

/**
 * Capability ids reference PROPERTY_FIELD_CATALOG entries.
 * Empty category => editor hides that section.
 */
export type NodeCapabilityFlags = {
  content: readonly string[];
  typography: readonly string[];
  appearance: readonly string[];
  layout: readonly string[];
};

export type ChildPolicy =
  | { kind: "none" }
  | { kind: "anyRegistered" }
  | { kind: "allowlist"; types: readonly NodeTypeId[] };

export type NodeTypeDefinition<TData = unknown> = {
  id: NodeTypeId;
  label: string;
  description: string;
  category: NodeCategory;
  version: 1;
  capabilities: NodeCapabilityFlags;
  children: ChildPolicy;
  html: HtmlSemantics;
  defaultData: TData;
  dataSchema: z.ZodType<TData>;
};

export type RegistryValidationIssue = {
  code: "unsupported_type" | "invalid_data" | "invalid_child" | "children_not_allowed";
  message: string;
  path?: string;
};

export type ValidateNodeInput = {
  type: string;
  data?: unknown;
  parentType?: string | null;
};

export type { PropertyCategory };
