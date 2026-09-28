import { buttonDefinition } from "./definitions/button";
import { containerDefinition } from "./definitions/container";
import { headingDefinition } from "./definitions/heading";
import { imageDefinition } from "./definitions/image";
import { linkDefinition } from "./definitions/link";
import { spacerDefinition } from "./definitions/spacer";
import { textDefinition } from "./definitions/text";
import type { NodeTypeDefinition, NodeTypeId } from "./types";

const definitions = [
  containerDefinition,
  headingDefinition,
  textDefinition,
  imageDefinition,
  buttonDefinition,
  linkDefinition,
  spacerDefinition,
] as const satisfies readonly NodeTypeDefinition[];

const byId = new Map<NodeTypeId, NodeTypeDefinition>(
  definitions.map((definition) => [definition.id, definition]),
);

export function listNodeTypes(): readonly NodeTypeDefinition[] {
  return definitions;
}

export function getNodeType(type: string): NodeTypeDefinition | undefined {
  return byId.get(type as NodeTypeId);
}

export function isRegisteredNodeType(type: string): type is NodeTypeId {
  return byId.has(type as NodeTypeId);
}

export function getRegisteredNodeTypeIds(): readonly NodeTypeId[] {
  return definitions.map((definition) => definition.id);
}

export function getDefaultNodeData(type: NodeTypeId): unknown {
  return structuredClone(byId.get(type)!.defaultData);
}
