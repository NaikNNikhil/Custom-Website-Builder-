import { z } from "zod";
import type { NodeTypeDefinition } from "../types";
import { migrateLegacyNodeData, nodeStylesSchema } from "../styles";

export const headingDataSchema = z.preprocess(
  migrateLegacyNodeData,
  z.object({
    text: z.string().default(""),
    level: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)])
      .default(2),
    styles: nodeStylesSchema,
  }),
);

export type HeadingData = z.infer<typeof headingDataSchema>;

export const headingDefinition: NodeTypeDefinition<HeadingData> = {
  id: "heading",
  label: "Heading",
  description: "Title text with platform-controlled heading semantics.",
  category: "content",
  version: 1,
  capabilities: {
    content: ["text", "level"],
    typography: ["fontFamily", "fontSize", "fontWeight", "color", "textAlign", "lineHeight"],
    appearance: ["background", "border", "borderRadius", "opacity"],
    layout: ["width", "padding", "margin"],
  },
  children: { kind: "none" },
  html: {
    defaultTag: "h2",
    tagFromDataField: "level",
    allowedTags: ["h1", "h2", "h3", "h4", "h5", "h6"],
  },
  defaultData: {
    text: "Heading",
    level: 2,
    styles: { textAlign: "start" },
  },
  dataSchema: headingDataSchema,
};
