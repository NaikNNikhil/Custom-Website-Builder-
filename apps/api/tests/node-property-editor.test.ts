import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  getCapabilityFields,
  getNodeType,
  setValueAtPath,
  validateNodeAgainstRegistry,
} from "@custom-website-builder/node-registry";

test("phase 4 property editor is capability-driven", () => {
  const editor = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/builder/NodePropertyEditor.tsx"),
    "utf8",
  );
  assert.match(editor, /getCapabilityFields/);
  assert.match(editor, /PropertyControl/);
  assert.doesNotMatch(editor, /if \(node\.type === "heading"\)/);
});

test("heading property update stays registry-valid", () => {
  const heading = getNodeType("heading");
  assert.ok(heading);
  const fields = getCapabilityFields(heading!);
  assert.ok(fields.typography.length > 0);

  const data = setValueAtPath(
    { text: "Hello", level: 2, styles: {} },
    "styles.fontSize",
    "2rem",
  );
  const result = validateNodeAgainstRegistry({ type: "heading", data });
  assert.equal(result.ok, true);
});

test("unsupported property category fields are empty for spacer content", () => {
  const spacer = getNodeType("spacer");
  assert.ok(spacer);
  const fields = getCapabilityFields(spacer!);
  assert.equal(fields.content.length, 0);
  assert.ok(fields.layout.some((field) => field.id === "size"));
});
