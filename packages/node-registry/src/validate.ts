import { ZodError } from "zod";
import { getNodeType, isRegisteredNodeType } from "./registry";
import { resolvePropertyFields } from "./properties";
import type { NodeTypeDefinition, RegistryValidationIssue, ValidateNodeInput } from "./types";
import { migrateLegacyNodeData } from "./styles";

function formatZodIssues(error: ZodError): RegistryValidationIssue[] {
  return error.issues.map((issue) => ({
    code: "invalid_data" as const,
    message: issue.message,
    path: issue.path.length ? issue.path.join(".") : "data",
  }));
}

export function canAcceptChild(parentType: string, childType: string): boolean {
  const parent = getNodeType(parentType);
  if (!parent) {
    return false;
  }

  if (!isRegisteredNodeType(childType)) {
    return false;
  }

  if (parent.children.kind === "none") {
    return false;
  }

  if (parent.children.kind === "anyRegistered") {
    return true;
  }

  return parent.children.types.includes(childType);
}

export function getCapabilityFields(definition: NodeTypeDefinition) {
  return {
    content: resolvePropertyFields(definition.capabilities.content),
    typography: resolvePropertyFields(definition.capabilities.typography),
    appearance: resolvePropertyFields(definition.capabilities.appearance),
    layout: resolvePropertyFields(definition.capabilities.layout),
  };
}

export function validateNodeAgainstRegistry(input: ValidateNodeInput): {
  ok: boolean;
  issues: RegistryValidationIssue[];
  data?: unknown;
} {
  const issues: RegistryValidationIssue[] = [];

  if (!isRegisteredNodeType(input.type)) {
    issues.push({
      code: "unsupported_type",
      message: `Unsupported node type: ${input.type}`,
      path: "type",
    });
    return { ok: false, issues };
  }

  const definition = getNodeType(input.type)!;

  if (input.parentType) {
    if (!isRegisteredNodeType(input.parentType)) {
      issues.push({
        code: "invalid_child",
        message: `Parent node type is unsupported: ${input.parentType}`,
        path: "parentId",
      });
    } else if (!canAcceptChild(input.parentType, input.type)) {
      const parent = getNodeType(input.parentType)!;
      if (parent.children.kind === "none") {
        issues.push({
          code: "children_not_allowed",
          message: `Node type "${input.parentType}" cannot have children`,
          path: "parentId",
        });
      } else {
        issues.push({
          code: "invalid_child",
          message: `Node type "${input.type}" is not allowed under "${input.parentType}"`,
          path: "parentId",
        });
      }
    }
  }

  const parsed = definition.dataSchema.safeParse(migrateLegacyNodeData(input.data ?? {}));
  if (!parsed.success) {
    issues.push(...formatZodIssues(parsed.error));
    return { ok: false, issues };
  }

  return {
    ok: issues.length === 0,
    issues,
    data: parsed.data,
  };
}

export function safeParseNodeData(
  type: string,
  data: unknown,
): { ok: true; data: unknown } | { ok: false; issues: RegistryValidationIssue[] } {
  const definition = getNodeType(type);
  if (!definition) {
    return {
      ok: false,
      issues: [{ code: "unsupported_type", message: `Unsupported node type: ${type}`, path: "type" }],
    };
  }

  const parsed = definition.dataSchema.safeParse(migrateLegacyNodeData(data ?? {}));
  if (!parsed.success) {
    return { ok: false, issues: formatZodIssues(parsed.error) };
  }

  return { ok: true, data: parsed.data };
}
