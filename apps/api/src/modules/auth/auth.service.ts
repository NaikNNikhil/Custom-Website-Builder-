import { randomUUID } from "node:crypto";
import { database } from "../../config/database";
import { env } from "../../config/env";
import { AppError } from "../../middleware/error.middleware";
import { parseDurationToMs } from "../../utils/duration";
import { hashPassword, isStrongPassword, verifyPassword } from "./auth.password";
import { hashToken, signAuthToken, verifyAuthToken } from "./auth.token";
import type { SafeUser } from "./auth.types";
import { normalizeEmail } from "./auth.validation";
import { normalizeRoleName } from "../roles/role.utils";

async function recordLoginLog(userId: string | null, status: "SUCCESS" | "FAILED", ipAddress?: string) {
  await database.loginLog.create({
    data: {
      userId,
      status,
      ipAddress: ipAddress ?? "unknown",
    },
  });
}

function toSafeUser(user: { id: string; email: string; status: "ACTIVE" | "INACTIVE"; role: { name: string; permissions: { permission: { code: string } }[] } }): SafeUser {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    role: normalizeRoleName(user.role.name),
    permissions: user.role.permissions.map(({ permission }) => permission.code),
  };
}

function createRefreshToken(userId: string, email: string) {
  return signAuthToken(
    {
      sub: userId,
      email,
      jti: randomUUID(),
    },
    "refresh",
    env.refreshTokenExpiresIn,
  );
}

async function createRefreshSession(userId: string, token: string) {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.refreshTokenExpiresIn));

  return database.refreshSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });
}

export const authService = {
  signup: async (email: string, password: string, ipAddress?: string) => {
    const normalizedEmail = normalizeEmail(email);

    if (!isStrongPassword(password)) {
      throw new AppError(400, "Password must meet the required complexity rules");
    }

    const existingUser = await database.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new AppError(409, "User already exists");
    }

    const role = await database.role.findUnique({ where: { name: "customer" } });
    if (!role) {
      throw new AppError(500, "Customer role not available");
    }

    const passwordHash = await hashPassword(password);
    const user = await database.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        status: "ACTIVE",
        roleId: role.id,
      },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const refreshToken = createRefreshToken(user.id, user.email);
    await createRefreshSession(user.id, refreshToken);

    const accessToken = signAuthToken(
      {
        sub: user.id,
        email: user.email,
        jti: randomUUID(),
      },
      "access",
      env.accessTokenExpiresIn,
    );

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken,
    };
  },

  login: async (email: string, password: string, ipAddress?: string) => {
    const normalizedEmail = normalizeEmail(email);
    const user = await database.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user) {
      await recordLoginLog(null, "FAILED", ipAddress);
      throw new AppError(401, "Invalid email or password");
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      await recordLoginLog(user.id, "FAILED", ipAddress);
      throw new AppError(401, "Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      await recordLoginLog(user.id, "FAILED", ipAddress);
      throw new AppError(401, "Account is inactive");
    }

    await recordLoginLog(user.id, "SUCCESS", ipAddress);

    const refreshToken = createRefreshToken(user.id, user.email);
    await createRefreshSession(user.id, refreshToken);

    const accessToken = signAuthToken(
      {
        sub: user.id,
        email: user.email,
        jti: randomUUID(),
      },
      "access",
      env.accessTokenExpiresIn,
    );

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken,
    };
  },

  refreshSession: async (refreshToken: string) => {
    verifyAuthToken(refreshToken, "refresh");
    const tokenHash = hashToken(refreshToken);

    const session = await database.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError(401, "Authentication required");
    }

    if (session.user.status !== "ACTIVE") {
      throw new AppError(401, "Account is inactive");
    }

    const nextRefreshToken = createRefreshToken(session.user.id, session.user.email);
    const nextAccessToken = signAuthToken(
      {
        sub: session.user.id,
        email: session.user.email,
        jti: randomUUID(),
      },
      "access",
      env.accessTokenExpiresIn,
    );
    const nextTokenHash = hashToken(nextRefreshToken);
    const nextExpiresAt = new Date(Date.now() + parseDurationToMs(env.refreshTokenExpiresIn));

    // Conditional update keeps one row per logical login and enforces single-use
    // rotation under concurrent refresh (only one request can claim the old hash).
    const rotated = await database.refreshSession.updateMany({
      where: {
        id: session.id,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        tokenHash: nextTokenHash,
        expiresAt: nextExpiresAt,
      },
    });

    if (rotated.count !== 1) {
      throw new AppError(401, "Authentication required");
    }

    return {
      user: toSafeUser(session.user),
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    };
  },

  logout: async (refreshToken: string) => {
    const tokenHash = hashToken(refreshToken);
    const session = await database.refreshSession.findUnique({
      where: { tokenHash },
    });

    if (!session) {
      return;
    }

    await database.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
  },
};
