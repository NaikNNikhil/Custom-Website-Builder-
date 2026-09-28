import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { hashPublishedSnapshot, type DraftWebsitePayload } from "../src/modules/publish/draft-snapshot";
import { DEFAULT_WEBSITE_THEME } from "@custom-website-builder/node-registry";

test("public routes expose slug lookup and id published endpoint", () => {
  const index = readFileSync(path.resolve(__dirname, "../src/routes/index.ts"), "utf8");
  assert.match(index, /\/sites\/:slug/);
  assert.match(index, /publicBySlug/);
  assert.match(index, /\/websites\/:websiteId\/published/);

  const service = readFileSync(
    path.resolve(__dirname, "../src/modules/publish/publish.service.ts"),
    "utf8",
  );
  assert.match(service, /getCurrentPublishedBySlug/);
  assert.match(service, /Website is not published/);
  assert.match(service, /Ambiguous website slug/);
  assert.match(service, /toPublicPayload/);
  assert.doesNotMatch(service, /buildDraftSnapshot\(websiteId\).*public/i);
});

test("public frontend route and shell stay builder-free", () => {
  const page = readFileSync(
    path.resolve(__dirname, "../../frontend/src/app/site/[slug]/page.tsx"),
    "utf8",
  );
  assert.match(page, /PublicSiteView/);
  assert.match(page, /pathSegments=\{\[\]\}/);

  const nested = readFileSync(
    path.resolve(__dirname, "../../frontend/src/app/site/[slug]/[...path]/page.tsx"),
    "utf8",
  );
  assert.match(nested, /PublicSiteView/);

  const view = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/public-site/PublicSiteView.tsx"),
    "utf8",
  );
  assert.match(view, /getPublicSiteBySlug/);
  assert.match(view, /Not Published/);
  assert.match(view, /interaction=\{null\}/);
  assert.doesNotMatch(view, /BuilderShell|ThemePanel|MediaPanel|StructurePanel|NodePropertyEditor/);
  assert.doesNotMatch(view, /publishWebsite|handlePublish/);

  const shell = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/builder/BuilderShell.tsx"),
    "utf8",
  );
  assert.match(shell, /\/site\/\$\{encodeURIComponent\(websiteSlug\)\}/);
  assert.match(shell, /View public site/);
});

test("published snapshot hash changes when draft content changes", () => {
  const base: DraftWebsitePayload = {
    schemaVersion: 1,
    website: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test",
      slug: "test",
      theme: DEFAULT_WEBSITE_THEME,
    },
    pages: [
      {
        id: "page-1",
        title: "Home",
        slug: "home",
        sortOrder: 0,
        parentId: null,
        sections: [
          {
            id: "section-1",
            name: "Main",
            sortOrder: 0,
            nodes: [
              {
                id: "node-1",
                type: "heading",
                name: "Title",
                data: { text: "Hello", level: 1, styles: {} },
                sortOrder: 0,
                libraryItemId: null,
                libraryItemVersion: null,
                libraryNodeKey: null,
                children: [],
              },
            ],
          },
        ],
        children: [],
      },
    ],
    libraryItems: [],
    mediaAssets: [],
  };

  const edited = structuredClone(base);
  const heading = edited.pages[0]?.sections[0]?.nodes[0];
  assert.ok(heading);
  heading.data = { text: "Changed", level: 1, styles: {} };

  const v1 = hashPublishedSnapshot(base);
  const v2 = hashPublishedSnapshot(edited);
  assert.notEqual(v1, v2);
  assert.equal(hashPublishedSnapshot(base), v1);
});
