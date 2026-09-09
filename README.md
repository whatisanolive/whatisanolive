# Developer blog

A dark-first developer blog built on the Next.js App Router, with an MDX content
tree that supports **arbitrarily deep category nesting**.

- Next.js 16 (App Router, React 19, Turbopack) · TypeScript
- Tailwind CSS v4 + `@tailwindcss/typography`, themed with semantic CSS variables
- Fraunces (display serif) + Geist Sans / Geist Mono, via `next/font`
- `next-mdx-remote/rsc` + `gray-matter`
- `remark-math` / `rehype-katex` for LaTeX, `rehype-pretty-code` / Shiki for code
- A hand-rolled SVG consistency heatmap (no charting dependency)

```bash
npm run dev     # http://localhost:3000
npm run build   # prerenders every category and post
npm start
```

## How routing works

There is one dynamic route, `app/[...slug]/page.tsx`. It resolves a URL against the
content tree built in `lib/posts.ts` and renders whichever it finds:

| Resolves to | Renders |
| --- | --- |
| A directory | A listing page: subfolder tiles, then post cards |
| An `.mdx` file | The full article |
| Nothing | `app/not-found.tsx` |

`generateStaticParams` enumerates every category and post, so the whole site is static
HTML after `npm run build`.

## Adding content

Create a folder, drop in an `.mdx` file. That is the entire workflow — no registry to
update, no route to add. Nesting is unbounded:

```
content/
└── tech/
    └── backend/
        └── nodejs/
            └── event-loop.mdx   ->  /tech/backend/nodejs/event-loop
```

`content/tech/backend/nodejs/` also becomes a browsable listing at
`/tech/backend/nodejs`.

### Frontmatter

```yaml
---
title: "The Node.js Event Loop, Phase by Phase"
description: "One or two sentences; used on cards, in <meta>, and in the RSS feed."
date: "2026-08-24"          # ISO. Drives ordering and the heatmap.
tags: ["nodejs", "libuv"]
author: "Ish"
draft: false                # true keeps it visible in dev, out of the build
---
```

Only `title` is really required; everything else degrades sensibly. Reading time is
computed from the word count.

### Naming a folder

Folder names become URLs, so they are lowercase and hyphenated. When the display name
differs, add a `_meta.json`:

```json
{
  "title": "Node.js",
  "description": "The runtime, its concurrency model, and where it stops being magic.",
  "order": 1
}
```

`order` sorts sibling folders (lower first); posts always sort by date, newest first.
Files and folders starting with `_` or `.` are ignored by the router.

## Writing in MDX

Everything below works in any post with no imports.

**Math** — `$O(n \log n)$` inline, `$$ ... $$` for display.

**Code** — fenced blocks get a language badge and a copy button automatically:

````md
```python title="knapsack.py" showLineNumbers {6-8}
```
````

- `title="..."` renders a filename bar
- `showLineNumbers` turns on the gutter
- `{6-8}` or `{2,5-7}` highlights lines by number
- `// [!code highlight]`, `// [!code ++]`, `// [!code --]`, `// [!code focus]`
  and `// [!code word:foo]` work as inline comment notation, and are stripped from
  both the rendered output and the copied text

**Components** — available globally via `components/MdxComponents.tsx`:

```mdx
<Callout type="warning" title="Optional heading">Body text.</Callout>

<Complexity time="O(n)" space="O(h)" note="h is tree height." />

<Columns>
  ...two children, side by side on desktop...
</Columns>
```

`Callout` accepts `note`, `tip`, `warning`, `danger`.

> Because MDX treats `{` as the start of a JS expression, braces in ordinary prose need
> backticks around them. Inside code fences and `$…$` math they are fine.

## Theming

Two themes, four grounds each. The homepage is neutral grey; each pillar is its own
world — blue for Tech, green for DSA, violet for Blank Canvas — and the navbar and
footer repaint with it.

|         | Home            | Sections                          |
| ---     | ---             | ---                               |
| Light   | light grey      | pale blue / mint / lilac paper    |
| Dark    | `#1a1a1e` grey  | the same hues at that same depth  |

