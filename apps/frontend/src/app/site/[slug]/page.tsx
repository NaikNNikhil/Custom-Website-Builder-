import { PublicSiteView } from "@/features/public-site/PublicSiteView";

type PublicSitePageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Public website home: `/site/:slug`
 * Renders current Published Version only — never draft.
 */
export default async function PublicSiteHomePage({ params }: PublicSitePageProps) {
  const { slug } = await params;
  return <PublicSiteView slug={slug} pathSegments={[]} />;
}
