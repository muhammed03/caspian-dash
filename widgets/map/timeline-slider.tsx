"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { COASTLINE_YEARS, useMapStore } from "@/shared/store/map-store";
import coastlineIndex from "@/data/coastline-index.json";

type YearEntry = { year: number; level_m: number; max_retreat_m: number; projected: boolean };
const YEARS = coastlineIndex.years as YearEntry[];

/**
 * Drives the year for every coastline layer. Pressing play walks the years so
 * the shoreline visibly crawls inward — the moment the whole map is built for.
 */
export function TimelineSlider() {
  const t = useT();
  const locale = useLocale();
  const { year, setYear, playing, setPlaying } = useMapStore();
  const idx = Math.max(COASTLINE_YEARS.indexOf(year), 0);
  const entry = YEARS.find((y) => y.year === year);
  const pct = (idx / (COASTLINE_YEARS.length - 1)) * 100;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const at = COASTLINE_YEARS.indexOf(useMapStore.getState().year);
      useMapStore
        .getState()
        .setYear(COASTLINE_YEARS[at >= COASTLINE_YEARS.length - 1 ? 0 : at + 1]);
    }, 900);
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <div className="pointer-events-auto border-rule bg-paper rounded-md border px-4 py-3">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? t.common.pause : t.common.play}
          className="border-rule text-ink hover:bg-ink hover:text-paper flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors md:size-9"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="ml-0.5 size-3.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-2.5">
              <motion.span
                key={year}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="tabular text-ink text-xl font-semibold tracking-tight"
              >
                {year}
              </motion.span>
              {entry?.projected && (
                <span className="rounded-full border-warn/40 text-warn border px-2 py-0.5 text-[10px]">
                  {t.water.forecast}
                </span>
              )}
            </div>
            {entry && (
              <div className="hidden items-center gap-4 text-ink-2 text-[11px] sm:flex">
                <span>
                  {locale === "ru" ? "уровень" : "деңгей"}{" "}
                  <span className="tabular text-ink font-medium">{entry.level_m.toFixed(2)} м</span>
                </span>
                <span>
                  {locale === "ru" ? "берег ушёл на" : "жағалау шегінді"}{" "}
                  <span className="tabular text-ink font-medium">
                    {Math.max(entry.max_retreat_m / 1000, 0).toFixed(1)} км
                  </span>
                </span>
              </div>
            )}
          </div>

          <input
            type="range"
            min={0}
            max={COASTLINE_YEARS.length - 1}
            step={1}
            value={idx}
            onChange={(e) => {
              setPlaying(false);
              setYear(COASTLINE_YEARS[Number(e.target.value)]);
            }}
            aria-label={t.map.timeline}
            className={cn(
              "h-1 w-full cursor-pointer appearance-none rounded-full",
              "[&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink",
              "[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink"
            )}
            style={{
              background: `linear-gradient(to right, #0a0a0a 0%, #0a0a0a ${pct}%, #e6e6e3 ${pct}%, #e6e6e3 100%)`,
            }}
          />

          <div className="mt-1.5 flex justify-between text-ink-3 text-[10px]">
            <span>{COASTLINE_YEARS[0]}</span>
            <span>2015</span>
            <span>{COASTLINE_YEARS.at(-1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
