import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";
import { parseDurationToMs } from "../utils/duration";

dotenv.config({
  path: path.resolve(__dirname, "../../../../.env"),
});

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z
    .string()
    .trim()
    .refine((value) => {
      try {
        parseDurationToMs(value);
        return true;
      } catch {
        return false;
      }
    }, "ACCESS_TOKEN_EXPIRES_IN must be a valid duration string like 15m, 12h, or 7d")
    .default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .trim()
    .refine((value) => {
      try {
        parseDurationToMs(value);
        return true;
      } catch {
        return false;
      }
    }, "REFRESH_TOKEN_EXPIRES_IN must be a valid duration string like 30s, 15m, 12h, or 7d")
    .default("7d"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  COOKIE_DOMAIN: z.string().optional(),
  SIGNUP_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  SIGNUP_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  LOGIN_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(5),
  CLOUDINARY_CLOUD_NAME: z.string().trim().optional(),
  CLOUDINARY_API_KEY: z.string().trim().optional(),
  CLOUDINARY_API_SECRET: z.string().trim().optional(),
  CLOUDINARY_FOLDER: z.string().trim().default("custom-website-builder"),
  MEDIA_MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5_000_000),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(`Invalid environment configuration: ${result.error.message}`);
}

export const env = {
  nodeEnv: result.data.NODE_ENV,
  port: result.data.PORT,
  databaseUrl: result.data.DATABASE_URL,
  jwtAccessSecret: result.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: result.data.JWT_REFRESH_SECRET,
  accessTokenExpiresIn: result.data.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: result.data.REFRESH_TOKEN_EXPIRES_IN,
  frontendUrl: result.data.FRONTEND_URL,
  cookieDomain: result.data.COOKIE_DOMAIN,
  signupRateLimitWindowMs: result.data.SIGNUP_RATE_LIMIT_WINDOW_MS,
  signupRateLimitMaxRequests: result.data.SIGNUP_RATE_LIMIT_MAX_REQUESTS,
  loginRateLimitWindowMs: result.data.LOGIN_RATE_LIMIT_WINDOW_MS,
  loginRateLimitMaxRequests: result.data.LOGIN_RATE_LIMIT_MAX_REQUESTS,
  cloudinaryCloudName: result.data.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: result.data.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: result.data.CLOUDINARY_API_SECRET,
  cloudinaryFolder: result.data.CLOUDINARY_FOLDER,
  mediaMaxUploadBytes: result.data.MEDIA_MAX_UPLOAD_BYTES,
} as const;
