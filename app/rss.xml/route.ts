import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

/** Minimal XML escaping — titles and descriptions are author-written prose. */
function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const dynamic = "force-static";

export function GET() {
  const posts = getAllPosts();
  const updated = posts[0]?.meta.date;

  const items = posts
    .map((post) => {
      const link = `${site.url}${post.url}`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.meta.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <description>${escapeXml(post.meta.description)}</description>`,
        post.meta.date
          ? `      <pubDate>${new Date(post.meta.date).toUTCString()}</pubDate>`
          : "",
        ...post.meta.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>${site.locale}</language>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
${updated ? `    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
