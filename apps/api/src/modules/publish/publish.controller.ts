import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { uuidSchema } from "../../utils/validation";
import { publishService } from "./publish.service";

function param(req: AuthenticatedRequest, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

export const publishController = {
  status: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "id"));
      const publication = await publishService.getPublicationStatus(req.user!.id, websiteId);
      res.status(200).json({ publication });
    } catch (error) {
      next(error);
    }
  },

  validate: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "id"));
      const result = await publishService.validateDraft(req.user!.id, websiteId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  publish: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "id"));
      const result = await publishService.publish(req.user!.id, websiteId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  currentPublished: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "id"));
      const result = await publishService.getCurrentPublished(req.user!.id, websiteId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  publicCurrentPublished: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "websiteId"));
      const result = await publishService.getCurrentPublishedPublic(websiteId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  publicBySlug: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = String(param(req, "slug") ?? "").trim().toLowerCase();
      const result = await publishService.getCurrentPublishedBySlug(slug);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
