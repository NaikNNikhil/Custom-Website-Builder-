# Custom Website Builder --- Authentication V1 Development Record

**Development Date:** 06-09-2026\
**Feature:** Authentication V1\
**Status:** Core Authentication Complete --- Rate Limiting Pending

## 1. Objective

Implement Authentication V1 end-to-end for the Custom Website Builder
with secure signup, login, logout, JWT access/refresh tokens,
refresh-token rotation, protected dashboard access, validation, secure
cookies, and frontend authentication state.

## 2. Scope

### Included

-   Signup
-   Login
-   Logout
-   Refresh
-   bcrypt password hashing
-   JWT access and refresh tokens
-   Refresh-token rotation
-   Database-backed refresh sessions
-   Refresh-token hashing
-   ACTIVE / DISABLED users
-   Email normalization
-   Request validation
-   Authentication middleware
-   Secure HttpOnly refresh cookie
-   In-memory access-token handling
-   Protected dashboard
-   Authentication-aware root route
-   Centralized API error handling
-   Authentication frontend UX
-   Environment configuration
-   Build/lint/runtime verification

### Out of Scope

-   OTP
-   Email verification
-   Forgot/reset password
-   Social login
-   2FA
-   Organization creation
-   RBAC
-   User management
-   Website builder
-   CMS
-   Themes
-   Media
-   Products/services
-   Leads
-   Billing

## 3. Architecture Decisions

### Token strategy

Access token: - HS256 - 15-minute lifetime - Stored only in frontend
memory - Sent as `Authorization: Bearer <token>`

Refresh token: - Separate JWT secret - 7-day lifetime - HttpOnly
cookie - Never stored in localStorage/sessionStorage - Raw token never
stored in PostgreSQL - Refresh session stores token hash/secure
identifier - Rotation is required

### JWT `jti`

The refresh JWT uses `jti` as the unique identifier for the individual
refresh session/token. The implementation was corrected so `jti` is
defined only once and is not simultaneously supplied through the
`jsonwebtoken` `jwtid` option.

### Passwords

Passwords use bcrypt.

Signup password requirements: - Minimum 8 characters - 1 uppercase
letter - 1 lowercase letter - 1 number

Login does not apply signup password-strength rules.

### Email

Emails are normalized with `trim()` and `toLowerCase()` before
lookup/storage.

### Login errors

Invalid credentials use the generic message:

`Invalid email or password`

This avoids unnecessary account enumeration.

## 4. Database

PostgreSQL database:

`CustomWebsiteBuilder`

Authentication models: - `User` - `RefreshSession`

Authentication migration:

`20260906145150_init_auth`

The migration was successfully created and applied. During the final
frontend cleanup, the schema and migration were not changed.

Refresh tokens are not stored in raw form.

## 5. Environment Configuration

The root `.env` remains the single source of truth.

Prisma was configured to explicitly load the root `.env`.

The API environment loader was also corrected to reliably load the root
`.env`.

Manual commands such as `export DATABASE_URL=...` are no longer
required.

No duplicate application `.env` files were created.

## 6. Backend Implementation

Authentication follows:

`Route → Validation/Middleware → Controller → Auth Service → Prisma → PostgreSQL`

Implemented endpoints:

-   `POST /api/auth/signup`
-   `POST /api/auth/login`
-   `POST /api/auth/refresh`
-   `POST /api/auth/logout`

A protected authenticated-user endpoint is used for frontend
authentication verification.

### Signup

Validates input, normalizes email, checks duplicates, hashes the
password, creates an ACTIVE user, creates a refresh session, issues
tokens, stores only the refresh-token hash, sets the HttpOnly cookie,
and returns safe user data plus the access token.

Successful signup immediately authenticates the user and navigates to
`/dashboard`.

### Login

Normalizes email, verifies bcrypt password, checks account status,
creates a refresh session, issues tokens, stores only the refresh-token
hash, sets the HttpOnly cookie, and returns safe user data plus the
access token.

### Refresh

Validates the refresh token, token purpose, expiration, session
identifier, database session, revocation state, and token hash.
Successful refresh issues a new refresh token and atomically updates
the existing `RefreshSession` row (`tokenHash` + `expiresAt`) instead of
inserting a new session row. The previous token hash no longer matches,
so replay of the old token is rejected.


### Logout

Revokes the current refresh session when identifiable, clears the
refresh cookie, and clears frontend in-memory authentication state.

## 7. Frontend Implementation

Implemented: - `/login` - `/signup` - `/dashboard` - Authentication
provider/state - API client - Refresh-on-startup - In-memory
access-token handling - Protected dashboard behavior - Logout -
Authentication-aware `/`

The default Next.js starter landing page was removed.

Root behavior: - Unauthenticated → `/login` - Authenticated →
`/dashboard`

### Login UX

Login validates only: - email required/valid - password required

It does not apply signup password-strength rules.

Wrong credentials display:

`Invalid email or password`

Raw backend JSON is not displayed.

### Signup UX

Signup displays: - email - password - confirm password - password
requirements - validation - loading state

