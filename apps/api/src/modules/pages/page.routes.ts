import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { pageController } from "./page.controller";

const pageRoutes = Router();

pageRoutes.use(requireAuth);
pageRoutes.patch("/:id", pageController.update);
pageRoutes.delete("/:id", pageController.remove);

export default pageRoutes;
