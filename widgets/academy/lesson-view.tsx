"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, MapPin } from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/shared/lib/cn";
import { byLocale, formatFixed, formatNumber } from "@/shared/lib/i18n";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { Label, Plain, Panel, Reveal, RevealItem } from "@/shared/ui/primitives";
import { Button } from "@/shared/ui/button";
import { SourceBadge } from "@/shared/ui/source-badge";
import { SERIES, CHART_INK } from "@/shared/config/chart-palette";
import { useLearning } from "@/entities/learning/store";
import { LESSONS, checksOf } from "@/shared/config/academy/lessons";
import { QUIZ_BY_ID } from "@/shared/config/academy/quiz";
import { metric } from "@/shared/config/academy/metrics";
import type { ChartId, Lesson, LessonCard } from "@/shared/config/academy/types";
import { AcademyHead, ProgressLine } from "./parts";

import seaLevel from "@/data/sea-level.json";
import wildlife from "@/data/wildlife.json";
import rivers from "@/data/rivers.json";
import pollution from "@/data/pollution.json";
import coastline from "@/data/coastline-index.json";

/* ------------------------------------------------------------------ charts */

/**
 * Lesson figures reuse the exact chart vocabulary of the dashboards: the same
 * palette, the same 2px stroke, no gridlines, no animation on load. A lesson
 * chart and a dashboard chart of the same data are indistinguishable, which is
 * the point — the reader is learning to read *this* interface.
 */
