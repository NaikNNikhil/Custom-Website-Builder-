import test from "node:test";
import assert from "node:assert/strict";
import { ecommerceTemplate, listTemplateCatalog, validateWebsiteTemplate } from "./catalog";

test("catalog lists ecommerce template", () => {
  const catalog = listTemplateCatalog();
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0]?.id, "ecommerce");
  assert.equal(catalog[0]?.version, 1);
});

test("ecommerce template validates against node registry", () => {
  const result = validateWebsiteTemplate(ecommerceTemplate);
  assert.equal(result.ok, true, result.issues.map((i) => i.message).join("; "));
});

test("ecommerce template has home starter sections", () => {
  const home = ecommerceTemplate.pages[0];
  assert.ok(home);
  assert.equal(home.slug, "home");
  const names = home.sections.map((section) => section.name);
  assert.deepEqual(names, [
    "Navbar",
    "Hero",
    "Featured Content",
    "Why Choose Us",
    "Testimonials",
    "Call To Action",
    "Footer",
  ]);
});
