import type { NextFunction, Response } from "express";
import { database } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import type { AuthenticatedRequest } from "./auth.types";
import { verifyAuthToken } from "./auth.token";

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication required");
    }

    const token = header.slice("Bearer ".length).trim();
    const payload = verifyAuthToken(token, "access");

    const user = await database.user.findUnique({
      where: { id: payload.sub },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user) {
      throw new AppError(401, "Authentication required");
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(401, "Account is inactive");
    }

    req.user = {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role.name,
      permissions: user.role.permissions.map(({ permission }) => permission.code),
    };

    next();
  } catch (error) {
    next(error);
  }
}
