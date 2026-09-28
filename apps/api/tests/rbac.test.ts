import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { normalizeRoleName, getRoleAccessLevel } from "../src/modules/roles/role.utils";

test("role names are normalized consistently", () => {
  assert.equal(normalizeRoleName(" Admin "), "admin");
  assert.equal(normalizeRoleName("CUSTOMER"), "customer");
});

test("admin roles are treated as privileged", () => {
  assert.equal(getRoleAccessLevel("admin"), "privileged");
  assert.equal(getRoleAccessLevel("customer"), "standard");
});

test("requirePermission lives in generic middleware, not the auth module", () => {
  const authorizationMiddleware = readFileSync(
    path.resolve(__dirname, "../src/middleware/authorization.middleware.ts"),
    "utf8",
  );
  const roleRoutes = readFileSync(path.resolve(__dirname, "../src/modules/roles/role.routes.ts"), "utf8");
  const userRoutes = readFileSync(path.resolve(__dirname, "../src/modules/users/user.routes.ts"), "utf8");

  assert.match(authorizationMiddleware, /export function requirePermission/);
  assert.match(roleRoutes, /from "\.\.\/\.\.\/middleware\/authorization\.middleware"/);
  assert.match(userRoutes, /from "\.\.\/\.\.\/middleware\/authorization\.middleware"/);
  assert.doesNotMatch(roleRoutes, /auth\.role\.middleware/);
  assert.doesNotMatch(userRoutes, /auth\.role\.middleware/);
});
