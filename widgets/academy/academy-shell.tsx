"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Compass,
  BookOpen,
  ListChecks,
  Medal,
  HelpCircle,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useT } from "@/shared/lib/i18n/client";
import { useLearning } from "@/entities/learning/store";
import { AwardToast } from "./parts";
import { ACADEMY_SECTIONS, type AcademySection } from "@/shared/config/academy/sections";

const ICONS: Record<AcademySection, typeof Compass> = {
  journey: Compass,
  lessons: BookOpen,
  quiz: HelpCircle,
  missions: ListChecks,
  achievements: Medal,
  simulator: SlidersHorizontal,
  community: Users,
};

/**
 * The Academy shell. Structurally identical to the map shell — a hairline tab
 * row that is never covered by content, then the section below it — so moving
 * between the dashboards and the Academy feels like one product.
 */
export function AcademyShell({
  section,
  children,
}: {
  section: AcademySection;
  children: React.ReactNode;
}) {
  const t = useT();
  const { lastAward, clearAward } = useLearning();

  return (
    <div className="min-h-screen pt-14">
      <div className="border-rule bg-paper/95 sticky top-14 z-30 border-b backdrop-blur">
        <nav className="scrollbar-none mx-auto flex max-w-[1800px] overflow-x-auto px-3 md:px-8">
          {ACADEMY_SECTIONS.map((id) => {
            const Icon = ICONS[id];
            const active = id === section;
            return (
              <Link
                key={id}
                href={`/academy/${id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 px-3 py-3 text-[13px] whitespace-nowrap transition-colors md:px-4",
                  active ? "text-ink" : "text-ink-2 hover:text-ink"
                )}
              >
                <Icon className="size-4" strokeWidth={1.5} />
                {t.academy[id]}
                {active && (
                  <motion.span
                    layoutId="academy-underline"
                    className="bg-ink absolute inset-x-2 -bottom-px h-0.5"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="mx-auto max-w-[1800px] px-5 py-10 md:px-10 md:py-14">{children}</main>

      <AnimatePresence>
        {lastAward && (
          <AwardToast
            key={`${lastAward.type}-${lastAward.ref}`}
            xp={lastAward.xp}
            label={t.academy[lastAward.type === "lesson_completed" ? "lessonDone" : "correct"]}
            onDone={clearAward}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
