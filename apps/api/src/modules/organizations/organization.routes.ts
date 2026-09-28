import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { organizationController } from "./organization.controller";

const organizationRoutes = Router();

organizationRoutes.use(requireAuth);
organizationRoutes.get("/", organizationController.list);
organizationRoutes.post("/", organizationController.create);
organizationRoutes.get("/:id", organizationController.detail);
organizationRoutes.patch("/:id", organizationController.update);

export default organizationRoutes;
