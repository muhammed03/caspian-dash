"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, Lock } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { byLocale, formatNumber } from "@/shared/lib/i18n";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { Label, Plain, Panel, Reveal, RevealItem } from "@/shared/ui/primitives";
import { Button } from "@/shared/ui/button";
import { MockBadge, SourceBadge } from "@/shared/ui/source-badge";
import { useLearning } from "@/entities/learning/store";
import { xpForLevel, MAX_LEVEL } from "@/entities/learning/model";
import { ACHIEVEMENTS, DISCOVERIES, LEVEL_NAMES, MISSIONS } from "@/shared/config/academy/progression";
import { LESSONS } from "@/shared/config/academy/lessons";
import { AcademyHead, LevelRing, ProgressLine, StreakFigure, XpFigure, achievementInput, levelName } from "./parts";
import coastline from "@/data/coastline-index.json";

/* ------------------------------------------------------------------ journey */

/**
 * The Progress Journey. Rather than a bar, the reader's path is drawn as the
 * same vertical hairline timeline the methodology page uses for its blocks —
 * milestones on a line, with the current position marked.
 */
export function JourneySection() {
  const t = useT();
  const locale = useLocale();
  const { progress, ready } = useLearning();
  const input = achievementInput(progress);

  const nextMissions = MISSIONS.filter((m) => {
    const { have, need } = m.measure(input);
    return have < need;
  }).slice(0, 3);

  return (
    <Reveal>
      <RevealItem>
        <AcademyHead title={t.academy.title} intro={t.academy.intro} />
      </RevealItem>

      <RevealItem>
        <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6">
          <div className="flex items-center gap-4">
            <LevelRing progress={progress.level.progress} level={progress.level.level} />
            <div>
              <Label>{t.academy.level}</Label>
              <div className="display mt-1.5 text-2xl">{levelName(progress.level.level, locale)}</div>
              <p className="text-ink-3 mt-1 text-[12px]">
                {progress.level.atMax
                  ? t.academy.maxLevel
                  : `${formatNumber(
                      xpForLevel(progress.level.level + 1) - progress.totalXp,
                      locale
                    )} ${t.academy.xpShort} ${t.academy.toNextLevel}`}
              </p>
            </div>
          </div>
          <XpFigure xp={progress.totalXp} />
          <StreakFigure days={progress.streak} />
          <div>
            <Label>{t.academy.lessons}</Label>
            <div className="display tabular mt-1.5 text-3xl">
              {progress.done.lesson_completed.size}
              <span className="text-ink-3 ml-1.5 text-sm font-normal">
                / {LESSONS.length}
              </span>
            </div>
          </div>
        </div>
      </RevealItem>

      {/* the journey itself — milestones on a hairline */}
      <RevealItem>
        <div className="mt-14">
          <Label>{t.academy.journey}</Label>
          <ol className="border-rule mt-5 border-l">
            {LEVEL_NAMES.map((name, level) => {
              const reached = progress.level.level >= level;
              const current = progress.level.level === level;
              const need = level === 0 ? 0 : xpForLevel(level);
              return (
                <li key={level} className="relative pl-6 pb-7 last:pb-0">
                  <span
                    className={cn(
                      "absolute -left-[4.5px] top-1.5 size-2 rounded-full",
                      reached ? "bg-ink" : "bg-rule"
                    )}
                    aria-hidden
                  />
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span
                      className={cn(
                        "text-[15px]",
                        current ? "text-ink font-medium" : reached ? "text-ink" : "text-ink-3"
                      )}
                    >
                      {byLocale(locale, name)}
                    </span>
                    <span className="label tabular">
                      {formatNumber(need, locale)} {t.academy.xpShort}
                    </span>
                    {current && (
                      <motion.span
                        layoutId="journey-here"
                        className="bg-ink text-paper rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase"
                      >
                        {t.academy.level}
                      </motion.span>
                    )}
                  </div>
                  {current && !progress.level.atMax && (
                    <ProgressLine have={progress.level.intoLevel} need={progress.level.levelSpan} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </RevealItem>

      {nextMissions.length > 0 && (
        <RevealItem>
          <div className="mt-14">
            <Label>{t.academy.recommended}</Label>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {nextMissions.map((m) => (
                <MissionCard key={m.id} mission={m} input={input} />
              ))}
            </div>
          </div>
        </RevealItem>
      )}

      <RevealItem>
        <p className="text-ink-3 rule-t mt-14 max-w-[60ch] pt-5 text-[12px] leading-relaxed">
          {t.academy.localOnly}
          {ready && progress.events.length > 0 && <ResetButton />}
        </p>
      </RevealItem>
    </Reveal>
  );
}

function ResetButton() {
  const t = useT();
  const { reset } = useLearning();
  return (
    <button
      type="button"
      onClick={reset}
      className="hover:text-ink ml-2 underline decoration-neutral-300 underline-offset-2 transition-colors"
    >
      {t.academy.resetProgress}
    </button>
  );
}

/* ----------------------------------------------------------------- missions */

function MissionCard({
  mission,
  input,
}: {
  mission: (typeof MISSIONS)[number];
  input: ReturnType<typeof achievementInput>;
}) {
  const t = useT();
  const locale = useLocale();
  const { have, need } = mission.measure(input);
  const done = have >= need;

  const kindLabel =
    mission.kind === "daily"
      ? t.academy.missionDaily
      : mission.kind === "weekly"
        ? t.academy.missionWeekly
        : t.academy.missionStanding;

  return (
    <Panel className="flex h-full flex-col p-5">
      <div className="flex items-baseline justify-between gap-3">
        <Label>{kindLabel}</Label>
        <span className="label tabular">
          {formatNumber(Math.min(have, need), locale)}/{formatNumber(need, locale)}
        </span>
      </div>
      <h3 className="text-ink mt-3 text-[15px] font-medium">{byLocale(locale, mission.title)}</h3>
      <Plain className="mt-2 flex-1">{byLocale(locale, mission.detail)}</Plain>
      <ProgressLine have={have} need={need} />
      <div className="mt-4">
        {done ? (
          <span className="text-good inline-flex items-center gap-1.5 text-[13px]">
            <Check className="size-4" strokeWidth={1.5} />
            {t.academy.missionDone}
          </span>
        ) : (
          <Link
            href={mission.href}
            className="text-ink-2 hover:text-ink inline-flex items-center gap-1 text-[13px] transition-colors"
          >
            {t.academy.startLesson}
            <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </Link>
        )}
      </div>
    </Panel>
  );
}

export function MissionsSection() {
  const t = useT();
  const { progress } = useLearning();
  const input = achievementInput(progress);

  const groups = [
    { kind: "daily" as const, label: t.academy.missionDaily },
    { kind: "weekly" as const, label: t.academy.missionWeekly },
    { kind: "standing" as const, label: t.academy.missionStanding },
  ];

  return (
    <Reveal>
      <RevealItem>
        <AcademyHead title={t.academy.missions} />
      </RevealItem>
      {groups.map((group) => (
        <RevealItem key={group.kind}>
          <div className="mt-10">
            <Label>{group.label}</Label>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {MISSIONS.filter((m) => m.kind === group.kind).map((m) => (
                <MissionCard key={m.id} mission={m} input={input} />
              ))}
            </div>
          </div>
        </RevealItem>
      ))}
    </Reveal>
  );
}

/* ------------------------------------------------------------- achievements */

const TIER_LABEL = {
  bronze: { kk: "Қола", ru: "Бронза", en: "Bronze" },
  silver: { kk: "Күміс", ru: "Серебро", en: "Silver" },
  gold: { kk: "Алтын", ru: "Золото", en: "Gold" },
} as const;

export function AchievementsSection() {
  const t = useT();
  const locale = useLocale();
  const { progress } = useLearning();
  const input = achievementInput(progress);
  const unlocked = ACHIEVEMENTS.filter((a) => a.test(input)).length;

  return (
    <Reveal>
      <RevealItem>
        <AcademyHead
          title={t.academy.achievements}
          aside={
            <div className="text-right">
              <Label>{t.academy.achievementUnlocked}</Label>
              <div className="display tabular mt-1.5 text-3xl">
                {unlocked}
                <span className="text-ink-3 ml-1.5 text-sm font-normal">
                  / {ACHIEVEMENTS.length}
                </span>
              </div>
            </div>
          }
        />
      </RevealItem>

      <RevealItem>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const done = a.test(input);
            const { have, need } = a.measure(input);
            return (
              <Panel key={a.id} tint={done} className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <Label>{byLocale(locale, TIER_LABEL[a.tier])}</Label>
                  {done ? (
                    <Check className="text-good size-4" strokeWidth={1.5} aria-hidden />
                  ) : (
                    <Lock className="text-ink-3 size-3.5" strokeWidth={1.5} aria-hidden />
                  )}
                </div>
                <h3 className={cn("mt-3 text-[15px] font-medium", done ? "text-ink" : "text-ink-2")}>
                  {byLocale(locale, a.title)}
                </h3>
                <Plain className="mt-2">{byLocale(locale, a.requirement)}</Plain>
                <ProgressLine have={have} need={need} />
                <p className="text-ink-3 tabular mt-2 text-[11px]">
                  {formatNumber(Math.min(have, need), locale)} / {formatNumber(need, locale)}
                  <span className="sr-only">
                    {" — "}
                    {done ? t.academy.achievementUnlocked : t.academy.achievementLocked}
                  </span>
                </p>
              </Panel>
            );
          })}
        </div>
      </RevealItem>
    </Reveal>
  );
}

/* ---------------------------------------------------------------- simulator */

type Scenario = {
  id: string;
  year: number;
  title: { kk: string; ru: string; en: string };
};

const YEARS = (coastline.years as { year: number; level_m: number; max_retreat_m: number }[]).filter(
  (y) => [1992, 2015, 2025, 2030, 2035].includes(y.year)
);

const SCENARIOS: Scenario[] = YEARS.map((y) => ({
  id: `year-${y.year}`,
  year: y.year,
  title: { kk: `${y.year} ж.`, ru: `${y.year} г.`, en: `${y.year}` },
}));

/**
 * The scenario view runs on the platform's own coastline index — the same
 * modelled retreat the map draws — so the simulator cannot show a future the
 * dashboards would disagree with. It is labelled a model everywhere, because
 * that is what it is.
 */
export function SimulatorSection() {
  const t = useT();
  const locale = useLocale();
  const { record } = useLearning();
  const [active, setActive] = useState(SCENARIOS.length - 3);

  const row = YEARS[active];
  const base = YEARS[0];
  const retreatKm = Math.abs(row.max_retreat_m) / 1000;
  const dropM = Math.abs(row.level_m - base.level_m);

  return (
    <Reveal>
      <RevealItem>
        <AcademyHead title={t.academy.simulatorTitle} intro={t.academy.simulatorIntro} />
      </RevealItem>

      <RevealItem>
        <div className="mt-10 flex flex-wrap gap-2">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActive(i);
                record("simulation_run", s.id);
              }}
              aria-pressed={i === active}
              className={cn(
                "rounded-full border px-4 py-2 text-[13px] transition-colors",
                i === active
                  ? "bg-ink text-paper border-ink"
                  : "border-rule text-ink-2 hover:border-ink hover:text-ink"
              )}
            >
              {byLocale(locale, s.title)}
            </button>
          ))}
        </div>
      </RevealItem>

      <RevealItem>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <div className="rule-t pt-4">
            <Label>{t.water.seaLevel}</Label>
            <div className="display tabular text-bad mt-2 text-4xl whitespace-nowrap">
              {row.level_m.toFixed(2)}
              <span className="text-ink-3 ml-1 text-base font-normal">
                {byLocale(locale, { kk: "м", ru: "м", en: "m" })}
              </span>
            </div>
          </div>
          <div className="rule-t pt-4">
            <Label>
              {byLocale(locale, {
                kk: "1992 жылдан төмендеу",
                ru: "падение с 1992 года",
                en: "fall since 1992",
              })}
            </Label>
            <div className="display tabular text-warn mt-2 text-4xl whitespace-nowrap">
              {dropM.toFixed(2)}
              <span className="text-ink-3 ml-1 text-base font-normal">
                {byLocale(locale, { kk: "м", ru: "м", en: "m" })}
              </span>
            </div>
          </div>
          <div className="rule-t pt-4">
            <Label>{t.water.retreat}</Label>
            <div className="display tabular text-warn mt-2 text-4xl whitespace-nowrap">
              {retreatKm.toFixed(1)}
              <span className="text-ink-3 ml-1 text-base font-normal">
                {byLocale(locale, { kk: "км", ru: "км", en: "km" })}
              </span>
            </div>
          </div>
        </div>
      </RevealItem>

      <RevealItem>
        <Plain className="mt-8">
          {byLocale(locale, {
            kk: "Көлденең шегіну = деңгейдің төмендеуі / түп еңісі. 2030 және 2035 жылдар — экстраполяция, бақылау емес.",
            ru: "Горизонтальное отступание = падение уровня / уклон дна. 2030 и 2035 годы — экстраполяция, а не наблюдение.",
            en: "Horizontal retreat = drop in level ÷ seabed slope. The 2030 and 2035 entries are extrapolation, not observation.",
          })}
        </Plain>
        <div className="mt-5">
          <SourceBadge sourceId="model" />
        </div>
        <div className="mt-6">
          <Button href="/map/water" variant="outline">
            {t.common.openMap}
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Button>
        </div>
      </RevealItem>
    </Reveal>
  );
}

