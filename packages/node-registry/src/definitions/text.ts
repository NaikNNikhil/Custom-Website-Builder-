import { z } from "zod";
import type { NodeTypeDefinition } from "../types";
import { migrateLegacyNodeData, nodeStylesSchema } from "../styles";

export const textDataSchema = z.preprocess(
  migrateLegacyNodeData,
  z.object({
    text: z.string().default(""),
    styles: nodeStylesSchema,
  }),
);

export type TextData = z.infer<typeof textDataSchema>;

export const textDefinition: NodeTypeDefinition<TextData> = {
  id: "text",
  label: "Text",
  description: "Body copy paragraph.",
  category: "content",
  version: 1,
  capabilities: {
    content: ["text"],
    typography: ["fontFamily", "fontSize", "fontWeight", "color", "textAlign", "lineHeight"],
    appearance: ["background", "border", "borderRadius", "opacity"],
    layout: ["width", "padding", "margin"],
  },
  children: { kind: "none" },
  html: { defaultTag: "p" },
  defaultData: {
    text: "Text content",
    styles: { textAlign: "start" },
  },
  dataSchema: textDataSchema,
};
