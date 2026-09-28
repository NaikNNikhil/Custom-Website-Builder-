# Custom Website Builder — Daily Implementation Report

**Date:** September 7, 2026  
**Feature:** API Foundation — Authentication + Rate Limiting  
**Status:** ✅ COMPLETE

---

## 1. Today's Objective

The objective for today was to complete and stabilize the backend API foundation for authentication and reusable rate limiting.

The scope was intentionally limited to the API foundation.

### In scope

- Authentication API foundation
- Signup
- Login
- Refresh-token rotation
- Logout
- Current-user (`/me`)
- Refresh-token sessions
- Configurable authentication token lifetimes
- Generic reusable rate-limiting infrastructure
- IP-based rate limiting
- IP + email rate-limiting strategy for future use
- Server-side in-memory rate-limit storage
- Expired rate-limit record cleanup
- Environment configuration
- Tests and build verification

### Explicitly out of scope

- Dashboard
- Frontend authentication UI
- Roles
- RBAC
- Permissions
- Organizations/organization management
- CMS
- Website renderer
- Uploads
- Themes
- Leads
- Redis
- Deployment architecture

---

## 2. Authentication Foundation Completed

The existing authentication flow was preserved and cleaned up.

### Authentication endpoints

The API continues to provide:

- `POST /signup`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `GET /me`

### Signup

Signup:

1. Validates the request with Zod.
2. Normalizes the email.
3. Validates password strength.
4. Checks for an existing user.
5. Hashes the password.
6. Creates the user.
7. Creates a refresh session.
8. Generates an access token.
9. Sends the refresh token through an HttpOnly cookie.
10. Returns the safe user and access token.

### Login

Login:

1. Normalizes the email.
2. Finds the user.
3. Verifies the password.
4. Checks that the account is active.
5. Creates a refresh session.
6. Generates an access token.
7. Sends the refresh token through an HttpOnly cookie.
8. Returns the safe user and access token.

### Refresh

Refresh:

1. Reads the refresh token from the HttpOnly cookie.
2. Verifies the refresh-token purpose/signature.
3. Finds the corresponding refresh session using the hashed token.
4. Rejects missing, revoked, expired, or inactive-user sessions.
5. Generates a new refresh token and access token.
6. Atomically updates the existing refresh session row when the old
   token hash is still current (`updateMany` with `tokenHash` +
   `revokedAt IS NULL`).
7. Sends the rotated refresh token through the HttpOnly cookie.

This preserves refresh-token rotation and single-use semantics without
inserting a new database row on every refresh.


### Logout

Logout:

- Revokes the refresh session when present.
- Clears the refresh-token cookie.
- Returns `{ success: true }`.

### Current user

`GET /me` is handled through the auth controller and protected by the existing authentication middleware.

---

## 3. Authentication Service Boundary Cleanup

The authentication service previously received a `clientId` value even though rate limiting was responsible for client identification.

That coupling was removed.

### Before

```text
Controller
   ↓
clientId
   ↓
Auth Service
```

### Now

```text
Request
   ↓
Rate-limit Middleware
   ↓
Auth Controller
   ↓
Auth Service
```

The auth service no longer needs to know about rate-limit client identification.

This keeps responsibilities separated:

- Middleware → request protection/rate limiting
- Controller → HTTP handling
- Service → authentication/business logic

---

## 4. Token Lifetime Configuration

Hardcoded token lifetime constants were removed.

Authentication now uses environment configuration as the source of truth:

- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`

The refresh duration is consistently applied to:

1. Refresh JWT expiration
2. Database `RefreshSession.expiresAt`
3. Refresh-token cookie expiration

A shared duration parser was added.

### Supported duration units

- `ms`
- `s`
- `m`
- `h`
- `d`

Examples:

```text
30s → 30,000 ms
15m → 900,000 ms
12h → 43,200,000 ms
7d  → 604,800,000 ms
```

Invalid duration values are rejected instead of silently falling back to an incorrect hardcoded duration.

This establishes a single source of truth:

```text
REFRESH_TOKEN_EXPIRES_IN
        │
        ├── Refresh JWT
        ├── Refresh Session
        └── Refresh Cookie
```

---

## 5. Rate Limiting Architecture

The V1 rate-limiting system is now complete.

The architecture is:

```text
HTTP Request
      ↓
Rate-limit Middleware
      ↓
Key Strategy
   ┌──┴──────────────┐
   │                 │
   IP          IP + Email
   │                 │
   └────────┬────────┘
            ↓
      RateLimitStore
            ↓
   In-Memory Store
