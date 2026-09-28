import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { toSlug, slugSchema } from "../src/utils/validation";
import { buildPageTree } from "../src/modules/websites/website-tree";
import { createPageSchema } from "../src/modules/pages/page.service";
import { createSectionSchema } from "../src/modules/sections/section.service";
import { createNodeSchema } from "../src/modules/nodes/node.service";

test("toSlug normalizes names", () => {
  assert.equal(toSlug(" My Website! "), "my-website");
  assert.equal(toSlug("Hello___World"), "hello-world");
});

test("slugSchema rejects invalid values", () => {
  assert.throws(() => slugSchema.parse("Bad Slug"));
  assert.equal(slugSchema.parse("good-slug"), "good-slug");
});

test("create schemas require core fields", () => {
  assert.throws(() => createPageSchema.parse({ title: "" }));
  assert.throws(() => createSectionSchema.parse({ name: "" }));
  assert.throws(() => createNodeSchema.parse({ type: "" }));
  assert.equal(createPageSchema.parse({ title: "Home" }).title, "Home");
});

test("buildPageTree nests pages, sections, and nodes", () => {
  const tree = buildPageTree(
    [
      { id: "p1", websiteId: "w1", parentId: null, title: "Home", slug: "home", sortOrder: 0 },
      { id: "p2", websiteId: "w1", parentId: "p1", title: "About", slug: "about", sortOrder: 0 },
    ],
    [
      { id: "s1", pageId: "p1", name: "Hero", sortOrder: 0 },
      { id: "s2", pageId: "p2", name: "Body", sortOrder: 0 },
    ],
    [
      { id: "n1", sectionId: "s1", parentId: null, type: "container", name: null, data: {}, sortOrder: 0 },
      { id: "n2", sectionId: "s1", parentId: "n1", type: "heading", name: "Title", data: { text: "Hi" }, sortOrder: 0 },
      { id: "n3", sectionId: "s2", parentId: null, type: "text", name: null, data: {}, sortOrder: 0 },
    ],
  );

  assert.equal(tree.length, 1);
  assert.equal(tree[0].children.length, 1);
  assert.equal(tree[0].sections[0].nodes[0].children[0].type, "heading");
  assert.equal(tree[0].children[0].sections[0].nodes[0].type, "text");
});

test("website foundation routes are registered", () => {
  const routes = readFileSync(path.resolve(__dirname, "../src/routes/index.ts"), "utf8");
  const websiteRoutes = readFileSync(
    path.resolve(__dirname, "../src/modules/websites/website.routes.ts"),
    "utf8",
  );
  assert.match(routes, /\/organizations/);
  assert.match(routes, /\/websites/);
  assert.match(websiteRoutes, /\/:id\/tree/);
  assert.match(routes, /pages\/reorder/);
  assert.match(routes, /sections\/reorder/);
  assert.match(routes, /nodes\/reorder/);
});

test("org access helpers enforce membership checks", () => {
  const orgAccess = readFileSync(
    path.resolve(__dirname, "../src/modules/organizations/org-access.ts"),
    "utf8",
  );
  assert.match(orgAccess, /requireOrganizationMembership/);
  assert.match(orgAccess, /throw new AppError\(403, "Forbidden"\)/);
});
