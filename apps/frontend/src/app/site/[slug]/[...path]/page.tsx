import { PublicSiteView } from "@/features/public-site/PublicSiteView";

type PublicSiteNestedPageProps = {
  params: Promise<{ slug: string; path: string[] }>;
};

/**
 * Public nested pages: `/site/:slug/...pagePath`
 * Navigation driven by published Website pages only.
 */
export default async function PublicSiteNestedPage({ params }: PublicSiteNestedPageProps) {
  const { slug, path } = await params;
  return <PublicSiteView slug={slug} pathSegments={path ?? []} />;
}
