import type { Request } from "express";

export type AuthTokenType = "access" | "refresh";

export type UserStatus = "ACTIVE" | "INACTIVE";

export type SafeUser = {
  id: string;
  email: string;
  status: UserStatus;
  role: string;
  permissions: string[];
};

export type AuthenticatedRequest = Request & {
  user?: SafeUser;
};

export type SignTokenPayload = {
  sub: string;
  email: string;
  jti: string;
};

export type JwtPayload = SignTokenPayload & {
  type: AuthTokenType;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
};

export type AuthenticatedResponse = {
  user: SafeUser;
  accessToken: string;
};

export type AuthCookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  expires?: Date;
};
