"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { Label } from "@/shared/ui/primitives";
import sourcesFile from "@/data/sources.json";

export function SiteFooter() {
  const t = useT();
  const locale = useLocale();
  const realCount = sourcesFile.sources.filter((s) => s.status === "real").length;

  const mapLinks = [
    { href: "/map/water", label: t.nav.water },
    { href: "/map/pollution", label: t.nav.pollution },
    { href: "/map/life", label: t.nav.life },
    { href: "/map/resources", label: t.nav.resources },
    { href: "/map/index", label: t.nav.index },
  ];

  return (
    <footer className="rule-t px-5 py-14 md:px-10">
      <div className="mx-auto grid max-w-[1800px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Caspian Watch</Label>
          <p className="text-ink-2 mt-3 text-[13px] leading-relaxed">{t.common.tagline}</p>
        </div>

        <nav>
          <Label>{t.common.map}</Label>
          <ul className="mt-3 space-y-1.5">
            {mapLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink-2 hover:text-ink text-[13px] transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <Label>{locale === "ru" ? "Проект" : "Жоба"}</Label>
          <ul className="mt-3 space-y-1.5">
            <li>
              <Link href="/methodology" className="text-ink-2 hover:text-ink text-[13px] transition-colors">
                {t.common.methodology}
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/muhammed03/caspian-dash"
                target="_blank"
                rel="noreferrer noopener"
                className="text-ink-2 hover:text-ink inline-flex items-center gap-1 text-[13px] transition-colors"
              >
                GitHub
                <ArrowUpRight className="size-3" />
              </a>
            </li>
          </ul>
        </div>

        <div>
          <Label>{t.common.sources}</Label>
          <p className="text-ink-2 mt-3 text-[13px] leading-relaxed">
            {locale === "ru"
              ? `${sourcesFile.sources.length} источников, ${realCount} из них — реальные машиночитаемые данные.`
              : `${sourcesFile.sources.length} дереккөз, оның ${realCount}-і — нақты машиналық оқылатын дерек.`}
          </p>
          <p className="text-ink-3 mt-1.5 text-[11px]">
            {t.common.updated}: {sourcesFile.last_checked}
          </p>
        </div>
      </div>

      <p className="text-ink-3 rule-t mx-auto mt-12 max-w-[1800px] pt-6 text-[11px] leading-relaxed">
        Natural Earth (public domain) · © OpenStreetMap contributors (ODbL) · Weather &amp; air quality
        by Open-Meteo.com (CC BY 4.0) · GBIF.org · Source: EC JRC/Google · UNEP/GRID-Arendal · FAO
        AQUASTAT · IUCN Red List
      </p>
    </footer>
  );
}
