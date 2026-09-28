import test from "node:test";
import assert from "node:assert/strict";
import {
  collectLibraryItemRefs,
  findLibraryNodeByKey,
  mergeNodeData,
  resolveLibraryDataForNode,
  resolveLibraryDefinitionData,
  wouldCreateLibraryCycle,
  type LibraryNodeDefinition,
} from "./library";

const buttonDef = (key: string, color: string): LibraryNodeDefinition => ({
  key,
  type: "button",
  name: "Primary Button",
  data: { label: "Buy", styles: { background: color } },
  children: [],
});

test("mergeNodeData keeps sparse style overrides", () => {
  const merged = mergeNodeData(
    { label: "A", styles: { fontSize: "16px", color: "blue" } },
    { styles: { fontSize: "20px" } },
  );
  assert.equal(merged.label, "A");
  assert.deepEqual(merged.styles, { fontSize: "20px", color: "blue" });
});

test("findLibraryNodeByKey walks composite trees", () => {
  const root: LibraryNodeDefinition = {
    key: "root",
    type: "container",
    data: {},
    children: [
      { key: "heading", type: "heading", data: { text: "Hi" }, children: [] },
      buttonDef("btn", "blue"),
    ],
  };
  assert.equal(findLibraryNodeByKey(root, "btn")?.type, "button");
});

test("wouldCreateLibraryCycle detects deep cycles", () => {
  const a: LibraryNodeDefinition = {
    key: "a",
    type: "container",
    data: {},
    children: [{ key: "ref", type: "button", data: {}, children: [], libraryItemId: "b" }],
  };
  const refs: Record<string, string[]> = {
    b: ["c"],
    c: ["a"],
  };
  assert.equal(
    wouldCreateLibraryCycle("a", a, (id) => refs[id] ?? []),
    true,
  );
  assert.equal(
    wouldCreateLibraryCycle("a", buttonDef("x", "red"), (id) => refs[id] ?? []),
    false,
  );
});

test("collectLibraryItemRefs finds nested ids", () => {
  const def: LibraryNodeDefinition = {
    key: "root",
    type: "container",
    data: {},
    children: [
      { key: "c1", type: "button", data: {}, children: [], libraryItemId: "item-1" },
      {
        key: "c2",
        type: "container",
        data: {},
        children: [{ key: "c3", type: "button", data: {}, children: [], libraryItemId: "item-2" }],
      },
    ],
  };
  assert.deepEqual(collectLibraryItemRefs(def).sort(), ["item-1", "item-2"]);
});

test("resolveLibraryDefinitionData expands nested library refs", () => {
  const primary = buttonDef("root", "blue");
  const cta: LibraryNodeDefinition = {
    key: "cta",
    type: "container",
    data: {},
    children: [
      {
        key: "btn",
        type: "button",
        data: { styles: { fontSize: "18px" } },
        children: [],
        libraryItemId: "primary",
      },
    ],
  };
  const lookup = {
    primary: { id: "primary", version: 1, definition: primary },
    cta: { id: "cta", version: 1, definition: cta },
  };

  const nested = resolveLibraryDefinitionData(cta.children[0]!, lookup);
  assert.equal((nested.styles as { background?: string }).background, "blue");
  assert.equal((nested.styles as { fontSize?: string }).fontSize, "18px");
  assert.equal(nested.label, "Buy");

  const forNode = resolveLibraryDataForNode({
    libraryItemId: "cta",
    libraryNodeKey: "btn",
    lookup,
  });
  assert.equal(forNode?.label, "Buy");
});
