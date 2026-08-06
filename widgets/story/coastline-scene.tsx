"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Play, Pause } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { Display, Label, Lede, Plain, SectionMark } from "@/shared/ui/primitives";
import { SourceBadge } from "@/shared/ui/source-badge";
import { Button } from "@/shared/ui/button";
import coastlineIndex from "@/data/coastline-index.json";

const YEARS = [1992, 2000, 2010, 2015, 2020, 2025, 2030, 2035];

/**
 * The reader drives this one. Drag the slider or press play and the shoreline
 * moves — no scroll trickery, so it behaves the way a control is expected to.
 */
export function CoastlineScene() {
  const t = useT();
  const locale = useLocale();
  const [paths, setPaths] = useState<Record<number, string>>({});
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const loaded = useRef(false);

  const year = YEARS[idx];

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      YEARS.map(async (y) => {
        const res = await fetch(`/api/coastline/${y}`);
        const fc = (await res.json()) as GeoJSON.FeatureCollection;
        const ring = (fc.features[0].geometry as GeoJSON.Polygon).coordinates[0] as [number, number][];
        return [y, toPath(ring)] as const;
      })
    ).then((entries) => {
      if (!cancelled) {
        setPaths(Object.fromEntries(entries));
        loaded.current = true;
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setIdx((i) => (i >= YEARS.length - 1 ? 0 : i + 1));
    }, 1100);
    return () => clearInterval(timer);
  }, [playing]);

  const entry = coastlineIndex.years.find((y) => y.year === year);
  const retreatKm = Math.max((entry?.max_retreat_m ?? 0) / 1000, 0);
  const pct = (idx / (YEARS.length - 1)) * 100;

  return (
    <section className="py-28 md:py-40">
      <div className="mx-auto grid max-w-[1800px] items-center gap-12 px-5 md:grid-cols-2 md:px-10">
        <div className="order-2 md:order-1">
          <SectionMark index={2}>{t.water.retreat}</SectionMark>
          <Display className="mt-6 max-w-[12ch]">{t.home.sectionCoastTitle}</Display>
          <Lede className="mt-5">{t.home.sectionCoastBody}</Lede>

          {/* the control the reader actually operates */}
          <div className="rule-t mt-10 pt-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPlaying((v) => !v)}
                aria-label={playing ? t.common.pause : t.common.play}
                className="border-rule text-ink hover:bg-ink hover:text-paper flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors"
              >
                {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
              </button>

              <div className="min-w-0 flex-1">
                <input
                  type="range"
                  min={0}
                  max={YEARS.length - 1}
                  step={1}
                  value={idx}
                  onChange={(e) => {
                    setPlaying(false);
                    setIdx(Number(e.target.value));
                  }}
                  aria-label={t.water.coastlineYear}
                  aria-valuetext={String(year)}
                  className={cn(
                    "h-1 w-full cursor-pointer appearance-none rounded-full",
                    "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none",
                    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink",
                    "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full",
                    "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink"
                  )}
                  style={{
                    background: `linear-gradient(to right, #0a0a0a 0%, #0a0a0a ${pct}%, #e6e6e3 ${pct}%, #e6e6e3 100%)`,
                  }}
                />
                <div className="text-ink-3 mt-2 flex justify-between text-[10px]">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setPlaying(false);
                        setIdx(YEARS.indexOf(y));
                      }}
                      className={cn(
                        "tabular transition-colors",
                        y === year ? "text-ink font-medium" : "hover:text-ink"
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8 sm:max-w-md">
            <div>
              <Label>{t.common.year}</Label>
              <div className="display tabular mt-1.5 flex items-baseline gap-2 text-4xl md:text-5xl">
                {year}
                {entry?.projected && (
                  <span className="text-warn text-[11px] font-normal tracking-normal">
                    {t.water.forecast}
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label>{t.water.retreat}</Label>
              <div className="display tabular text-warn mt-1.5 text-4xl md:text-5xl">
                {retreatKm.toFixed(1)}
                <span className="text-ink-3 ml-1 text-base font-normal">км</span>
              </div>
            </div>
          </div>

          <Plain className="mt-6">{t.plain.retreatMeans}</Plain>

          <div className="mt-7">
            <Button href="/map/water" variant="outline">
              {t.common.openMap}
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <div className="mt-6">
            <SourceBadge sourceId="model" />
          </div>
        </div>

        <figure className="border-rule order-1 relative aspect-[4/5] overflow-hidden rounded-lg border md:order-2">
          <svg viewBox="43 34.5 15.5 15" className="absolute inset-0 size-full -scale-y-100" role="img">
            <title>{`${t.water.coastlineYear}: ${year}`}</title>
            {/* 1992 shoreline, filled with the dried-out colour */}
            {paths[1992] && <path d={paths[1992]} fill="#f0e2d6" stroke="#c9c9c5" strokeWidth={0.03} />}
            {/* today's water sits inside it */}
            {paths[year] && (
              <motion.path
                key={year}
                d={paths[year]}
                fill="#cfe2f8"
                stroke="#1d6fd0"
                strokeWidth={0.045}
                initial={{ opacity: 0.55 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </svg>

          <figcaption className="rule-t bg-paper absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-2.5">
            <span className="text-ink-2 flex items-center gap-1.5 text-[11px]">
              <span className="size-2.5 rounded-[2px] bg-[#f0e2d6] ring-1 ring-[#c9c9c5]" />
              {locale === "ru" ? "высохло с 1992" : "1992 жылдан құрғады"}
            </span>
            <span className="text-ink flex items-center gap-1.5 text-[11px] font-medium">
              <span className="size-2.5 rounded-[2px] bg-[#cfe2f8] ring-1 ring-[#1d6fd0]" />
              {locale === "ru" ? `вода в ${year}` : `${year} жылғы су`}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/** GeoJSON ring → SVG path, thinned so the browser is not asked to draw 2000 points. */
function toPath(ring: [number, number][], step = 3): string {
  const pts = ring.filter((_, i) => i % step === 0);
  return `M${pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("L")}Z`;
}