The light home is deliberately light so that moving into a section is a shift in *hue*
rather than a jump in brightness.

That works through **semantic tokens** rather than per-section class names. Every
component is written once against `bg-ground`, `text-ink`, `border-edge`, `text-accent`,
`text-muted`. `app/globals.css` defines those variables on `:root` (dark) and redefines
them under `[data-pillar="tech"]`, `[data-pillar="dsa"]` and `[data-pillar="blank-canvas"]`:

```
:root                                        light home
:root:has([data-pillar="tech"])              light blue paper
[data-theme="dark"]                          dark home
[data-theme="dark"]:has([data-pillar="tech"]) dark blue
```

`[data-theme="dark"]` lives on `<html>` and matches `:root` for specificity, so the dark
blocks win on source order. Every colour is generated and contrast-checked against
**both** the page ground and the raised card surface — in light themes the ground is the
harder background, in dark themes the card is. Targets: body 8:1, muted 6:1, faint 4.5:1.

`components/SiteShell.tsx` stamps `data-pillar` on the wrapper. `app/[...slug]/layout.tsx`
reads the pillar from the first slug segment, so the palette is applied server-side with
no theme flash. This is also why the navbar and footer live in `SiteShell` rather than
the root layout: they have to sit *inside* the themed element to inherit its variables.

Where all three pillars appear at once (the nav, the homepage cards) the per-section
hues `--hue-tech` / `--hue-dsa` / `--hue-blank-canvas` are used. Those are pastel on the
dark ground and deepened on light paper, so one reference reads correctly in both.

Adding a pillar means an entry in `lib/sections.ts`, a light and a dark `[data-pillar]`
block in `globals.css`, and a matching folder under `content/`.

### The theme switch

`components/ThemeToggle.tsx` writes `data-theme` on `<html>` and stores the choice in
`localStorage`. It holds no React state — both icons render and CSS picks one — so there
is no hydration mismatch and no post-mount effect. A small blocking script in
`app/layout.tsx` applies the stored value before first paint, so someone who chose dark
never sees a flash of light.

**Light is the default for everyone.** The script does not consult
`prefers-color-scheme`, so a first visit lands on the light palette whatever the OS is
set to; dark is opt-in through the toggle and sticky afterwards.

Code blocks are highlighted at **build time**, so a single baked theme would stay light in
dark mode. `rehype-pretty-code` is configured with both `vitesse-light` and `vitesse-dark`;
it emits `--shiki-light` / `--shiki-dark` on every token and `globals.css` chooses.

### A cascade trap worth knowing

The article styles in `globals.css` are deliberately **not** wrapped in
`@layer components`. The typography plugin emits into Tailwind's `utilities` layer, and
layer order beats specificity — anything in `components` loses to `.prose` no matter how
specific. Unlayered CSS outranks every layer, which is what makes the `--tw-prose-*`
overrides (and the `pre` background reset) actually apply.

## The consistency heatmap

`getActivityData()` in `lib/posts.ts` emits one entry per day for the trailing year,
counting post publications. To track GitHub commits instead, replace the `counts` map
with a contributions fetch — `ActivityHeatmap` takes the same `{ date, count, level }`
shape either way.

`components/ActivityHeatmap.tsx` draws the calendar itself rather than using
`react-activity-calendar`. That library lays columns out as fixed seven-day slices of the
data array, so every month begins wherever the previous one ended; giving each month its
own run of columns is not expressible through its props, and faking it with filler
entries would mean inventing dates that then appear in tooltips and totals. Owning the
SVG also means the squares take their colour from CSS (`data-level` attributes), so they
follow the theme toggle — and the component ships **no client JavaScript at all**.

Within a month the rows still mean weekdays, so a month opening on a Thursday starts
partway down its first column. Light-mode greens are deliberately dark: on a pale ground
a pastel green sits at roughly 1.2:1 against the page and reads as an empty square.

## Before deploying

Set the canonical URL, which feeds `<meta>` tags, `sitemap.xml`, and `rss.xml`:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.dev
```

The rest of the site identity — name, description, author — is in `lib/site.ts`.
# whatisanolive