```

The store abstraction intentionally allows a future Redis implementation without rewriting the feature-level middleware.

---

## 6. Current Rate-Limit Policies

The approved V1 policies are:

| Endpoint | Strategy | Limit |
|---|---|---:|
| Signup | IP | 5 requests / 60 seconds |
| Login | IP | 5 requests / 60 seconds |

These policies are configurable through environment variables.

---

## 7. Reusable Rate-Limit Strategies

Two reusable strategies are available.

### IP-only

```text
rateLimitIP(...)
```

The bucket is based on the client IP.

### IP + Email

```text
rateLimitIPAndEmail(...)
```

The bucket is based on:

```text
client IP + normalized email
```

Email normalization includes trimming and lowercasing.

The IP + email strategy is available for future operations where it is more appropriate, such as account-specific authentication or other sensitive operations.

Signup and login remain IP-only. Refresh is intentionally not protected by a
fixed IP window: a normal browser reload must rotate its valid HttpOnly cookie
without an arbitrary logout threshold. Refresh-token signature validation,
database-backed session lookup, rotation, expiry, and inactive-user rejection
remain the protection for that endpoint.

---

## 8. Rate-Limit Store

V1 uses a server-side in-memory store.

Important behavior:

- State is held on the API server.
- Browser refresh does not reset the limit.
- Browser cache clearing does not reset the limit.
- Logout does not reset the rate limit.
- Closing the browser does not reset the rate limit.
- A server restart can reset the V1 in-memory state.

This is intentional for V1.

---

## 9. Fixed-Window Algorithm

The current rate limiter uses a fixed-window model.

For each key:

```text
First request
    ↓
Create window
    ↓
Count requests
    ↓
Max reached
    ↓
Reject with HTTP 429
    ↓
Window expires
    ↓
New window starts
```

The window and maximum request count are configurable.

---

## 10. Rate-Limit Memory Cleanup

A cleanup mechanism was added to prevent expired records from remaining in the in-memory map indefinitely.

Important implementation characteristics:

- Cleanup is owned by the store.
- A periodic cleanup mechanism is used.
- A new timer is not created for every request.
- Expired records are removed from the store.
- The cleanup timer uses `unref()` where available so it does not unnecessarily keep the Node process alive.

This addresses the memory-growth issue identified during review.

---

## 11. Client IP Handling

The local V1 implementation intentionally does not blindly trust forwarded proxy headers.

The resolution order is:

```text
req.ip
   ↓
socket.remoteAddress
   ↓
"unknown"
```

The implementation does not currently trust `x-forwarded-for`.

This is intentional because the current local API deployment does not have an explicitly configured trusted reverse-proxy architecture.

When deployment architecture is introduced later, proxy trust can be configured deliberately rather than assuming forwarded headers are trustworthy.

---

## 12. Environment Configuration

The repository-root `.env.example` was updated with the rate-limit configuration.

Added variables:

```env
SIGNUP_RATE_LIMIT_WINDOW_MS=60000
SIGNUP_RATE_LIMIT_MAX_REQUESTS=5

LOGIN_RATE_LIMIT_WINDOW_MS=60000
LOGIN_RATE_LIMIT_MAX_REQUESTS=5
```

The existing authentication configuration remains environment-driven.

The former refresh IP policy was removed after runtime verification showed
that it logged out valid users after ten browser reloads in one minute.

No second `.env.example` was created inside `apps/api`.

---

## 13. Error Handling

Rate-limit failures use the existing centralized application error mechanism.

Exceeded requests return:

```json
{
  "error": {
    "message": "Too many requests. Please try again later."
  }
}
```

with HTTP status:

```text
429 Too Many Requests
```

Existing authentication response/error contracts were preserved.

---

## 14. Testing Completed

The API test suite was run across the API source test files.

Final result:

```text
16 tests passing
0 tests failing
```

Tests cover authentication validation/token behavior and the rate-limit foundation, including:

- email normalization
- signup validation
- password strength
- JWT purpose
- fixed-window maximum requests
- fixed-window expiry
- IP isolation
- IP + email isolation
- IP extraction
- socket fallback
- forwarded-header rejection
- expired-record cleanup
- HTTP 429 behavior
- reusable middleware factory
- duration/configuration behavior

---

## 15. Build Verification

The API TypeScript build was run successfully using the API package build command.

Result:

```text
Build succeeded
```

There is no separate API typecheck script.

The TypeScript compile step is therefore verified through the API build.

There is also no API-specific lint script currently available.

---

## 16. Final Architecture Decision

The following decisions are now considered complete and should not be unnecessarily revisited during the next feature.

### Authentication

- Access token → application/auth state
- Refresh token → HttpOnly cookie
- Refresh sessions → PostgreSQL
- Refresh-token rotation → enabled
- Token lifetimes → environment-driven

### Rate limiting

- Server-side
- In-memory for V1
- Fixed-window
- Configurable
- IP strategy
- IP + email strategy available
- Store abstraction ready for future Redis
- Periodic cleanup
- No browser-side rate-limit state

### Future Redis migration

When Redis is introduced, the intended change is to provide a Redis-backed `RateLimitStore`.

The feature-level middleware and route policies should remain unchanged.

Conceptually:

```text
Current:

RateLimit Middleware
        ↓
InMemoryRateLimitStore


Future:

RateLimit Middleware
        ↓
RedisRateLimitStore
```

---

# 17. Final Status

## ✅ API Authentication + Rate Limiting Foundation — COMPLETE

Today's implementation is considered complete.

No further refactoring is required for this feature.

The next development session should begin with the next agreed feature rather than continuing to modify the completed authentication/rate-limiting foundation.

---

## 18. Files Changed Today

The final corrective work touched:

```text
.env.example

apps/api/src/
├── duration.ts
├── config/
│   └── env.ts
├── middleware/
│   └── rate-limiter.ts
└── modules/
    └── auth/
        ├── auth.controller.ts
        ├── auth.service.ts
        └── auth.test.ts
```

Only files required for the approved authentication/rate-limit foundation work were changed.
