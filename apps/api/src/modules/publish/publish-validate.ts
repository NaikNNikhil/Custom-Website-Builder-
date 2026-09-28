import {
  canAcceptChild,
  isRegisteredNodeType,
  mergeNodeData,
  parseLibraryNodeDefinition,
  resolveLibraryDataForNode,
  validateNodeAgainstRegistry,
  websiteThemeSchema,
  type LibraryNodeDefinition,
} from "@custom-website-builder/node-registry";
import type { BuiltNodeTree } from "../websites/website-tree";
import type { DraftWebsitePayload } from "./draft-snapshot";

export type PublishValidationIssue = {
  path: string;
  message: string;
};

function walkLibraryDefinition(
  node: LibraryNodeDefinition,
  path: string,
  issues: PublishValidationIssue[],
  libraryIds: Set<string>,
  mediaIds: Set<string>,
) {
  if (!isRegisteredNodeType(node.type)) {
    issues.push({ path, message: `Unsupported node type: ${node.type}` });
  } else {
    const result = validateNodeAgainstRegistry({ type: node.type, data: node.data });
    if (!result.ok) {
      issues.push({
        path: `${path}.data`,
        message: result.issues[0]?.message ?? "Invalid library node data",
      });
    }
  }

  if (node.libraryItemId && !libraryIds.has(node.libraryItemId)) {
    issues.push({
      path: `${path}.libraryItemId`,
      message: `Missing library reference: ${node.libraryItemId}`,
    });
  }

  const mediaAssetId = (node.data as { mediaAssetId?: unknown })?.mediaAssetId;
  if (typeof mediaAssetId === "string" && mediaAssetId && !mediaIds.has(mediaAssetId)) {
    issues.push({
      path: `${path}.data.mediaAssetId`,
      message: `Missing media reference: ${mediaAssetId}`,
    });
  }

  node.children.forEach((child, index) => {
    walkLibraryDefinition(child, `${path}.children[${index}]`, issues, libraryIds, mediaIds);
  });
}

function walkNode(
  node: BuiltNodeTree,
  path: string,
  parentType: string | null,
  issues: PublishValidationIssue[],
  libraryLookup: Map<string, { id: string; version: number; definition: LibraryNodeDefinition }>,
  mediaIds: Set<string>,
) {
  if (!isRegisteredNodeType(node.type)) {
    issues.push({ path, message: `Unsupported node type: ${node.type}` });
    return;
  }

  if (parentType && !canAcceptChild(parentType, node.type)) {
    issues.push({
      path,
      message: `Node type "${node.type}" is not allowed under "${parentType}"`,
    });
  }

  if (node.libraryItemId) {
    if (!libraryLookup.has(node.libraryItemId)) {
      issues.push({
        path: `${path}.libraryItemId`,
        message: `Missing library reference: ${node.libraryItemId}`,
      });
    }
    if (!node.libraryNodeKey) {
      issues.push({
        path: `${path}.libraryNodeKey`,
        message: "libraryNodeKey is required for linked library instances",
      });
    }
  }

  const libraryData = resolveLibraryDataForNode({
    libraryItemId: node.libraryItemId,
    libraryNodeKey: node.libraryNodeKey,
    lookup: libraryLookup,
  });
  const overrideData = (node.data ?? {}) as Record<string, unknown>;
  const merged = mergeNodeData(libraryData ?? {}, overrideData);

  const mediaAssetId = merged.mediaAssetId;
  if (typeof mediaAssetId === "string" && mediaAssetId && !mediaIds.has(mediaAssetId)) {
    issues.push({
      path: `${path}.data.mediaAssetId`,
      message: `Missing media reference: ${mediaAssetId}`,
    });
  }

  const result = validateNodeAgainstRegistry({
    type: node.type,
    data: merged,
    parentType,
  });
  if (!result.ok) {
    issues.push({
      path: `${path}.data`,
      message: result.issues[0]?.message ?? "Invalid node data",
    });
  }

  node.children.forEach((child, index) => {
    walkNode(child, `${path}.children[${index}]`, node.type, issues, libraryLookup, mediaIds);
  });
}

export function validateDraftSnapshot(
  draft: DraftWebsitePayload,
): { ok: boolean; issues: PublishValidationIssue[] } {
  const issues: PublishValidationIssue[] = [];

  const themeParsed = websiteThemeSchema.safeParse(draft.website.theme);
  if (!themeParsed.success) {
    issues.push({
      path: "website.theme",
      message: themeParsed.error.issues[0]?.message ?? "Invalid theme",
    });
  }

  const libraryIds = new Set(draft.libraryItems.map((item) => item.id));
  const mediaIds = new Set(draft.mediaAssets.map((item) => item.id));
  const libraryLookup = new Map(
    draft.libraryItems.map((item) => [
      item.id,
      { id: item.id, version: item.version, definition: item.definition },
    ]),
  );

  draft.libraryItems.forEach((item, index) => {
    try {
      parseLibraryNodeDefinition(item.definition);
    } catch (error) {
      issues.push({
        path: `libraryItems[${index}]`,
        message: error instanceof Error ? error.message : "Invalid library definition",
      });
      return;
    }
    walkLibraryDefinition(
      item.definition,
      `libraryItems[${index}].definition`,
      issues,
      libraryIds,
      mediaIds,
    );
  });

  if (!draft.pages.length) {
    issues.push({ path: "pages", message: "Website must have at least one page to publish" });
  }

  const walkAllPages = (pages: typeof draft.pages, base: string) => {
    pages.forEach((page, index) => {
      if (!page.slug?.trim()) {
        issues.push({ path: `${base}[${index}].slug`, message: "Page slug is required" });
      }
      page.sections.forEach((section, sectionIndex) => {
        section.nodes.forEach((node, nodeIndex) => {
          walkNode(
            node,
            `${base}[${index}].sections[${sectionIndex}].nodes[${nodeIndex}]`,
            null,
            issues,
            libraryLookup,
            mediaIds,
          );
        });
      });
      if (page.children.length) {
        walkAllPages(page.children, `${base}[${index}].children`);
      }
    });
  };

  walkAllPages(draft.pages, "pages");

  return { ok: issues.length === 0, issues };
}
