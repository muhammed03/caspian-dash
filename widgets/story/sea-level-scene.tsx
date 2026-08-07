"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Area, AreaChart, ResponsiveContainer, YAxis, ReferenceLine } from "recharts";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { byLocale, formatFixed, formatNumber } from "@/shared/lib/i18n";
import { Display, Label, Lede, Plain, SectionMark } from "@/shared/ui/primitives";
import { SERIES, CHART_INK } from "@/shared/config/chart-palette";
import { SourceBadge } from "@/shared/ui/source-badge";
import seaLevel from "@/data/sea-level.json";

gsap.registerPlugin(ScrollTrigger);

type Row = { year: number; level_m: number; area_km2: number };
const DATA = seaLevel.series as Row[];

/**
 * Pinned scene: scrolling walks the year forward and the line falls with it.
 * The scroll bar becomes the time axis, so the reader does the falling.
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
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=200%",
        pin: true,
        scrub: 0.7,
        onUpdate: (self) => setIndex(Math.round(self.progress * (DATA.length - 1))),
      });
    }, el);

    return () => ctx.revert();
  }, []);

  const row = DATA[index];
  const visible = DATA.slice(0, index + 1);
  const areaLost = DATA[0].area_km2 - row.area_km2;

  return (
    <section ref={section} className="relative flex h-[100svh] items-center py-10">
      <div className="mx-auto grid w-full max-w-[1800px] items-center gap-12 px-5 md:grid-cols-[1fr_1.1fr] md:px-10">
        <div>
          <SectionMark index={1}>{t.nav.water}</SectionMark>
          <Display className="mt-6 max-w-[12ch]">{t.home.sectionSeaTitle}</Display>
          <Lede className="mt-5">{t.home.sectionSeaBody}</Lede>

          {/* Two columns on a phone: three display numbers plus their units do
              not fit across 375px, and the third was being clipped. */}
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
            <div>
              <Label>{t.common.year}</Label>
              <div className="display tabular mt-1.5 text-4xl md:text-5xl">{row.year}</div>
            </div>
            <div>
              <Label>{t.home.metricLevel}</Label>
              <div className="display tabular text-bad mt-1.5 text-4xl whitespace-nowrap md:text-5xl">
                {formatFixed(row.level_m, locale, 2)}
                {/* tracking-normal: `display` sets letter-spacing in em against
                    the parent's size, and the computed value is inherited whole
                    by this much smaller unit. */}
                <span className="text-ink-3 ml-1 text-base font-normal tracking-normal">
                  {byLocale(locale, { kk: "м", ru: "м", en: "m" })}
                </span>
              </div>
            </div>
            <div>
              <Label>
                {byLocale(locale, {
                  kk: "Жоғалған айдын",
                  ru: "Потеряно акватории",
                  en: "Water area lost",
                })}
              </Label>
              <div className="display tabular text-warn mt-1.5 text-3xl whitespace-nowrap md:text-4xl">
                {areaLost > 0 ? `−${formatNumber(areaLost, locale)}` : "0"}
                <span className="text-ink-3 ml-1 text-sm font-normal tracking-normal">
                  {byLocale(locale, { kk: "км²", ru: "км²", en: "km²" })}
                </span>
              </div>
            </div>
          </div>

          <Plain className="mt-6">{t.plain.levelMeans}</Plain>

          <div className="mt-6">
            <SourceBadge sourceId="grealm" />
          </div>
        </div>

        <figure className="border-rule relative h-[320px] rounded-lg border p-5 md:h-[440px]">
          <figcaption className="mb-3 flex items-baseline justify-between">
            <Label>{t.water.levelChart}</Label>
            <span className="text-ink-3 tabular text-[11px]">{row.year}</span>
          </figcaption>

          <div className="h-[calc(100%-3.5rem)]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visible} margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="storyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                {/* fixed domain and fixed x-range so the line falls through a
                    stable frame instead of the axis rescaling under it */}
                <YAxis domain={[-29.8, -26.2]} hide />
                <ReferenceLine
                  y={-29}
                  stroke={CHART_INK.muted}
                  strokeDasharray="3 3"
                  label={{
                    value: byLocale(locale, {
                      kk: "тарихи минимум",
                      ru: "исторический минимум",
                      en: "historic low",
                    }),
                    fill: CHART_INK.muted,
                    fontSize: 10,
                    position: "insideBottomLeft",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="level_m"
                  stroke={SERIES[0]}
                  strokeWidth={2}
                  fill="url(#storyFill)"
                  baseValue={-29.8}
                  isAnimationActive={false}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-ink-3 rule-t mt-3 flex justify-between pt-2 text-[10px]">
            <span>1992</span>
            <span className="text-ink">{row.year}</span>
            <span>2025</span>
          </div>
        </figure>
      </div>
    </section>
  );
}
