import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  canAcceptChild,
  listNodeTypes,
  resolveHtmlTag,
  safeParseNodeData,
  validateNodeAgainstRegistry,
} from "@custom-website-builder/node-registry";
import { listRegistryNodeTypes } from "../src/modules/nodes/node-registry.service";

test("phase 2 registry exposes V1 types without framework details", () => {
  const types = listRegistryNodeTypes();
  assert.ok(types.some((item) => item.id === "container"));
  assert.ok(types.every((item) => !JSON.stringify(item).includes("React")));
  assert.equal(listNodeTypes().length, 7);
});

test("phase 2 rejects unsupported persisted node types", () => {
  const result = validateNodeAgainstRegistry({ type: "testimonial", data: {} });
  assert.equal(result.ok, false);
  assert.equal(result.issues[0]?.code, "unsupported_type");
});

test("phase 2 validates nested container children", () => {
  assert.equal(canAcceptChild("container", "text"), true);
  assert.equal(canAcceptChild("spacer", "text"), false);
});

test("phase 2 safe parse supports renderer fallback path", () => {
  const bad = safeParseNodeData("nope", {});
  assert.equal(bad.ok, false);

  const good = safeParseNodeData("heading", { text: "Hello", level: 3 });
  assert.equal(good.ok, true);
  if (good.ok) {
    assert.equal(resolveHtmlTag("heading", good.data), "h3");
  }
});

test("registry route is mounted", () => {
  const routes = readFileSync(path.resolve(__dirname, "../src/routes/index.ts"), "utf8");
  assert.match(routes, /\/registry/);
  assert.match(routes, /registryRoutes/);
});
