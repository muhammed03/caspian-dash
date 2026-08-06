"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { SectionBody, SectionLabel, SectionTitle } from "@/shared/ui/section";
import { SERIES } from "@/shared/config/chart-palette";
import { SourceBadge } from "@/shared/ui/source-badge";
import seaLevel from "@/data/sea-level.json";

gsap.registerPlugin(ScrollTrigger);

type Row = { year: number; level_m: number; area_km2: number };
const DATA = seaLevel.series as Row[];

/**
 * Pinned scene: scrolling walks the year forward, and the chart, the level and
 * the lost-surface figure move with it. The scroll bar becomes the time axis.
 */
export function SeaLevelScene() {
  const t = useT();
  const locale = useLocale();
  const section = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIndex(DATA.length - 1);
      return;
    }

    const ctx = gsap.context(() => {
      const state = { progress: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=180%",
        pin: true,
        scrub: 0.8,
        onUpdate: (self) => {
          state.progress = self.progress;
          setIndex(Math.round(self.progress * (DATA.length - 1)));
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  const row = DATA[index];
  const visible = DATA.slice(0, index + 1);
  const areaLost = DATA[0].area_km2 - row.area_km2;

  return (
    <section ref={section} className="relative flex h-[100svh] items-center overflow-hidden">
      <div className="mx-auto grid w-full max-w-[1800px] gap-10 px-5 md:grid-cols-2 md:items-center md:px-12">
        <div>
          <SectionLabel>{`1992 — 2025`}</SectionLabel>
          <SectionTitle className="mt-5">{t.home.sectionSeaTitle}</SectionTitle>
          <SectionBody className="mt-5">{t.home.sectionSeaBody}</SectionBody>

          <div className="mt-9 flex flex-wrap items-end gap-x-10 gap-y-5">
            <div>
              <div className="text-mist/50 text-[10px] font-medium tracking-[0.16em] uppercase">
                {t.common.year}
              </div>
              <div className="font-display tabular mt-1 text-5xl font-semibold md:text-6xl">
                {row.year}
              </div>
            </div>
            <div>
              <div className="text-mist/50 text-[10px] font-medium tracking-[0.16em] uppercase">
                {t.home.metricLevel}
              </div>
              <div className="font-display tabular text-danger mt-1 text-5xl font-semibold md:text-6xl">
                {row.level_m.toFixed(2)}
                <span className="text-mist/40 ml-1.5 text-xl font-normal">м</span>
              </div>
            </div>
            <div>
              <div className="text-mist/50 text-[10px] font-medium tracking-[0.16em] uppercase">
                {locale === "ru" ? "Потеряно акватории" : "Жоғалған айдын"}
              </div>
              <div className="font-display tabular text-warn mt-1 text-3xl font-semibold md:text-4xl">
                {areaLost > 0 ? `−${areaLost.toLocaleString("ru-RU")}` : "0"}
                <span className="text-mist/40 ml-1.5 text-base font-normal">км²</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <SourceBadge sourceId="grealm" />
          </div>
        </div>

        <div className="glass relative h-[300px] overflow-hidden rounded-2xl p-4 md:h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visible} margin={{ top: 12, right: 4, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="storyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* fixed domain so the line falls through the frame instead of rescaling */}
              <YAxis domain={[-29.8, -26.2]} hide />
              <Area
                type="monotone"
                dataKey="level_m"
                stroke={SERIES[0]}
                strokeWidth={2.5}
                fill="url(#storyFill)"
                // levels are negative, so the fill has to run down to the floor
                // of the domain rather than to zero
                baseValue={-29.8}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="text-mist/35 absolute inset-x-4 bottom-3 flex justify-between text-[10px]">
            <span>1992</span>
            <span className="text-glow/70">{row.year}</span>
            <span>2025</span>
          </div>
        </div>
      </div>
    </section>
  );
}
