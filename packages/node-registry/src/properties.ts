export type PropertyCategory = "content" | "typography" | "appearance" | "layout";

export type PropertyControlKind =
  | "text"
  | "textarea"
  | "url"
  | "color"
  | "number"
  | "select"
  | "mediaAsset";

export type PropertyFieldOption = {
  value: string;
  label: string;
};

/**
 * Declarative editor field. Paths use dot notation into node.data
 * (e.g. `styles.fontSize`). Unset style paths = inherit later.
 */
export type PropertyFieldDefinition = {
  id: string;
  path: string;
  category: PropertyCategory;
  label: string;
  control: PropertyControlKind;
  options?: readonly PropertyFieldOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
};

const FONT_FAMILY_OPTIONS: readonly PropertyFieldOption[] = [
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, Times, serif", label: "Times New Roman" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "system-ui, sans-serif", label: "System UI" },
];

const FONT_SIZE_OPTIONS: readonly PropertyFieldOption[] = [
  { value: "0.875rem", label: "Small" },
  { value: "1rem", label: "Medium" },
  { value: "1.25rem", label: "Large" },
  { value: "1.5rem", label: "XL" },
  { value: "2rem", label: "2XL" },
  { value: "2.5rem", label: "3XL" },
];

const FONT_WEIGHT_OPTIONS: readonly PropertyFieldOption[] = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];

const ALIGN_OPTIONS: readonly PropertyFieldOption[] = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
];

const LINE_HEIGHT_OPTIONS: readonly PropertyFieldOption[] = [
  { value: "1.2", label: "Tight" },
  { value: "1.5", label: "Normal" },
  { value: "1.75", label: "Relaxed" },
  { value: "2", label: "Loose" },
];

const SPACING_OPTIONS: readonly PropertyFieldOption[] = [
  { value: "0", label: "None" },
  { value: "0.5rem", label: "SM" },
  { value: "1rem", label: "MD" },
  { value: "1.5rem", label: "LG" },
  { value: "2rem", label: "XL" },
];

const WIDTH_OPTIONS: readonly PropertyFieldOption[] = [
  { value: "auto", label: "Auto" },
  { value: "100%", label: "Full" },
  { value: "50%", label: "Half" },
  { value: "fit-content", label: "Fit content" },
];

