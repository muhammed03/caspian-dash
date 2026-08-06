"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowDown, ArrowRight, Waves, TrendingDown, Ruler, Fish } from "lucide-react";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { Button } from "@/shared/ui/button";
import { AnimatedNumber } from "@/shared/ui/animated-number";
import { GlassCard } from "@/shared/ui/glass-card";
import { EASE_FLUID } from "@/shared/lib/motion";
import { ecoIndexScore } from "@/entities/ai-insight/compute";

import seaLevel from "@/data/sea-level.json";
import coastlineIndex from "@/data/coastline-index.json";
import wildlife from "@/data/wildlife.json";

const WaterScene = dynamic(() => import("./water-scene").then((m) => m.WaterScene), {
  ssr: false,
});

export function Hero() {
  const t = useT();
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

  const series = seaLevel.series;
  const current = series.at(-1)!;
  const score = ecoIndexScore();
  const retreat2025 = (coastlineIndex.years.find((y) => y.year === 2025)?.max_retreat_m ?? 0) / 1000;

  const metrics = [
    {
      icon: Waves,
      label: t.home.metricLevel,
      value: current.level_m,
      decimals: 2,
      unit: "м",
    },
    {
      icon: TrendingDown,
      label: t.home.metricRate,
      value: 23,
      decimals: 0,
      unit: locale === "ru" ? "см/год" : "см/жыл",
    },
    {
      icon: Ruler,
      label: locale === "ru" ? "Берег отступил" : "Жағалау шегінді",
      value: retreat2025,
      decimals: 1,
      unit: "км",
    },
    {
      icon: Fish,
      label: t.home.metricSeal,
      value: wildlife.seal.decline_percent,
      decimals: 0,
      unit: "%↓",
    },
  ];

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[680px] w-full overflow-hidden">
      <motion.div style={{ scale: sceneScale }} className="absolute inset-0">
        <WaterScene />
      </motion.div>

      {/* vignette keeps the type legible over the moving water */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 20% 30%, rgba(5,7,11,0.82) 0%, rgba(5,7,11,0.35) 45%, transparent 70%), linear-gradient(180deg, rgba(5,7,11,0.7) 0%, transparent 30%, rgba(5,7,11,0.9) 100%)",
        }}
      />

      <motion.div
        style={{ y: titleY, opacity: titleOpacity }}
        className="relative z-10 mx-auto flex h-full max-w-[1800px] flex-col justify-center px-5 md:px-12"
      >
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_FLUID, delay: 0.35 }}
          className="text-glow/70 mb-5 inline-flex items-center gap-2.5 text-[11px] font-medium tracking-[0.24em] uppercase"
        >
          <span className="bg-glow/60 h-px w-10" />
          {t.common.tagline}
        </motion.span>

        <h1 className="font-display max-w-5xl text-[13vw] leading-[0.88] font-semibold tracking-tight md:text-[7.5vw] xl:text-[104px]">
          {t.home.heroTitle.split(" ").map((word, i) => (
            <span key={word + i} className="inline-block overflow-hidden pr-[0.22em] align-bottom">
              <motion.span
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.15, ease: EASE_FLUID, delay: 0.15 + i * 0.09 }}
                className="inline-block"
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_FLUID, delay: 0.6 }}
          className="text-mist/70 mt-6 max-w-xl text-base leading-relaxed md:mt-8 md:text-lg"
        >
          {t.home.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_FLUID, delay: 0.75 }}
          className="mt-8 flex flex-wrap items-center gap-3 md:mt-10"
        >
          <Button href="/map/water" magnetic>
            {t.common.openMap}
            <ArrowRight className="size-4" />
          </Button>
          <Button href="/methodology" variant="outline">
            {t.common.methodology}
          </Button>
        </motion.div>

        {/* eco score + live metrics */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE_FLUID, delay: 0.95 }}
          className="mt-12 flex flex-wrap items-stretch gap-3 md:mt-16"
        >
          <GlassCard static accent className="flex items-center gap-5 px-6 py-4">
            <div>
              <div className="text-mist/60 text-[10px] font-medium tracking-[0.16em] uppercase">
                {t.home.ecoIndex}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <AnimatedNumber
                  value={score}
                  className="font-display text-danger text-5xl font-semibold tracking-tight"
                />
                <span className="text-mist/40 text-lg">/100</span>
              </div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
              {metrics.map(({ icon: Icon, label, value, decimals, unit }) => (
                <div key={label}>
                  <div className="text-mist/50 flex items-center gap-1.5 text-[10px] tracking-wide uppercase">
                    <Icon className="size-3" strokeWidth={1.5} />
                    {label}
                  </div>
                  <div className="text-foam mt-0.5 text-lg font-medium">
                    <AnimatedNumber value={value} decimals={decimals} />
                    <span className="text-mist/50 ml-1 text-xs">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        style={{ opacity: titleOpacity }}
        className="text-mist/45 absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 text-[10px] tracking-[0.2em] uppercase"
      >
        {t.common.scroll}
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="size-3.5" />
        </motion.span>
      </motion.div>
    </section>
  );
}
