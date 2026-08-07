"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { byLocale, pick } from "@/shared/lib/i18n";
import {
  Display,
  Label,
  Lede,
  Plain,
  Reveal,
  RevealItem,
  SectionMark,
} from "@/shared/ui/primitives";
import { AnimatedNumber } from "@/shared/ui/animated-number";
import { SourceBadge } from "@/shared/ui/source-badge";
import { Button } from "@/shared/ui/button";
import { SERIES } from "@/shared/config/chart-palette";
import { NARRATIVES } from "@/widgets/ai-insight/narratives";
import { computeAnalysis } from "@/entities/ai-insight/compute";
import { viewportOnce } from "@/shared/lib/motion";

import pollution from "@/data/pollution.json";
import koshkar from "@/data/koshkar-ata.json";
import wildlife from "@/data/wildlife.json";

export function PollutionSection() {
  const t = useT();
  const locale = useLocale();

  return (
    <section className="py-28 md:py-40">
      <div className="mx-auto max-w-[1800px] px-5 md:px-10">
        <Reveal className="max-w-2xl">
          <RevealItem>
            <SectionMark index={3}>{t.pollution.title}</SectionMark>
          </RevealItem>
          <RevealItem>
            <Display className="mt-6 max-w-[13ch]">{t.home.sectionPollutionTitle}</Display>
          </RevealItem>
          <RevealItem>
            <Lede className="mt-5">{t.home.sectionPollutionBody}</Lede>
          </RevealItem>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          {/* what the pollution is made of */}
          <div>
            <Label>{t.pollution.structure}</Label>
            <ul className="mt-5 space-y-5">
              {pollution.structure.map((s, i) => (
                <li key={s.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-4">
                    <span className="text-ink text-[15px]">{pick(s, "name", locale)}</span>
                    <span className="tabular text-ink text-sm font-semibold">{s.percent}%</span>
                  </div>
                  <div className="bg-tint h-1.5 w-full overflow-hidden rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.percent}%` }}
                      viewport={viewportOnce}
                      transition={{ duration: 1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: SERIES[i % SERIES.length] }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <SourceBadge sourceId="grid_arendal" />
            </div>
          </div>

          {/* the single worst object */}
          <div className="rule-t pt-6">
            <Label>{t.pollution.koshkarAta}</Label>
            <div className="display text-bad mt-3 flex items-baseline gap-2 text-6xl md:text-7xl">
              <AnimatedNumber value={koshkar.waste_mt} />
              <span className="text-ink-3 text-lg font-normal">
                {byLocale(locale, { kk: "млн т", ru: "млн т", en: "million t" })}
              </span>
            </div>
            <Plain className="mt-4">
              {byLocale(locale, {
                kk: koshkar.facts_kk[1],
                ru: koshkar.facts_ru[1],
                en: koshkar.facts_en[1],
              })}
            </Plain>
            <Plain className="mt-2">
              {byLocale(locale, {
                kk: koshkar.facts_kk[2],
                ru: koshkar.facts_ru[2],
                en: koshkar.facts_en[2],
              })}
            </Plain>
            <div className="mt-6">
              <SourceBadge sourceId="koshkar_pub" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LifeSection() {
  const t = useT();
  const locale = useLocale();
  const sturgeon = wildlife.sturgeon.catch_series;

  const stats = [
    {
      value: wildlife.seal.decline_percent,
      suffix: "%",
      title: byLocale(locale, {
        kk: "итбалық жоғалды",
        ru: "тюленей потеряно",
        en: "of seals lost",
      }),
      plain: t.plain.sealMeans,
    },
    {
      value: sturgeon.at(-1)!.tonnes,
      suffix: byLocale(locale, { kk: " т", ru: " т", en: " t" }),
      title: byLocale(locale, {
        kk: `${sturgeon.at(-1)!.year} жылғы бекіре аулауы`,
        ru: `вылов осетровых в ${sturgeon.at(-1)!.year}`,
        en: `sturgeon catch in ${sturgeon.at(-1)!.year}`,
      }),
      plain: t.plain.sturgeonMeans,
    },
  ];

  return (
    <section className="py-28 md:py-40">
      <div className="mx-auto max-w-[1800px] px-5 md:px-10">
        <Reveal className="max-w-2xl">
          <RevealItem>
            <SectionMark index={4}>{t.life.title}</SectionMark>
          </RevealItem>
          <RevealItem>
            <Display className="mt-6 max-w-[13ch]">{t.home.sectionLifeTitle}</Display>
          </RevealItem>
          <RevealItem>
            <Lede className="mt-5">{t.home.sectionLifeBody}</Lede>
          </RevealItem>
        </Reveal>

        <div className="mt-16 grid gap-10 md:grid-cols-2">
          {stats.map((s) => (
            <div key={s.title} className="rule-t pt-6">
              <div className="display text-bad flex items-baseline text-7xl md:text-8xl">
                <AnimatedNumber value={s.value} />
                <span className="text-ink-3 ml-2 text-2xl font-normal">
                  {s.suffix}
                </span>
              </div>
              <div className="text-ink mt-3 text-lg">{s.title}</div>
              <Plain className="mt-2">{s.plain}</Plain>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <SourceBadge sourceId="cites_fao" />
        </div>
      </div>
    </section>
  );
}

export function AiSummarySection() {
  const t = useT();
  const locale = useLocale();
  const analysis = computeAnalysis("index");
  const narrative = NARRATIVES.index[locale];

  return (
    <section className="rule-t py-28 md:py-40">
      <div className="mx-auto max-w-[1800px] px-5 md:px-10">
        <Reveal className="mx-auto max-w-3xl">
          <RevealItem>
            <SectionMark index={5}>{t.home.aiSummaryTitle}</SectionMark>
          </RevealItem>
          <RevealItem>
            <p className="display mt-8 text-2xl leading-[1.25] md:text-4xl">{narrative.summary}</p>
          </RevealItem>
          <RevealItem>
            <div className="rule-t text-ink-2 mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 pt-5 text-[13px]">
              <span>
                {byLocale(locale, {
                  kk: "Тәуекел деңгейі",
                  ru: "Уровень риска",
                  en: "Risk level",
                })}
                :{" "}
                <span className="text-bad font-medium">{t.common.riskLevel[analysis.risk]}</span>
              </span>
              <Link
                href="/methodology"
                className="hover:text-ink underline decoration-neutral-300 underline-offset-4 transition-colors"
              >
                {byLocale(locale, {
                  kk: "Бұл қалай есептелген",
                  ru: "Как это посчитано",
                  en: "How this is calculated",
                })}
              </Link>
            </div>
          </RevealItem>
          <RevealItem>
            <div className="mt-10">
              <Button href="/map/index">
                {t.home.cta}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </RevealItem>
        </Reveal>
      </div>
    </section>
  );
}
