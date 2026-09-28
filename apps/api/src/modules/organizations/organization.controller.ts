import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import {
  createOrganizationSchema,
  organizationService,
  updateOrganizationSchema,
} from "./organization.service";

export const organizationController = {
  list: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizations = await organizationService.listForUser(req.user!.id);
      res.status(200).json({ organizations });
    } catch (error) {
      next(error);
    }
  },

  detail: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = organizationService.parseOrganizationId(
        Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
      );
      const organization = await organizationService.getForUser(req.user!.id, id);
      res.status(200).json({ organization });
    } catch (error) {
      next(error);
    }
  },

  create: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createOrganizationSchema.parse(req.body);
      const organization = await organizationService.create(req.user!.id, parsed);
      res.status(201).json({ organization });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = organizationService.parseOrganizationId(
        Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
      );
      const parsed = updateOrganizationSchema.parse(req.body);
      const organization = await organizationService.update(req.user!.id, id, parsed);
      res.status(200).json({ organization });
    } catch (error) {
      next(error);
    }
  },
};
