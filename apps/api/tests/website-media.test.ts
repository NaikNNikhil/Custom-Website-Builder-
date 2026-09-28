import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  getCapabilityFields,
  getNodeType,
  validateNodeAgainstRegistry,
} from "@custom-website-builder/node-registry";

test("image node prefers mediaAssetId capability over raw src editing", () => {
  const image = getNodeType("image");
  assert.ok(image);
  const fields = getCapabilityFields(image!);
  assert.ok(fields.content.some((field) => field.id === "mediaAssetId"));
  assert.ok(fields.content.some((field) => field.id === "alt"));
  assert.ok(!fields.content.some((field) => field.id === "src"));
});

test("image data accepts mediaAssetId reference", () => {
  const result = validateNodeAgainstRegistry({
    type: "image",
    data: {
      mediaAssetId: "550e8400-e29b-41d4-a716-446655440000",
      alt: "Hero",
      styles: { opacity: 0.9 },
    },
  });
  assert.equal(result.ok, true);
});

test("media storage boundary and routes exist", () => {
  const provider = readFileSync(
    path.resolve(__dirname, "../src/modules/media/storage/cloudinary.provider.ts"),
    "utf8",
  );
  assert.match(provider, /CloudinaryStorageProvider/);
  assert.match(provider, /implements MediaStorageProvider/);

  const types = readFileSync(
    path.resolve(__dirname, "../src/modules/media/storage/storage.types.ts"),
    "utf8",
  );
  assert.match(types, /MediaStorageProvider/);

  const routes = readFileSync(path.resolve(__dirname, "../src/routes/index.ts"), "utf8");
  assert.match(routes, /\/media/);
  assert.match(routes, /mediaUpload\.single/);

  const migration = readFileSync(
    path.resolve(
      __dirname,
      "../../../packages/database/prisma/migrations/20260913210000_website_media/migration.sql",
    ),
    "utf8",
  );
  assert.match(migration, /media_assets/);
});

test("builder Media tab and media picker wired", () => {
  const shell = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/builder/BuilderShell.tsx"),
    "utf8",
  );
  assert.match(shell, /MediaPanel/);
  assert.match(shell, /leftTab === "media"/);
  assert.match(shell, /uploadMediaAsset|uploadMedia/);

  const renderer = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/website/renderer/WebsiteRenderer.tsx"),
    "utf8",
  );
  assert.match(renderer, /MediaLookupProvider/);
  assert.match(renderer, /resolveImageSrc/);
  assert.match(renderer, /Media asset unavailable/);
});
