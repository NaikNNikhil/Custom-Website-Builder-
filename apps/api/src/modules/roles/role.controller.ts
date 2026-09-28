import type { NextFunction, Request, Response } from "express";
import { roleService, roleNameSchema } from "./role.service";

export const roleController = {
  list: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await roleService.getAllRoles();
      res.status(200).json({ roles });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = roleNameSchema.parse(req.body);
      const role = await roleService.createRole(parsed);
      res.status(201).json({ role });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = roleNameSchema.parse(req.body);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const role = await roleService.updateRole(id, parsed);
      res.status(200).json({ role });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await roleService.deleteRole(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
