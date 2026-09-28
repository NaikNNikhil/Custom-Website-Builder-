import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";
import { userController } from "./user.controller";

const userRoutes = Router();

userRoutes.use(requireAuth);
userRoutes.get("/", requirePermission("admin:access"), userController.list);
userRoutes.get("/:id", requirePermission("admin:access"), userController.detail);
userRoutes.get("/:id/login-logs", requirePermission("admin:access"), userController.loginLogs);
userRoutes.patch("/:id/role", requirePermission("admin:access"), userController.changeRole);
userRoutes.patch("/:id/status", requirePermission("admin:access"), userController.changeStatus);

export default userRoutes;
