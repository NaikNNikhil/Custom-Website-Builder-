import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { sectionController } from "./section.controller";

const sectionRoutes = Router();

sectionRoutes.use(requireAuth);
sectionRoutes.patch("/:id", sectionController.update);
sectionRoutes.delete("/:id", sectionController.remove);

export default sectionRoutes;
