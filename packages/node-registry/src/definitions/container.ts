import { z } from "zod";
import type { NodeTypeDefinition } from "../types";
import { nodeStylesSchema } from "../styles";

export const containerDataSchema = z.object({
  layout: z.enum(["stack", "row"]).default("stack"),
  gap: z.enum(["none", "sm", "md", "lg"]).default("md"),
  styles: nodeStylesSchema,
});

export type ContainerData = z.infer<typeof containerDataSchema>;

export const containerDefinition: NodeTypeDefinition<ContainerData> = {
  id: "container",
  label: "Container",
  description: "Structural wrapper that nests child nodes.",
  category: "structure",
  version: 1,
  capabilities: {
    content: [],
    typography: [],
    appearance: ["background", "border", "borderRadius", "opacity"],
    layout: ["containerLayout", "gap", "width", "padding", "margin"],
  },
  children: { kind: "anyRegistered" },
  html: { defaultTag: "div" },
  defaultData: { layout: "stack", gap: "md", styles: {} },
  dataSchema: containerDataSchema,
};
