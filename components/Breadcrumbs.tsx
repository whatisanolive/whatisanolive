import { Home } from "lucide-react";
import Link from "next/link";

import { getBreadcrumbs } from "@/lib/posts";
import { cn } from "@/lib/utils";

/**
 * `Home / Tech / Backend / Node.js` for any depth.
 *
 * Titles come from the content tree rather than the raw slug, so a folder named
 * `nodejs` with a `_meta.json` renders as "Node.js".
 */
export function Breadcrumbs({ slug, className }: { slug: string[]; className?: string }) {
  const crumbs = getBreadcrumbs(slug);

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 kicker text-faint">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1.5 transition-colors hover:text-accent"
          >
            <Home className="h-3 w-3" />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.url} className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="text-edge">
                /
              </span>
              {isLast ? (
                <span aria-current="page" className="truncate text-accent" title={crumb.title}>
                  {crumb.title}
                </span>
              ) : (
                <Link href={crumb.url} className="truncate transition-colors hover:text-accent">
                  {crumb.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
