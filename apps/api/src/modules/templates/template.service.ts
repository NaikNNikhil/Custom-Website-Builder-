import { listTemplateCatalog, requireWebsiteTemplate } from "@custom-website-builder/website-templates";
import { AppError } from "../../middleware/error.middleware";

export const templateService = {
  listCatalog() {
    return listTemplateCatalog();
  },

  getById(templateId: string) {
    try {
      const template = requireWebsiteTemplate(templateId);
      return {
        id: template.id,
        name: template.name,
        description: template.description,
        version: template.version,
      };
    } catch (error) {
      throw new AppError(404, error instanceof Error ? error.message : "Template not found");
    }
  },
};
