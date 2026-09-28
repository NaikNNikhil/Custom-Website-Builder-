import { z } from "zod";
import type { NodeTypeDefinition } from "../types";
import { nodeStylesSchema } from "../styles";

export const buttonDataSchema = z.object({
  label: z.string().default("Button"),
  href: z.string().default(""),
  styles: nodeStylesSchema,
});

export type ButtonData = z.infer<typeof buttonDataSchema>;

export const buttonDefinition: NodeTypeDefinition<ButtonData> = {
  id: "button",
  label: "Button",
  description: "Call-to-action control. Renders as link when href is set.",
  category: "action",
  version: 1,
  capabilities: {
    content: ["label", "href"],
    typography: ["fontFamily", "fontSize", "fontWeight", "color", "textAlign"],
    appearance: ["background", "border", "borderRadius", "opacity"],
    layout: ["width", "padding", "margin"],
  },
  children: { kind: "none" },
  html: {
    defaultTag: "button",
    tagFromDataField: "href",
    allowedTags: ["button", "a"],
  },
  defaultData: {
    label: "Button",
    href: "",
    styles: {},
  },
  dataSchema: buttonDataSchema,
};
