import Link from "next/link";
import type { CSSProperties } from "react";

import { SiteShell } from "@/components/SiteShell";
import { hueVar, SECTIONS, SECTION_ORDER } from "@/lib/sections";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-2xl flex-col px-6 py-32">
        <p className="kicker text-faint">Error 404</p>
        <h1 className="display mt-6 text-4xl text-ink sm:text-5xl">This path does not resolve</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          There is no category or post at that address. It may have been renamed, or it may never
          have existed.
        </p>

        <ul className="mt-12 border-t border-edge">
          {SECTION_ORDER.map((key) => (
            <li key={key}>
              <Link
                href={`/${key}`}
                style={{ "--accent": hueVar(key) } as CSSProperties}
                className="group flex items-baseline justify-between gap-4 border-b border-edge py-5 transition-colors hover:border-accent"
              >
                <span className="display text-xl text-ink transition-colors group-hover:text-accent">
                  {SECTIONS[key].title}
                </span>
                <span className="truncate text-sm text-faint">{SECTIONS[key].tagline}</span>
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/" className="mt-10 kicker text-faint transition-colors hover:text-accent">
          &larr; Back home
        </Link>
      </div>
    </SiteShell>
  );
}
