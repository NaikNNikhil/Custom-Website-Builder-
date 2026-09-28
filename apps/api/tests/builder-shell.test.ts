import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

test("builder shell route and feature modules exist", () => {
  const builderPage = readFileSync(
    path.resolve(
      __dirname,
      "../../frontend/src/app/dashboard/customer/orgs/[orgId]/websites/[websiteId]/builder/page.tsx",
    ),
    "utf8",
  );
  const shell = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/builder/BuilderShell.tsx"),
    "utf8",
  );
  const renderer = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/website/renderer/WebsiteRenderer.tsx"),
    "utf8",
  );

  assert.match(builderPage, /BuilderShell/);
  assert.match(shell, /overflow-hidden/);
  assert.match(shell, /overflow-y-auto/);
  assert.match(shell, /StructurePanel/);
  assert.match(shell, /PropertiesPanel/);
  assert.match(shell, /interaction=\{/);
  assert.match(shell, /syncPreviewToSelection|previewScrollRef|previewSync/);
  assert.match(renderer, /RendererInteractionProvider/);
  assert.match(renderer, /SelectableNodeFrame/);
  assert.match(renderer, /data-node-id/);
  assert.match(renderer, /data-section-id/);
  assert.match(renderer, /data-page-id/);
});
