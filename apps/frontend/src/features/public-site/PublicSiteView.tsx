"use client";

import { Component, type ReactNode, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { WebsiteRenderer } from "@/features/website/renderer/WebsiteRenderer";
import { websiteApi, type PublicPublishedSite } from "@/features/websites/lib/api";
import type { WebsiteTreePage } from "@/features/websites/types";
import {
  collectNavEntries,
  findPageByPath,
  resolveHomePage,
} from "./public-navigation";

type PublicSiteViewProps = {
  slug: string;
  pathSegments: string[];
};

class PublicRenderBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Boundary only — malformed published trees must not crash the shell.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="mx-auto max-w-3xl px-4 py-16 text-center"
          data-public-state="render-error"
        >
          <h1 className="text-2xl font-semibold text-[#14213D]">Rendering error</h1>
          <p className="mt-2 text-sm text-[#14213D]/80">
            Published content could not be rendered safely.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function snapshotPages(site: PublicPublishedSite): WebsiteTreePage[] {
  const pages = site.publishedVersion.snapshot?.pages;
  if (!Array.isArray(pages)) return [];
  return pages as WebsiteTreePage[];
}

export function PublicSiteView({ slug, pathSegments }: PublicSiteViewProps) {
  const query = useQuery({
    queryKey: ["public-site", slug],
    queryFn: () => websiteApi.getPublicSiteBySlug(slug),
    retry: false,
  });

  const errorMessage = query.error instanceof Error ? query.error.message : null;
  const isNotPublished = errorMessage === "Website is not published";
  const isNotFound =
    errorMessage === "Website not found" || errorMessage === "Ambiguous website slug";

  const pages = useMemo(
    () => (query.data ? snapshotPages(query.data) : []),
    [query.data],
  );
  const home = useMemo(() => resolveHomePage(pages), [pages]);
  const activePage = useMemo(
    () => findPageByPath(pages, pathSegments),
    [pages, pathSegments],
  );
  const navEntries = useMemo(
    () => collectNavEntries(pages, slug, home),
    [pages, slug, home],
  );

  const theme = query.data?.publishedVersion.snapshot?.website?.theme ?? null;
  const libraryItems = query.data?.publishedVersion.snapshot?.libraryItems ?? [];
  const mediaAssets = query.data?.publishedVersion.snapshot?.mediaAssets ?? [];
  const siteName = query.data?.website.name ?? slug;

  if (query.isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#FFFFFF] text-[#14213D]"
        data-public-state="loading"
      >
        <p className="text-sm">Loading website…</p>
      </div>
    );
  }

  if (isNotPublished) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-2 bg-[#E5E5E5] px-4 text-center text-[#14213D]"
        data-public-state="not-published"
      >
        <h1 className="text-2xl font-semibold">Not Published</h1>
        <p className="text-sm opacity-80">This website has no published version yet.</p>
      </div>
    );
  }

  if (isNotFound || !query.data) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-2 bg-[#E5E5E5] px-4 text-center text-[#14213D]"
        data-public-state="not-found"
      >
        <h1 className="text-2xl font-semibold">Not Found</h1>
        <p className="text-sm opacity-80">No public website exists for this address.</p>
      </div>
    );
  }

  if (!activePage) {
    return (
      <div
        className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#14213D]"
        data-public-state="page-not-found"
      >
        <PublicNav siteName={siteName} entries={navEntries} activeHref={null} />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="mt-2 text-sm opacity-80">
            That page is not part of this published website.
          </p>
          <Link href={`/site/${encodeURIComponent(slug)}`} className="mt-4 inline-block text-sm underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const renderPage: WebsiteTreePage = { ...activePage, children: [] };
  const activeHref =
    home && activePage.id === home.id
      ? `/site/${encodeURIComponent(slug)}`
      : null;

  const matchedNav = navEntries.find((entry) => entry.page.id === activePage.id);

  return (
    <div
      className="flex min-h-screen flex-col overflow-x-hidden bg-[#FFFFFF] text-[#14213D]"
      data-public-site="true"
      data-public-state="ready"
      data-published-version={query.data.publishedVersion.version}
    >
      <PublicNav
        siteName={siteName}
        entries={navEntries}
        activeHref={matchedNav?.href ?? activeHref}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:px-8">
        <PublicRenderBoundary>
          <WebsiteRenderer
            pages={[renderPage]}
            theme={theme}
            libraryItems={libraryItems}
            mediaAssets={mediaAssets}
            interaction={null}
          />
        </PublicRenderBoundary>
      </main>
    </div>
  );
}

function PublicNav({
  siteName,
  entries,
  activeHref,
}: {
  siteName: string;
  entries: { page: WebsiteTreePage; href: string; depth: number }[];
  activeHref: string | null;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-[#E5E5E5] bg-[#FFFFFF]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-8">
        <p className="truncate text-base font-semibold tracking-tight">{siteName}</p>
        <nav
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
          aria-label="Site pages"
          data-public-nav="true"
        >
          {entries.map(({ page, href, depth }) => {
            const active = activeHref === href;
            return (
              <Link
                key={page.id}
                href={href}
                className={`${depth > 0 ? "pl-2 opacity-90" : ""} ${
                  active ? "font-semibold text-[#FCA311]" : "text-[#14213D] hover:text-[#FCA311]"
                }`}
                data-nav-page={page.slug}
                data-nav-active={active ? "true" : "false"}
              >
                {page.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
