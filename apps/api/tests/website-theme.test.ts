import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  DEFAULT_WEBSITE_THEME,
  mergeWebsiteTheme,
  resolveEffectiveStyles,
} from "@custom-website-builder/node-registry";

test("theme resolution inherits until node overrides", () => {
  const inherited = resolveEffectiveStyles({
    nodeType: "button",
    theme: DEFAULT_WEBSITE_THEME,
    nodeStyles: {},
  });
  assert.equal(inherited.background, DEFAULT_WEBSITE_THEME.colors.primary);

  const overridden = resolveEffectiveStyles({
    nodeType: "button",
    theme: DEFAULT_WEBSITE_THEME,
    nodeStyles: { background: "#ff0000" },
  });
  assert.equal(overridden.background, "#ff0000");
  assert.equal(overridden.borderRadius, DEFAULT_WEBSITE_THEME.general.borderRadius);
});

test("theme merge patches nested sections", () => {
  const next = mergeWebsiteTheme(DEFAULT_WEBSITE_THEME, {
    colors: { primary: "#123456" },
  });
  assert.equal(next.colors.primary, "#123456");
  assert.equal(next.colors.text, DEFAULT_WEBSITE_THEME.colors.text);
});

test("website theme route is registered before :id catch-all", () => {
  const routes = readFileSync(
    path.resolve(__dirname, "../src/modules/websites/website.routes.ts"),
    "utf8",
  );
  assert.match(routes, /\/:id\/theme/);
  const themeIndex = routes.indexOf("/:id/theme");
  const patchIdIndex = routes.indexOf('websiteRoutes.patch("/:id"');
  assert.ok(themeIndex >= 0 && patchIdIndex > themeIndex);
});

test("builder exposes Theme tab panel", () => {
  const shell = readFileSync(
    path.resolve(__dirname, "../../frontend/src/features/builder/BuilderShell.tsx"),
    "utf8",
  );
  assert.match(shell, /ThemePanel/);
  assert.match(shell, /leftTab === "theme"/);
  assert.match(shell, /updateWebsiteTheme/);
});
