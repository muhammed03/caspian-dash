"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

import { useLocale, useT } from "@/shared/lib/i18n/client";
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
    <section ref={ref} className="relative min-h-[100svh] w-full overflow-hidden">
      {/* The sea itself, as the one object on the page. Bounded to the upper
          right so it never sits under the headline or the meta strip. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] items-center justify-center pb-56 lg:flex">
        <div className="relative aspect-[3/4] h-[68%] max-h-[560px]">
          <SeaScene />
        </div>
      </div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1800px] flex-col justify-between px-5 pt-24 pb-8 md:px-10 md:pt-32"
      >
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_FLUID, delay: 0.15 }}
          >
            <Label>
              {locale === "ru" ? "Каспийское море · 1992 — 2035" : "Каспий теңізі · 1992 — 2035"}
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
          className="bg-paper relative z-10 mt-16"
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
                <span className="text-ink-3 text-base font-normal"> м</span>
              </span>
              <p className="text-ink-2 mt-1.5 text-[12px] leading-relaxed">{t.plain.levelMeans}</p>
            </MetaCell>

            <MetaCell label={t.home.metricRate}>
              <span className="display text-3xl">
                <AnimatedNumber value={23} />
                <span className="text-ink-3 text-base font-normal">
                  {locale === "ru" ? " см/год" : " см/жыл"}
                </span>
              </span>
              <p className="text-ink-2 mt-1.5 text-[12px] leading-relaxed">{t.plain.rateMeans}</p>
            </MetaCell>

            <MetaCell label={locale === "ru" ? "Берег отступил" : "Жағалау шегінді"}>
              <span className="display text-3xl">
                <AnimatedNumber value={retreat} decimals={1} />
                <span className="text-ink-3 text-base font-normal"> км</span>
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
              {locale === "ru"
                ? `Тюленей стало меньше на ${wildlife.seal.decline_percent}% за век`
                : `Итбалық ғасырда ${wildlife.seal.decline_percent}%-ға азайды`}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
