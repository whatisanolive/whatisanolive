import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { getCategories, getPostsDeep, type CategoryNode } from "@/lib/posts";
import { pluralize } from "@/lib/utils";

/** A clickable folder tile: one rung further down the category tree. */
export function SubcategoryBadge({ category }: { category: CategoryNode }) {
  const postCount = getPostsDeep(category).length;
  const childCount = getCategories(category).length;

  return (
    <Link
      href={category.url}
      className="group flex items-baseline gap-3 border-b border-edge py-4 transition-colors hover:border-accent"
    >
      <span className="min-w-0 flex-1">
        <span className="display block truncate text-lg text-ink transition-colors group-hover:text-accent-deep">
          {category.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-faint">
          {childCount > 0 && `${pluralize(childCount, "subcategory", "subcategories")} · `}
          {pluralize(postCount, "post")}
        </span>
      </span>

      <ArrowUpRight
        className="h-4 w-4 shrink-0 text-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
        aria-hidden
      />
    </Link>
  );
}
