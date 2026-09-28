import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../../middleware/error.middleware";
import { parseDurationToMs } from "../../utils/duration";
import type { AuthenticatedRequest } from "./auth.types";
import { authService } from "./auth.service";
import { loginSchema, signupSchema } from "./auth.validation";

const getRefreshCookieExpiry = (): Date => new Date(Date.now() + parseDurationToMs(env.refreshTokenExpiresIn));

export const authController = {
  signup: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = signupSchema.parse(req.body);
      const result = await authService.signup(parsed.email, parsed.password, req.ip ?? "unknown");

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/api/auth",
        expires: getRefreshCookieExpiry(),
      });

      res.status(201).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await authService.login(parsed.email, parsed.password, req.ip ?? "unknown");

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/api/auth",
        expires: getRefreshCookieExpiry(),
      });

      res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      if (!refreshToken) {
        throw new AppError(401, "Authentication required");
      }

      const result = await authService.refreshSession(refreshToken);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/api/auth",
        expires: getRefreshCookieExpiry(),
      });

      res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  },

  me: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json({ user: req.user });
  },

  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie("refreshToken", { path: "/api/auth" });
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};