function LessonChart({ chart }: { chart: ChartId }) {
  const locale = useLocale();

  if (chart === "seaLevel") {
    const data = seaLevel.series as { year: number; level_m: number }[];
    return (
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="lessonLevel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.18} />
              <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: CHART_INK.muted }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis domain={[-30, -26]} hide />
          <Area
            type="monotone"
            dataKey="level_m"
            stroke={SERIES[0]}
            strokeWidth={2}
            fill="url(#lessonLevel)"
            baseValue={-30}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chart === "sturgeonCatch") {
    const data = wildlife.sturgeon.catch_series as { year: number; tonnes: number }[];
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: CHART_INK.muted }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Bar dataKey="tonnes" fill={SERIES[1]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart === "riverInflow") {
    const data = rivers.rivers.map((r) => ({
      name: byLocale(locale, { kk: r.name_kk, ru: r.name_ru, en: r.name_en }),
      current: r.current,
    }));
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fontSize: 11, fill: CHART_INK.muted }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="current" fill={SERIES[0]} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // pollutionStructure — a stacked hairline rather than a pie
  return (
    <ul className="space-y-4">
      {pollution.structure.map((s, i) => (
        <li key={s.id}>
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <span className="text-ink text-[14px]">
              {byLocale(locale, { kk: s.name_kk, ru: s.name_ru, en: s.name_en })}
            </span>
            <span className="tabular text-ink text-sm font-semibold">{s.percent}%</span>
          </div>
          <div className="bg-tint h-1.5 w-full overflow-hidden rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${s.percent}%` }}
              transition={{ duration: 0.9, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: SERIES[i % SERIES.length] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------- one lesson */

function CheckCard({
  questionId,
  onResolved,
}: {
  questionId: string;
  onResolved: (firstTry: boolean) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const question = QUIZ_BY_ID.get(questionId);
  const [picked, setPicked] = useState<number | null>(null);
  const [missed, setMissed] = useState(false);

  if (!question) return null;
  const answered = picked !== null;
  const correct = picked === question.answer;

  return (
    <Panel tint className="p-5 md:p-6">
      <Label>{t.plain.whatIsThis}</Label>
      <p className="text-ink mt-3 text-[15px] leading-relaxed">{byLocale(locale, question.prompt)}</p>

      <div className="mt-5 space-y-2">
        {question.options.map((option, i) => {
          const isAnswer = i === question.answer;
          const chosen = picked === i;
          return (
            <button
              key={i}
              type="button"
              disabled={answered && correct}
              onClick={() => {
                setPicked(i);
                if (i === question.answer) onResolved(!missed);
                else setMissed(true);
              }}
              aria-pressed={chosen}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-[14px] transition-colors",
                answered && isAnswer
                  ? "border-good text-ink bg-paper"
                  : chosen
                    ? "border-bad text-ink-2 bg-paper"
                    : "border-rule text-ink-2 hover:border-ink hover:text-ink bg-paper"
              )}
            >
              <span
                className={cn(
                  "inline-block size-1.5 shrink-0 rounded-full",
                  answered && isAnswer ? "bg-good" : chosen ? "bg-bad" : "bg-rule"
                )}
                aria-hidden
              />
              {byLocale(locale, option)}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="rule-t mt-5 pt-4">
              <Label>{correct ? t.academy.correct : t.academy.whyThis}</Label>
              <Plain className="mt-2 max-w-none">{byLocale(locale, question.explain)}</Plain>
              {question.sourceId && (
                <div className="mt-4">
                  <SourceBadge sourceId={question.sourceId} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
}

function Card({ card, onResolved }: { card: LessonCard; onResolved: (ok: boolean) => void }) {
  const t = useT();
  const locale = useLocale();

  switch (card.kind) {
    case "text":
      return (
        <div>
          <h2 className="display text-2xl md:text-3xl">{byLocale(locale, card.title)}</h2>
          <p className="text-ink-2 mt-4 max-w-[62ch] text-[15px] leading-relaxed">
            {byLocale(locale, card.body)}
          </p>
        </div>
      );

    case "stat": {
      const m = metric(card.metric);
      const tone =
        card.tone === "bad" ? "text-bad" : card.tone === "warn" ? "text-warn" : "text-ink";
      return (
        <div className="rule-t pt-5">
          <Label>{byLocale(locale, card.label)}</Label>
          <div className={cn("display tabular mt-2 text-5xl md:text-6xl", tone)}>
            {m.decimals > 0
              ? formatFixed(m.value, locale, m.decimals)
              : formatNumber(Math.round(m.value), locale)}
          </div>
          <Plain className="mt-4">{byLocale(locale, card.plain)}</Plain>
          <div className="mt-4">
            <SourceBadge sourceId={m.sourceId} />
          </div>
        </div>
      );
    }

    case "chart":
      return (
        <figure>
          <LessonChart chart={card.chart} />
          <figcaption className="text-ink-2 rule-t mt-4 pt-3 text-[13px] leading-relaxed">
            {byLocale(locale, card.caption)}
          </figcaption>
        </figure>
      );

    case "compare": {
      const years = coastline.years as { year: number; max_retreat_m: number; level_m: number }[];
      const from = years.find((y) => y.year === card.fromYear) ?? years[0];
      const to = years.find((y) => y.year === card.toYear) ?? years[years.length - 1];
      const rows = [from, to];
      const widest = Math.max(...rows.map((r) => Math.abs(r.max_retreat_m)));
      return (
        <figure>
          <div className="space-y-5">
            {rows.map((row) => (
              <div key={row.year}>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="label tabular">{row.year}</span>
                  <span className="tabular text-ink text-sm">
                    {formatFixed(Math.abs(row.max_retreat_m) / 1000, locale, 1)}{" "}
                    {byLocale(locale, { kk: "км", ru: "км", en: "km" })}
                  </span>
                </div>
                <div className="bg-tint h-2 w-full overflow-hidden rounded-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(Math.abs(row.max_retreat_m) / widest) * 100}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-warn h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <figcaption className="text-ink-2 rule-t mt-5 pt-3 text-[13px] leading-relaxed">
            {byLocale(locale, card.caption)}
          </figcaption>
        </figure>
      );
    }

    case "map":
      return (
        <Panel className="p-5 md:p-6">
          <Label>{t.common.map}</Label>
          <p className="text-ink mt-3 text-[15px] leading-relaxed">{byLocale(locale, card.prompt)}</p>
          <div className="mt-5">
            <Button href={`/map/${card.module}`} variant="outline">
              <MapPin className="size-4" strokeWidth={1.5} />
              {t.common.openMap}
            </Button>
          </div>
        </Panel>
      );

    case "check":
      return <CheckCard questionId={card.question} onResolved={onResolved} />;
  }
}

function LessonReader({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) {
  const t = useT();
  const locale = useLocale();
  const { record, has } = useLearning();
  const [index, setIndex] = useState(0);
  const [passed, setPassed] = useState<Set<string>>(new Set());

  const card = lesson.cards[index];
  const checks = useMemo(() => checksOf(lesson), [lesson]);
  const isCheck = card.kind === "check";
  const checkDone = isCheck ? passed.has(card.question) : true;
  const last = index === lesson.cards.length - 1;

  function resolveCheck(firstTry: boolean) {
    if (!isCheck) return;
    const id = card.question;
    setPassed((prev) => new Set(prev).add(id));
    record("quiz_answered", id);
    if (firstTry) record("quiz_perfect", id);
  }

  function finish() {
    record("lesson_completed", lesson.id);
    onExit();
  }

  return (
    <div>
      <button
        type="button"
        onClick={onExit}
        className="text-ink-2 hover:text-ink inline-flex items-center gap-1.5 text-[13px] transition-colors"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} />
        {t.academy.lessons}
      </button>

      <div className="rule-b mt-5 pb-6">
        <h1 className="display text-3xl md:text-4xl">{byLocale(locale, lesson.title)}</h1>
        <p className="text-ink-2 mt-3 max-w-[56ch] text-sm leading-relaxed">
          {byLocale(locale, lesson.hook)}
        </p>
      </div>

      <div className="mt-4">
        <div className="text-ink-3 tabular flex items-baseline justify-between text-[11px]">
          <span>
            {index + 1} / {lesson.cards.length}
          </span>
          <span>
            {lesson.minutes} {t.academy.minutes}
          </span>
        </div>
        <ProgressLine have={index + 1} need={lesson.cards.length} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 min-h-[220px]"
        >
          <Card card={card} onResolved={resolveCheck} />
        </motion.div>
      </AnimatePresence>

      <div className="rule-t mt-12 flex flex-wrap items-center justify-between gap-4 pt-6">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="text-ink-2 hover:text-ink inline-flex items-center gap-1.5 text-[13px] transition-colors disabled:opacity-30"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          {t.common.close}
        </button>

        {last ? (
          <Button onClick={finish} className={cn(!checkDone && "pointer-events-none opacity-40")}>
            {t.academy.finishLesson}
            <Check className="size-4" strokeWidth={1.5} />
          </Button>
        ) : (
          <Button
            onClick={() => setIndex((i) => Math.min(lesson.cards.length - 1, i + 1))}
            className={cn(!checkDone && "pointer-events-none opacity-40")}
          >
            {t.academy.nextCard}
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Button>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-6">
        {lesson.sourceIds.map((id) => (
          <SourceBadge key={id} sourceId={id} />
        ))}
      </div>

      {checks.length > 0 && (
        <p className="text-ink-3 mt-6 text-[12px]">
          {passed.size} / {checks.length} · {t.academy.checkAnswer}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- index */

const TRACK_LABEL = {
  sea: { kk: "Теңіз", ru: "Море", en: "The sea" },
  coast: { kk: "Жағалау", ru: "Берег", en: "The shore" },
  pollution: { kk: "Ластану", ru: "Загрязнение", en: "Pollution" },
  life: { kk: "Тіршілік", ru: "Жизнь", en: "Life" },
  resources: { kk: "Ресурстар", ru: "Ресурсы", en: "Resources" },
  future: { kk: "Болашақ", ru: "Будущее", en: "The future" },
} as const;

export function LessonsSection() {
  const t = useT();
  const locale = useLocale();
  const { has } = useLearning();
  const [open, setOpen] = useState<Lesson | null>(null);

  if (open) return <LessonReader lesson={open} onExit={() => setOpen(null)} />;

  const doneCount = LESSONS.filter((l) => has("lesson_completed", l.id)).length;

  return (
    <Reveal>
      <RevealItem>
        <AcademyHead
          title={t.academy.lessons}
          intro={t.academy.intro}
          aside={
            <div className="text-right">
              <Label>{t.academy.lessonDone}</Label>
              <div className="display tabular mt-1.5 text-3xl">
                {doneCount}
                <span className="text-ink-3 ml-1.5 text-sm font-normal">/ {LESSONS.length}</span>
              </div>
            </div>
          }
        />
      </RevealItem>

      <RevealItem>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {LESSONS.map((lesson) => {
            const done = has("lesson_completed", lesson.id);
            return (
              <Panel key={lesson.id} tint={done} className="flex h-full flex-col p-5 md:p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <Label>{byLocale(locale, TRACK_LABEL[lesson.track])}</Label>
                  <span className="label tabular">
                    {lesson.minutes} {t.academy.minutes}
                  </span>
                </div>
                <h2 className="display mt-4 text-xl leading-tight">
                  {byLocale(locale, lesson.title)}
                </h2>
                <Plain className="mt-3 flex-1">{byLocale(locale, lesson.hook)}</Plain>
                <div className="mt-5">
                  <Button variant={done ? "outline" : "solid"} onClick={() => setOpen(lesson)}>
                    {done ? t.academy.reviewLesson : t.academy.startLesson}
                    <ArrowRight className="size-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </Panel>
            );
          })}
        </div>
      </RevealItem>
    </Reveal>
  );
}
