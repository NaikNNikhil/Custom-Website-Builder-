import type { WebsiteTreeNode, WebsiteTreePage, WebsiteTreeSection } from "../websites/types";

export type BuilderSelection =
  | { kind: "page"; id: string }
  | { kind: "section"; id: string }
  | { kind: "node"; id: string }
  | null;

export type FoundNode = {
  node: WebsiteTreeNode;
  sectionId: string;
  pageId: string;
  parentNodeId: string | null;
  siblingIds: string[];
};

function walkNodes(
  nodes: WebsiteTreeNode[],
  sectionId: string,
  pageId: string,
  parentNodeId: string | null,
  targetId: string,
): FoundNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return {
        node,
        sectionId,
        pageId,
        parentNodeId,
        siblingIds: nodes.map((item) => item.id),
      };
    }

    const nested = walkNodes(node.children, sectionId, pageId, node.id, targetId);
    if (nested) {
      return nested;
    }
  }

  return null;
}

export function findNodeInPages(pages: WebsiteTreePage[], nodeId: string): FoundNode | null {
  for (const page of pages) {
    for (const section of page.sections) {
      const found = walkNodes(section.nodes, section.id, page.id, null, nodeId);
      if (found) {
        return found;
      }
    }

    const nested = findNodeInPages(page.children, nodeId);
    if (nested) {
      return nested;
    }
  }

  return null;
}

export function findPageInPages(pages: WebsiteTreePage[], pageId: string): WebsiteTreePage | null {
  for (const page of pages) {
    if (page.id === pageId) {
      return page;
    }
    const nested = findPageInPages(page.children, pageId);
    if (nested) {
      return nested;
    }
  }
  return null;
}

export function findSectionInPages(
  pages: WebsiteTreePage[],
  sectionId: string,
): { section: WebsiteTreeSection; pageId: string; siblingIds: string[] } | null {
  for (const page of pages) {
    const section = page.sections.find((item) => item.id === sectionId);
    if (section) {
      return {
        section,
        pageId: page.id,
        siblingIds: page.sections.map((item) => item.id),
      };
    }
    const nested = findSectionInPages(page.children, sectionId);
    if (nested) {
      return nested;
    }
  }
  return null;
}

export function moveSiblingIds(orderedIds: string[], id: string, direction: -1 | 1): string[] | null {
  const index = orderedIds.indexOf(id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= orderedIds.length) {
    return null;
  }

  const next = [...orderedIds];
  const [removed] = next.splice(index, 1);
  next.splice(nextIndex, 0, removed);
  return next;
}

function mapNodes(
  nodes: WebsiteTreeNode[],
  nodeId: string,
  updater: (node: WebsiteTreeNode) => WebsiteTreeNode,
): WebsiteTreeNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }
    if (!node.children.length) {
      return node;
    }
    return {
      ...node,
      children: mapNodes(node.children, nodeId, updater),
    };
  });
}

export function updateNodeDataInPages(
  pages: WebsiteTreePage[],
  nodeId: string,
  data: Record<string, unknown>,
): WebsiteTreePage[] {
  return pages.map((page) => ({
    ...page,
    sections: page.sections.map((section) => ({
      ...section,
      nodes: mapNodes(section.nodes, nodeId, (node) => ({ ...node, data })),
    })),
    children: updateNodeDataInPages(page.children, nodeId, data),
  }));
}
