import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { database } from "../src/config/database";
import { AppError } from "../src/middleware/error.middleware";
import { authService } from "../src/modules/auth/auth.service";
import { hashToken } from "../src/modules/auth/auth.token";

test.after(async () => {
  await database.$disconnect();
});

test.before(async () => {
  const adminRole = await database.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin" },
  });

  await database.role.upsert({
    where: { name: "customer" },
    update: {},
    create: { name: "customer" },
  });

  const adminAccessPermission = await database.permission.upsert({
    where: { code: "admin:access" },
    update: {},
    create: { code: "admin:access" },
  });

  await database.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: adminAccessPermission.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: adminAccessPermission.id,
    },
  });
});

async function cleanupUserByEmail(email: string) {
  const user = await database.user.findUnique({ where: { email } });
  if (!user) {
    return;
  }

  await database.refreshSession.deleteMany({ where: { userId: user.id } });
  await database.loginLog.deleteMany({ where: { userId: user.id } });
  await database.user.delete({ where: { id: user.id } });
}

async function countSessions(userId: string) {
  return database.refreshSession.count({ where: { userId } });
}

async function getActiveSession(userId: string) {
  return database.refreshSession.findFirst({
    where: { userId, revokedAt: null },
    orderBy: { updatedAt: "desc" },
  });
}

test("refresh rotates token hash in place without growing session rows", async () => {
  const email = `refresh-bound-${randomUUID()}@example.com`;
  const password = "Password123";

  try {
    const signup = await authService.signup(email, password);
    const userId = signup.user.id;
    assert.equal(await countSessions(userId), 1);

    let currentRefreshToken = signup.refreshToken;
    const previousHashes: string[] = [hashToken(currentRefreshToken)];

    for (let index = 0; index < 20; index += 1) {
      const refreshed = await authService.refreshSession(currentRefreshToken);
      const nextHash = hashToken(refreshed.refreshToken);

      assert.notEqual(refreshed.refreshToken, currentRefreshToken);
      assert.equal(await countSessions(userId), 1);
      assert.ok(!previousHashes.includes(nextHash));

      previousHashes.push(nextHash);
      currentRefreshToken = refreshed.refreshToken;
    }

    const active = await getActiveSession(userId);
    assert.ok(active);
    assert.equal(active.revokedAt, null);
    assert.equal(active.tokenHash, hashToken(currentRefreshToken));
  } finally {
    await cleanupUserByEmail(email);
  }
});

test("old refresh token is rejected after rotation", async () => {
  const email = `refresh-replay-${randomUUID()}@example.com`;
  const password = "Password123";

  try {
    const signup = await authService.signup(email, password);
    const firstToken = signup.refreshToken;
    const rotated = await authService.refreshSession(firstToken);

    assert.notEqual(rotated.refreshToken, firstToken);
    assert.equal(await countSessions(signup.user.id), 1);

    await assert.rejects(
      () => authService.refreshSession(firstToken),
      (error: unknown) => error instanceof AppError && error.statusCode === 401,
    );
  } finally {
    await cleanupUserByEmail(email);
  }
});

test("independent logins still create independent refresh sessions", async () => {
  const email = `refresh-multi-${randomUUID()}@example.com`;
  const password = "Password123";

  try {
    const first = await authService.signup(email, password);
    const second = await authService.login(email, password);

    assert.equal(await countSessions(first.user.id), 2);
    assert.notEqual(hashToken(first.refreshToken), hashToken(second.refreshToken));

    const afterFirstRefresh = await authService.refreshSession(first.refreshToken);
    assert.equal(await countSessions(first.user.id), 2);
    assert.notEqual(afterFirstRefresh.refreshToken, first.refreshToken);

    await authService.refreshSession(second.refreshToken);
    assert.equal(await countSessions(first.user.id), 2);
  } finally {
    await cleanupUserByEmail(email);
  }
});

test("concurrent refresh of the same token allows only one successful rotation", async () => {
  const email = `refresh-race-${randomUUID()}@example.com`;
  const password = "Password123";

  try {
    const signup = await authService.signup(email, password);
    const token = signup.refreshToken;

    const results = await Promise.allSettled([
      authService.refreshSession(token),
      authService.refreshSession(token),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(await countSessions(signup.user.id), 1);

    const rejectedError = (rejected[0] as PromiseRejectedResult).reason;
    assert.ok(rejectedError instanceof AppError);
    assert.equal(rejectedError.statusCode, 401);
  } finally {
    await cleanupUserByEmail(email);
  }
});

test("refresh preserves role and permissions from the database", async () => {
  const email = `refresh-role-${randomUUID()}@example.com`;
  const password = "Password123";

  try {
    const signup = await authService.signup(email, password);
    assert.equal(signup.user.role, "customer");

    const refreshed = await authService.refreshSession(signup.refreshToken);
    assert.equal(refreshed.user.role, "customer");
    assert.deepEqual(refreshed.user.permissions, signup.user.permissions);

    const adminRole = await database.role.findUnique({
      where: { name: "admin" },
      include: { permissions: { include: { permission: true } } },
    });
    assert.ok(adminRole);

    await database.user.update({
      where: { id: signup.user.id },
      data: { roleId: adminRole.id },
    });

    const asAdmin = await authService.refreshSession(refreshed.refreshToken);
    assert.equal(asAdmin.user.role, "admin");
    assert.ok(asAdmin.user.permissions.includes("admin:access"));

    const again = await authService.refreshSession(asAdmin.refreshToken);
    assert.equal(again.user.role, "admin");
    assert.ok(again.user.permissions.includes("admin:access"));
  } finally {
    await cleanupUserByEmail(email);
  }
});

test("logout revokes the current session so refresh fails", async () => {
  const email = `refresh-logout-${randomUUID()}@example.com`;
  const password = "Password123";

  try {
    const signup = await authService.signup(email, password);
    await authService.logout(signup.refreshToken);

    const session = await getActiveSession(signup.user.id);
    assert.equal(session, null);

    const revoked = await database.refreshSession.findFirst({
      where: { userId: signup.user.id },
    });
    assert.ok(revoked?.revokedAt);

    await assert.rejects(
      () => authService.refreshSession(signup.refreshToken),
      (error: unknown) => error instanceof AppError && error.statusCode === 401,
    );
  } finally {
    await cleanupUserByEmail(email);
  }
});

test("inactive users cannot refresh", async () => {
  const email = `refresh-inactive-${randomUUID()}@example.com`;
  const password = "Password123";

  try {
    const signup = await authService.signup(email, password);

    await database.user.update({
      where: { id: signup.user.id },
      data: { status: "INACTIVE" },
    });

    await assert.rejects(
      () => authService.refreshSession(signup.refreshToken),
      (error: unknown) => error instanceof AppError && error.statusCode === 401,
    );

    assert.equal(await countSessions(signup.user.id), 1);
    const session = await getActiveSession(signup.user.id);
    assert.ok(session);
    assert.equal(session.tokenHash, hashToken(signup.refreshToken));
  } finally {
    await cleanupUserByEmail(email);
  }
});
