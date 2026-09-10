import { Mail } from "lucide-react";
import Link from "next/link";
import type { SVGProps } from "react";

import { SECTIONS, SECTION_ORDER } from "@/lib/sections";
import { site } from "@/lib/site";

/* lucide-react v1 dropped brand marks, so these two are inlined. */

function GithubMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.02c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function LinkedinMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

const SOCIALS = [
  { href: "https://github.com/", label: "GitHub", icon: GithubMark },
  { href: "https://www.linkedin.com/", label: "LinkedIn", icon: LinkedinMark },
  { href: `mailto:${site.email}`, label: `Email ${site.author}`, icon: Mail },
];

export function Footer() {
  return (
    <footer className="mt-28 border-t border-edge-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 sm:flex-row sm:justify-between">
        <div className="max-w-sm space-y-3">
          <p className="display text-2xl text-ink">{site.name}</p>
          <p className="text-sm leading-relaxed text-muted">
            Notes on the systems I build, the algorithms I unpack, and the things that do not fit
            in either box.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:items-end">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {SECTION_ORDER.map((key) => (
              <li key={key}>
                <Link
                  href={`/${key}`}
                  className="text-sm text-muted transition-colors hover:text-accent-deep"
                >
                  {SECTIONS[key].title}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="flex gap-2">
            {SOCIALS.map(({ href, label, icon: Icon }) => {
              // Only http(s) links leave the site. A mailto: opens the mail
              // client, so target="_blank" would strand an empty tab.
              const external = href.startsWith("http");
              return (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={external ? `${label} (opens in a new tab)` : label}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-edge-soft">
        <p className="mx-auto max-w-6xl px-6 py-5 text-center text-xs text-faint">
          Made with Love
        </p>
      </div>
    </footer>
  );
}
