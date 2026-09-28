import type { WebsiteTreePage } from "@/features/websites/types";

/** Resolve home page: prefer slug `home`, else first root by sortOrder. */
export function resolveHomePage(pages: WebsiteTreePage[]): WebsiteTreePage | null {
  if (!pages.length) return null;
  const bySlug = pages.find((page) => page.slug === "home");
  if (bySlug) return bySlug;
  return [...pages].sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
}

/**
 * Walk published page tree by URL path segments (page slugs).
 * Empty segments → home page.
 */
export function findPageByPath(
  pages: WebsiteTreePage[],
  segments: string[],
): WebsiteTreePage | null {
  const normalized = segments.map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (normalized.length === 0) {
    return resolveHomePage(pages);
  }

  let level = pages;
  let found: WebsiteTreePage | null = null;

  for (const segment of normalized) {
    found = level.find((page) => page.slug === segment) ?? null;
    if (!found) return null;
    level = found.children;
  }

  return found;
}

/** Public href for a page under `/site/:slug`. Home uses bare site path. */
export function publicPageHref(siteSlug: string, page: WebsiteTreePage, home: WebsiteTreePage | null): string {
  const base = `/site/${encodeURIComponent(siteSlug)}`;
  if (home && page.id === home.id) {
    return base;
  }
  // Build path from root via parent chain is not available; use slug for root pages,
  // and for nested pages rely on caller providing full path segments.
  return `${base}/${encodeURIComponent(page.slug)}`;
}

/** Flatten root pages for top nav (hierarchy via nested children links optional). */
export function rootNavPages(pages: WebsiteTreePage[]): WebsiteTreePage[] {
  return [...pages].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Href for nested page using ancestor slug path. */
export function publicNestedPageHref(siteSlug: string, pathSlugs: string[]): string {
  const base = `/site/${encodeURIComponent(siteSlug)}`;
  if (!pathSlugs.length) return base;
  return `${base}/${pathSlugs.map((s) => encodeURIComponent(s)).join("/")}`;
}

export function collectNavEntries(
  pages: WebsiteTreePage[],
  siteSlug: string,
  home: WebsiteTreePage | null,
  ancestors: string[] = [],
): { page: WebsiteTreePage; href: string; depth: number }[] {
  const entries: { page: WebsiteTreePage; href: string; depth: number }[] = [];
  for (const page of rootNavPages(pages)) {
    const pathSlugs = [...ancestors, page.slug];
    const isHome = home && page.id === home.id && ancestors.length === 0;
    const href = isHome
      ? `/site/${encodeURIComponent(siteSlug)}`
      : publicNestedPageHref(siteSlug, pathSlugs);
    entries.push({ page, href, depth: ancestors.length });
    if (page.children.length) {
      entries.push(...collectNavEntries(page.children, siteSlug, home, pathSlugs));
    }
  }
  return entries;
}
