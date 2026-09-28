import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { libraryController } from "./library.controller";

const libraryRoutes = Router();

libraryRoutes.use(requireAuth);
libraryRoutes.get("/:id/usage", libraryController.usage);
libraryRoutes.post("/:id/use", libraryController.use);
libraryRoutes.get("/:id", libraryController.detail);
libraryRoutes.patch("/:id", libraryController.update);
libraryRoutes.delete("/:id", libraryController.remove);

export default libraryRoutes;
