import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import roleRoutes from "../modules/roles/role.routes";
import userRoutes from "../modules/users/user.routes";
import organizationRoutes from "../modules/organizations/organization.routes";
import websiteRoutes from "../modules/websites/website.routes";
import pageRoutes from "../modules/pages/page.routes";
import sectionRoutes from "../modules/sections/section.routes";
import nodeRoutes from "../modules/nodes/node.routes";
import registryRoutes from "../modules/registry/registry.routes";
import libraryRoutes from "../modules/library/library.routes";
import mediaRoutes from "../modules/media/media.routes";
import templateRoutes from "../modules/templates/template.routes";
import { requireAuth } from "../modules/auth/auth.middleware";
import { websiteController } from "../modules/websites/website.controller";
import { pageController } from "../modules/pages/page.controller";
import { sectionController } from "../modules/sections/section.controller";
import { nodeController } from "../modules/nodes/node.controller";
import { libraryController } from "../modules/library/library.controller";
import { mediaController, mediaUpload } from "../modules/media/media.controller";
import { publishController } from "../modules/publish/publish.controller";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/roles", roleRoutes);
routes.use("/users", userRoutes);
routes.use("/organizations", organizationRoutes);
routes.use("/registry", registryRoutes);
routes.use("/templates", templateRoutes);

const organizationScoped = Router({ mergeParams: true });
organizationScoped.use(requireAuth);
organizationScoped.get("/websites", websiteController.listByOrganization);
organizationScoped.post("/websites", websiteController.create);
routes.use("/organizations/:organizationId", organizationScoped);

routes.use("/websites", websiteRoutes);

const websiteScoped = Router({ mergeParams: true });
websiteScoped.use(requireAuth);
websiteScoped.get("/pages", pageController.listByWebsite);
websiteScoped.post("/pages", pageController.create);
websiteScoped.post("/pages/reorder", pageController.reorder);
websiteScoped.get("/library", libraryController.listByWebsite);
websiteScoped.post("/library", libraryController.create);
websiteScoped.get("/media", mediaController.listByWebsite);
websiteScoped.post("/media", mediaUpload.single("file"), mediaController.upload);
routes.use("/websites/:websiteId", websiteScoped);

routes.use("/library-items", libraryRoutes);
routes.use("/media", mediaRoutes);

routes.use("/pages", pageRoutes);

const pageScoped = Router({ mergeParams: true });
pageScoped.use(requireAuth);
pageScoped.get("/sections", sectionController.listByPage);
pageScoped.post("/sections", sectionController.create);
pageScoped.post("/sections/reorder", sectionController.reorder);
routes.use("/pages/:pageId", pageScoped);

routes.use("/sections", sectionRoutes);

const sectionScoped = Router({ mergeParams: true });
sectionScoped.use(requireAuth);
sectionScoped.get("/nodes", nodeController.listBySection);
sectionScoped.post("/nodes", nodeController.create);
sectionScoped.post("/nodes/reorder", nodeController.reorder);
routes.use("/sections/:sectionId", sectionScoped);

routes.use("/nodes", nodeRoutes);

const publicRoutes = Router();
publicRoutes.get("/sites/:slug", publishController.publicBySlug);
publicRoutes.get("/websites/:websiteId/published", publishController.publicCurrentPublished);
routes.use("/public", publicRoutes);

export default routes;
