import { Router } from "express";
import { env } from "../../config/env";
import { rateLimitIP } from "../../middleware/rate-limiter";
import { authController } from "./auth.controller";
import { requireAuth } from "./auth.middleware";

const authRoutes = Router();

const signupRateLimit = rateLimitIP({
  windowMs: env.signupRateLimitWindowMs,
  maxRequests: env.signupRateLimitMaxRequests,
});

const loginRateLimit = rateLimitIP({
  windowMs: env.loginRateLimitWindowMs,
  maxRequests: env.loginRateLimitMaxRequests,
});

authRoutes.post("/signup", signupRateLimit, authController.signup);
authRoutes.post("/login", loginRateLimit, authController.login);
// Refresh tokens are high-entropy, HttpOnly, database-backed credentials that
// rotate on every success. A fixed IP limit here logs out legitimate users who
// reload repeatedly, while doing nothing useful against token guessing.
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", requireAuth, authController.me);

export default authRoutes;
