import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { listRegistryNodeTypes } from "../nodes/node-registry.service";

export const registryController = {
  listNodeTypes: async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ nodeTypes: listRegistryNodeTypes() });
    } catch (error) {
      next(error);
    }
  },
};
