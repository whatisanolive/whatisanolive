/**
 * The three top-level pillars.
 *
 * Colour lives in CSS, not here. Each pillar has a `[data-pillar]` block in
 * `globals.css` that redefines the semantic tokens (`--ground`, `--ink`,
 * `--accent`, …), so components can be written once against `bg-ground` /
 * `text-accent` and retheme automatically. The one value kept here is the
 * pastel used to preview a section on the dark homepage, where the page's own
 * accent belongs to the homepage rather than the pillar.
 */

export type SectionKey = "tech" | "dsa" | "blank-canvas";

export type Section = {
  key: SectionKey;
  title: string;
  tagline: string;
  description: string;
  /** Resolved to a component in `components/SectionIcon.tsx`. */
  iconName: "cpu" | "binary" | "palette";
};

export const SECTIONS: Record<SectionKey, Section> = {
  tech: {
    key: "tech",
    title: "Tech",
    tagline: "Systems, servers & the math under the model",
    description:
      "Software engineering, system design, backend architecture, and the theory behind machine learning.",
    iconName: "cpu",
  },
  dsa: {
    key: "dsa",
    title: "DSA",
    tagline: "Patterns, invariants & the cost of everything",
    description:
      "My daily dose of dopamine! The patterns makes it fun and data structures give things order.",
    iconName: "binary",
  },
  "blank-canvas": {
    key: "blank-canvas",
    title: "Blank Canvas",
    tagline: "Essays, experiments & everything else",
    description:
      "Personal essays, creative design experiments, summaries of books, and thoughts that refuse a category.",
    iconName: "palette",
  },
};

export const SECTION_ORDER: SectionKey[] = ["tech", "dsa", "blank-canvas"];

/**
 * The CSS variable holding this section's hue.
 *
 * Defined once per theme in `globals.css`, so the same reference resolves to a
 * pastel on the dark homepage and to a deeper, readable tone on light paper.
 */
export function hueVar(key: SectionKey) {
  return `var(--hue-${key})`;
}

export function isSectionKey(value: string): value is SectionKey {
  return value in SECTIONS;
}

/** The pillar a slug belongs to, decided by its first segment. */
export function getSection(slug: string[]): Section | null {
  const root = slug[0];
  return root && isSectionKey(root) ? SECTIONS[root] : null;
}
