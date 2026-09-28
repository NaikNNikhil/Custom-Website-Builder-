import type { NextFunction, Request, Response } from "express";
import { userRoleUpdateSchema, userService, userStatusUpdateSchema } from "./user.service";

export const userController = {
  list: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await userService.listUsers();
      res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  },

  detail: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await userService.getUserById(id);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },

  changeRole: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = userRoleUpdateSchema.parse(req.body);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await userService.updateRole(id, parsed.roleId);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },

  changeStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = userStatusUpdateSchema.parse(req.body);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await userService.updateStatus(id, parsed.status);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },

  loginLogs: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const logs = await userService.getLoginLogs(id);
      res.status(200).json({ logs });
    } catch (error) {
      next(error);
    }
  },
};
