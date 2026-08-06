"use client";

import { motion } from "motion/react";
import { Radiation, Fish, Factory, Droplets, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { useLocale, useT } from "@/shared/lib/i18n/client";
import { SectionBody, SectionLabel, SectionTitle, Reveal, RevealItem } from "@/shared/ui/section";
import { GlassCard } from "@/shared/ui/glass-card";
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
  const structure = pollution.structure;

  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="mx-auto max-w-[1800px] px-5 md:px-12">
        <Reveal className="max-w-2xl">
          <RevealItem>
            <SectionLabel>{t.pollution.title}</SectionLabel>
          </RevealItem>
          <RevealItem>
            <SectionTitle className="mt-5">{t.home.sectionPollutionTitle}</SectionTitle>
          </RevealItem>
          <RevealItem>
            <SectionBody className="mt-5">{t.home.sectionPollutionBody}</SectionBody>
          </RevealItem>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <GlassCard className="p-6 md:col-span-2">
            <div className="text-mist/60 mb-6 flex items-center gap-2 text-xs tracking-wide uppercase">
              <Factory className="size-3.5" strokeWidth={1.5} />
              {t.pollution.structure}
            </div>
            <div className="space-y-4">
              {structure.map((s, i) => (
                <div key={s.id}>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="text-foam/85">{locale === "ru" ? s.name_ru : s.name_kk}</span>
                    <span className="text-foam tabular font-medium">{s.percent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.percent}%` }}
                      viewport={viewportOnce}
                      transition={{ duration: 1.1, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{
                        background: SERIES[i % SERIES.length],
                        boxShadow: `0 0 12px ${SERIES[i % SERIES.length]}70`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-white/[0.06] pt-3">
              <SourceBadge sourceId="grid_arendal" />
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between p-6">
            <div>
              <div className="text-danger mb-4 flex items-center gap-2 text-xs tracking-wide uppercase">
                <Radiation className="size-3.5" strokeWidth={1.5} />
                {t.pollution.koshkarAta}
              </div>
              <div className="font-display text-danger flex items-baseline gap-2 text-6xl font-semibold tracking-tight">
                <AnimatedNumber value={koshkar.waste_mt} />
                <span className="text-mist/50 text-lg font-normal">
                  {locale === "ru" ? "млн т" : "млн т"}
                </span>
              </div>
              <p className="text-mist/65 mt-4 text-sm leading-relaxed">
                {locale === "ru" ? koshkar.facts_ru[1] : koshkar.facts_kk[1]}
              </p>
              <p className="text-mist/45 mt-2 text-xs">
                {locale === "ru" ? koshkar.facts_ru[2] : koshkar.facts_kk[2]}
              </p>
            </div>
            <div className="mt-6 border-t border-white/[0.06] pt-3">
              <SourceBadge sourceId="koshkar_pub" />
            </div>
          </GlassCard>
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
      icon: Fish,
      value: wildlife.seal.decline_percent,
      suffix: "%",
      label: locale === "ru" ? "спад популяции тюленя за век" : "бір ғасырдағы итбалық азаюы",
      tone: SERIES[1],
    },
    {
      icon: Droplets,
      value: sturgeon.at(-1)!.tonnes,
      suffix: locale === "ru" ? " т" : " т",
      label:
        locale === "ru"
          ? `вылов осетровых в ${sturgeon.at(-1)!.year} против ${sturgeon[0].tonnes.toLocaleString("ru-RU")} т в ${sturgeon[0].year}`
          : `${sturgeon.at(-1)!.year} жылғы бекіре аулауы, ${sturgeon[0].year} жылы ${sturgeon[0].tonnes.toLocaleString("ru-RU")} т болған`,
      tone: SERIES[2],
    },
  ];

  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="mx-auto max-w-[1800px] px-5 md:px-12">
        <Reveal className="max-w-2xl">
          <RevealItem>
            <SectionLabel>{t.life.title}</SectionLabel>
          </RevealItem>
          <RevealItem>
            <SectionTitle className="mt-5">{t.home.sectionLifeTitle}</SectionTitle>
          </RevealItem>
          <RevealItem>
            <SectionBody className="mt-5">{t.home.sectionLifeBody}</SectionBody>
          </RevealItem>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {stats.map(({ icon: Icon, value, suffix, label, tone }) => (
            <GlassCard key={label} className="p-7">
              <Icon className="mb-5 size-5" strokeWidth={1.25} style={{ color: tone }} />
              <div
                className="font-display flex items-baseline text-6xl font-semibold tracking-tight md:text-7xl"
                style={{ color: tone }}
              >
                <AnimatedNumber value={value} />
                <span className="text-mist/50 text-2xl font-normal">{suffix}</span>
              </div>
              <p className="text-mist/65 mt-4 max-w-sm text-sm leading-relaxed">{label}</p>
            </GlassCard>
          ))}
        </div>

        <Reveal className="mt-4">
          <RevealItem>
            <GlassCard className="p-5">
              <p className="text-mist/60 text-[13px] leading-relaxed">
                {locale === "ru" ? wildlife.sturgeon.note_ru : wildlife.sturgeon.note_kk}
              </p>
              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <SourceBadge sourceId="cites_fao" />
              </div>
            </GlassCard>
          </RevealItem>
        </Reveal>
      </div>
    </section>
  );
}

export function AiSummarySection() {
  const t = useT();
  const locale = useLocale();
  const analysis = computeAnalysis("index");
  const narrative = NARRATIVES.index[locale === "ru" ? "ru" : "kk"];

  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="mx-auto max-w-[1800px] px-5 md:px-12">
        <Reveal className="mx-auto max-w-3xl text-center">
          <RevealItem className="flex justify-center">
            <SectionLabel>{t.home.aiSummaryTitle}</SectionLabel>
          </RevealItem>
          <RevealItem>
            <p className="font-display mt-8 text-2xl leading-[1.35] font-medium tracking-tight text-balance md:text-4xl">
              {narrative.summary}
            </p>
          </RevealItem>
          <RevealItem>
            <div className="text-mist/50 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="text-glow size-3.5" strokeWidth={1.5} />
                {t.common.aiLabel}
              </span>
              <span>
                {locale === "ru" ? "Уровень риска" : "Тәуекел деңгейі"}:{" "}
                <span className="text-danger font-medium">{t.common.riskLevel[analysis.risk]}</span>
              </span>
              <Link href="/methodology" className="hover:text-foam underline underline-offset-4 transition-colors">
                {t.common.methodology}
              </Link>
            </div>
          </RevealItem>
          <RevealItem>
            <div className="mt-12 flex justify-center">
              <Button href="/map/index" magnetic>
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
