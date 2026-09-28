import type { NextFunction, Response } from "express";
import { database } from "../config/database";
import type { AuthenticatedRequest } from "../modules/auth/auth.types";
import { AppError } from "./error.middleware";

export function requirePermission(...permissions: string[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, "Authentication required");
      }

      const user = await database.user.findUnique({
        where: { id: req.user.id },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });

      const grantedPermissions = user?.role.permissions.map(({ permission }) => permission.code) ?? [];
      if (!user || !permissions.every((permission) => grantedPermissions.includes(permission))) {
        throw new AppError(403, "Forbidden");
      }

      req.user.role = user.role.name;
      next();
    } catch (error) {
      next(error);
    }
  };
}
