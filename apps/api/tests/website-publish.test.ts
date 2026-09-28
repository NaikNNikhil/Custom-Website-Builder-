import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { DEFAULT_WEBSITE_THEME } from "@custom-website-builder/node-registry";
import { validateDraftSnapshot } from "../src/modules/publish/publish-validate";
import { hashPublishedSnapshot, type DraftWebsitePayload } from "../src/modules/publish/draft-snapshot";

test("validateDraftSnapshot rejects empty pages", () => {
  const draft: DraftWebsitePayload = {
    schemaVersion: 1,
    website: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test",
      slug: "test",
      theme: DEFAULT_WEBSITE_THEME,
    },
    pages: [],
    libraryItems: [],
    mediaAssets: [],
  };
  const result = validateDraftSnapshot(draft);
  assert.equal(result.ok, false);
  assert.match(result.issues[0]?.message ?? "", /at least one page/i);
});

test("validateDraftSnapshot accepts minimal valid draft", () => {
  const draft: DraftWebsitePayload = {
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
  const result = validateDraftSnapshot(draft);
  assert.equal(result.ok, true, result.issues.map((i) => i.message).join("; "));
});

test("content hash is stable for same snapshot", () => {
  const draft: DraftWebsitePayload = {
    schemaVersion: 1,
    website: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Test",
      slug: "test",
      theme: DEFAULT_WEBSITE_THEME,
    },
    pages: [],
    libraryItems: [],
    mediaAssets: [],
  };
  assert.equal(hashPublishedSnapshot(draft), hashPublishedSnapshot(structuredClone(draft)));
});

test("publish routes and builder publish UX exist", () => {
  const routes = readFileSync(
    path.resolve(__dirname, "../src/modules/websites/website.routes.ts"),
    "utf8",
  );
  assert.match(routes, /\/:id\/publish/);
  assert.match(routes, /\/:id\/validate/);
  assert.match(routes, /\/:id\/published/);

  const index = readFileSync(path.resolve(__dirname, "../src/routes/index.ts"), "utf8");
  assert.match(index, /\/public/);
  assert.match(index, /published/);

  const shell = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/builder/BuilderShell.tsx"),
    "utf8",
  );
  assert.match(shell, /Publish/);
  assert.match(shell, /Preview/);
  assert.match(shell, /publication/);
  assert.match(shell, /publishWebsite/);

  const migration = readFileSync(
    path.resolve(
      __dirname,
      "../../../packages/database/prisma/migrations/20260913230000_draft_publish/migration.sql",
    ),
    "utf8",
  );
  assert.match(migration, /published_versions/);
  assert.match(migration, /current_published_version_id/);
});
