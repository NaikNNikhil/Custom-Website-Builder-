import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { uuidSchema } from "../../utils/validation";
import {
  createNodeSchema,
  nodeService,
  reorderSchema,
  updateNodeSchema,
} from "./node.service";

function param(req: AuthenticatedRequest, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

export const nodeController = {
  listBySection: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sectionId = uuidSchema.parse(param(req, "sectionId"));
      const nodes = await nodeService.listForSection(req.user!.id, sectionId);
      res.status(200).json({ nodes });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sectionId = uuidSchema.parse(param(req, "sectionId"));
      const parsed = createNodeSchema.parse(req.body);
      const node = await nodeService.create(req.user!.id, sectionId, parsed);
      res.status(201).json({ node });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = nodeService.parseId(param(req, "id"));
      const parsed = updateNodeSchema.parse(req.body);
      const node = await nodeService.update(req.user!.id, id, parsed);
      res.status(200).json({ node });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = nodeService.parseId(param(req, "id"));
      const result = await nodeService.remove(req.user!.id, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  reorder: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sectionId = uuidSchema.parse(param(req, "sectionId"));
      const parsed = reorderSchema.parse(req.body);
      const parentId =
        req.body.parentId === null || req.body.parentId === undefined
          ? null
          : uuidSchema.parse(req.body.parentId);
      const nodes = await nodeService.reorder(req.user!.id, sectionId, parentId, parsed.orderedIds);
      res.status(200).json({ nodes });
    } catch (error) {
      next(error);
    }
  },
};
