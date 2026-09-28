import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { nodeController } from "./node.controller";
import { libraryController } from "../library/library.controller";

const nodeRoutes = Router();

nodeRoutes.use(requireAuth);
nodeRoutes.post("/:id/save-to-library", libraryController.saveNode);
nodeRoutes.post("/:id/make-independent", libraryController.makeIndependent);
nodeRoutes.patch("/:id", nodeController.update);
nodeRoutes.delete("/:id", nodeController.remove);

export default nodeRoutes;
