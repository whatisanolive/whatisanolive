import type { ReactNode } from "react";

import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { isSectionKey } from "@/lib/sections";

/**
 * Wraps a page in its palette.
 *
 * `data-pillar` selects one of the token blocks in `globals.css`, so the whole
 * tree below — navbar and footer included — repaints for that section. The
 * homepage passes nothing and inherits the dark `:root` palette.
 *
 * This is why the navbar and footer live here rather than in the root layout:
 * they have to sit *inside* the themed element to pick up its variables.
 */
export function SiteShell({
  pillar,
  children,
}: {
  pillar?: string;
  children: ReactNode;
}) {
  const themed = pillar && isSectionKey(pillar) ? pillar : undefined;

  return (
    <div
      data-pillar={themed}
      className="flex min-h-screen flex-col bg-ground text-body transition-colors"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
