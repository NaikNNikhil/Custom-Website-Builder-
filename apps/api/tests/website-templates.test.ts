import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ecommerceTemplate,
  listTemplateCatalog,
  validateWebsiteTemplate,
} from "@custom-website-builder/website-templates";

test("template catalog exposes ecommerce v1", () => {
  const catalog = listTemplateCatalog();
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0]?.id, "ecommerce");
  assert.equal(catalog[0]?.version, 1);
});

test("ecommerce template validates against node registry", () => {
  const result = validateWebsiteTemplate(ecommerceTemplate);
  assert.equal(result.ok, true, result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
});

test("ecommerce template uses generic page/section/node shape", () => {
  const home = ecommerceTemplate.pages[0];
  assert.ok(home);
  assert.ok(home.sections.length >= 7);
  assert.ok(home.sections.every((section) => Array.isArray(section.nodes)));
  assert.equal(ecommerceTemplate.pages.length, 4);
  assert.deepEqual(
    ecommerceTemplate.pages.map((page) => page.slug),
    ["home", "products", "about", "contact"],
  );
  assert.ok(ecommerceTemplate.libraryItems.some((item) => item.key === "primary-button"));
  assert.ok(ecommerceTemplate.mediaAssets.every((asset) => asset.url.startsWith("http")));
});

test("template routes and website create accept templateId", () => {
  const routes = readFileSync(path.resolve(__dirname, "../src/routes/index.ts"), "utf8");
  assert.match(routes, /\/templates/);

  const websiteService = readFileSync(
    path.resolve(__dirname, "../src/modules/websites/website.service.ts"),
    "utf8",
  );
  assert.match(websiteService, /templateId/);
  assert.match(websiteService, /applyWebsiteTemplate/);

  const apply = readFileSync(
    path.resolve(__dirname, "../src/modules/templates/template-apply.ts"),
    "utf8",
  );
  assert.match(apply, /provider: "template"/);
  assert.match(apply, /templateVersion/);

  const orgPage = readFileSync(
    path.resolve(__dirname, "../../frontend/src/app/dashboard/customer/orgs/[orgId]/page.tsx"),
    "utf8",
  );
  assert.match(orgPage, /listTemplates/);
  assert.match(orgPage, /templateId/);
  assert.match(orgPage, /Open builder|\/builder/);
});
