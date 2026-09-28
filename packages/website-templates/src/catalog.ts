import type { TemplateCatalogEntry, WebsiteTemplateDefinition } from "./types";
import { ecommerceTemplate } from "./templates/ecommerce";
import { validateWebsiteTemplate } from "./validate";

const TEMPLATES: WebsiteTemplateDefinition[] = [ecommerceTemplate];

export function listTemplateCatalog(): TemplateCatalogEntry[] {
  return TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    version: template.version,
  }));
}

export function getWebsiteTemplate(id: string): WebsiteTemplateDefinition | null {
  return TEMPLATES.find((template) => template.id === id) ?? null;
}

export function requireWebsiteTemplate(id: string): WebsiteTemplateDefinition {
  const template = getWebsiteTemplate(id);
  if (!template) {
    throw new Error(`Unknown template: ${id}`);
  }
  const validation = validateWebsiteTemplate(template);
  if (!validation.ok) {
    throw new Error(
      `Template "${id}" failed validation: ${validation.issues[0]?.message ?? "invalid"}`,
    );
  }
  return template;
}

export { ecommerceTemplate };
export { validateWebsiteTemplate } from "./validate";
export type {
  TemplateCatalogEntry,
  TemplateLibraryItem,
  TemplateLibraryNode,
  TemplateMediaAsset,
  TemplateNode,
  TemplatePage,
  TemplateSection,
  WebsiteTemplateDefinition,
} from "./types";
export type { TemplateValidationIssue } from "./validate";
