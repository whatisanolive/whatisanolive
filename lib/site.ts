/** One place to change before deploying. */
export const site = {
  name: "whatisanolive",
  title: "engineering notes",
  description:
    "A developer notebook on systems, algorithms, and everything that refuses a category.",
  /** No trailing slash. Used for canonical URLs, RSS, and the sitemap. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
  author: "Ish",
  /** Contact address, linked from the footer. */
  email: "ish2k21989@gmail.com",
  locale: "en",
} as const;
