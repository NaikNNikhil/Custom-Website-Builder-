import { z } from "zod";
import { isRegisteredNodeType } from "./registry";
import type { NodeStyles } from "./styles";

/**
 * Stable node within a library item definition tree.
 * Generic structure only — no React/JSX/frontend paths.
 */
export type LibraryNodeDefinition = {
  key: string;
  type: string;
  name?: string | null;
  data: Record<string, unknown>;
  children: LibraryNodeDefinition[];
  /** Nested UI Library reference (another item on the same website). */
  libraryItemId?: string | null;
};

export const libraryNodeDefinitionSchema: z.ZodType<LibraryNodeDefinition> = z.lazy(() =>
  z.object({
    key: z.string().trim().min(1).max(64),
    type: z.string().trim().min(1).max(120),
    name: z.string().trim().min(1).max(160).nullable().optional(),
    data: z.record(z.string(), z.unknown()).default({}),
    children: z.array(libraryNodeDefinitionSchema).default([]),
    libraryItemId: z.string().uuid().nullable().optional(),
  }),
);

export type LibraryItemRecord = {
  id: string;
  version: number;
  definition: LibraryNodeDefinition;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function definedStyleEntries(styles: unknown): Partial<NodeStyles> {
  if (!isPlainObject(styles)) return {};
  const next: Partial<NodeStyles> = {};
  for (const [key, entry] of Object.entries(styles)) {
    if (entry !== undefined && entry !== null && entry !== "") {
      (next as Record<string, unknown>)[key] = entry;
    }
  }
  return next;
}

/** Sparse merge: override wins for set keys; styles merge sparsely. */
export function mergeNodeData(
  base: Record<string, unknown>,
  override: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const overlay = override ?? {};
  const mergedStyles = {
    ...definedStyleEntries(base.styles),
    ...definedStyleEntries(overlay.styles),
  };

  return {
    ...base,
    ...overlay,
    ...(Object.keys(mergedStyles).length || base.styles !== undefined || overlay.styles !== undefined
      ? { styles: mergedStyles }
      : {}),
  };
}

export function parseLibraryNodeDefinition(raw: unknown): LibraryNodeDefinition {
  const parsed = libraryNodeDefinitionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid library definition");
  }
  return parsed.data;
}

export function findLibraryNodeByKey(
  root: LibraryNodeDefinition,
  key: string,
): LibraryNodeDefinition | null {
  if (root.key === key) return root;
  for (const child of root.children) {
    const found = findLibraryNodeByKey(child, key);
    if (found) return found;
  }
  return null;
}

export function collectLibraryItemRefs(definition: LibraryNodeDefinition): string[] {
  const refs = new Set<string>();

  function walk(node: LibraryNodeDefinition) {
    if (node.libraryItemId) {
      refs.add(node.libraryItemId);
    }
    for (const child of node.children) {
      walk(child);
    }
  }

  walk(definition);
  return [...refs];
}

/**
 * Detect cycles if `itemId` adopted `definition` (including deeper A→B→C→A).
 * `getDirectRefs` returns nested libraryItemIds for another item's current definition.
 */
export function wouldCreateLibraryCycle(
  itemId: string,
  definition: LibraryNodeDefinition,
  getDirectRefs: (libraryItemId: string) => string[],
): boolean {
  const direct = collectLibraryItemRefs(definition);
  if (direct.includes(itemId)) {
    return true;
  }

  const queue = [...direct];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === itemId) {
      return true;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    for (const next of getDirectRefs(current)) {
      queue.push(next);
    }
  }

  return false;
}

export function assertLibraryDefinitionTypes(definition: LibraryNodeDefinition): void {
  if (!isRegisteredNodeType(definition.type)) {
    throw new Error(`Unsupported node type in library definition: ${definition.type}`);
  }
  for (const child of definition.children) {
    assertLibraryDefinitionTypes(child);
  }
}

export type LibraryLookup = Map<string, LibraryItemRecord> | Record<string, LibraryItemDefinitionView>;

export type LibraryItemDefinitionView = {
  id: string;
  version: number;
  definition: LibraryNodeDefinition;
};

function toLookupMap(lookup: LibraryLookup): Map<string, LibraryItemDefinitionView> {
  if (lookup instanceof Map) {
    return lookup;
  }
  return new Map(Object.entries(lookup));
}

/**
 * Resolve configured data for a definition node, expanding nested library refs.
 * Order inside library layer: nested item → embedding overrides on this definition node.
 */
export function resolveLibraryDefinitionData(
  node: LibraryNodeDefinition,
  lookup: LibraryLookup,
  visiting: Set<string> = new Set(),
): Record<string, unknown> {
  const map = toLookupMap(lookup);

  if (node.libraryItemId) {
    if (visiting.has(node.libraryItemId)) {
      return { ...(node.data ?? {}) };
    }
    const nested = map.get(node.libraryItemId);
    if (!nested) {
      return { ...(node.data ?? {}) };
    }
    visiting.add(node.libraryItemId);
    const nestedRootData = resolveLibraryDefinitionData(nested.definition, map, visiting);
    visiting.delete(node.libraryItemId);
    return mergeNodeData(nestedRootData, node.data ?? {});
  }

  return { ...(node.data ?? {}) };
}

/**
 * Library layer data for a linked page node (by item + stable key).
 * V1 always uses the item's current definition (live link). version fields are pin-ready.
 */
export function resolveLibraryDataForNode(input: {
  libraryItemId: string | null | undefined;
  libraryNodeKey: string | null | undefined;
  lookup: LibraryLookup;
}): Record<string, unknown> | null {
  if (!input.libraryItemId || !input.libraryNodeKey) {
    return null;
  }

  const map = toLookupMap(input.lookup);
  const item = map.get(input.libraryItemId);
  if (!item) {
    return null;
  }

  const defNode = findLibraryNodeByKey(item.definition, input.libraryNodeKey);
  if (!defNode) {
    return null;
  }

  return resolveLibraryDefinitionData(defNode, map);
}

export function libraryStylesFromData(data: Record<string, unknown> | null | undefined): Partial<NodeStyles> {
  if (!data) return {};
  return definedStyleEntries(data.styles);
}

/** Build a library definition tree from an in-memory node tree (keys freshly assigned by caller). */
export function mapTreeToLibraryDefinition(
  node: {
    key: string;
    type: string;
    name?: string | null;
    data: Record<string, unknown>;
    children: unknown[];
    libraryItemId?: string | null;
  },
  mapChild: (child: unknown) => LibraryNodeDefinition,
): LibraryNodeDefinition {
  return {
    key: node.key,
    type: node.type,
    name: node.name ?? null,
    data: node.data ?? {},
    children: node.children.map(mapChild),
    ...(node.libraryItemId ? { libraryItemId: node.libraryItemId } : {}),
  };
}
