"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { Play, Pause, TrendingDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useT } from "@/shared/lib/i18n/client";
import { COASTLINE_YEARS, useMapStore } from "@/shared/store/map-store";
import { AnimatedNumber } from "@/shared/ui/animated-number";
import coastlineIndex from "@/data/coastline-index.json";

type YearEntry = { year: number; level_m: number; max_retreat_m: number; projected: boolean };
const YEARS = coastlineIndex.years as YearEntry[];

/**
 * Drives the year for every coastline layer. Playing it steps through the
 * years so the shoreline visibly crawls inward — the core demo moment.
 */
export function TimelineSlider() {
  const t = useT();
  const { year, setYear, playing, setPlaying } = useMapStore();
  const idx = COASTLINE_YEARS.indexOf(year);
  const entry = YEARS.find((y) => y.year === year);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const current = useMapStore.getState().year;
      const at = COASTLINE_YEARS.indexOf(current);
      if (at >= COASTLINE_YEARS.length - 1) {
        useMapStore.getState().setYear(COASTLINE_YEARS[0]);
      } else {
        useMapStore.getState().setYear(COASTLINE_YEARS[at + 1]);
      }
    }, 900);
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <div className="glass-strong pointer-events-auto rounded-2xl px-5 py-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? t.common.pause : t.common.play}
          className="border-glow/30 bg-glow/10 text-glow hover:bg-glow/20 flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors"
        >
          {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-2.5">
              <motion.span
                key={year}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display tabular text-2xl font-semibold tracking-tight"
              >
                {year}
              </motion.span>
              {entry?.projected && (
                <span className="border-warn/40 bg-warn/10 text-warn rounded-full border px-2 py-0.5 text-[10px] font-medium">
                  {t.water.forecast}
                </span>
              )}
            </div>
            {entry && (
              <div className="flex items-center gap-4 text-right">
                <span className="text-mist/60 text-xs">
                  {t.water.seaLevel.split("(")[0].trim()}{" "}
                  <span className="text-foam tabular font-medium">{entry.level_m.toFixed(2)} м</span>
                </span>
                <span className="text-warn flex items-center gap-1 text-xs">
                  <TrendingDown className="size-3" />
                  <AnimatedNumber
                    value={Math.max(entry.max_retreat_m / 1000, 0)}
                    decimals={1}
                    suffix=" км"
                    className="font-medium"
                  />
                </span>
              </div>
            )}
          </div>

          <input
            type="range"
            min={0}
            max={COASTLINE_YEARS.length - 1}
            step={1}
            value={idx < 0 ? 0 : idx}
            onChange={(e) => {
              setPlaying(false);
              setYear(COASTLINE_YEARS[Number(e.target.value)]);
            }}
            aria-label={t.map.timeline}
            className={cn(
              "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10",
              "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-glow",
              "[&::-webkit-slider-thumb]:shadow-[0_0_16px_rgba(34,211,238,0.7)]",
              "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-glow"
            )}
            style={{
              background: `linear-gradient(to right, rgba(34,211,238,0.55) 0%, rgba(34,211,238,0.55) ${
                (Math.max(idx, 0) / (COASTLINE_YEARS.length - 1)) * 100
              }%, rgba(255,255,255,0.09) ${
                (Math.max(idx, 0) / (COASTLINE_YEARS.length - 1)) * 100
              }%, rgba(255,255,255,0.09) 100%)`,
            }}
          />

          <div className="text-mist/40 mt-1.5 flex justify-between text-[10px]">
            <span>{COASTLINE_YEARS[0]}</span>
            <span>2015</span>
            <span>{COASTLINE_YEARS.at(-1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
