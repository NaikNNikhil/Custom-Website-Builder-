import type { NextFunction, Response } from "express";
import multer from "multer";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { env } from "../../config/env";
import { AppError } from "../../middleware/error.middleware";
import { uuidSchema } from "../../utils/validation";
import { mediaService } from "./media.service";

function param(req: AuthenticatedRequest, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

function queryFlag(value: unknown): boolean {
  if (Array.isArray(value)) return queryFlag(value[0]);
  return value === "true" || value === "1";
}

export const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.mediaMaxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      cb(new AppError(400, "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF"));
      return;
    }
    cb(null, true);
  },
});

export const mediaController = {
  listByWebsite: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "websiteId"));
      const mediaAssets = await mediaService.listForWebsite(req.user!.id, websiteId);
      res.status(200).json({ mediaAssets });
    } catch (error) {
      next(error);
    }
  },

  upload: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const websiteId = uuidSchema.parse(param(req, "websiteId"));
      const file = req.file;
      if (!file) {
        throw new AppError(400, "File is required");
      }
      const mediaAsset = await mediaService.upload(req.user!.id, websiteId, {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });
      res.status(201).json({ mediaAsset });
    } catch (error) {
      next(error);
    }
  },

  detail: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = mediaService.parseId(param(req, "id"));
      const mediaAsset = await mediaService.getById(req.user!.id, id);
      res.status(200).json({ mediaAsset });
    } catch (error) {
      next(error);
    }
  },

  usage: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = mediaService.parseId(param(req, "id"));
      const usage = await mediaService.usage(req.user!.id, id);
      res.status(200).json({ usage });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = mediaService.parseId(param(req, "id"));
      const force = queryFlag(req.query.force);
      const result = await mediaService.remove(req.user!.id, id, force);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
