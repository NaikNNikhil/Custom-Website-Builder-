import test from "node:test";
import assert from "node:assert/strict";

import {
  canAcceptChild,
  DEFAULT_WEBSITE_THEME,
  getCapabilityFields,
  getNodeType,
  isRegisteredNodeType,
  listNodeTypes,
  resolveEffectiveStyles,
  resolveHtmlTag,
  safeParseNodeData,
  setValueAtPath,
  validateNodeAgainstRegistry,
} from "./index";

test("registry lists V1 node types", () => {
  const ids = listNodeTypes().map((item) => item.id).sort();
  assert.deepEqual(ids, ["button", "container", "heading", "image", "link", "spacer", "text"]);
});

test("unsupported type fails validation", () => {
  const result = validateNodeAgainstRegistry({ type: "product-card", data: {} });
  assert.equal(result.ok, false);
  assert.equal(result.issues[0]?.code, "unsupported_type");
});

test("container accepts nested registered children", () => {
  assert.equal(canAcceptChild("container", "heading"), true);
  assert.equal(canAcceptChild("heading", "text"), false);
});

test("heading data normalizes and maps to semantic tags", () => {
  const parsed = safeParseNodeData("heading", { text: "Hello", level: 1 });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(resolveHtmlTag("heading", parsed.data), "h1");
  }
});

test("leaf nodes reject children via parent policy", () => {
  const result = validateNodeAgainstRegistry({
    type: "text",
    data: { text: "Hi" },
    parentType: "heading",
  });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === "children_not_allowed" || issue.code === "invalid_child"));
});

test("getNodeType returns definition metadata without React details", () => {
  const heading = getNodeType("heading");
  assert.ok(heading);
  assert.equal(heading?.id, "heading");
  assert.equal(heading?.html.defaultTag, "h2");
  assert.equal(isRegisteredNodeType("heading"), true);
  assert.equal(isRegisteredNodeType("Product"), false);
});

test("capability fields resolve from property catalog", () => {
  const heading = getNodeType("heading");
  assert.ok(heading);
  const fields = getCapabilityFields(heading!);
  assert.ok(fields.content.some((field) => field.id === "text"));
  assert.ok(fields.typography.some((field) => field.path === "styles.fontSize"));
  assert.equal(fields.content.every((field) => field.category === "content"), true);
});

test("setValueAtPath keeps style overrides sparse", () => {
  const next = setValueAtPath({ text: "Hi" }, "styles.color", "#111111");
  assert.equal((next.styles as { color: string }).color, "#111111");
  const cleared = setValueAtPath(next, "styles.color", "");
  assert.equal(cleared.styles, undefined);
});

test("legacy align migrates into styles.textAlign", () => {
  const parsed = safeParseNodeData("heading", { text: "Hello", level: 2, align: "center" });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    const data = parsed.data as { styles?: { textAlign?: string } };
    assert.equal(data.styles?.textAlign, "center");
  }
});

test("resolveEffectiveStyles prefers node override over theme", () => {
  const effective = resolveEffectiveStyles({
    nodeType: "heading",
    theme: DEFAULT_WEBSITE_THEME,
    nodeStyles: { color: "#abcdef" },
  });
  assert.equal(effective.color, "#abcdef");
  assert.equal(effective.fontFamily, DEFAULT_WEBSITE_THEME.typography.headingFont);
});

test("resolveEffectiveStyles inserts library between theme and node", () => {
  const effective = resolveEffectiveStyles({
    nodeType: "button",
    theme: DEFAULT_WEBSITE_THEME,
    libraryStyles: { background: "#0000ff", fontSize: "16px" },
    nodeStyles: { fontSize: "20px" },
  });
  assert.equal(effective.background, "#0000ff");
  assert.equal(effective.fontSize, "20px");
  assert.equal(effective.borderRadius, DEFAULT_WEBSITE_THEME.general.borderRadius);
});
