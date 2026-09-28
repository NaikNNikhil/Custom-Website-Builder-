import test from "node:test";
import assert from "node:assert/strict";

import {
  findNodeInPages,
  findPageInPages,
  findSectionInPages,
  moveSiblingIds,
  updateNodeDataInPages,
} from "./selection";
import type { WebsiteTreePage } from "../websites/types";

const samplePages: WebsiteTreePage[] = [
  {
    id: "p1",
    title: "Home",
    slug: "home",
    sortOrder: 0,
    parentId: null,
    sections: [
      {
        id: "s1",
        name: "Hero",
        sortOrder: 0,
        nodes: [
          {
            id: "n1",
            type: "container",
            name: null,
            data: {},
            sortOrder: 0,
            children: [
              {
                id: "n2",
                type: "heading",
                name: null,
                data: { text: "Hi", level: 1, align: "start" },
                sortOrder: 0,
                children: [],
              },
            ],
          },
        ],
      },
    ],
    children: [
      {
        id: "p2",
        title: "About",
        slug: "about",
        sortOrder: 0,
        parentId: "p1",
        sections: [],
        children: [],
      },
    ],
  },
];

test("findNodeInPages resolves nested child nodes", () => {
  const found = findNodeInPages(samplePages, "n2");
  assert.ok(found);
  assert.equal(found?.node.type, "heading");
  assert.equal(found?.parentNodeId, "n1");
  assert.equal(found?.sectionId, "s1");
  assert.deepEqual(found?.siblingIds, ["n2"]);
});

test("findPageInPages and findSectionInPages walk hierarchy", () => {
  assert.equal(findPageInPages(samplePages, "p2")?.title, "About");
  assert.equal(findSectionInPages(samplePages, "s1")?.section.name, "Hero");
});

test("moveSiblingIds reorders without mutating length", () => {
  assert.deepEqual(moveSiblingIds(["a", "b", "c"], "c", -1), ["a", "c", "b"]);
  assert.equal(moveSiblingIds(["a", "b"], "a", -1), null);
});

test("updateNodeDataInPages updates nested node data", () => {
  const updated = updateNodeDataInPages(samplePages, "n2", { text: "Updated", styles: { color: "#f00" } });
  const found = findNodeInPages(updated, "n2");
  assert.equal(found?.node.data.text, "Updated");
  assert.equal((found?.node.data.styles as { color: string }).color, "#f00");
  assert.equal(findNodeInPages(samplePages, "n2")?.node.data.text, "Hi");
});