## 8. Token Storage

The final token architecture is:

-   Refresh token: HttpOnly cookie
-   Access token: in-memory authentication state
-   localStorage: NOT USED
-   sessionStorage: NOT USED
-   JavaScript-readable refresh token: NOT USED

The access token is attached to protected requests through the
Authorization bearer header.

## 9. Refresh Persistence

Verified flow:

`Login → Dashboard → Browser refresh → /api/auth/refresh → new access token → Dashboard`

Refresh rotation updates the existing `RefreshSession` row. Repeated
browser refreshes of the same login must not grow session row counts.

Backend rotation uses a conditional `updateMany` on the current
`tokenHash`, so only one concurrent refresh of the same token can
succeed. That single-use behavior is intentional.

Frontend `AuthProvider` bootstrap (A1):

- Access token: React memory only (never localStorage/sessionStorage).
- Refresh token: HttpOnly cookie only.
- Same document: `refreshLockRef` blocks duplicate `refresh()` calls.
- Across documents: native `BroadcastChannel("auth-bootstrap")` signals
  `REFRESH_STARTED` / `REFRESH_SUCCEEDED` / `REFRESH_FAILED` only — never
  tokens, cookies, or user secrets. Coordination only; not a security
  boundary. If `BroadcastChannel` is missing, refresh + retry still work.
- When another document announces `REFRESH_STARTED`, this document waits a
  short bounded time (then continues even if the peer vanishes).
- First `POST /api/auth/refresh` succeeds → set in-memory auth → broadcast
  `REFRESH_SUCCEEDED`.
- First attempt fails → wait ~100ms → **one** retry with
  `credentials: "include"`.
- Retry succeeds → authenticate → `REFRESH_SUCCEEDED`.
- Retry fails → `REFRESH_FAILED` → clear local AuthProvider state only
  (no `logout()` / session revoke on this path).

Backend single-use `updateMany` rotation is unchanged. Extreme multi-tab
overlap can still produce an occasional 401; retry + channel wait recover
the common rapid-reload case.

## 10. Security

Implemented security measures include: - bcrypt - password policy -
normalized email - generic invalid-credential message - short-lived
access tokens - separate access/refresh secrets - token purpose
separation - refresh rotation - refresh-session persistence -
refresh-token hashing - HttpOnly refresh cookie - Helmet - credentialed
CORS - authentication middleware - centralized error handling - no
plaintext passwords - no persistent browser token storage - no JWT
secrets in frontend - no sensitive authentication values in logs

## 11. Rate Limiting

Rate limiting is the remaining Authentication V1 security task.

The intended design does not store every request/IP in PostgreSQL. The
limiter should remain behind an abstraction so V1 can use in-memory
state while allowing future Redis/distributed storage.

During testing, a normal browser window could become rate limited while
an Incognito window could still log in. This indicates that the current
limiter needs further investigation and verification across browser
contexts.

Status:

**Rate limiting finalization: PENDING**

## 12. UX Issues Found and Fixed

-   Login incorrectly showed signup password requirements → fixed.
-   Raw server JSON appeared in the UI → fixed.
-   Login field-level errors were hidden by stale server errors → fixed.
-   Native browser validation prevented the specified custom email
    message → fixed.
-   Default Next.js starter landing page → removed.
-   Auth-provider refresh race → fixed.
-   Root redirect behavior → implemented.

## 13. Verification

### Database

-   Prisma generate: PASS
-   Prisma migrate: PASS
-   Prisma seed: PASS
-   Prisma Studio: PASS

### Backend

-   API build: PASS
-   API startup: PASS
-   `/health`: PASS

### Frontend

-   Frontend build: PASS
-   `/login`: PASS
-   `/signup`: PASS
-   `/dashboard`: PASS
-   `/`: PASS

### Project

-   Lint: PASS
-   `build:api`: PASS
-   `build:frontend`: PASS
-   `build`: PASS

## 14. Runtime Authentication Verification

-   Signup → Dashboard: PASS
-   Login → Dashboard: PASS
-   Wrong password → generic message: PASS
-   Wrong email → generic message: PASS
-   Browser refresh → remains authenticated: PASS
-   Refresh-token rotation: PASS
-   Logout → Login: PASS
-   Protected `/me` request: PASS
-   Bearer access-token header: PASS
-   localStorage unused: PASS
-   sessionStorage unused: PASS

## 15. Known Limitation

Rate limiting is not yet finalized. Incognito testing showed different
behavior between browser contexts and requires a dedicated follow-up
implementation/audit.

## 16. Final State

### Complete

-   Authentication database foundation
-   Environment configuration
-   Signup
-   Login
-   JWT access token
-   JWT refresh token
-   Refresh rotation
-   Logout
-   Protected API
-   Frontend auth state
-   Secure token storage
-   Dashboard protection
-   Authentication UX
-   Build/lint/runtime verification

### Remaining

-   Rate limiting finalization and cross-browser-context verification

## 17. Final Status

**AUTHENTICATION CORE COMPLETE --- RATE LIMITING REMAINS**
