"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { Waves } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useT } from "@/shared/lib/i18n/client";
import { LocaleSwitch } from "@/features/locale-switch/locale-switch";
import { EASE_FLUID } from "@/shared/lib/motion";

export function SiteHeader() {
  const t = useT();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  const links = [
    { href: "/", label: t.common.home },
    { href: "/map/water", label: t.common.map },
    { href: "/methodology", label: t.common.methodology },
  ];

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: EASE_FLUID, delay: 0.2 }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled && "glass-strong border-x-0 border-t-0"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="border-glow/30 bg-glow/10 text-glow group-hover:ring-glow flex size-8 items-center justify-center rounded-lg border transition-all duration-500">
            <Waves className="size-4" strokeWidth={1.75} />
          </span>
          <span className="font-display text-sm font-semibold tracking-tight">
            {t.common.appName}
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href.split("/").slice(0, 2).join("/"));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm transition-colors duration-300",
                  active ? "text-foam" : "text-mist/60 hover:text-foam"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="glass absolute inset-0 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>

        <LocaleSwitch />
      </nav>
    </motion.header>
  );
}
