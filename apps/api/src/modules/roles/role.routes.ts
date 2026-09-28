import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";
import { roleController } from "./role.controller";

const roleRoutes = Router();

roleRoutes.use(requireAuth);
roleRoutes.get("/", requirePermission("admin:access"), roleController.list);
roleRoutes.post("/", requirePermission("admin:access"), roleController.create);
roleRoutes.patch("/:id", requirePermission("admin:access"), roleController.update);
roleRoutes.delete("/:id", requirePermission("admin:access"), roleController.remove);

export default roleRoutes;
