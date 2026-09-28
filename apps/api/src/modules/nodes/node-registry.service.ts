import {
  getDefaultNodeData,
  isRegisteredNodeType,
  listNodeTypes,
  validateNodeAgainstRegistry,
  type NodeTypeId,
} from "@custom-website-builder/node-registry";
import { AppError } from "../../middleware/error.middleware";
import { database } from "../../config/database";

export function assertValidNodePayload(input: {
  type: string;
  data?: unknown;
  parentType?: string | null;
}): unknown {
  const result = validateNodeAgainstRegistry({
    type: input.type,
    data: input.data,
    parentType: input.parentType,
  });

  if (!result.ok) {
    throw new AppError(400, result.issues[0]?.message ?? "Invalid node");
  }

  return result.data;
}

export async function resolveParentNodeType(
  sectionId: string,
  parentId: string | null,
): Promise<string | null> {
  if (!parentId) {
    return null;
  }

  const parent = await database.node.findUnique({
    where: { id: parentId },
    select: { type: true, sectionId: true },
  });

  if (!parent || parent.sectionId !== sectionId) {
    throw new AppError(400, "Parent node must belong to the same section");
  }

  return parent.type;
}

export async function assertNodeTypeChangeAllowed(nodeId: string, nextType: string): Promise<void> {
  if (!isRegisteredNodeType(nextType)) {
    throw new AppError(400, `Unsupported node type: ${nextType}`);
  }

  const childCount = await database.node.count({ where: { parentId: nodeId } });
  if (childCount === 0) {
    return;
  }

  const definition = listNodeTypes().find((item) => item.id === nextType);
  if (!definition || definition.children.kind === "none") {
    throw new AppError(400, `Node type "${nextType}" cannot have children`);
  }

  const children = await database.node.findMany({
    where: { parentId: nodeId },
    select: { type: true },
  });

  for (const child of children) {
    const result = validateNodeAgainstRegistry({
      type: child.type,
      data: {},
      parentType: nextType,
    });
    if (!result.ok) {
      throw new AppError(400, result.issues[0]?.message ?? "Invalid child relationship");
    }
  }
}

export function defaultDataForType(type: string): unknown {
  if (!isRegisteredNodeType(type)) {
    return {};
  }
  return getDefaultNodeData(type as NodeTypeId);
}

export function listRegistryNodeTypes() {
  return listNodeTypes().map((definition) => ({
    id: definition.id,
    label: definition.label,
    description: definition.description,
    category: definition.category,
    version: definition.version,
    capabilities: definition.capabilities,
    children: definition.children,
    html: definition.html,
    defaultData: definition.defaultData,
  }));
}
