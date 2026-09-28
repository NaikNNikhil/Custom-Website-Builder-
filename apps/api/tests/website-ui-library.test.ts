import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  DEFAULT_WEBSITE_THEME,
  resolveEffectiveStyles,
  wouldCreateLibraryCycle,
  type LibraryNodeDefinition,
} from "@custom-website-builder/node-registry";

test("theme → library → node resolution order", () => {
  const effective = resolveEffectiveStyles({
    nodeType: "button",
    theme: DEFAULT_WEBSITE_THEME,
    libraryStyles: { background: "#1111ff", fontSize: "16px" },
    nodeStyles: { fontSize: "22px" },
  });
  assert.equal(effective.background, "#1111ff");
  assert.equal(effective.fontSize, "22px");
  assert.equal(effective.borderRadius, DEFAULT_WEBSITE_THEME.general.borderRadius);
});

test("circular library refs rejected by helper", () => {
  const definition: LibraryNodeDefinition = {
    key: "root",
    type: "container",
    data: {},
    children: [
      {
        key: "child",
        type: "button",
        data: {},
        children: [],
        libraryItemId: "b",
      },
    ],
  };
  assert.equal(
    wouldCreateLibraryCycle("a", definition, (id) => (id === "b" ? ["a"] : [])),
    true,
  );
});

test("library routes and builder UI Library tab exist", () => {
  const routes = readFileSync(path.resolve(__dirname, "../src/routes/index.ts"), "utf8");
  assert.match(routes, /\/library/);
  assert.match(routes, /library-items/);

  const nodeRoutes = readFileSync(
    path.resolve(__dirname, "../src/modules/nodes/node.routes.ts"),
    "utf8",
  );
  assert.match(nodeRoutes, /save-to-library/);
  assert.match(nodeRoutes, /make-independent/);

  const shell = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/builder/BuilderShell.tsx"),
    "utf8",
  );
  assert.match(shell, /LibraryPanel/);
  assert.match(shell, /leftTab === "library"/);
  assert.match(shell, /saveNodeToLibrary|Save to UI Library|handleSaveToLibrary/);

  const migration = readFileSync(
    path.resolve(
      __dirname,
      "../../../packages/database/prisma/migrations/20260913200000_website_ui_library/migration.sql",
    ),
    "utf8",
  );
  assert.match(migration, /library_items/);
  assert.match(migration, /library_item_id/);
});

test("renderer wires libraryStyles into resolveEffectiveStyles", () => {
  const renderer = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/website/renderer/WebsiteRenderer.tsx"),
    "utf8",
  );
  assert.match(renderer, /libraryStyles/);
  assert.match(renderer, /resolveLibraryDataForNode/);
  assert.match(renderer, /LibraryLookupProvider/);
});
