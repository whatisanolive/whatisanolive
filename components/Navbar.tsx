"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { hueVar, SECTIONS, SECTION_ORDER } from "@/lib/sections";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { SectionIcon } from "./SectionIcon";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-edge-soft bg-ground/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="display text-xl text-ink">{site.name}</span>
          <span className="kicker text-faint transition-colors group-hover:text-accent">
            
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ul className="hidden items-center gap-1 md:flex">
          {SECTION_ORDER.map((key) => {
            const section = SECTIONS[key];
            const active = pathname === `/${key}` || pathname.startsWith(`/${key}/`);
            return (
              <li key={key}>
                <Link
                  href={`/${key}`}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent/12 font-medium text-accent-deep"
                      : "text-muted hover:bg-ground-alt hover:text-ink",
                  )}
                >
                  <SectionIcon
                    name={section.iconName}
                    className="h-4 w-4"
                    style={active ? undefined : { color: hueVar(key) }}
                  />
                  {section.title}
                </Link>
              </li>
            );
            })}
          </ul>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:text-ink md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-edge-soft md:hidden"
          >
            <ul className="space-y-1 px-6 py-4">
              {SECTION_ORDER.map((key) => {
                const section = SECTIONS[key];
                return (
                  <li key={key}>
                    <Link
                      href={`/${key}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-ground-alt"
                    >
                      <SectionIcon
                        name={section.iconName}
                        className="h-4 w-4 shrink-0"
                        style={{ color: hueVar(key) }}
                      />
                      <span className="text-sm font-medium text-ink">{section.title}</span>
                      <span className="ml-auto truncate text-xs text-faint">
                        {section.tagline}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
