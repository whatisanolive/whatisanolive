"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Shiki's ids are terse; show what a reader would actually call the language. */
const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  c: "C",
  cpp: "C++",
  css: "CSS",
  diff: "Diff",
  docker: "Dockerfile",
  dockerfile: "Dockerfile",
  go: "Go",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  md: "Markdown",
  mdx: "MDX",
  plaintext: "Text",
  py: "Python",
  python: "Python",
  rs: "Rust",
  rust: "Rust",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  toml: "TOML",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  yaml: "YAML",
  yml: "YAML",
};

type CodeBlockProps = React.ComponentPropsWithoutRef<"pre"> & {
  /** Injected by the `rehypeCodeSource` plugin in `lib/mdx.ts`. */
  "data-raw"?: string;
  "data-language"?: string;
};

export function CodeBlock({
  children,
  className,
  "data-raw": raw,
  "data-language": language,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(async () => {
    // `data-raw` is the exact source; innerText is a fallback for blocks that
    // somehow reach us unhighlighted.
    const text = raw ?? preRef.current?.innerText ?? "";
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied (insecure origin, permissions policy).
      // Selecting the block is a reasonable consolation.
      const node = preRef.current;
      if (!node) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [raw]);

  const label = language ? (LANGUAGE_LABELS[language] ?? language.toUpperCase()) : null;

  return (
    // Positioned against the enclosing figure (see `Figure`), so the badge and
    // button land in the filename bar when there is one, and in the padding
    // reserved at the top of the code when there is not.
    <div className="contents">
      <div className="pointer-events-none absolute right-3 top-2.5 z-10 flex items-center gap-2">
        {label && (
          <span className="rounded-md border border-edge-soft bg-ground-alt/90 px-2 py-1 font-mono text-[11px] leading-none text-muted backdrop-blur">
            {label}
          </span>
        )}
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
          className={cn(
            "pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md border border-edge-soft bg-ground-alt/90 backdrop-blur transition-all",
            "opacity-0 focus-visible:opacity-100 group-hover/code:opacity-100",
            copied
              ? "border-accent/50 text-accent opacity-100"
              : "text-muted hover:border-edge hover:text-ink",
          )}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      </div>

      <pre
        ref={preRef}
        className={cn("overflow-x-auto", className)}
        data-language={language}
        {...props}
      >
        {children}
      </pre>

      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
