"use client";

import { motion } from "motion/react";
import { cn } from "@/shared/lib/cn";
import { byLocale, formatNumber, type Locale, type Trio } from "@/shared/lib/i18n";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { Label } from "@/shared/ui/primitives";
import { springSnappy } from "@/shared/lib/motion";
import { LEVEL_NAMES } from "@/shared/config/academy/progression";
import type { AchievementInput } from "@/shared/config/academy/types";
import type { Progress } from "@/entities/learning/model";
import { LESSONS, LESSON_BY_ID } from "@/shared/config/academy/lessons";
import { DISCOVERIES } from "@/shared/config/academy/progression";

/**
 * Small pieces shared by every Academy section. All of them are assembled from
 * the primitives the rest of the site already uses — hairline rules, the small
 * uppercase label, display figures — so nothing here introduces a second visual
 * language.
 */

/** Flattens derived progress into the shape achievements and missions test against. */
export function achievementInput(progress: Progress): AchievementInput {
  const lessons = progress.done.lesson_completed;
  const tracks = new Set(
    [...lessons].map((id) => LESSON_BY_ID.get(id)?.track).filter(Boolean) as string[]
  );
  return {
    lessons: lessons.size,
    totalLessons: LESSONS.length,
    quizAnswered: progress.done.quiz_answered.size,
    perfectChecks: progress.done.quiz_perfect.size,
    discoveries: progress.done.discovery_found.size,
    totalDiscoveries: DISCOVERIES.length,
    missions: progress.done.mission_completed.size,
    simulations: progress.done.simulation_run.size,
    streak: progress.streak,
    level: progress.level.level,
    tracksCompleted: tracks.size,
  };
}

export function levelName(level: number, locale: Locale): string {
  return byLocale(locale, LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)]);
}

/**
 * The level ring. A thin arc rather than a filled bar, so it reads as an
 * instrument dial like the rest of the platform's charts rather than a game HUD.
 */
export function LevelRing({
  progress,
  level,
  size = 76,
}: {
  progress: number;
  level: number;
  size?: number;
}) {
  const stroke = 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-rule)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="display text-xl">{level}</span>
      </div>
    </div>
  );
}

/** Horizontal progress hairline — used for missions and achievements. */
export function ProgressLine({ have, need }: { have: number; need: number }) {
  const ratio = need > 0 ? Math.min(1, have / need) : 0;
  const done = ratio >= 1;
  return (
    <div className="bg-rule mt-2 h-px w-full overflow-hidden">
      <motion.div
        className={cn("h-px", done ? "bg-good" : "bg-ink")}
        initial={{ width: 0 }}
        animate={{ width: `${ratio * 100}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/** The XP total, set in display type like every other headline figure. */
export function XpFigure({ xp, className }: { xp: number; className?: string }) {
  const t = useT();
  const locale = useLocale();
  return (
    <div className={className}>
      <Label>{t.academy.xp}</Label>
      <div className="display tabular mt-1.5 text-3xl">
        {formatNumber(xp, locale)}
        <span className="text-ink-3 ml-1.5 text-sm font-normal">{t.academy.xpShort}</span>
      </div>
    </div>
  );
}

export function StreakFigure({ days, className }: { days: number; className?: string }) {
  const t = useT();
  const locale = useLocale();
  return (
    <div className={className}>
      <Label>{t.academy.streak}</Label>
      <div className="display tabular mt-1.5 text-3xl">
        {formatNumber(days, locale)}
        <span className="text-ink-3 ml-1.5 text-sm font-normal">{t.academy.streakDays}</span>
      </div>
    </div>
  );
}

/**
 * The XP toast. Deliberately quiet: a hairline card that states what was earned
 * and leaves. No sound, no burst, no full-screen takeover — the platform never
 * shouts, and a learning module inside it should not either.
 */
export function AwardToast({
  xp,
  label,
  onDone,
}: {
  xp: number;
  label: string;
  onDone: () => void;
}) {
  const locale = useLocale();
  const t = useT();
  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={springSnappy}
      onAnimationComplete={() => window.setTimeout(onDone, 2600)}
      className="border-rule bg-paper fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center justify-between gap-4 rounded-lg border px-4 py-3 md:inset-x-auto md:right-6 md:bottom-6"
    >
      <span className="text-ink text-[13px]">{label}</span>
      <span className="display tabular text-good shrink-0 text-sm">
        +{formatNumber(xp, locale)} {t.academy.xpShort}
      </span>
    </motion.div>
  );
}

/** Section opener used by every Academy panel, matching the site's numbered marks. */
export function AcademyHead({
  title,
  intro,
  aside,
}: {
  title: string;
  intro?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="rule-b flex flex-wrap items-end justify-between gap-6 pb-6">
      <div>
        <h1 className="display text-3xl md:text-4xl">{title}</h1>
        {intro && <p className="text-ink-2 mt-3 max-w-[56ch] text-sm leading-relaxed">{intro}</p>}
      </div>
      {aside}
    </div>
  );
}

/** A locked/unlocked marker that stays legible without relying on colour alone. */
export function StateDot({ done, className }: { done: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        done ? "bg-good" : "bg-rule",
        className
      )}
      aria-hidden
    />
  );
}

export function trioText(trio: Trio, locale: Locale): string {
  return byLocale(locale, trio);
}
