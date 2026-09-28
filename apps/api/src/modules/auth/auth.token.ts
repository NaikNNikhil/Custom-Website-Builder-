import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../middleware/error.middleware";
import type { AuthTokenType, JwtPayload, SignTokenPayload } from "./auth.types";

const ISSUER = "custom-website-builder";

export function generateTokenId(): string {
  return crypto.randomUUID();
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAuthToken(
  payload: SignTokenPayload,
  type: AuthTokenType,
  expiresIn: string,
): string {
  return jwt.sign(
    {
      ...payload,
      type,
      iss: ISSUER,
      aud: ISSUER,
    },
    type === "access" ? env.jwtAccessSecret : env.jwtRefreshSecret,
    {
      algorithm: "HS256",
      expiresIn,
    } as jwt.SignOptions,
  );
}

export function verifyAuthToken(token: string, type: AuthTokenType): JwtPayload {
  const secret = type === "access" ? env.jwtAccessSecret : env.jwtRefreshSecret;

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: ISSUER,
    }) as JwtPayload;

    if (decoded.type !== type) {
      throw new AppError(401, "Invalid token type");
    }

    return decoded;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, "Invalid or expired token");
  }
}
