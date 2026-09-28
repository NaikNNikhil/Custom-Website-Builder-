import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { registryController } from "./registry.controller";

const registryRoutes = Router();

registryRoutes.use(requireAuth);
registryRoutes.get("/node-types", registryController.listNodeTypes);

export default registryRoutes;
