import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { uuidSchema } from "../../utils/validation";
import {
  createSectionSchema,
  reorderSchema,
  sectionService,
  updateSectionSchema,
} from "./section.service";

function param(req: AuthenticatedRequest, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

export const sectionController = {
  listByPage: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pageId = uuidSchema.parse(param(req, "pageId"));
      const sections = await sectionService.listForPage(req.user!.id, pageId);
      res.status(200).json({ sections });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pageId = uuidSchema.parse(param(req, "pageId"));
      const parsed = createSectionSchema.parse(req.body);
      const section = await sectionService.create(req.user!.id, pageId, parsed);
      res.status(201).json({ section });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = sectionService.parseId(param(req, "id"));
      const parsed = updateSectionSchema.parse(req.body);
      const section = await sectionService.update(req.user!.id, id, parsed);
      res.status(200).json({ section });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = sectionService.parseId(param(req, "id"));
      const result = await sectionService.remove(req.user!.id, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  reorder: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pageId = uuidSchema.parse(param(req, "pageId"));
      const parsed = reorderSchema.parse(req.body);
      const sections = await sectionService.reorder(req.user!.id, pageId, parsed.orderedIds);
      res.status(200).json({ sections });
    } catch (error) {
      next(error);
    }
  },
};
