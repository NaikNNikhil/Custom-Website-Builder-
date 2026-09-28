import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { templateService } from "./template.service";

function param(req: AuthenticatedRequest, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

export const templateController = {
  list: async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const templates = templateService.listCatalog();
      res.status(200).json({ templates });
    } catch (error) {
      next(error);
    }
  },

  detail: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = templateService.getById(param(req, "id"));
      res.status(200).json({ template });
    } catch (error) {
      next(error);
    }
  },
};
