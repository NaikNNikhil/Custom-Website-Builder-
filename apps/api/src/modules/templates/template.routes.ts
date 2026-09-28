import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { templateController } from "./template.controller";

const templateRoutes = Router();

templateRoutes.use(requireAuth);
templateRoutes.get("/", templateController.list);
templateRoutes.get("/:id", templateController.detail);

export default templateRoutes;
