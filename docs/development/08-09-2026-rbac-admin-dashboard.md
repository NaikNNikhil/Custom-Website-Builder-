# RBAC and Admin Dashboard

## Scope

The application has database-backed roles, user status enforcement, login logs, and an admin dashboard for role and user administration.

## Authorization foundation

`Role` remains the user's single role source. Authorization is permission-based: the seed `admin` role receives the database permission `admin:access`. There is no permission management UI in this release.

This means renaming a role does not silently change its authorization capability. Admin API routes require `admin:access`; the frontend uses the same capability only for routing and navigation, never as the security boundary.

Authentication and authorization are separated:

- Authentication (`requireAuth`) lives in `apps/api/src/modules/auth/` and answers "who is this user?"
- Authorization (`requirePermission`) lives in `apps/api/src/middleware/authorization.middleware.ts` and answers "can this authenticated user perform this operation?"

Route flow:

```text
requireAuth → req.user → requirePermission(...) → controller
```

## Refresh sessions

Each login/signup creates one `RefreshSession` row for that browser/device session.

Refresh-token rotation updates that existing row:

```text
login → INSERT RefreshSession (hash of Token A)
refresh → UPDATE same row (hash of Token B, new expiresAt)
refresh → UPDATE same row (hash of Token C, new expiresAt)
```

Repeated refreshes of the same logical session do not create additional rows. Independent logins (laptop vs phone) still create independent sessions.

Rotation remains single-use: after Token A rotates to Token B, Token A no longer matches `tokenHash` and refresh with Token A fails. Concurrent refreshes using the same current token compete on a conditional `updateMany`; only one request can claim the old hash.

Frontend bootstrap (A1): same-document `refreshLockRef`, cross-document `BroadcastChannel("auth-bootstrap")` coordination signals only (no tokens), and one bounded refresh retry before clearing local auth. Persistent failure clears memory only; it does not call logout/revoke. Backend single-use rotation is unchanged. BroadcastChannel is not required for auth correctness.

Logout sets `revokedAt` on the current session. Inactive users are rejected on refresh without rotating the session.

Refresh is intentionally not protected by a fixed per-IP rate limit; signup and login remain IP rate limited.


## Authentication behavior

- Access tokens remain in React memory; refresh tokens remain HttpOnly cookies.
- Login, refresh, and `/auth/me` return the user role and granted permissions from the database.
- Every protected request reloads the user and rejects `INACTIVE` accounts.
- Refresh rejects inactive accounts before rotating the refresh session.
- Public signup always assigns the database `customer` role and accepts no client role input.

## Admin capabilities

- Persistent sidebar: `Masters → Roles`, and `Users`.
- Roles can be listed, created, renamed, and deleted only when unassigned.
- Users list email, role, status, creation time, and last successful login.
- User details support role changes, activation/deactivation, and safe login-log viewing.
- Password hashes, refresh tokens, and access tokens are not returned by management endpoints.

## Safety rules

- Login attempts are recorded as `SUCCESS` or `FAILED` with server-derived IP data.
- The final active user whose role grants `admin:access` cannot be deactivated or moved to a role without that permission.
- Database migration `20260908113000_add_admin_permission_and_inactive_status` changes the persisted status contract from `DISABLED` to `INACTIVE` without deleting users.

## Seed

The seed is idempotent. It ensures the `admin` and `customer` roles, the `admin:access` permission assignment, and the environment-configured seed administrator.
