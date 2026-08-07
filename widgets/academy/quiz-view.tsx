"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, RotateCcw } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { byLocale, formatNumber } from "@/shared/lib/i18n";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { Label, Plain, Panel, Reveal, RevealItem } from "@/shared/ui/primitives";
import { Button } from "@/shared/ui/button";
import { SourceBadge } from "@/shared/ui/source-badge";
import { useLearning } from "@/entities/learning/store";
import { QUIZ } from "@/shared/config/academy/quiz";
import type { QuizDifficulty } from "@/shared/config/academy/types";
import { AcademyHead, ProgressLine } from "./parts";

const DIFFICULTIES: QuizDifficulty[] = ["basic", "applied", "expert"];

/**
 * The quiz.
 *
 * The explanation is the product, not the score. It appears after every answer,
 * right or wrong, and it is written to teach the caveat behind the figure — so
 * a reader who guesses still leaves knowing why the answer is what it is.
 */
export function QuizSection() {
  const t = useT();
  const locale = useLocale();
  const { record } = useLearning();

  const [filter, setFilter] = useState<QuizDifficulty | "all">("all");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = useMemo(
    () => (filter === "all" ? QUIZ : QUIZ.filter((q) => q.difficulty === filter)),
    [filter]
  );

  const question = questions[index];
  const answered = picked !== null;

  const DIFF_LABEL: Record<QuizDifficulty, string> = {
    basic: t.academy.difficultyBasic,
    applied: t.academy.difficultyApplied,
    expert: t.academy.difficultyExpert,
  };

  function restart(next: QuizDifficulty | "all" = filter) {
    setFilter(next);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  }

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    record("quiz_answered", question.id);
    if (i === question.answer) {
      setScore((s) => s + 1);
      record("quiz_perfect", question.id);
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  if (finished) {
    return (
      <Reveal>
        <RevealItem>
          <AcademyHead title={t.academy.quiz} />
        </RevealItem>
        <RevealItem>
          <div className="mt-14 text-center">
            <Label>{t.academy.yourScore}</Label>
            <div className="display tabular mt-3 text-6xl md:text-7xl">
              {score}
              <span className="text-ink-3 ml-2 text-2xl font-normal">/ {questions.length}</span>
            </div>
            <div className="mt-10 flex justify-center">
              <Button onClick={() => restart()}>
                <RotateCcw className="size-4" strokeWidth={1.5} />
                {t.academy.restart}
              </Button>
            </div>
          </div>
        </RevealItem>
      </Reveal>
    );
  }

  return (
    <Reveal>
      <RevealItem>
        <AcademyHead title={t.academy.quiz} intro={t.academy.quizIntro} />
      </RevealItem>

      <RevealItem>
        <div className="mt-8 flex flex-wrap gap-2">
          {(["all", ...DIFFICULTIES] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => restart(d)}
              aria-pressed={filter === d}
              className={cn(
                "rounded-full border px-4 py-2 text-[13px] transition-colors",
                filter === d
                  ? "bg-ink text-paper border-ink"
                  : "border-rule text-ink-2 hover:border-ink hover:text-ink"
              )}
            >
              {d === "all" ? t.common.sources : DIFF_LABEL[d]}
            </button>
          ))}
        </div>
      </RevealItem>

      <RevealItem>
        <div className="mt-8">
          <div className="text-ink-3 tabular flex items-baseline justify-between text-[11px]">
            <span>
              {t.academy.questionOf} {index + 1} / {questions.length}
            </span>
            <span>{DIFF_LABEL[question.difficulty]}</span>
          </div>
          <ProgressLine have={index + (answered ? 1 : 0)} need={questions.length} />
        </div>
      </RevealItem>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <h2 className="display max-w-[36ch] text-2xl leading-tight md:text-3xl">
            {byLocale(locale, question.prompt)}
          </h2>

          <div className="mt-8 grid gap-2.5 md:max-w-2xl">
            {question.options.map((option, i) => {
              const isAnswer = i === question.answer;
              const chosen = picked === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={answered}
                  aria-pressed={chosen}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left text-[15px] transition-colors",
                    answered && isAnswer
                      ? "border-good text-ink"
                      : chosen
                        ? "border-bad text-ink-2"
                        : "border-rule text-ink-2 enabled:hover:border-ink enabled:hover:text-ink"
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
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <Panel tint className="mt-8 p-5 md:max-w-2xl md:p-6">
                  <Label>
                    {picked === question.answer ? t.academy.correct : t.academy.whyThis}
                  </Label>
                  <Plain className="mt-3 max-w-none">{byLocale(locale, question.explain)}</Plain>
                  {question.sourceId && (
                    <div className="mt-4">
                      <SourceBadge sourceId={question.sourceId} />
                    </div>
                  )}
                </Panel>

                <div className="mt-8">
                  <Button onClick={next}>
                    {t.academy.nextCard}
                    <ArrowRight className="size-4" strokeWidth={1.5} />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <p className="text-ink-3 tabular mt-14 text-[12px]">
        {t.academy.yourScore}: {formatNumber(score, locale)}
      </p>
    </Reveal>
  );
}
