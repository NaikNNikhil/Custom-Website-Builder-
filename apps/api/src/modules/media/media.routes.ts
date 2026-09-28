import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { mediaController } from "./media.controller";

const mediaRoutes = Router();

mediaRoutes.use(requireAuth);
mediaRoutes.get("/:id/usage", mediaController.usage);
mediaRoutes.get("/:id", mediaController.detail);
mediaRoutes.delete("/:id", mediaController.remove);

export default mediaRoutes;
