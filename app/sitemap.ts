import type { MetadataRoute } from "next";

import { getAllCategories, getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map((post) => ({
    url: `${site.url}${post.url}`,
    lastModified: post.meta.date ? new Date(post.meta.date) : undefined,
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }));

  const categories = getAllCategories().map((category) => ({
    url: `${site.url}${category.url}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    ...categories,
    ...posts,
  ];
}
