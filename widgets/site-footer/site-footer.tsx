"use client";

import Link from "next/link";
import { Waves, Code2 } from "lucide-react";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import sourcesFile from "@/data/sources.json";

export function SiteFooter() {
  const t = useT();
  const locale = useLocale();
  const realCount = sourcesFile.sources.filter((s) => s.status === "real").length;

  const links = [
    { href: "/map/water", label: t.nav.water },
    { href: "/map/pollution", label: t.nav.pollution },
    { href: "/map/life", label: t.nav.life },
    { href: "/map/resources", label: t.nav.resources },
    { href: "/map/index", label: t.nav.index },
  ];

  return (
    <footer className="border-t border-white/[0.06] px-5 py-14 md:px-12">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-10 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="border-glow/30 bg-glow/10 text-glow flex size-8 items-center justify-center rounded-lg border">
              <Waves className="size-4" strokeWidth={1.75} />
            </span>
            <span className="font-display text-sm font-semibold">{t.common.appName}</span>
          </div>
          <p className="text-mist/55 mt-4 text-xs leading-relaxed">{t.common.tagline}</p>
          <p className="text-mist/35 mt-3 text-[11px] leading-relaxed">
            {locale === "ru"
              ? `${sourcesFile.sources.length} источников в реестре, из них ${realCount} — реальные машиночитаемые данные. Проверено ${sourcesFile.last_checked}.`
              : `Тізілімде ${sourcesFile.sources.length} дереккөз, оның ${realCount}-і — нақты машиналық оқылатын дерек. ${sourcesFile.last_checked} тексерілді.`}
          </p>
        </div>

        <nav className="flex flex-col gap-2.5">
          <span className="text-mist/40 text-[10px] font-medium tracking-[0.16em] uppercase">
            {t.common.map}
          </span>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-mist/65 hover:text-foam text-sm transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2.5">
          <span className="text-mist/40 text-[10px] font-medium tracking-[0.16em] uppercase">
            {locale === "ru" ? "Проект" : "Жоба"}
          </span>
          <Link href="/methodology" className="text-mist/65 hover:text-foam text-sm transition-colors">
            {t.common.methodology}
          </Link>
          <a
            href="https://github.com/muhammed03/caspian-dash"
            target="_blank"
            rel="noreferrer noopener"
            className="text-mist/65 hover:text-foam inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <Code2 className="size-3.5" />
            GitHub
          </a>
        </div>
      </div>

      <div className="text-mist/30 mx-auto mt-12 max-w-[1800px] border-t border-white/[0.05] pt-6 text-[10px] leading-relaxed">
        Natural Earth (public domain) · © OpenStreetMap contributors (ODbL) · Weather &amp; air quality
        by Open-Meteo.com (CC BY 4.0) · GBIF.org · Source: EC JRC/Google · UNEP/GRID-Arendal · FAO
        AQUASTAT · IUCN Red List
      </div>
    </footer>
  );
}
