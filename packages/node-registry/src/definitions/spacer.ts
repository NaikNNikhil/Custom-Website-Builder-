import { z } from "zod";
import type { NodeTypeDefinition } from "../types";
import { nodeStylesSchema } from "../styles";

export const spacerDataSchema = z.object({
  size: z.enum(["sm", "md", "lg"]).default("md"),
  styles: nodeStylesSchema,
});

export type SpacerData = z.infer<typeof spacerDataSchema>;

export const spacerDefinition: NodeTypeDefinition<SpacerData> = {
  id: "spacer",
  label: "Spacer",
  description: "Vertical spacing primitive.",
  category: "structure",
  version: 1,
  capabilities: {
    content: [],
    typography: [],
    appearance: ["opacity"],
    layout: ["size", "width"],
  },
  children: { kind: "none" },
  html: { defaultTag: "div" },
  defaultData: { size: "md", styles: {} },
  dataSchema: spacerDataSchema,
};