/** Global catalog — node definitions reference ids from here. */
export const PROPERTY_FIELD_CATALOG: Record<string, PropertyFieldDefinition> = {
  text: {
    id: "text",
    path: "text",
    category: "content",
    label: "Text",
    control: "textarea",
    placeholder: "Enter text",
  },
  level: {
    id: "level",
    path: "level",
    category: "content",
    label: "Heading level",
    control: "select",
    options: [
      { value: "1", label: "H1" },
      { value: "2", label: "H2" },
      { value: "3", label: "H3" },
      { value: "4", label: "H4" },
      { value: "5", label: "H5" },
      { value: "6", label: "H6" },
    ],
  },
  src: {
    id: "src",
    path: "src",
    category: "content",
    label: "Image source",
    control: "url",
    placeholder: "https://…",
  },
  mediaAssetId: {
    id: "mediaAssetId",
    path: "mediaAssetId",
    category: "content",
    label: "Media",
    control: "mediaAsset",
  },
  alt: {
    id: "alt",
    path: "alt",
    category: "content",
    label: "Alt text",
    control: "text",
    placeholder: "Describe the image",
  },
  label: {
    id: "label",
    path: "label",
    category: "content",
    label: "Label",
    control: "text",
  },
  href: {
    id: "href",
    path: "href",
    category: "content",
    label: "Link URL",
    control: "url",
    placeholder: "https://… or /path",
  },
  containerLayout: {
    id: "containerLayout",
    path: "layout",
    category: "layout",
    label: "Direction",
    control: "select",
    options: [
      { value: "stack", label: "Stack" },
      { value: "row", label: "Row" },
    ],
  },
  gap: {
    id: "gap",
    path: "gap",
    category: "layout",
    label: "Gap",
    control: "select",
    options: [
      { value: "none", label: "None" },
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
      { value: "lg", label: "Large" },
    ],
  },
  size: {
    id: "size",
    path: "size",
    category: "layout",
    label: "Spacer size",
    control: "select",
    options: [
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
      { value: "lg", label: "Large" },
    ],
  },
  fontFamily: {
    id: "fontFamily",
    path: "styles.fontFamily",
    category: "typography",
    label: "Font family",
    control: "select",
    options: FONT_FAMILY_OPTIONS,
  },
  fontSize: {
    id: "fontSize",
    path: "styles.fontSize",
    category: "typography",
    label: "Font size",
    control: "select",
    options: FONT_SIZE_OPTIONS,
  },
  fontWeight: {
    id: "fontWeight",
    path: "styles.fontWeight",
    category: "typography",
    label: "Font weight",
    control: "select",
    options: FONT_WEIGHT_OPTIONS,
  },
  color: {
    id: "color",
    path: "styles.color",
    category: "typography",
    label: "Text color",
    control: "color",
  },
  textAlign: {
    id: "textAlign",
    path: "styles.textAlign",
    category: "typography",
    label: "Alignment",
    control: "select",
    options: ALIGN_OPTIONS,
  },
  lineHeight: {
    id: "lineHeight",
    path: "styles.lineHeight",
    category: "typography",
    label: "Line height",
    control: "select",
    options: LINE_HEIGHT_OPTIONS,
  },
  background: {
    id: "background",
    path: "styles.background",
    category: "appearance",
    label: "Background",
    control: "color",
  },
  border: {
    id: "border",
    path: "styles.border",
    category: "appearance",
    label: "Border",
    control: "text",
    placeholder: "1px solid #ccc",
  },
  borderRadius: {
    id: "borderRadius",
    path: "styles.borderRadius",
    category: "appearance",
    label: "Radius",
    control: "text",
    placeholder: "8px",
  },
  opacity: {
    id: "opacity",
    path: "styles.opacity",
    category: "appearance",
    label: "Opacity",
    control: "number",
    min: 0,
    max: 1,
    step: 0.05,
  },
  width: {
    id: "width",
    path: "styles.width",
    category: "layout",
    label: "Width",
    control: "select",
    options: WIDTH_OPTIONS,
  },
  height: {
    id: "height",
    path: "styles.height",
    category: "layout",
    label: "Height",
    control: "text",
    placeholder: "auto",
  },
  padding: {
    id: "padding",
    path: "styles.padding",
    category: "layout",
    label: "Padding",
    control: "select",
    options: SPACING_OPTIONS,
  },
  margin: {
    id: "margin",
    path: "styles.margin",
    category: "layout",
    label: "Margin",
    control: "select",
    options: SPACING_OPTIONS,
  },
};

export function getPropertyField(id: string): PropertyFieldDefinition | undefined {
  return PROPERTY_FIELD_CATALOG[id];
}

export function resolvePropertyFields(fieldIds: readonly string[]): PropertyFieldDefinition[] {
  return fieldIds
    .map((id) => PROPERTY_FIELD_CATALOG[id])
    .filter((field): field is PropertyFieldDefinition => Boolean(field));
}

export function getValueAtPath(data: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".");
  let current: unknown = data;
  for (const part of parts) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function setValueAtPath(
  data: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split(".");
  const root = structuredClone(data);

  if (parts.length === 1) {
    if (value === "" || value === undefined || value === null) {
      delete root[parts[0]];
    } else {
      root[parts[0]] = value;
    }
    return root;
  }

  let cursor: Record<string, unknown> = root;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    const next = cursor[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cursor[key] = {};
    } else {
      cursor[key] = { ...(next as Record<string, unknown>) };
    }
    cursor = cursor[key] as Record<string, unknown>;
  }

  const leaf = parts[parts.length - 1];
  if (value === "" || value === undefined || value === null) {
    delete cursor[leaf];
  } else {
    cursor[leaf] = value;
  }

  // Drop empty styles object to keep overrides sparse
  if (
    root.styles &&
    typeof root.styles === "object" &&
    !Array.isArray(root.styles) &&
    Object.keys(root.styles as object).length === 0
  ) {
    delete root.styles;
  }

  return root;
}
