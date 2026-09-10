import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { humanize, toDayKey } from "./utils";

export const CONTENT_DIR = path.join(process.cwd(), "content");

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type PostMeta = {
  title: string;
  description: string;
  /** ISO date string from frontmatter. */
  date: string;
  tags: string[];
  author?: string;
  draft: boolean;
  /** Estimated minutes to read, from the body word count. */
  readingTime: number;
  wordCount: number;
};

export type PostNode = {
  kind: "post";
  /** Directory/file name this node was reached by. */
  segment: string;
  /** Full path from the content root, e.g. ["tech","backend","nodejs","event-loop"]. */
  slug: string[];
  /** Route, e.g. "/tech/backend/nodejs/event-loop". */
  url: string;
  /** Absolute path on disk. */
  filePath: string;
  meta: PostMeta;
};

export type CategoryNode = {
  kind: "category";
  segment: string;
  slug: string[];
  url: string;
  title: string;
  description: string;
  /** Sort key from `_meta.json`; lower sorts first. */
  order: number;
  children: ContentNode[];
};

export type ContentNode = CategoryNode | PostNode;

/** Optional `_meta.json` inside any folder, for names `nodejs` -> `Node.js`. */
type CategoryMeta = {
  title?: string;
  description?: string;
  order?: number;
};

/* -------------------------------------------------------------------------- */
/*                              Tree construction                             */
/* -------------------------------------------------------------------------- */

const isMdx = (name: string) => /\.mdx?$/.test(name);

/** Files and folders that never become routes. */
const isHidden = (name: string) => name.startsWith(".") || name.startsWith("_");

function readCategoryMeta(dir: string): CategoryMeta {
  const metaPath = path.join(dir, "_meta.json");
  if (!fs.existsSync(metaPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf8")) as CategoryMeta;
  } catch {
    console.warn(`[content] Ignoring malformed ${path.relative(process.cwd(), metaPath)}`);
    return {};
  }
}

function readPost(slug: string[], filePath: string): PostNode {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const segment = slug[slug.length - 1];

  const words = content.trim().split(/\s+/).filter(Boolean).length;

  return {
    kind: "post",
    segment,
    slug,
    url: `/${slug.join("/")}`,
    filePath,
    meta: {
      title: typeof data.title === "string" ? data.title : humanize(segment),
      description: typeof data.description === "string" ? data.description : "",
      date:
        typeof data.date === "string"
          ? data.date
          : data.date instanceof Date
            ? toDayKey(data.date)
            : "",
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      author: typeof data.author === "string" ? data.author : undefined,
      draft: data.draft === true,
      readingTime: Math.max(1, Math.round(words / 220)),
      wordCount: words,
    },
  };
}

/** Newest first; undated posts sink to the bottom. */
function byDateDesc(a: PostNode, b: PostNode) {
  if (!a.meta.date) return 1;
  if (!b.meta.date) return -1;
  return b.meta.date.localeCompare(a.meta.date);
}

function readCategory(slug: string[], dir: string): CategoryNode {
  const meta = readCategoryMeta(dir);
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const categories: CategoryNode[] = [];
  const posts: PostNode[] = [];

  for (const entry of entries) {
    if (isHidden(entry.name)) continue;
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      categories.push(readCategory([...slug, entry.name], full));
    } else if (entry.isFile() && isMdx(entry.name)) {
      const post = readPost([...slug, entry.name.replace(/\.mdx?$/, "")], full);
      // Drafts stay visible while writing, but never ship.
      if (post.meta.draft && process.env.NODE_ENV === "production") continue;
      posts.push(post);
    }
  }

  categories.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  posts.sort(byDateDesc);

  const segment = slug[slug.length - 1] ?? "";

  return {
    kind: "category",
    segment,
    slug,
    url: slug.length ? `/${slug.join("/")}` : "/",
    title: meta.title ?? humanize(segment),
    description: meta.description ?? "",
    order: meta.order ?? Number.MAX_SAFE_INTEGER,
    // Folders before articles, so a listing reads as "drill down, then read".
    children: [...categories, ...posts],
  };
}

/**
 * The whole content tree, rooted at an unnamed category for `content/` itself.
 *
 * Cached in production (the filesystem cannot change between requests) but read
 * fresh in development, so editing an `.mdx` file shows up on the next refresh.
 */
let cachedTree: CategoryNode | null = null;

export function getContentTree(): CategoryNode {
  if (cachedTree && process.env.NODE_ENV === "production") return cachedTree;

  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn("[content] No `content/` directory found; the site will be empty.");
    cachedTree = {
      kind: "category",
      segment: "",
      slug: [],
      url: "/",
      title: "",
      description: "",
      order: 0,
      children: [],
    };
  } else {
    cachedTree = readCategory([], CONTENT_DIR);
  }

  return cachedTree;
}

/* -------------------------------------------------------------------------- */
/*                                  Lookups                                   */
/* -------------------------------------------------------------------------- */

/** Resolve a URL slug to a category or a post, at any depth. */
export function findNode(slug: string[]): ContentNode | null {
  let node: ContentNode = getContentTree();

  for (const segment of slug) {
    if (node.kind !== "category") return null;
    const next: ContentNode | undefined = node.children.find((child) => child.segment === segment);
    if (!next) return null;
    node = next;
  }

  return node;
}

