"use client";

import { Moon, Sun } from "lucide-react";

/**
 * Light/dark switch.
 *
 * Deliberately holds no React state: the current theme lives in
 * `document.documentElement.dataset.theme`, and both icons are rendered with
 * CSS deciding which is visible. That avoids a hydration mismatch (the server
 * cannot know the visitor's stored preference) without needing an effect to
 * sync state after mount.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private browsing can refuse storage; the toggle still works for
      // this page view.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light or dark theme"
      title="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
      <Moon className="h-4 w-4 dark:hidden" aria-hidden />
    </button>
  );
}
