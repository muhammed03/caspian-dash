"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { useT } from "@/shared/lib/i18n/client";
import { LocaleSwitch } from "@/features/locale-switch/locale-switch";

export function SiteHeader() {
  const t = useT();
  const pathname = usePathname();
  const onMap = pathname?.startsWith("/map");

  const links = [
    { href: "/", label: t.common.home, match: (p: string) => p === "/" },
    { href: "/map/water", label: t.common.map, match: (p: string) => p.startsWith("/map") },
    { href: "/academy/journey", label: t.academy.title, match: (p: string) => p.startsWith("/academy") },
    { href: "/methodology", label: t.common.methodology, match: (p: string) => p.startsWith("/methodology") },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50",
        onMap ? "bg-paper/95 border-rule border-b backdrop-blur" : "bg-paper/85 backdrop-blur"
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1800px] items-center justify-between px-5 md:px-10">
        <Link href="/" className="group flex flex-col leading-none">
          <span className="label group-hover:text-ink transition-colors">
            {t.common.tagline}
          </span>
          <span className="display mt-1 text-[15px] tracking-tight">Caspian Watch</span>
        </Link>

        <nav className="flex items-center gap-6">
          <ul className="hidden items-center gap-5 md:flex">
            {links.map((l) => {
              const active = l.match(pathname ?? "");
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      "label transition-colors",
                      active ? "text-ink" : "hover:text-ink"
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <LocaleSwitch />
        </nav>
      </div>
    </header>
  );
}
