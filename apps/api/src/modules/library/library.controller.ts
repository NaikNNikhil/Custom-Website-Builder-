import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { uuidSchema } from "../../utils/validation";
import {
  createLibraryItemSchema,
  libraryService,
  saveNodeToLibrarySchema,
  updateLibraryItemSchema,
  useLibraryItemSchema,
} from "./library.service";

function param(req: AuthenticatedRequest, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

function queryFlag(value: unknown): boolean {
  if (Array.isArray(value)) {
    return queryFlag(value[0]);
  }
  return value === "true" || value === "1";
}

export const libraryController = {
  listByWebsite: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "websiteId"));
      const libraryItems = await libraryService.listForWebsite(req.user!.id, websiteId);
      res.status(200).json({ libraryItems });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "websiteId"));
      const parsed = createLibraryItemSchema.parse(req.body);
      const libraryItem = await libraryService.create(req.user!.id, websiteId, parsed);
      res.status(201).json({ libraryItem });
    } catch (error) {
      next(error);
    }
  },

  detail: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = libraryService.parseId(param(req, "id"));
      const libraryItem = await libraryService.getById(req.user!.id, id);
      res.status(200).json({ libraryItem });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = libraryService.parseId(param(req, "id"));
      const parsed = updateLibraryItemSchema.parse(req.body);
      const libraryItem = await libraryService.update(req.user!.id, id, parsed);
      res.status(200).json({ libraryItem });
    } catch (error) {
      next(error);
    }
  },

  usage: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = libraryService.parseId(param(req, "id"));
      const usage = await libraryService.usage(req.user!.id, id);
      res.status(200).json({ usage });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = libraryService.parseId(param(req, "id"));
      const force = queryFlag(req.query.force);
      const result = await libraryService.remove(req.user!.id, id, force);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  use: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = libraryService.parseId(param(req, "id"));
      const parsed = useLibraryItemSchema.parse(req.body);
      const result = await libraryService.use(req.user!.id, id, parsed);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  saveNode: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const nodeId = uuidSchema.parse(param(req, "id"));
      const parsed = saveNodeToLibrarySchema.parse(req.body);
      const libraryItem = await libraryService.saveNodeToLibrary(req.user!.id, nodeId, parsed);
      res.status(201).json({ libraryItem });
    } catch (error) {
      next(error);
    }
  },

  makeIndependent: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const nodeId = uuidSchema.parse(param(req, "id"));
      const result = await libraryService.makeIndependent(req.user!.id, nodeId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
