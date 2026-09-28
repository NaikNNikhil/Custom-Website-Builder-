import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { uuidSchema } from "../../utils/validation";
import {
  createWebsiteSchema,
  updateWebsiteSchema,
  updateWebsiteThemeSchema,
  websiteService,
} from "./website.service";

export const websiteController = {
  listByOrganization: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = uuidSchema.parse(
        Array.isArray(req.params.organizationId) ? req.params.organizationId[0] : req.params.organizationId,
      );
      const websites = await websiteService.listForOrganization(req.user!.id, organizationId);
      res.status(200).json({ websites });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = uuidSchema.parse(
        Array.isArray(req.params.organizationId) ? req.params.organizationId[0] : req.params.organizationId,
      );
      const parsed = createWebsiteSchema.parse(req.body);
      const website = await websiteService.create(req.user!.id, organizationId, parsed);
      res.status(201).json({ website });
    } catch (error) {
      next(error);
    }
  },

  detail: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = websiteService.parseId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const website = await websiteService.getForUser(req.user!.id, id);
      res.status(200).json({ website });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = websiteService.parseId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const parsed = updateWebsiteSchema.parse(req.body);
      const website = await websiteService.update(req.user!.id, id, parsed);
      res.status(200).json({ website });
    } catch (error) {
      next(error);
    }
  },

  updateTheme: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = websiteService.parseId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const parsed = updateWebsiteThemeSchema.parse(req.body);
      const website = await websiteService.updateTheme(req.user!.id, id, parsed);
      res.status(200).json({ website });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = websiteService.parseId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const result = await websiteService.remove(req.user!.id, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  tree: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = websiteService.parseId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const website = await websiteService.getTree(req.user!.id, id);
      res.status(200).json({ website });
    } catch (error) {
      next(error);
    }
  },
};
