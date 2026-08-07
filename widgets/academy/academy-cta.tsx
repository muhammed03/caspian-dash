"use client";

import { ArrowRight } from "lucide-react";

import { byLocale } from "@/shared/lib/i18n";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { Display, Label, Lede, Reveal, RevealItem, SectionMark } from "@/shared/ui/primitives";
import { Button } from "@/shared/ui/button";
import { LESSONS } from "@/shared/config/academy/lessons";
import { QUIZ } from "@/shared/config/academy/quiz";
import { DISCOVERIES } from "@/shared/config/academy/progression";

/**
 * The landing page's entry into the Academy. Built from the same section
 * furniture as every other block on the page — numbered mark, display heading,
 * lede, hairline meta row — so it reads as the story's next chapter rather than
 * as an advertisement bolted onto the end.
 */
export function AcademyCta() {
  const t = useT();
  const locale = useLocale();

  const counts = [
    {
      value: LESSONS.length,
      label: { kk: "сабақ", ru: "уроков", en: "lessons" },
    },
    {
      value: QUIZ.length,
      label: { kk: "тексеру сұрағы", ru: "проверочных вопросов", en: "questions" },
    },
    {
      value: DISCOVERIES.length,
      label: { kk: "картадағы ашылым", ru: "открытий на карте", en: "map discoveries" },
    },
  ];

  return (
    <section className="rule-t py-28 md:py-40">
      <div className="mx-auto max-w-[1800px] px-5 md:px-10">
        <Reveal className="max-w-2xl">
          <RevealItem>
            <SectionMark index={6}>{t.academy.title}</SectionMark>
          </RevealItem>
          <RevealItem>
            <Display className="mt-6 max-w-[14ch]">{t.academy.tagline}</Display>
          </RevealItem>
          <RevealItem>
            <Lede className="mt-5">{t.academy.intro}</Lede>
          </RevealItem>
        </Reveal>

        <Reveal className="mt-14">
          <RevealItem>
            <div className="grid max-w-3xl gap-8 sm:grid-cols-3">
              {counts.map((c) => (
                <div key={c.label.en} className="rule-t pt-4">
                  <div className="display tabular text-4xl">{c.value}</div>
                  <Label className="mt-2">{byLocale(locale, c.label)}</Label>
                </div>
              ))}
            </div>
          </RevealItem>
          <RevealItem>
            <div className="mt-12">
              <Button href="/academy/journey">
                {t.academy.open}
                <ArrowRight className="size-4" strokeWidth={1.5} />
              </Button>
            </div>
          </RevealItem>
        </Reveal>
      </div>
    </section>
  );
}
