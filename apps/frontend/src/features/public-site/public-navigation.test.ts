import test from "node:test";
import assert from "node:assert/strict";

import type { WebsiteTreePage } from "../websites/types";
import {
  collectNavEntries,
  findPageByPath,
  resolveHomePage,
} from "./public-navigation";

const pages: WebsiteTreePage[] = [
  {
    id: "home",
    title: "Home",
    slug: "home",
    sortOrder: 0,
    parentId: null,
    sections: [],
    children: [],
  },
  {
    id: "products",
    title: "Products",
    slug: "products",
    sortOrder: 1,
    parentId: null,
    sections: [],
    children: [
      {
        id: "widgets",
        title: "Widgets",
        slug: "widgets",
        sortOrder: 0,
        parentId: "products",
        sections: [],
        children: [],
      },
    ],
  },
];

test("resolves home and nested paths from published pages", () => {
  assert.equal(resolveHomePage(pages)?.id, "home");
  assert.equal(findPageByPath(pages, [])?.id, "home");
  assert.equal(findPageByPath(pages, ["products"])?.id, "products");
  assert.equal(findPageByPath(pages, ["products", "widgets"])?.id, "widgets");
  assert.equal(findPageByPath(pages, ["missing"]), null);
});

test("builds nav hrefs from page hierarchy", () => {
  const home = resolveHomePage(pages);
  const entries = collectNavEntries(pages, "acme", home);
  assert.deepEqual(
    entries.map((e) => e.href),
    ["/site/acme", "/site/acme/products", "/site/acme/products/widgets"],
  );
});
