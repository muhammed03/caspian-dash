"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "motion/react";
import { ArrowRight } from "lucide-react";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { SectionBody, SectionLabel, SectionTitle } from "@/shared/ui/section";
import { SourceBadge } from "@/shared/ui/source-badge";
import { Button } from "@/shared/ui/button";
import coastlineIndex from "@/data/coastline-index.json";

const YEARS = [1992, 2000, 2010, 2015, 2020, 2025, 2030, 2035];

/**
 * Draws the modelled shorelines as SVG paths straight from the committed
 * GeoJSON, morphing between years as the section scrolls. Cheap enough to run
 * outside WebGL and it reads instantly: the outline visibly shrinks.
 */
export function CoastlineScene() {
  const t = useT();
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const [paths, setPaths] = useState<Record<number, string>>({});
  const [year, setYear] = useState(1992);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const index = useTransform(scrollYProgress, [0.15, 0.85], [0, YEARS.length - 1]);
  useMotionValueEvent(index, "change", (v) => {
    setYear(YEARS[Math.max(0, Math.min(YEARS.length - 1, Math.round(v)))]);
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const entries = await Promise.all(
        YEARS.map(async (y) => {
          const res = await fetch(`/api/coastline/${y}`);
          const fc = (await res.json()) as GeoJSON.FeatureCollection;
          const ring = (fc.features[0].geometry as GeoJSON.Polygon).coordinates[0] as [number, number][];
          return [y, toPath(ring)] as const;
        })
      );
      if (!cancelled) setPaths(Object.fromEntries(entries));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const entry = coastlineIndex.years.find((y) => y.year === year);
  const retreatKm = Math.max((entry?.max_retreat_m ?? 0) / 1000, 0);

  return (
    <section ref={ref} className="relative overflow-hidden py-24 md:py-36">
      <div className="mx-auto grid max-w-[1800px] gap-12 px-5 md:grid-cols-2 md:items-center md:px-12">
        <div className="order-2 md:order-1">
          <SectionLabel>{t.water.coastlineYear}</SectionLabel>
          <SectionTitle className="mt-5">{t.home.sectionCoastTitle}</SectionTitle>
          <SectionBody className="mt-5">{t.home.sectionCoastBody}</SectionBody>

          <div className="mt-9 flex items-end gap-10">
            <div>
              <div className="text-mist/50 text-[10px] font-medium tracking-[0.16em] uppercase">
                {t.common.year}
              </div>
              <div className="font-display tabular mt-1 text-5xl font-semibold">
                {year}
                {entry?.projected && (
                  <span className="text-warn ml-2 align-super text-xs">{t.water.forecast}</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-mist/50 text-[10px] font-medium tracking-[0.16em] uppercase">
                {t.water.retreat}
              </div>
              <div className="font-display tabular text-warn mt-1 text-5xl font-semibold">
                {retreatKm.toFixed(1)}
                <span className="text-mist/40 ml-1.5 text-lg font-normal">км</span>
              </div>
            </div>
          </div>

          <p className="text-mist/45 mt-6 max-w-md text-[11px] leading-snug">
            {locale === "ru" ? coastlineIndex.method_ru : coastlineIndex.method_kk}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button href="/map/water" variant="outline">
              {t.common.openMap}
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="mt-5">
            <SourceBadge sourceId="model" />
          </div>
        </div>

        <div className="glass order-1 relative aspect-[4/5] overflow-hidden rounded-3xl md:order-2">
          <svg viewBox="43 34.5 15.5 15" className="absolute inset-0 size-full -scale-y-100" role="img">
            <title>{`${t.water.coastlineYear}: ${year}`}</title>
            {/* 1992 reference stays as the ghost outline */}
            {paths[1992] && (
              <path d={paths[1992]} fill="rgba(34,211,238,0.05)" stroke="rgba(148,163,184,0.35)" strokeWidth={0.035} />
            )}
            {paths[year] && (
              <motion.path
                key={year}
                d={paths[year]}
                fill="rgba(7,26,38,0.92)"
                stroke="#22d3ee"
                strokeWidth={0.05}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{ filter: "drop-shadow(0 0 3px rgba(34,211,238,0.55))" }}
              />
            )}
          </svg>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-5 pb-4 text-[10px]">
            <span className="text-mist/40">{locale === "ru" ? "1992 — контур" : "1992 — контур"}</span>
            <span className="text-glow/80">{year}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** GeoJSON ring → SVG path, thinned so the browser is not asked to draw 2000 points. */
function toPath(ring: [number, number][], step = 3): string {
  const pts = ring.filter((_, i) => i % step === 0);
  return `M${pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("L")}Z`;
}
