import {
  AlertTriangle,
  ArrowUpRight,
  Flame,
  Info,
  Lightbulb,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { Children, isValidElement } from "react";

import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";

/* -------------------------------------------------------------------------- */
/*                              Heading anchors                               */
/* -------------------------------------------------------------------------- */

/** Flatten a React subtree to plain text, for deriving heading ids. */
function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Headings become linkable targets, with the anchor revealed on hover. */
function heading(level: 2 | 3 | 4) {
  const Tag = `h${level}` as const;
  const sizes = {
    2: "mt-14 mb-5 text-2xl font-semibold tracking-tight",
    3: "mt-10 mb-4 text-xl font-semibold tracking-tight",
    4: "mt-8 mb-3 text-lg font-semibold tracking-tight",
  } as const;

  const Heading = ({ children, id, ...props }: ComponentPropsWithoutRef<"h2">) => {
    const anchor = id ?? slugify(textOf(children));
    return (
      <Tag id={anchor} className={cn("scroll-mt-24 text-ink", sizes[level])} {...props}>
        {children}
        <a href={`#${anchor}`} className="heading-anchor" aria-label="Link to this section">
          <LinkIcon className="inline h-4 w-4 align-baseline" />
        </a>
      </Tag>
    );
  };

  Heading.displayName = `MdxH${level}`;
  return Heading;
}

/* -------------------------------------------------------------------------- */
/*                            Authoring components                            */
/* -------------------------------------------------------------------------- */

const CALLOUT_VARIANTS = {
  note: { icon: Info, hue: "#2c6baf", label: "Note" },
  tip: { icon: Lightbulb, hue: "#2a7355", label: "Tip" },
  warning: { icon: AlertTriangle, hue: "#9a6510", label: "Warning" },
  danger: { icon: Flame, hue: "#b3405e", label: "Careful" },
} as const;

export type CalloutVariant = keyof typeof CALLOUT_VARIANTS;

/** `<Callout type="warning" title="...">…</Callout>` */
export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: CalloutVariant;
  title?: string;
  children: ReactNode;
}) {
  const variant = CALLOUT_VARIANTS[type] ?? CALLOUT_VARIANTS.note;
  const Icon = variant.icon;

  return (
    <aside
      style={
        {
          "--hue": variant.hue,
          borderColor: `color-mix(in oklab, ${variant.hue} 30%, transparent)`,
          backgroundColor: `color-mix(in oklab, ${variant.hue} 6%, transparent)`,
        } as CSSProperties
      }
      className="my-7 flex gap-3.5 rounded-xl border p-5 text-[0.95em] leading-relaxed"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: variant.hue }} aria-hidden />
      <div className="min-w-0 flex-1 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        <p className="mb-1.5 kicker" style={{ color: variant.hue }}>
          {title ?? variant.label}
        </p>
        {children}
      </div>
    </aside>
  );
}

/**
 * A compact complexity table. Written for DSA posts, where the cost of a
 * solution deserves to be stated up front rather than buried in prose.
 */
export function Complexity({
  time,
  space,
  note,
}: {
  time: string;
  space: string;
  note?: string;
}) {
  return (
    // `not-prose` keeps the typography plugin from indenting <dd>; this widget
    // brings all of its own styling.
    <div className="not-prose my-7 overflow-hidden rounded-xl border border-accent/30 bg-accent/6">
      <dl className="grid grid-cols-2 divide-x divide-accent/20">
        {[
          ["Time", time],
          ["Space", space],
        ].map(([label, value]) => (
          <div key={label} className="px-5 py-4">
            <dt className="kicker text-accent/80">{label}</dt>
            <dd className="mt-1.5 font-mono text-base text-accent-deep">{value}</dd>
          </div>
        ))}
      </dl>
      {note && (
        <p className="border-t border-accent/20 px-5 py-3 text-xs leading-relaxed text-muted">
          {note}
        </p>
      )}
    </div>
  );
}

/** Side-by-side comparison, e.g. naive vs. optimised. */
export function Columns({ children }: { children: ReactNode }) {
  return (
    <div className="my-7 grid gap-4 md:grid-cols-2 [&>*]:my-0">
      {Children.map(children, (child) => child)}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Element overrides                             */
/* -------------------------------------------------------------------------- */

function Anchor({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) {
  const isExternal = /^https?:\/\//.test(href);

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-accent-deep underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
        {...props}
      >
        {children}
        <ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5 align-baseline text-muted" aria-hidden />
      </a>
    );
  }

  // In-page anchors must stay plain <a>; Link would try to route them.
  if (href.startsWith("#")) {
    return (
      <a href={href} className="text-accent-deep underline decoration-accent/40 underline-offset-4" {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="font-medium text-accent-deep underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
      {...props}
    >
      {children}
    </Link>
  );
}

type FigureProps = ComponentPropsWithoutRef<"figure"> & {
  "data-rehype-pretty-code-figure"?: string;
};

/** Wraps highlighted code in a card; leaves ordinary figures alone. */
function Figure({ children, className, ...props }: FigureProps) {
  const isCode = "data-rehype-pretty-code-figure" in props;

  if (!isCode) {
    return (
      <figure className={cn("my-7", className)} {...props}>
        {children}
      </figure>
    );
  }

  return (
    <figure
      className={cn(
        "group/code relative my-7 overflow-hidden rounded-xl border border-edge bg-surface",
        className,
      )}
      {...props}
    >
      {children}
    </figure>
  );
}

type FigcaptionProps = ComponentPropsWithoutRef<"figcaption"> & {
  "data-rehype-pretty-code-title"?: string;
};

/** ```ts title="server.ts" renders as a filename tab above the code. */
function Figcaption({ children, className, ...props }: FigcaptionProps) {
  const isCodeTitle = "data-rehype-pretty-code-title" in props;

  return (
    <figcaption
      className={cn(
        isCodeTitle
          ? "border-b border-edge-soft bg-ground-alt py-2.5 pl-4 pr-28 font-mono text-xs text-muted"
          : "mt-2 text-center text-sm text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </figcaption>
  );
}

export const mdxComponents = {
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  a: Anchor,
  pre: CodeBlock,
  figure: Figure,
  figcaption: Figcaption,

  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="my-8 border-l-2 border-accent/50 pl-6 [&>p]:my-2"
      {...props}
    />
  ),

  hr: () => <hr className="my-14 border-edge" />,

  table: (props: ComponentPropsWithoutRef<"table">) => (
    <div className="my-7 overflow-x-auto rounded-xl border border-edge">
      <table className="my-0 w-full border-collapse text-sm" {...props} />
    </div>
  ),

  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th
      className="border-b border-edge bg-ground-alt px-4 py-3 text-left kicker text-muted"
      {...props}
    />
  ),

  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td className="border-b border-edge-soft px-4 py-3 align-top" {...props} />
  ),

  img: ({ alt = "", ...props }: ComponentPropsWithoutRef<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      loading="lazy"
      decoding="async"
      className="my-7 w-full rounded-xl border border-edge"
      {...props}
    />
  ),

  // Available to every post without an import.
  Callout,
  Complexity,
  Columns,
};
