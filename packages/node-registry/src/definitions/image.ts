import { z } from "zod";
import type { NodeTypeDefinition } from "../types";
import { nodeStylesSchema } from "../styles";

export const imageDataSchema = z.object({
  /** Website Media Asset reference (preferred). */
  mediaAssetId: z.string().uuid().nullable().optional(),
  /** Legacy/external URL fallback when no mediaAssetId is set. */
  src: z.string().default(""),
  alt: z.string().default(""),
  styles: nodeStylesSchema,
});

export type ImageData = z.infer<typeof imageDataSchema>;

export const imageDefinition: NodeTypeDefinition<ImageData> = {
  id: "image",
  label: "Image",
  description: "Image asset reference with accessible alt text.",
  category: "media",
  version: 1,
  capabilities: {
    content: ["mediaAssetId", "alt"],
    typography: [],
    appearance: ["border", "borderRadius", "opacity"],
    layout: ["width", "height", "padding", "margin"],
  },
  children: { kind: "none" },
  html: { defaultTag: "img" },
  defaultData: { mediaAssetId: null, src: "", alt: "", styles: {} },
  dataSchema: imageDataSchema,
};
