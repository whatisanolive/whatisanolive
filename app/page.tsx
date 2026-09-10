import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { PostCard } from "@/components/PostCard";
import { SectionIcon } from "@/components/SectionIcon";
import { SiteShell } from "@/components/SiteShell";
import {
  findNode,
  getActivityData,
  getActivityStats,
  getPostsDeep,
  getRecentPosts,
} from "@/lib/posts";
import { hueVar, isSectionKey, SECTIONS, SECTION_ORDER, type Section } from "@/lib/sections";
import { pluralize } from "@/lib/utils";

export default function HomePage() {
  const activity = getActivityData();
  const stats = getActivityStats(activity);
  const recent = getRecentPosts(4);

  return (
    <SiteShell>
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] grid-backdrop" />

        <div className="relative mx-auto max-w-6xl px-6">
          {/* ------------------------------ Hero ------------------------------ */}
          <section className="py-24 sm:py-32">
            <p className="kicker text-faint">
              {pluralize(stats.totalPosts, "essay")} &middot; since ????
            </p>

            <h1 className="display mt-8 max-w-4xl text-balance-pretty text-5xl text-ink sm:text-7xl">
              Learning, writing and order, here is everything I {" "}
              <em className="not-italic bg-gradient-to-r from-[var(--hue-tech)] via-[var(--hue-dsa)] to-[var(--hue-blank-canvas)] bg-clip-text text-transparent">
                love
              </em>.
            </h1>

            <div className="mt-10 flex max-w-2xl gap-6">
              <span aria-hidden className="mt-3 h-px w-12 shrink-0 bg-edge" />
              <p className="text-lg leading-relaxed text-muted">
                Long-form notes on backend systems and machine learning, the algorithmic patterns
                worth internalising, and the occasional essay that belongs to neither. No
                listicles, no hedging &mdash; just the working.
              </p>
            </div>
          </section>

          {/* -------------------------- Three pillars ------------------------- */}
          <section aria-labelledby="pillars-heading" className="pb-24">
            <h2 id="pillars-heading" className="sr-only">
              Sections
            </h2>
            <div className="grid gap-px overflow-hidden rounded-3xl border border-edge bg-edge md:grid-cols-3">
              {SECTION_ORDER.map((key) => (
                <PillarCard key={key} section={SECTIONS[key]} />
              ))}
            </div>
          </section>

          {/* ---------------------------- Consistency ------------------------- */}
          <section className="pb-24">
            <ActivityHeatmap data={activity} stats={stats} />
          </section>

          {/* ------------------------------ Recent ---------------------------- */}
          {recent.length > 0 && (
            <section aria-labelledby="recent-heading" className="pb-10">
              <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-edge pb-4">
                <h2 id="recent-heading" className="display text-2xl text-ink">
                  Recently published
                </h2>
                <span className="kicker text-faint">latest four</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {recent.map((post) => (
                  <PostCard
                    key={post.url}
                    post={post}
                    showPath
                    accent={isSectionKey(post.slug[0]) ? hueVar(post.slug[0]) : undefined}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </SiteShell>
  );
}

function PillarCard({ section }: { section: Section }) {
  const node = findNode([section.key]);
  const count = node?.kind === "category" ? getPostsDeep(node).length : 0;

  return (
    <Link
      href={`/${section.key}`}
      // The pillar's pastel becomes this card's accent, so one card can preview
      // a section's colour without leaving the homepage palette.
      style={{ "--accent": hueVar(section.key) } as CSSProperties}
      className="group relative flex flex-col bg-ground p-8 transition-colors hover:bg-ground-alt"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <SectionIcon name={section.iconName} className="h-5 w-5 text-accent" />

      <h3 className="display mt-6 text-2xl text-ink">{section.title}</h3>
      <p className="mt-2 text-sm text-accent">{section.tagline}</p>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{section.description}</p>

      <span className="mt-8 flex items-center justify-between kicker text-faint">
        {pluralize(count, "post")}
        <ArrowRight
          className="h-4 w-4 transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
          aria-hidden
        />
      </span>
    </Link>
  );
}
