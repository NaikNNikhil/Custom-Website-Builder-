import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  assertLibraryDefinitionTypes,
  collectLibraryItemRefs,
  findLibraryNodeByKey,
  mergeNodeData,
  parseLibraryNodeDefinition,
  resolveLibraryDataForNode,
  wouldCreateLibraryCycle,
  type LibraryNodeDefinition,
} from "@custom-website-builder/node-registry";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import { uuidSchema } from "../../utils/validation";
import {
  requireOrganizationMembership,
  resolveLibraryItemAccess,
  resolveNodeAccess,
  resolveSectionAccess,
  resolveWebsiteOrganizationId,
} from "../organizations/org-access";
import { assertValidNodePayload, resolveParentNodeType } from "../nodes/node-registry.service";

export const createLibraryItemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(160).nullable().optional(),
  definition: z.unknown(),
});

export const updateLibraryItemSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    category: z.string().trim().min(1).max(160).nullable().optional(),
    definition: z.unknown().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined || value.category !== undefined || value.definition !== undefined,
    { message: "At least one field is required" },
  );

export const useLibraryItemSchema = z.object({
  sectionId: uuidSchema,
  parentId: uuidSchema.nullable().optional(),
});

export const saveNodeToLibrarySchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(160).nullable().optional(),
});

const libraryItemSelect = {
  id: true,
  websiteId: true,
  name: true,
  category: true,
  version: true,
  definition: true,
  createdAt: true,
  updatedAt: true,
} as const;

const nodeSelect = {
  id: true,
  sectionId: true,
  parentId: true,
  type: true,
  name: true,
  data: true,
  sortOrder: true,
  libraryItemId: true,
  libraryItemVersion: true,
  libraryNodeKey: true,
  createdAt: true,
  updatedAt: true,
} as const;

type DbNode = {
  id: string;
  sectionId: string;
  parentId: string | null;
  type: string;
  name: string | null;
  data: unknown;
  sortOrder: number;
  libraryItemId: string | null;
  libraryItemVersion: number | null;
  libraryNodeKey: string | null;
};

