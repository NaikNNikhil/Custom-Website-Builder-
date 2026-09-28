export type TreePage = {
  id: string;
  websiteId: string;
  parentId: string | null;
  title: string;
  slug: string;
  sortOrder: number;
};

export type TreeSection = {
  id: string;
  pageId: string;
  name: string;
  sortOrder: number;
};

export type TreeNode = {
  id: string;
  sectionId: string;
  parentId: string | null;
  type: string;
  name: string | null;
  data: unknown;
  sortOrder: number;
  libraryItemId?: string | null;
  libraryItemVersion?: number | null;
  libraryNodeKey?: string | null;
};

export type BuiltNodeTree = {
  id: string;
  type: string;
  name: string | null;
  data: unknown;
  sortOrder: number;
  libraryItemId: string | null;
  libraryItemVersion: number | null;
  libraryNodeKey: string | null;
  children: BuiltNodeTree[];
};

export type BuiltPageTree = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  parentId: string | null;
  sections: {
    id: string;
    name: string;
    sortOrder: number;
    nodes: BuiltNodeTree[];
  }[];
  children: BuiltPageTree[];
};

export function buildNodeTree(nodes: TreeNode[], parentId: string | null = null): BuiltNodeTree[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((node) => ({
      id: node.id,
      type: node.type,
      name: node.name,
      data: node.data,
      sortOrder: node.sortOrder,
      libraryItemId: node.libraryItemId ?? null,
      libraryItemVersion: node.libraryItemVersion ?? null,
      libraryNodeKey: node.libraryNodeKey ?? null,
      children: buildNodeTree(nodes, node.id),
    }));
}

export function buildPageTree(
  pages: TreePage[],
  sections: TreeSection[],
  nodes: TreeNode[],
  parentId: string | null = null,
): BuiltPageTree[] {
  return pages
    .filter((page) => page.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((page) => {
      const pageSections = sections
        .filter((section) => section.pageId === page.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => ({
          id: section.id,
          name: section.name,
          sortOrder: section.sortOrder,
          nodes: buildNodeTree(nodes.filter((node) => node.sectionId === section.id)),
        }));

      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        sortOrder: page.sortOrder,
        parentId: page.parentId,
        sections: pageSections,
        children: buildPageTree(pages, sections, nodes, page.id),
      };
    });
}
