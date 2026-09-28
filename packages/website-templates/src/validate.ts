import {
  isRegisteredNodeType,
  validateNodeAgainstRegistry,
} from "@custom-website-builder/node-registry";
import type {
  TemplateLibraryNode,
  TemplateNode,
  WebsiteTemplateDefinition,
} from "./types";

export type TemplateValidationIssue = {
  path: string;
  message: string;
};

function walkLibraryNode(
  node: TemplateLibraryNode,
  path: string,
  issues: TemplateValidationIssue[],
  libraryKeys: Set<string>,
) {
  if (!isRegisteredNodeType(node.type)) {
    issues.push({ path, message: `Unsupported node type: ${node.type}` });
  } else {
    const result = validateNodeAgainstRegistry({ type: node.type, data: node.data });
    if (!result.ok) {
      issues.push({
        path: `${path}.data`,
        message: result.issues[0]?.message ?? "Invalid node data",
      });
    }
  }

  if (node.libraryItemKey && !libraryKeys.has(node.libraryItemKey)) {
    issues.push({
      path: `${path}.libraryItemKey`,
      message: `Unknown library item key: ${node.libraryItemKey}`,
    });
  }

  node.children.forEach((child, index) => {
    walkLibraryNode(child, `${path}.children[${index}]`, issues, libraryKeys);
  });
}

function walkPageNode(
  node: TemplateNode,
  path: string,
  issues: TemplateValidationIssue[],
  libraryKeys: Set<string>,
  mediaKeys: Set<string>,
) {
  if (!isRegisteredNodeType(node.type)) {
    issues.push({ path, message: `Unsupported node type: ${node.type}` });
  } else {
    const data = { ...node.data };
    if (typeof data.mediaAssetKey === "string") {
      if (!mediaKeys.has(data.mediaAssetKey)) {
        issues.push({
          path: `${path}.data.mediaAssetKey`,
          message: `Unknown media asset key: ${data.mediaAssetKey}`,
        });
      }
      delete data.mediaAssetKey;
    }
    const result = validateNodeAgainstRegistry({ type: node.type, data });
    if (!result.ok) {
      issues.push({
        path: `${path}.data`,
        message: result.issues[0]?.message ?? "Invalid node data",
      });
    }
  }

  if (node.libraryItemKey) {
    if (!libraryKeys.has(node.libraryItemKey)) {
      issues.push({
        path: `${path}.libraryItemKey`,
        message: `Unknown library item key: ${node.libraryItemKey}`,
      });
    }
    if (!node.libraryNodeKey) {
      issues.push({
        path: `${path}.libraryNodeKey`,
        message: "libraryNodeKey is required when libraryItemKey is set",
      });
    }
  }

  (node.children ?? []).forEach((child, index) => {
    walkPageNode(child, `${path}.children[${index}]`, issues, libraryKeys, mediaKeys);
  });
}

export function validateWebsiteTemplate(
  template: WebsiteTemplateDefinition,
): { ok: boolean; issues: TemplateValidationIssue[] } {
  const issues: TemplateValidationIssue[] = [];
  const libraryKeys = new Set(template.libraryItems.map((item) => item.key));
  const mediaKeys = new Set(template.mediaAssets.map((item) => item.key));

  if (libraryKeys.size !== template.libraryItems.length) {
    issues.push({ path: "libraryItems", message: "Duplicate library item keys" });
  }
  if (mediaKeys.size !== template.mediaAssets.length) {
    issues.push({ path: "mediaAssets", message: "Duplicate media asset keys" });
  }

  template.libraryItems.forEach((item, index) => {
    walkLibraryNode(
      item.definition,
      `libraryItems[${index}].definition`,
      issues,
      libraryKeys,
    );
  });

  template.pages.forEach((page, pageIndex) => {
    page.sections.forEach((section, sectionIndex) => {
      section.nodes.forEach((node, nodeIndex) => {
        walkPageNode(
          node,
          `pages[${pageIndex}].sections[${sectionIndex}].nodes[${nodeIndex}]`,
          issues,
          libraryKeys,
          mediaKeys,
        );
      });
    });
  });

  return { ok: issues.length === 0, issues };
}
