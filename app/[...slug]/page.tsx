import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { mdxComponents } from "@/components/MdxComponents";
import { PostCard } from "@/components/PostCard";
import { SectionIcon } from "@/components/SectionIcon";
import { SubcategoryBadge } from "@/components/SubcategoryBadge";
import { mdxOptions } from "@/lib/mdx";
import {
  findNode,
  getAllSlugs,
  getCategories,
  getPostSource,
  getPosts,
  getPostsDeep,
  getSiblingPosts,
  type CategoryNode,
  type PostNode,
} from "@/lib/posts";
import { getSection } from "@/lib/sections";
import { cn, formatDate, pluralize } from "@/lib/utils";

/** Pre-render every category listing and every article at build time. */
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const node = findNode(slug);
  if (!node) return {};

  if (node.kind === "post") {
    return {
      title: node.meta.title,
      description: node.meta.description,
      keywords: node.meta.tags,
      openGraph: {
        type: "article",
        title: node.meta.title,
        description: node.meta.description,
        publishedTime: node.meta.date || undefined,
        tags: node.meta.tags,
      },
    };
  }

  const section = getSection(node.slug);
  return {
    title: node.title,
    description: node.description || section?.description,
  };
}

export default async function ContentPage({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const node = findNode(slug);

  if (!node) notFound();

  return node.kind === "post" ? <Article post={node} /> : <CategoryListing category={node} />;
}

/* -------------------------------------------------------------------------- */
/*                              Category listing                              */
/* -------------------------------------------------------------------------- */

function CategoryListing({ category }: { category: CategoryNode }) {
  const section = getSection(category.slug);
  const isSectionRoot = category.slug.length === 1 && section !== null;

  const subcategories = getCategories(category);
  const posts = getPosts(category);
  const totalPosts = getPostsDeep(category).length;

  // A section root that only holds folders would otherwise show no writing at
  // all, so surface its most recent articles from further down the tree.
  const showDeepFeed = subcategories.length > 0 && posts.length === 0 && totalPosts > 0;
  const deepPosts = showDeepFeed ? getPostsDeep(category).slice(0, 6) : [];

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] grid-backdrop" />

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <Breadcrumbs slug={category.slug} className="mb-10" />

        <header className="mb-16 max-w-3xl">
          {isSectionRoot && section && (
            <div className="mb-6 flex items-center gap-2.5">
              <SectionIcon name={section.iconName} className="h-4 w-4 text-accent" />
              <span className="kicker text-accent">{section.tagline}</span>
            </div>
          )}

          <h1 className="display text-balance-pretty text-4xl text-ink sm:text-6xl">
            {category.title}
          </h1>

          {(category.description || (isSectionRoot && section)) && (
            <div className="mt-8 flex gap-6">
              <span aria-hidden className="mt-3 h-px w-12 shrink-0 bg-edge" />
              <p className="text-lg leading-relaxed text-muted">
                {category.description || section?.description}
              </p>
            </div>
          )}

          <p className="mt-8 kicker text-faint">
            {pluralize(totalPosts, "post")}
            {subcategories.length > 0 &&
              ` · ${pluralize(subcategories.length, "subcategory", "subcategories")}`}
          </p>
        </header>

        {subcategories.length > 0 && (
          <section className="mb-16">
            <SectionHeading>Browse</SectionHeading>
            <div className="grid gap-x-10 border-t border-edge sm:grid-cols-2 lg:grid-cols-3">
              {subcategories.map((child) => (
                <SubcategoryBadge key={child.url} category={child} />
              ))}
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section>
            <SectionHeading>Articles</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.url} post={post} />
              ))}
            </div>
          </section>
        )}

        {showDeepFeed && (
          <section>
            <SectionHeading>Latest in {category.title}</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              {deepPosts.map((post) => (
                <PostCard key={post.url} post={post} showPath />
              ))}
            </div>
          </section>
        )}

        {subcategories.length === 0 && posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-edge px-6 py-20 text-center">
            <p className="text-sm text-muted">Nothing here yet.</p>
            <p className="mt-2 text-sm text-faint">
              Add an <code className="font-mono">.mdx</code> file under{" "}
              <code className="font-mono">content/{category.slug.join("/")}/</code> and it will
              show up on the next build.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 kicker text-faint">{children}</h2>;
}

/* -------------------------------------------------------------------------- */
/*                                  Article                                   */
/* -------------------------------------------------------------------------- */

async function Article({ post }: { post: PostNode }) {
  const source = getPostSource(post);
  const { prev, next } = getSiblingPosts(post);
  const parentUrl = `/${post.slug.slice(0, -1).join("/")}`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Breadcrumbs slug={post.slug} className="mb-10" />

      <article>
        <header className="mb-14">
          <h1 className="display text-balance-pretty text-4xl leading-[1.1] text-ink sm:text-5xl">
            {post.meta.title}
          </h1>

          {post.meta.description && (
            <p className="mt-6 text-xl leading-relaxed text-muted">{post.meta.description}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-edge pt-5 kicker text-faint">
            {post.meta.date && (
              <time dateTime={post.meta.date}>{formatDate(post.meta.date)}</time>
            )}
            <span aria-hidden>&middot;</span>
            <span>{post.meta.readingTime} min read</span>
            {post.meta.author && (
              <>
                <span aria-hidden>&middot;</span>
                <span>{post.meta.author}</span>
              </>
            )}
            {post.meta.tags.length > 0 && (
              <span className="ml-auto hidden text-accent sm:inline">
                {post.meta.tags.join(" / ")}
              </span>
            )}
          </div>
        </header>

        <div className="prose prose-blog">
          <MDXRemote source={source} options={mdxOptions} components={mdxComponents} />
        </div>
      </article>

      <nav className="mt-20 border-t border-edge pt-8" aria-label="More posts">
        <div className="grid gap-4 sm:grid-cols-2">
          {prev ? <SiblingLink post={prev} direction="prev" /> : <span className="hidden sm:block" />}
          {next && <SiblingLink post={next} direction="next" />}
        </div>

        <Link
          href={parentUrl}
          className="mt-8 inline-flex items-center gap-2 kicker text-faint transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All posts
        </Link>
      </nav>
    </div>
  );
}

function SiblingLink({ post, direction }: { post: PostNode; direction: "prev" | "next" }) {
  const isNext = direction === "next";

  return (
    <Link
      href={post.url}
      className={cn(
        "group flex flex-col gap-2 rounded-2xl border border-edge bg-surface p-5 transition-colors hover:border-accent/50",
        isNext && "sm:text-right",
      )}
    >
      <span
        className={cn("flex items-center gap-1.5 kicker text-faint", isNext && "sm:justify-end")}
      >
        {!isNext && <ArrowLeft className="h-3 w-3" aria-hidden />}
        {isNext ? "Older" : "Newer"}
        {isNext && <ArrowRight className="h-3 w-3" aria-hidden />}
      </span>
      <span className="display text-lg text-ink transition-colors group-hover:text-accent-deep">
        {post.meta.title}
      </span>
    </Link>
  );
}
