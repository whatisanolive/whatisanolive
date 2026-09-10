import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { getBreadcrumbs, type PostNode } from "@/lib/posts";
import { cn, formatDate } from "@/lib/utils";

type PostCardProps = {
  post: PostNode;
  /**
   * Show the category trail above the title. Useful anywhere a post appears
   * outside its own folder, such as the homepage feed.
   */
  showPath?: boolean;
  /** Pastel accent override, for cards shown against the dark homepage. */
  accent?: string;
};

export function PostCard({ post, showPath = false, accent }: PostCardProps) {
  // Drop the post itself; only its ancestors describe where it lives.
  const trail = getBreadcrumbs(post.slug).slice(0, -1);

  return (
    <article
      className="group relative"
      style={accent ? ({ "--accent": accent } as React.CSSProperties) : undefined}
    >
      <Link
        href={post.url}
        className={cn(
          "flex h-full flex-col gap-3 rounded-2xl border border-edge bg-surface p-6 transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-accent/50",
        )}
      >
        {showPath && trail.length > 0 && (
          <p className="kicker text-accent">{trail.map((crumb) => crumb.title).join(" / ")}</p>
        )}

        <h3 className="display text-balance-pretty text-xl text-ink transition-colors group-hover:text-accent-deep">
          {post.meta.title}
        </h3>

        {post.meta.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">
            {post.meta.description}
          </p>
        )}

        {post.meta.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 pt-0.5">
            {post.meta.tags.slice(0, 4).map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-edge-soft px-2.5 py-0.5 font-mono text-[11px] text-faint"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center gap-3 border-t border-edge-soft pt-4 text-xs text-faint">
          {post.meta.date && (
            <time dateTime={post.meta.date}>{formatDate(post.meta.date)}</time>
          )}
          <span aria-hidden>&middot;</span>
          <span>{post.meta.readingTime} min</span>
          <ArrowRight
            className="ml-auto h-4 w-4 transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
            aria-hidden
          />
        </div>
      </Link>
    </article>
  );
}