function toLibraryDto(item: {
  id: string;
  websiteId: string;
  name: string;
  category: string | null;
  version: number;
  definition: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    websiteId: item.websiteId,
    name: item.name,
    category: item.category,
    version: item.version,
    definition: parseLibraryNodeDefinition(item.definition),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function loadWebsiteLibraryLookup(websiteId: string) {
  const items = await database.libraryItem.findMany({
    where: { websiteId },
    select: { id: true, version: true, definition: true },
  });
  const map = new Map<
    string,
    { id: string; version: number; definition: LibraryNodeDefinition }
  >();
  for (const item of items) {
    map.set(item.id, {
      id: item.id,
      version: item.version,
      definition: parseLibraryNodeDefinition(item.definition),
    });
  }
  return map;
}

async function assertDefinitionAllowed(
  websiteId: string,
  itemId: string | null,
  definition: LibraryNodeDefinition,
) {
  try {
    assertLibraryDefinitionTypes(definition);
  } catch (error) {
    throw new AppError(400, error instanceof Error ? error.message : "Invalid library definition");
  }

  const refs = collectLibraryItemRefs(definition);
  if (itemId && refs.includes(itemId)) {
    throw new AppError(400, "Library item cannot reference itself");
  }

  if (refs.length > 0) {
    const referenced = await database.libraryItem.findMany({
      where: { websiteId, id: { in: refs } },
      select: { id: true },
    });
    if (referenced.length !== refs.length) {
      throw new AppError(400, "Nested library reference must belong to the same website");
    }
  }

  if (itemId) {
    const allItems = await database.libraryItem.findMany({
      where: { websiteId, id: { not: itemId } },
      select: { id: true, definition: true },
    });
    const refMap = new Map(
      allItems.map((item) => [
        item.id,
        collectLibraryItemRefs(parseLibraryNodeDefinition(item.definition)),
      ]),
    );

    if (wouldCreateLibraryCycle(itemId, definition, (id) => refMap.get(id) ?? [])) {
      throw new AppError(400, "Circular library references are not allowed");
    }
  }
}

function buildDefinitionFromNodes(
  nodes: DbNode[],
  rootId: string,
  lookup: Map<string, { id: string; version: number; definition: LibraryNodeDefinition }>,
): LibraryNodeDefinition {
  const byParent = new Map<string | null, DbNode[]>();
  for (const node of nodes) {
    const list = byParent.get(node.parentId) ?? [];
    list.push(node);
    byParent.set(node.parentId, list);
  }

  function walk(node: DbNode): LibraryNodeDefinition {
    const libraryData = resolveLibraryDataForNode({
      libraryItemId: node.libraryItemId,
      libraryNodeKey: node.libraryNodeKey,
      lookup,
    });
    const effective = mergeNodeData(
      libraryData ?? {},
      (node.data as Record<string, unknown>) ?? {},
    );
    const children = (byParent.get(node.id) ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(walk);

    return {
      key: randomUUID(),
      type: node.type,
      name: node.name,
      data: effective,
      children,
    };
  }

  const root = nodes.find((node) => node.id === rootId);
  if (!root) {
    throw new AppError(404, "Node not found");
  }
  return walk(root);
}

async function collectSubtree(sectionId: string, rootId: string): Promise<DbNode[]> {
  const all = await database.node.findMany({
    where: { sectionId },
    select: nodeSelect,
  });
  const byParent = new Map<string | null, DbNode[]>();
  for (const node of all) {
    const list = byParent.get(node.parentId) ?? [];
    list.push(node);
    byParent.set(node.parentId, list);
  }

  const result: DbNode[] = [];
  function walk(id: string) {
    const node = all.find((item) => item.id === id);
    if (!node) return;
    result.push(node);
    for (const child of (byParent.get(id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder)) {
      walk(child.id);
    }
  }
  walk(rootId);
  return result;
}

async function insertDefinitionTree(input: {
  sectionId: string;
  parentId: string | null;
  definition: LibraryNodeDefinition;
  libraryItemId: string;
  libraryItemVersion: number;
}): Promise<string> {
  const siblingCount = await database.node.count({
    where: { sectionId: input.sectionId, parentId: input.parentId },
  });

  async function createNode(
    def: LibraryNodeDefinition,
    parentId: string | null,
    sortOrder: number,
  ): Promise<string> {
    const id = randomUUID();
    await database.node.create({
      data: {
        id,
        sectionId: input.sectionId,
        parentId,
        type: def.type,
        name: def.name ?? null,
        data: {},
        sortOrder,
        libraryItemId: input.libraryItemId,
        libraryItemVersion: input.libraryItemVersion,
        libraryNodeKey: def.key,
      },
    });

    let childOrder = 0;
    for (const child of def.children) {
      await createNode(child, id, childOrder);
      childOrder += 1;
    }
    return id;
  }

  return createNode(input.definition, input.parentId, siblingCount);
}

async function countInstanceRoots(libraryItemId: string): Promise<number> {
  const linked = await database.node.findMany({
    where: { libraryItemId },
    select: { id: true, parentId: true },
  });
  if (!linked.length) return 0;

  const parentIds = linked.map((node) => node.parentId).filter((id): id is string => Boolean(id));
  const parents =
    parentIds.length > 0
      ? await database.node.findMany({
          where: { id: { in: parentIds } },
          select: { id: true, libraryItemId: true },
        })
      : [];
  const parentLibrary = new Map(parents.map((parent) => [parent.id, parent.libraryItemId]));

  let roots = 0;
  for (const node of linked) {
    const parentLib = node.parentId ? parentLibrary.get(node.parentId) : null;
    if (parentLib !== libraryItemId) {
      roots += 1;
    }
  }
  return roots;
}

async function findInstanceRoot(node: DbNode): Promise<DbNode> {
  if (!node.libraryItemId) {
    throw new AppError(400, "Node is not linked to a library item");
  }

  let current = node;
  while (current.parentId) {
    const parent = await database.node.findUnique({
      where: { id: current.parentId },
      select: nodeSelect,
    });
    if (!parent || parent.libraryItemId !== node.libraryItemId) {
      break;
    }
    current = parent;
  }
  return current;
}

async function bakeIndependentSubtree(root: DbNode, websiteId: string) {
  if (!root.libraryItemId) {
    throw new AppError(400, "Node is not linked to a library item");
  }

  const lookup = await loadWebsiteLibraryLookup(websiteId);
  const all = await database.node.findMany({
    where: { sectionId: root.sectionId },
    select: nodeSelect,
  });

  const toDetach: DbNode[] = [];
  function collect(id: string) {
    const node = all.find((item) => item.id === id);
    if (!node || node.libraryItemId !== root.libraryItemId) return;
    toDetach.push(node);
    for (const child of all.filter((item) => item.parentId === id)) {
      collect(child.id);
    }
  }
  collect(root.id);

  await database.$transaction(
    toDetach.map((node) => {
      const libraryData = resolveLibraryDataForNode({
        libraryItemId: node.libraryItemId,
        libraryNodeKey: node.libraryNodeKey,
        lookup,
      });
      const baked = mergeNodeData(
        libraryData ?? {},
        (node.data as Record<string, unknown>) ?? {},
      );
      return database.node.update({
        where: { id: node.id },
        data: {
          data: baked as object,
          libraryItemId: null,
          libraryItemVersion: null,
          libraryNodeKey: null,
        },
      });
    }),
  );
}

function cloneDefinitionWithNewKeys(definition: LibraryNodeDefinition): LibraryNodeDefinition {
  return {
    key: randomUUID(),
    type: definition.type,
    name: definition.name ?? null,
    data: structuredClone(definition.data ?? {}),
    children: definition.children.map(cloneDefinitionWithNewKeys),
  };
}

function inlineLibraryRefInDefinition(
  definition: LibraryNodeDefinition,
  targetId: string,
  targetDefinition: LibraryNodeDefinition,
): LibraryNodeDefinition {
  if (definition.libraryItemId === targetId) {
    const expanded = cloneDefinitionWithNewKeys(targetDefinition);
    return {
      ...expanded,
      key: definition.key,
      name: definition.name ?? expanded.name ?? null,
      data: mergeNodeData(expanded.data, definition.data ?? {}),
    };
  }

  return {
    ...definition,
    children: definition.children.map((child) =>
      inlineLibraryRefInDefinition(child, targetId, targetDefinition),
    ),
  };
}

export const libraryService = {
  async listForWebsite(userId: string, websiteId: string) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const items = await database.libraryItem.findMany({
      where: { websiteId },
      select: libraryItemSelect,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return items.map(toLibraryDto);
  },

  async getById(userId: string, libraryItemId: string) {
    const access = await resolveLibraryItemAccess(libraryItemId);
    await requireOrganizationMembership(userId, access.organizationId);

    const item = await database.libraryItem.findUnique({
      where: { id: libraryItemId },
      select: libraryItemSelect,
    });
    if (!item) {
      throw new AppError(404, "Library item not found");
    }
    return toLibraryDto(item);
  },

  async create(userId: string, websiteId: string, input: z.infer<typeof createLibraryItemSchema>) {
    const organizationId = await resolveWebsiteOrganizationId(websiteId);
    await requireOrganizationMembership(userId, organizationId);

    const parsed = createLibraryItemSchema.parse(input);
    const definition = parseLibraryNodeDefinition(parsed.definition);
    await assertDefinitionAllowed(websiteId, null, definition);

    const item = await database.libraryItem.create({
      data: {
        id: randomUUID(),
        websiteId,
        name: parsed.name,
        category: parsed.category ?? null,
        version: 1,
        definition: definition as object,
      },
      select: libraryItemSelect,
    });

    return toLibraryDto(item);
  },

  async update(userId: string, libraryItemId: string, input: z.infer<typeof updateLibraryItemSchema>) {
    const access = await resolveLibraryItemAccess(libraryItemId);
    await requireOrganizationMembership(userId, access.organizationId);

    const existing = await database.libraryItem.findUnique({
      where: { id: libraryItemId },
      select: libraryItemSelect,
    });
    if (!existing) {
      throw new AppError(404, "Library item not found");
    }

    const parsed = updateLibraryItemSchema.parse(input);
    let nextDefinition = parseLibraryNodeDefinition(existing.definition);
    let nextVersion = existing.version;

    if (parsed.definition !== undefined) {
      nextDefinition = parseLibraryNodeDefinition(parsed.definition);
      await assertDefinitionAllowed(access.websiteId, libraryItemId, nextDefinition);
      nextVersion = existing.version + 1;
    }

    const item = await database.libraryItem.update({
      where: { id: libraryItemId },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.category !== undefined ? { category: parsed.category } : {}),
        ...(parsed.definition !== undefined
          ? { definition: nextDefinition as object, version: nextVersion }
          : {}),
      },
      select: libraryItemSelect,
    });

    return toLibraryDto(item);
  },

  async usage(userId: string, libraryItemId: string) {
    const access = await resolveLibraryItemAccess(libraryItemId);
    await requireOrganizationMembership(userId, access.organizationId);

    const instanceRootCount = await countInstanceRoots(libraryItemId);
    const nodeCount = await database.node.count({ where: { libraryItemId } });

    const others = await database.libraryItem.findMany({
      where: { websiteId: access.websiteId, id: { not: libraryItemId } },
      select: { id: true, name: true, definition: true },
    });
    const referencedByLibraryItems = others
      .filter((item) =>
        collectLibraryItemRefs(parseLibraryNodeDefinition(item.definition)).includes(libraryItemId),
      )
      .map((item) => ({ id: item.id, name: item.name }));

    return {
      libraryItemId,
      instanceRootCount,
      nodeCount,
      referencedByLibraryItems,
      canDeleteSafely:
        instanceRootCount === 0 && referencedByLibraryItems.length === 0,
    };
  },

  async remove(userId: string, libraryItemId: string, force = false) {
    const access = await resolveLibraryItemAccess(libraryItemId);
    await requireOrganizationMembership(userId, access.organizationId);

    const usage = await this.usage(userId, libraryItemId);
    if (!usage.canDeleteSafely && !force) {
      throw new AppError(
        409,
        `Library item is in use (${usage.instanceRootCount} instance(s), ${usage.referencedByLibraryItems.length} library ref(s)). Confirm force delete to detach.`,
      );
    }

    const item = await database.libraryItem.findUnique({
      where: { id: libraryItemId },
      select: libraryItemSelect,
    });
    if (!item) {
      throw new AppError(404, "Library item not found");
    }
    const definition = parseLibraryNodeDefinition(item.definition);

    if (force || !usage.canDeleteSafely) {
      const linkedRoots = await database.node.findMany({
        where: { libraryItemId },
        select: nodeSelect,
      });
      const rootCandidates: DbNode[] = [];
      for (const node of linkedRoots) {
        const root = await findInstanceRoot(node);
        if (!rootCandidates.some((item) => item.id === root.id)) {
          rootCandidates.push(root);
        }
      }
      for (const root of rootCandidates) {
        await bakeIndependentSubtree(root, access.websiteId);
      }

      const dependents = await database.libraryItem.findMany({
        where: { websiteId: access.websiteId, id: { not: libraryItemId } },
        select: libraryItemSelect,
      });
      for (const dependent of dependents) {
        const depDef = parseLibraryNodeDefinition(dependent.definition);
        if (!collectLibraryItemRefs(depDef).includes(libraryItemId)) {
          continue;
        }
        const inlined = inlineLibraryRefInDefinition(depDef, libraryItemId, definition);
        await database.libraryItem.update({
          where: { id: dependent.id },
          data: {
            definition: inlined as object,
            version: dependent.version + 1,
          },
        });
      }
    }

    await database.libraryItem.delete({ where: { id: libraryItemId } });
    return { success: true as const, detached: !usage.canDeleteSafely || force };
  },

  async use(
    userId: string,
    libraryItemId: string,
    input: z.infer<typeof useLibraryItemSchema>,
  ) {
    const access = await resolveLibraryItemAccess(libraryItemId);
    await requireOrganizationMembership(userId, access.organizationId);

    const parsed = useLibraryItemSchema.parse(input);
    const sectionAccess = await resolveSectionAccess(parsed.sectionId);
    if (sectionAccess.websiteId !== access.websiteId) {
      throw new AppError(400, "Section must belong to the same website as the library item");
    }

    const item = await database.libraryItem.findUnique({
      where: { id: libraryItemId },
      select: libraryItemSelect,
    });
    if (!item) {
      throw new AppError(404, "Library item not found");
    }

    const definition = parseLibraryNodeDefinition(item.definition);
    const parentId = parsed.parentId ?? null;
    const parentType = await resolveParentNodeType(parsed.sectionId, parentId);
    assertValidNodePayload({
      type: definition.type,
      data: definition.data,
      parentType,
    });

    const rootId = await insertDefinitionTree({
      sectionId: parsed.sectionId,
      parentId,
      definition,
      libraryItemId: item.id,
      libraryItemVersion: item.version,
    });

    const node = await database.node.findUnique({
      where: { id: rootId },
      select: nodeSelect,
    });
    return { node };
  },

  async saveNodeToLibrary(
    userId: string,
    nodeId: string,
    input: z.infer<typeof saveNodeToLibrarySchema>,
  ) {
    const access = await resolveNodeAccess(nodeId);
    await requireOrganizationMembership(userId, access.organizationId);

    const parsed = saveNodeToLibrarySchema.parse(input);
    const subtree = await collectSubtree(access.sectionId, nodeId);
    const lookup = await loadWebsiteLibraryLookup(access.websiteId);
    const definition = buildDefinitionFromNodes(subtree, nodeId, lookup);
    await assertDefinitionAllowed(access.websiteId, null, definition);

    const item = await database.libraryItem.create({
      data: {
        id: randomUUID(),
        websiteId: access.websiteId,
        name: parsed.name,
        category: parsed.category ?? null,
        version: 1,
        definition: definition as object,
      },
      select: libraryItemSelect,
    });

    return toLibraryDto(item);
  },

  async makeIndependent(userId: string, nodeId: string) {
    const access = await resolveNodeAccess(nodeId);
    await requireOrganizationMembership(userId, access.organizationId);

    const node = await database.node.findUnique({
      where: { id: nodeId },
      select: nodeSelect,
    });
    if (!node) {
      throw new AppError(404, "Node not found");
    }
    if (!node.libraryItemId) {
      throw new AppError(400, "Node is not linked to a library item");
    }

    const root = await findInstanceRoot(node);
    await bakeIndependentSubtree(root, access.websiteId);

    const updated = await database.node.findUnique({
      where: { id: root.id },
      select: nodeSelect,
    });
    return { node: updated };
  },

  parseId(raw: string) {
    return uuidSchema.parse(raw);
  },
};