/* ---------------------------------------------------------------- community */

/**
 * Community impact.
 *
 * The platform has no server and no accounts, so there is no honest way to
 * report what other people have learned. Rather than invent a number — which
 * would break the one rule this project holds everywhere else — the cohort
 * figures carry the same demonstration badge the dashboards use for modelled
 * data, and the reader's own contribution, which IS real, is shown separately.
 */
const COHORT = { learners: 240, lessons: 1180, discoveries: 640 };

export function CommunitySection() {
  const t = useT();
  const locale = useLocale();
  const { progress } = useLearning();
  const input = achievementInput(progress);

  const rows = [
    {
      label: { kk: "Оқушылар", ru: "Учащиеся", en: "Learners" },
      cohort: COHORT.learners,
      mine: progress.events.length > 0 ? 1 : 0,
    },
    {
      label: { kk: "Аяқталған сабақтар", ru: "Пройдено уроков", en: "Lessons finished" },
      cohort: COHORT.lessons,
      mine: input.lessons,
    },
    {
      label: { kk: "Ашылымдар", ru: "Открытий", en: "Discoveries" },
      cohort: COHORT.discoveries,
      mine: input.discoveries,
    },
  ];

  return (
    <Reveal>
      <RevealItem>
        <AcademyHead title={t.academy.community} aside={<MockBadge />} />
      </RevealItem>

      <RevealItem>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label.en} className="rule-t pt-4">
              <Label>{byLocale(locale, row.label)}</Label>
              <div className="display tabular mt-2 text-4xl">
                {formatNumber(row.cohort + row.mine, locale)}
              </div>
              <p className="text-ink-3 mt-2 text-[12px]">
                {t.academy.yourContribution}: {formatNumber(row.mine, locale)}
              </p>
            </div>
          ))}
        </div>
      </RevealItem>

      <RevealItem>
        <Plain className="mt-10 max-w-[62ch]">{t.academy.communityNote}</Plain>
      </RevealItem>

      <RevealItem>
        <div className="mt-10">
          <Label>{t.academy.discoveries}</Label>
          <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {DISCOVERIES.map((d) => {
              const found = progress.done.discovery_found.has(d.id);
              return (
                <li key={d.id} className="rule-t flex items-baseline gap-2.5 pt-3">
                  <span
                    className={cn(
                      "mt-1.5 inline-block size-1.5 shrink-0 rounded-full",
                      found ? "bg-good" : "bg-rule"
                    )}
                    aria-hidden
                  />
                  <div>
                    <div className={cn("text-[14px]", found ? "text-ink" : "text-ink-3")}>
                      {byLocale(locale, d.title)}
                    </div>
                    {found && <Plain className="mt-1">{byLocale(locale, d.fact)}</Plain>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </RevealItem>
    </Reveal>
  );
}

/* ----------------------------------------------------------------- explorer */

/**
 * Explorer mode.
 *
 * Every discovery is a real object already drawn on one of the map modules —
 * a habitat, a hotspot, a field — so revealing one and then opening it on the
 * map lands the reader on the same feature the dashboards show. The fact is
 * held back until the reader claims it, which is what makes exploring worth
 * doing; nothing is invented to fill the grid.
 */
export function ExplorerSection() {
  const t = useT();
  const locale = useLocale();
  const { progress, record } = useLearning();
  const found = progress.done.discovery_found;

  const KIND_LABEL = {
    species: { kk: "Түр", ru: "Вид", en: "Species" },
    habitat: { kk: "Мекен", ru: "Место обитания", en: "Habitat" },
    hotspot: { kk: "Ластану ошағы", ru: "Очаг загрязнения", en: "Pollution hotspot" },
    coastline: { kk: "Жағалау", ru: "Береговая линия", en: "Shoreline" },
    facility: { kk: "Нысан", ru: "Объект", en: "Facility" },
  } as const;

  return (
    <Reveal>
      <RevealItem>
        <AcademyHead
          title={t.academy.explorer}
          intro={t.academy.explorerHint}
          aside={
            <div className="text-right">
              <Label>{t.academy.discoveries}</Label>
              <div className="display tabular mt-1.5 text-3xl">
                {found.size}
                <span className="text-ink-3 ml-1.5 text-sm font-normal">
                  / {DISCOVERIES.length}
                </span>
              </div>
            </div>
          }
        />
      </RevealItem>

      <RevealItem>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {DISCOVERIES.map((d) => {
            const open = found.has(d.id);
            return (
              <Panel key={d.id} tint={open} className="flex h-full flex-col p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <Label>{byLocale(locale, KIND_LABEL[d.kind])}</Label>
                  <span className="label tabular">
                    {d.lat.toFixed(2)}, {d.lng.toFixed(2)}
                  </span>
                </div>
                <h3 className="display mt-3 text-lg">{byLocale(locale, d.title)}</h3>

                {open ? (
                  <>
                    <Plain className="mt-3 flex-1">{byLocale(locale, d.fact)}</Plain>
                    <div className="mt-4">
                      <SourceBadge sourceId={d.sourceId} />
                    </div>
                    <Link
                      href={`/map/${d.module}`}
                      className="text-ink-2 hover:text-ink mt-4 inline-flex items-center gap-1 text-[13px] transition-colors"
                    >
                      {t.academy.exploreOnMap}
                      <ArrowRight className="size-3.5" strokeWidth={1.5} />
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex-1" />
                    <div className="mt-5">
                      <Button variant="outline" onClick={() => record("discovery_found", d.id)}>
                        {t.academy.reveal}
                        <ArrowRight className="size-4" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </>
                )}
              </Panel>
            );
          })}
        </div>
      </RevealItem>
    </Reveal>
  );
}
