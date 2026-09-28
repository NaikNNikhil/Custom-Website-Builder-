import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { websiteController } from "./website.controller";
import { publishController } from "../publish/publish.controller";

const websiteRoutes = Router();

websiteRoutes.use(requireAuth);
websiteRoutes.get("/:id/tree", websiteController.tree);
websiteRoutes.get("/:id/publication", publishController.status);
websiteRoutes.post("/:id/validate", publishController.validate);
websiteRoutes.post("/:id/publish", publishController.publish);
websiteRoutes.get("/:id/published", publishController.currentPublished);
websiteRoutes.patch("/:id/theme", websiteController.updateTheme);
websiteRoutes.get("/:id", websiteController.detail);
websiteRoutes.patch("/:id", websiteController.update);
websiteRoutes.delete("/:id", websiteController.remove);

export default websiteRoutes;
