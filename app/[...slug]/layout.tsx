import { SiteShell } from "@/components/SiteShell";

/**
 * Catch-all layouts receive the same params as their page, so the pillar can be
 * read from the first slug segment and applied before anything renders — no
 * client-side theme flash.
 */
export default async function SectionLayout({ children, params }: LayoutProps<"/[...slug]">) {
  const { slug } = await params;
  return <SiteShell pillar={slug[0]}>{children}</SiteShell>;
}
