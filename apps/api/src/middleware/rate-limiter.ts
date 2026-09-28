import type { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware";

type RateLimitPolicy = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitStore = {
  allow: (key: string, policy: RateLimitPolicy) => boolean;
  cleanupExpiredEntries: () => void;
};

type RateLimitKeyGenerator = (request: Request) => string;

type RateLimitMiddlewareOptions = {
  keyGenerator: RateLimitKeyGenerator;
  policy: RateLimitPolicy;
  store?: RateLimitStore;
  message?: string;
};

type RequestRecord = {
  count: number;
  resetAt: number;
};

export function createInMemoryRateLimitStore(): RateLimitStore {
  const hits = new Map<string, RequestRecord>();

  const cleanupExpiredEntries = (): void => {
    const now = Date.now();

    for (const [key, record] of hits.entries()) {
      if (record.resetAt <= now) {
        hits.delete(key);
      }
    }
  };

  const timer = setInterval(() => {
    cleanupExpiredEntries();
  }, 60_000);

  timer.unref?.();

  return {
    allow: (key: string, { windowMs, maxRequests }: RateLimitPolicy): boolean => {
      const now = Date.now();
      const existing = hits.get(key);

      if (!existing || existing.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }

      if (existing.count >= maxRequests) {
        return false;
      }

      existing.count += 1;
      return true;
    },
    cleanupExpiredEntries,
  };
}

export function createRateLimitMiddleware({
  keyGenerator,
  policy,
  store = createInMemoryRateLimitStore(),
  message = "Too many requests. Please try again later.",
}: RateLimitMiddlewareOptions) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const key = keyGenerator(request);

    if (!store.allow(key, policy)) {
      return next(new AppError(429, message));
    }

    next();
  };
}

export function extractClientIp(request: {
  ip?: string;
  socket?: { remoteAddress?: string | undefined };
  headers?: Record<string, string | string[] | undefined>;
}): string {
  const requestIp = typeof request.ip === "string" ? request.ip : undefined;
  if (requestIp && requestIp !== "unknown") {
    return requestIp;
  }

  const socketIp = typeof request.socket?.remoteAddress === "string" ? request.socket.remoteAddress : undefined;
  if (socketIp && socketIp !== "unknown") {
    return socketIp;
  }

  return "unknown";
}

export function getClientIdentifier(request: Request): string {
  return extractClientIp(request as Parameters<typeof extractClientIp>[0]);
}

export function rateLimitIP(policy: RateLimitPolicy, store = createInMemoryRateLimitStore()) {
  return createRateLimitMiddleware({
    keyGenerator: (request) => getClientIdentifier(request),
    policy,
    store,
  });
}

export function rateLimitIPAndEmail(policy: RateLimitPolicy, store = createInMemoryRateLimitStore()) {
  return createRateLimitMiddleware({
    keyGenerator: (request) => {
      const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "unknown";
      return `${getClientIdentifier(request)}:${email}`;
    },
    policy,
    store,
  });
}

export type { RateLimitPolicy, RateLimitStore };
