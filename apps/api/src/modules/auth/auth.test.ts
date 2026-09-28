import test from "node:test";
import assert from "node:assert/strict";

import { AppError } from "../../middleware/error.middleware";
import {
  createInMemoryRateLimitStore,
  createRateLimitMiddleware,
  extractClientIp,
  rateLimitIP,
  rateLimitIPAndEmail,
} from "../../middleware/rate-limiter";
import { parseDurationToMs } from "../../utils/duration";
import { isStrongPassword } from "./auth.password";
import { normalizeEmail, signupSchema } from "./auth.validation";
import { signAuthToken, verifyAuthToken } from "./auth.token";

test("duration parser supports supported values and rejects invalid input", () => {
  assert.equal(parseDurationToMs("30s"), 30_000);
  assert.equal(parseDurationToMs("15m"), 15 * 60 * 1000);
  assert.equal(parseDurationToMs("12h"), 12 * 60 * 60 * 1000);
  assert.equal(parseDurationToMs("7d"), 7 * 24 * 60 * 60 * 1000);

  assert.throws(() => parseDurationToMs("invalid"));
  assert.throws(() => parseDurationToMs("1w"));
  assert.throws(() => parseDurationToMs(""));
});

test("normalizeEmail trims and lowercases email", () => {
  assert.equal(normalizeEmail(" User@Example.COM "), "user@example.com");
});

test("signup validation accepts valid payload", () => {
  const payload = signupSchema.parse({
    email: "User@Example.COM",
    password: "Password123",
  });

  assert.deepEqual(payload, {
    email: "user@example.com",
    password: "Password123",
  });
});

test("signup validation rejects weak password", () => {
  assert.throws(() => {
    signupSchema.parse({
      email: "user@example.com",
      password: "password123",
    });
  });
});

test("strong password validation enforces policy", () => {
  assert.equal(isStrongPassword("Password123"), true);
  assert.equal(isStrongPassword("password123"), false);
  assert.equal(isStrongPassword("PASSWORD123"), false);
  assert.equal(isStrongPassword("Password"), false);
});

test("JWT tokens verify with the correct purpose", () => {
  const accessToken = signAuthToken(
    {
      sub: "123e4567-e89b-12d3-a456-426614174000",
      email: "user@example.com",
      jti: "6b1d4d3a-84f5-4e8d-8d36-b31ab6d0e50f",
    },
    "access",
    "15m",
  );

  const decoded = verifyAuthToken(accessToken, "access");

  assert.equal(decoded.sub, "123e4567-e89b-12d3-a456-426614174000");
  assert.equal(decoded.type, "access");
});

test("fixed-window in-memory store blocks after max requests", () => {
  const store = createInMemoryRateLimitStore();
  const policy = { windowMs: 60_000, maxRequests: 2 };

  assert.equal(store.allow("10.0.0.1", policy), true);
  assert.equal(store.allow("10.0.0.1", policy), true);
  assert.equal(store.allow("10.0.0.1", policy), false);
});

test("fixed-window store resets after expiry", () => {
  const store = createInMemoryRateLimitStore();
  const policy = { windowMs: 1000, maxRequests: 1 };

  assert.equal(store.allow("10.0.0.5", policy), true);
  assert.equal(store.allow("10.0.0.5", policy), false);

  const originalNow = Date.now;
  Date.now = () => originalNow() + 2001;

  try {
    assert.equal(store.allow("10.0.0.5", policy), true);
  } finally {
    Date.now = originalNow;
  }
});

test("rate-limit middleware isolates different IPs", () => {
  const store = createInMemoryRateLimitStore();
  const middleware = rateLimitIP({ windowMs: 60_000, maxRequests: 1 }, store);

  const firstRequest = { ip: "203.0.113.10", headers: {} } as any;
  const secondRequest = { ip: "203.0.113.11", headers: {} } as any;
  const res = {} as any;

  let nextCalled = 0;
  let error: unknown;

  middleware(firstRequest, res, () => {
    nextCalled += 1;
  });
  middleware(secondRequest, res, (err) => {
    error = err;
    nextCalled += 1;
  });

  assert.equal(nextCalled, 2);
  assert.ok(error === undefined);
});

test("rate-limit middleware enforces IP + email isolation", () => {
  const store = createInMemoryRateLimitStore();
  const middleware = rateLimitIPAndEmail({ windowMs: 60_000, maxRequests: 1 }, store);

  const reqA = {
    ip: "203.0.113.20",
    headers: {},
    body: { email: " User@Example.com " },
  } as any;
  const reqB = {
    ip: "203.0.113.20",
    headers: {},
    body: { email: "other@example.com" },
  } as any;
  const res = {} as any;

  let firstResult: unknown;
  let secondResult: unknown;

  middleware(reqA, res, (err) => {
    firstResult = err;
  });
  middleware(reqB, res, (err) => {
    secondResult = err;
  });

  assert.equal(firstResult, undefined);
  assert.equal(secondResult, undefined);
});

test("client IP extraction prefers Express req.ip in local-only configuration", () => {
  const request = {
    headers: {
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    },
    ip: "10.0.0.2",
  } as any;

  assert.equal(extractClientIp(request), "10.0.0.2");
});

test("client IP extraction falls back to socket remoteAddress when req.ip is unavailable", () => {
  const request = {
    headers: {
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    },
    ip: undefined,
    socket: {
      remoteAddress: "10.0.0.42",
    },
  } as any;

  assert.equal(extractClientIp(request), "10.0.0.42");
});

test("client IP extraction does not trust forwarded headers in the local-only configuration", () => {
  const request = {
    headers: {
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    },
    ip: undefined,
    socket: undefined,
  } as any;

  assert.equal(extractClientIp(request), "unknown");
});

test("expired in-memory rate-limit records are cleaned up", () => {
  const store = createInMemoryRateLimitStore();
  const policy = { windowMs: 1000, maxRequests: 1 };

  assert.equal(store.allow("expired-key", policy), true);
  assert.equal(store.allow("expired-key", policy), false);

  const originalNow = Date.now;
  Date.now = () => originalNow() + 2001;

  try {
    store.cleanupExpiredEntries();
    assert.equal(store.allow("expired-key", policy), true);
  } finally {
    Date.now = originalNow;
  }
});

test("rate-limit middleware returns AppError 429 on exceed", () => {
  const store = createInMemoryRateLimitStore();
  const middleware = rateLimitIP({ windowMs: 60_000, maxRequests: 1 }, store);
  const req = { ip: "203.0.113.30", headers: {} } as any;
  const res = {} as any;

  let blocked: AppError | undefined;

  middleware(req, res, () => {
    // first call is accepted
  });

  middleware(req, res, (error) => {
    blocked = error as AppError;
  });

  assert.ok(blocked instanceof AppError);
  assert.equal(blocked?.statusCode, 429);
  assert.equal(blocked?.message, "Too many requests. Please try again later.");
});

test("rate-limit middleware supports a reusable factory", () => {
  const store = createInMemoryRateLimitStore();
  const middleware = createRateLimitMiddleware({
    keyGenerator: (req) => `key:${req.ip ?? "unknown"}`,
    policy: { windowMs: 60_000, maxRequests: 1 },
    store,
  });

  const request = { ip: "203.0.113.40", headers: {} } as any;
  const res = {} as any;

  let firstError: unknown;
  let secondError: unknown;

  middleware(request, res, (error) => {
    firstError = error;
  });
  middleware(request, res, (error) => {
    secondError = error;
  });

  assert.equal(firstError, undefined);
  assert.ok(secondError instanceof AppError);
  assert.equal((secondError as AppError).statusCode, 429);
});
