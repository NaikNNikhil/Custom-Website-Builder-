import { randomUUID } from "node:crypto";
import {
  parseLibraryNodeDefinition,
  type LibraryNodeDefinition,
} from "@custom-website-builder/node-registry";
import {
  requireWebsiteTemplate,
  type TemplateLibraryNode,
  type TemplateNode,
  type TemplatePage,
  type WebsiteTemplateDefinition,
} from "@custom-website-builder/website-templates";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";

function remapDataMediaKeys(
  data: Record<string, unknown>,
  mediaMap: Map<string, string>,
): Record<string, unknown> {
  const next = { ...data };
  const key = next.mediaAssetKey;
  if (typeof key === "string") {
    next.mediaAssetId = mediaMap.get(key) ?? null;
    delete next.mediaAssetKey;
  }
  return next;
}

function convertLibraryNode(
  node: TemplateLibraryNode,
  libraryMap: Map<string, string>,
  mediaMap: Map<string, string>,
): LibraryNodeDefinition {
  return {
    key: node.key,
    type: node.type,
    name: node.name ?? null,
    data: remapDataMediaKeys(node.data ?? {}, mediaMap),
    children: node.children.map((child) => convertLibraryNode(child, libraryMap, mediaMap)),
    ...(node.libraryItemKey
      ? { libraryItemId: libraryMap.get(node.libraryItemKey) ?? null }
      : {}),
  };
}

async function createMediaAssets(websiteId: string, template: WebsiteTemplateDefinition) {
  const map = new Map<string, string>();
  for (const asset of template.mediaAssets) {
    const id = randomUUID();
    await database.mediaAsset.create({
      data: {
        id,
        websiteId,
        kind: asset.kind,
        filename: asset.filename,
        mimeType: asset.mimeType,
        byteSize: asset.byteSize,
        width: asset.width ?? null,
        height: asset.height ?? null,
        url: asset.url,
        provider: "template",
        providerId: `${template.id}:${template.version}:${asset.key}`,
        providerMeta: {
          templateId: template.id,
          templateVersion: template.version,
          templateMediaKey: asset.key,
        },
      },
    });
    map.set(asset.key, id);
  }
  return map;
}

async function createLibraryItems(
  websiteId: string,
  template: WebsiteTemplateDefinition,
  mediaMap: Map<string, string>,
) {
  const libraryMap = new Map<string, string>();
  // Pre-allocate ids so nested refs can resolve in one pass
  for (const item of template.libraryItems) {
    libraryMap.set(item.key, randomUUID());
  }

  for (const item of template.libraryItems) {
    const definition = convertLibraryNode(item.definition, libraryMap, mediaMap);
    // Ensure parseable
    parseLibraryNodeDefinition(definition);
    await database.libraryItem.create({
      data: {
        id: libraryMap.get(item.key)!,
        websiteId,
        name: item.name,
        category: item.category ?? null,
        version: 1,
        definition: definition as object,
      },
    });
  }

  return libraryMap;
}

async function createNodeTree(input: {
  sectionId: string;
  parentId: string | null;
  nodes: TemplateNode[];
  libraryMap: Map<string, string>;
  mediaMap: Map<string, string>;
}) {
  let sortOrder = 0;
  for (const node of input.nodes) {
    const id = randomUUID();
    const libraryItemId = node.libraryItemKey
      ? (input.libraryMap.get(node.libraryItemKey) ?? null)
      : null;
    const data = remapDataMediaKeys({ ...(node.data ?? {}) }, input.mediaMap);

    await database.node.create({
      data: {
        id,
        sectionId: input.sectionId,
        parentId: input.parentId,
        type: node.type,
        name: node.name ?? null,
        data: data as object,
        sortOrder,
        libraryItemId,
        libraryItemVersion: libraryItemId ? 1 : null,
        libraryNodeKey: libraryItemId ? (node.libraryNodeKey ?? null) : null,
      },
    });

    if (node.children?.length) {
      await createNodeTree({
        sectionId: input.sectionId,
        parentId: id,
        nodes: node.children,
        libraryMap: input.libraryMap,
        mediaMap: input.mediaMap,
      });
    }
    sortOrder += 1;
  }
}

async function createPages(
  websiteId: string,
  pages: TemplatePage[],
  parentId: string | null,
  libraryMap: Map<string, string>,
  mediaMap: Map<string, string>,
) {
  for (const page of pages) {
    const pageId = randomUUID();
    await database.page.create({
      data: {
        id: pageId,
        websiteId,
        parentId,
        title: page.title,
        slug: page.slug,
        sortOrder: page.sortOrder,
      },
    });

    for (const section of page.sections) {
      const sectionId = randomUUID();
      await database.section.create({
        data: {
          id: sectionId,
          pageId,
          name: section.name,
          sortOrder: section.sortOrder,
        },
      });

      await createNodeTree({
        sectionId,
        parentId: null,
        nodes: section.nodes,
        libraryMap,
        mediaMap,
      });
    }

    if (page.children?.length) {
      await createPages(websiteId, page.children, pageId, libraryMap, mediaMap);
    }
  }
}

/**
 * Copy a platform template blueprint into an independent Website.
 * Website structure becomes authoritative — no runtime template inheritance.
 */
export async function applyWebsiteTemplate(websiteId: string, templateId: string) {
  let template: WebsiteTemplateDefinition;
  try {
    template = requireWebsiteTemplate(templateId);
  } catch (error) {
    throw new AppError(400, error instanceof Error ? error.message : "Invalid template");
  }

  const mediaMap = await createMediaAssets(websiteId, template);
  const libraryMap = await createLibraryItems(websiteId, template, mediaMap);
  await createPages(websiteId, template.pages, null, libraryMap, mediaMap);

  await database.website.update({
    where: { id: websiteId },
    data: {
      theme: template.theme as object,
      templateId: template.id,
      templateVersion: template.version,
    },
  });

  return {
    templateId: template.id,
    templateVersion: template.version,
  };
}
