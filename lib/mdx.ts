import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import type { Element, Root } from "hast";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import { toString } from "hast-util-to-string";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";

/**
 * Stash each block's plain source on the `<pre>` as `data-raw`, so the copy
 * button ships the original text rather than the highlighted markup.
 *
 * Runs *after* rehype-pretty-code, joining the one-element-per-line output that
 * Shiki produces. rehype-pretty-code happens to leave newline text nodes between
 * lines, but that is an implementation detail; joining `data-line` children
 * reconstructs the source whether or not those nodes survive.
 *
 * hast stores properties under their literal attribute names, so the keys here
 * are `data-line` and `data-raw`, not their camelCase forms.
 */
function rehypeCodeSource() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") return;

      const code = node.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "code",
      );
      if (!code) return;

      const lines = code.children.filter(
        (child): child is Element =>
          child.type === "element" && child.properties?.["data-line"] !== undefined,
      );

      const source = lines.length
        ? lines.map((line) => toString(line)).join("\n")
        : toString(code);

      node.properties ??= {};
      // Stripped notation comments leave trailing spaces behind; nobody wants
      // those pasted into their editor.
      node.properties["data-raw"] = source.replace(/[ \t]+$/gm, "");
    });
  };
}

const prettyCodeOptions: PrettyCodeOptions = {
  // Two themes, emitted as `--shiki-light` / `--shiki-dark` custom properties
  // on every token. Highlighting happens at build time, so a single baked theme
  // would stay light in dark mode; `globals.css` picks the variable to use.
  theme: { light: "vitesse-light", dark: "vitesse-dark" },
  // We paint the card ourselves; Shiki's own background would fight the palette.
  keepBackground: false,
  // Inline code is styled as a chip in `globals.css`; running it through Shiki
  // would stamp an inline colour on every backtick span and override that.
  bypassInlineCode: true,
  defaultLang: { block: "plaintext" },
  // Comment notation: `// [!code highlight]`, `// [!code ++]`, `// [!code focus]`
  // and `[!code word:foo]`. The transformers strip the marker comment from the
  // output, so `data-raw` (built afterwards) stays clean for copying too.
  transformers: [
    transformerNotationHighlight({ matchAlgorithm: "v3" }),
    transformerNotationWordHighlight({ matchAlgorithm: "v3" }),
    transformerNotationDiff({ matchAlgorithm: "v3" }),
    transformerNotationFocus({ matchAlgorithm: "v3" }),
  ],
  onVisitLine(element) {
    // Empty lines collapse to zero height without a child node.
    if (element.children.length === 0) {
      element.children = [{ type: "text", value: " " }];
    }
  },
  onVisitHighlightedLine(element) {
    element.properties.className = [...(element.properties.className ?? []), "line--highlighted"];
  },
  onVisitHighlightedChars(element) {
    element.properties.className = [...(element.properties.className ?? []), "chars--highlighted"];
  },
};

export const mdxOptions: MDXRemoteProps["options"] = {
  // Content is authored locally and trusted, so JSX expressions stay enabled;
  // next-mdx-remote v6 strips them by default.
  blockJS: false,
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      [rehypePrettyCode, prettyCodeOptions],
      // `strict: false` keeps a stray macro from failing the whole build. The
      // default output includes MathML, which is what screen readers announce.
      [rehypeKatex, { strict: false, throwOnError: false }],
      rehypeCodeSource,
    ],
  },
};
