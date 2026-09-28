import { z } from "zod";
import type { NodeTypeDefinition } from "../types";
import { nodeStylesSchema } from "../styles";

export const linkDataSchema = z.object({
  label: z.string().default("Link"),
  href: z.string().default("#"),
  styles: nodeStylesSchema,
});

export type LinkData = z.infer<typeof linkDataSchema>;

export const linkDefinition: NodeTypeDefinition<LinkData> = {
  id: "link",
  label: "Link",
  description: "Inline or standalone hyperlink.",
  category: "action",
  version: 1,
  capabilities: {
    content: ["label", "href"],
    typography: ["fontFamily", "fontSize", "fontWeight", "color", "textAlign"],
    appearance: ["opacity"],
    layout: ["padding", "margin"],
  },
  children: { kind: "none" },
  html: { defaultTag: "a" },
  defaultData: {
    label: "Link",
    href: "#",
    styles: {},
  },
  dataSchema: linkDataSchema,
};
