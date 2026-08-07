"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { byLocale } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { AnimatedNumber } from "@/shared/ui/animated-number";
import { Display, Label, Lede, MetaCell, MetaRow } from "@/shared/ui/primitives";
import { EASE_FLUID } from "@/shared/lib/motion";
import { ecoIndexScore } from "@/entities/ai-insight/compute";

import seaLevel from "@/data/sea-level.json";
import coastlineIndex from "@/data/coastline-index.json";
import wildlife from "@/data/wildlife.json";

const SeaScene = dynamic(() => import("./sea-scene").then((m) => m.SeaScene), { ssr: false });

export function Hero() {
  const t = useT();
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const current = seaLevel.series.at(-1)!;
  const score = ecoIndexScore();
  const retreat = (coastlineIndex.years.find((y) => y.year === 2025)?.max_retreat_m ?? 0) / 1000;

  const words = t.home.heroTitle.split(" ");

  return (
    <section ref={ref} className="relative w-full overflow-hidden lg:min-h-[100svh]">
      {/* The sea itself, as the one object on the page. Bounded to the upper
          right so it never sits under the headline or the meta strip. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] items-center justify-center pb-56 lg:flex">
        <div className="relative aspect-[3/4] h-[68%] max-h-[560px]">
          <SeaScene />
        </div>
      </div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex max-w-[1800px] flex-col px-5 pt-24 pb-12 md:px-10 md:pt-32 lg:min-h-[100svh] lg:justify-between lg:pb-8"
      >
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_FLUID, delay: 0.15 }}
          >
            <Label>
              {byLocale(locale, {
                kk: "Каспий теңізі · 1992 — 2035",
                ru: "Каспийское море · 1992 — 2035",
                en: "Caspian Sea · 1992 — 2035",
              })}
            </Label>
          </motion.div>

          <Display as="h1" className="mt-5 max-w-[15ch]">
            {words.map((word, i) => (
              <span key={word + i} className="inline-block overflow-hidden pr-[0.2em] align-bottom">
                <motion.span
                  initial={{ y: "102%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, ease: EASE_FLUID, delay: 0.1 + i * 0.07 }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </Display>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_FLUID, delay: 0.5 }}
            className="mt-7 max-w-xl"
          >
            <Lede>{t.home.heroSubtitle}</Lede>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button href="/map/water">
                {t.common.openMap}
                <ArrowRight className="size-4" />
              </Button>
              <Button href="/methodology" variant="outline">
                {t.common.methodology}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* meta strip: the four numbers that matter, each explained in a line */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_FLUID, delay: 0.75 }}
          className="relative z-10 mt-14 lg:mt-16"
        >
          <MetaRow>
            <MetaCell label={t.home.ecoIndex}>
              <span className="display text-bad text-3xl">
                <AnimatedNumber value={score} />
                <span className="text-ink-3 text-base font-normal">/100</span>
              </span>
              <p className="text-ink-2 mt-1.5 text-[12px] leading-relaxed">{t.plain.indexMeans}</p>
            </MetaCell>

            <MetaCell label={t.home.metricLevel}>
              <span className="display text-3xl">
                <AnimatedNumber value={current.level_m} decimals={2} />
                <span className="text-ink-3 text-base font-normal">
                  {byLocale(locale, { kk: " м", ru: " м", en: " m" })}
                </span>
              </span>
              <p className="text-ink-2 mt-1.5 text-[12px] leading-relaxed">{t.plain.levelMeans}</p>
            </MetaCell>

            <MetaCell label={t.home.metricRate}>
              <span className="display text-3xl">
                <AnimatedNumber value={23} />
                <span className="text-ink-3 text-base font-normal">
                  {byLocale(locale, { kk: " см/жыл", ru: " см/год", en: " cm/year" })}
                </span>
              </span>
              <p className="text-ink-2 mt-1.5 text-[12px] leading-relaxed">{t.plain.rateMeans}</p>
            </MetaCell>

            <MetaCell
              label={byLocale(locale, {
                kk: "Жағалау шегінді",
                ru: "Берег отступил",
                en: "Shoreline retreat",
              })}
            >
              <span className="display text-3xl">
                <AnimatedNumber value={retreat} decimals={1} />
                <span className="text-ink-3 text-base font-normal">
                  {byLocale(locale, { kk: " км", ru: " км", en: " km" })}
                </span>
              </span>
              <p className="text-ink-2 mt-1.5 text-[12px] leading-relaxed">{t.plain.retreatMeans}</p>
            </MetaCell>
          </MetaRow>

          <div className="text-ink-3 mt-8 flex items-center gap-2">
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="size-3.5" />
            </motion.span>
            <Label>{t.common.scroll}</Label>
            <span className="text-ink-3 ml-auto hidden text-[11px] sm:block">
              {byLocale(locale, {
                kk: `Итбалық ғасырда ${wildlife.seal.decline_percent}%-ға азайды`,
                ru: `Тюленей стало меньше на ${wildlife.seal.decline_percent}% за век`,
                en: `Seal numbers fell ${wildlife.seal.decline_percent}% in a century`,
              })}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
