import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { uuidSchema } from "../../utils/validation";
import {
  createPageSchema,
  pageService,
  reorderSchema,
  updatePageSchema,
} from "./page.service";

function param(req: AuthenticatedRequest, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

export const pageController = {
  listByWebsite: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "websiteId"));
      const pages = await pageService.listForWebsite(req.user!.id, websiteId);
      res.status(200).json({ pages });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "websiteId"));
      const parsed = createPageSchema.parse(req.body);
      const page = await pageService.create(req.user!.id, websiteId, parsed);
      res.status(201).json({ page });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = pageService.parseId(param(req, "id"));
      const parsed = updatePageSchema.parse(req.body);
      const page = await pageService.update(req.user!.id, id, parsed);
      res.status(200).json({ page });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = pageService.parseId(param(req, "id"));
      const result = await pageService.remove(req.user!.id, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  reorder: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "websiteId"));
      const parsed = reorderSchema.parse(req.body);
      const parentId =
        req.body.parentId === null || req.body.parentId === undefined
          ? null
          : uuidSchema.parse(req.body.parentId);
      const pages = await pageService.reorder(req.user!.id, websiteId, parentId, parsed.orderedIds);
      res.status(200).json({ pages });
    } catch (error) {
      next(error);
    }
  },
};