export function getCategories(node: CategoryNode): CategoryNode[] {
  return node.children.filter((c): c is CategoryNode => c.kind === "category");
}

export function getPosts(node: CategoryNode): PostNode[] {
  return node.children.filter((c): c is PostNode => c.kind === "post");
}

/** Every post beneath a category, at any depth, newest first. */
export function getPostsDeep(node: CategoryNode): PostNode[] {
  const out: PostNode[] = [];
  const walk = (current: CategoryNode) => {
    for (const child of current.children) {
      if (child.kind === "post") out.push(child);
      else walk(child);
    }
  };
  walk(node);
  return out.sort(byDateDesc);
}

export function getAllPosts(): PostNode[] {
  return getPostsDeep(getContentTree());
}

export function getRecentPosts(limit = 5): PostNode[] {
  return getAllPosts().slice(0, limit);
}

/** Every category beneath a node, at any depth. */
export function getAllCategories(): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (node: CategoryNode) => {
    for (const child of node.children) {
      if (child.kind === "category") {
        out.push(child);
        walk(child);
      }
    }
  };
  walk(getContentTree());
  return out;
}

export type Crumb = { title: string; url: string; slug: string[] };

/** Titled trail from the content root down to `slug`, root excluded. */
export function getBreadcrumbs(slug: string[]): Crumb[] {
  const crumbs: Crumb[] = [];
  let node: ContentNode = getContentTree();

  for (const segment of slug) {
    if (node.kind !== "category") break;
    const next: ContentNode | undefined = node.children.find((c) => c.segment === segment);
    if (!next) break;
    crumbs.push({
      title: next.kind === "post" ? next.meta.title : next.title,
      url: next.url,
      slug: next.slug,
    });
    node = next;
  }

  return crumbs;
}

/** Previous/next within the same folder, ordered as the listing shows them. */
export function getSiblingPosts(post: PostNode): { prev: PostNode | null; next: PostNode | null } {
  const parent = findNode(post.slug.slice(0, -1));
  if (!parent || parent.kind !== "category") return { prev: null, next: null };

  const siblings = getPosts(parent);
  const index = siblings.findIndex((p) => p.url === post.url);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: siblings[index - 1] ?? null,
    next: siblings[index + 1] ?? null,
  };
}

/** The MDX body, frontmatter stripped. */
export function getPostSource(post: PostNode): string {
  return matter(fs.readFileSync(post.filePath, "utf8")).content;
}

/* -------------------------------------------------------------------------- */
/*                                   Routing                                  */
/* -------------------------------------------------------------------------- */

/** Every category and post path, for `generateStaticParams`. */
export function getAllSlugs(): string[][] {
  return [
    ...getAllCategories().map((c) => c.slug),
    ...getAllPosts().map((p) => p.slug),
  ];
}

/* -------------------------------------------------------------------------- */
/*                              Consistency stats                             */
/* -------------------------------------------------------------------------- */

export type ActivityDay = { date: string; count: number; level: number };

function levelFor(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

/**
 * One entry per day for the trailing `days` window, so the calendar renders a
 * full grid rather than only the days that happen to have posts.
 *
 * Counts publications from the content tree. To track commits instead, swap the
 * `counts` map for a GitHub contributions fetch — the shape is identical.
 */
export function getActivityData(days = 365): ActivityDay[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    const day = post.meta.date.slice(0, 10);
    if (day) counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0); // midday avoids DST edges when stepping backwards

  const out: ActivityDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = toDayKey(date);
    const count = counts.get(key) ?? 0;
    out.push({ date: key, count, level: levelFor(count) });
  }

  return out;
}

export type ActivityStats = {
  totalPosts: number;
  postsInWindow: number;
  activeDays: number;
  currentStreakWeeks: number;
  longestStreakWeeks: number;
};

/**
 * Weekly streaks: a blog cadence is measured in weeks, not days.
 *
 * Buckets run backwards from today so the most recent bucket is the last seven
 * days. Bucketing forwards from the start of the window would leave a one-day
 * remainder at the end (365 = 52*7 + 1), which would report a current streak of
 * zero on six days out of seven.
 */
export function getActivityStats(data: ActivityDay[]): ActivityStats {
  const weeks: number[] = [];
  for (let end = data.length; end > 0; end -= 7) {
    const start = Math.max(0, end - 7);
    weeks.unshift(data.slice(start, end).reduce((sum, day) => sum + day.count, 0));
  }

  let longest = 0;
  let running = 0;
  for (const total of weeks) {
    running = total > 0 ? running + 1 : 0;
    longest = Math.max(longest, running);
  }

  let current = 0;
  for (let i = weeks.length - 1; i >= 0 && weeks[i] > 0; i--) current++;

  return {
    totalPosts: getAllPosts().length,
    postsInWindow: data.reduce((sum, day) => sum + day.count, 0),
    activeDays: data.filter((day) => day.count > 0).length,
    currentStreakWeeks: current,
    longestStreakWeeks: longest,
  };
}
