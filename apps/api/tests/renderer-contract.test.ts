import test from "node:test";
import assert from "node:assert/strict";

import {
  getDefaultNodeData,
  resolveHtmlTag,
  safeParseNodeData,
} from "@custom-website-builder/node-registry";

type TreeNode = {
  id: string;
  type: string;
  data: unknown;
  children: TreeNode[];
};

function collectRenderPlan(node: TreeNode): Array<{ id: string; type: string; status: "ok" | "fallback"; tag?: string | null }> {
  const parsed = safeParseNodeData(node.type, node.data);
  if (!parsed.ok) {
    return [{ id: node.id, type: node.type, status: "fallback" }];
  }

  return [
    {
      id: node.id,
      type: node.type,
      status: "ok",
      tag: resolveHtmlTag(node.type, parsed.data),
    },
    ...node.children.flatMap((child) => collectRenderPlan(child)),
  ];
}

test("generic renderer contract walks nested registry nodes", () => {
  const tree: TreeNode = {
    id: "n1",
    type: "container",
    data: getDefaultNodeData("container"),
    children: [
      {
        id: "n2",
        type: "heading",
        data: { text: "Welcome", level: 1, align: "start" },
        children: [],
      },
      {
        id: "n3",
        type: "text",
        data: { text: "Body", align: "start" },
        children: [],
      },
      {
        id: "n4",
        type: "button",
        data: { label: "Go", href: "/x" },
        children: [],
      },
      {
        id: "n5",
        type: "spacer",
        data: { size: "md" },
        children: [],
      },
    ],
  };

  const plan = collectRenderPlan(tree);
  assert.equal(plan.length, 5);
  assert.deepEqual(
    plan.map((item) => item.status),
    ["ok", "ok", "ok", "ok", "ok"],
  );
  assert.equal(plan[1]?.tag, "h1");
  assert.equal(plan[2]?.tag, "p");
  assert.equal(plan[3]?.tag, "a");
  assert.equal(plan[4]?.tag, "div");
});

test("generic renderer contract fails safely for unsupported nodes", () => {
  const nodes: TreeNode[] = [
    { id: "ok", type: "link", data: { label: "A", href: "#" }, children: [] },
    { id: "bad", type: "product-grid", data: {}, children: [] },
  ];

  const plan = nodes.flatMap((node) => collectRenderPlan(node));
  assert.equal(plan[0]?.status, "ok");
  assert.equal(plan[0]?.tag, "a");
  assert.equal(plan[1]?.status, "fallback");
});
