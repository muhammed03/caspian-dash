import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getDict } from "@/shared/lib/i18n";
import { getLocale } from "@/shared/lib/i18n/server";
import { AcademyShell } from "@/widgets/academy/academy-shell";
import { ACADEMY_SECTIONS, type AcademySection } from "@/shared/config/academy/sections";
import {
  JourneySection,
  MissionsSection,
  AchievementsSection,
  SimulatorSection,
  CommunitySection,
  ExplorerSection,
} from "@/widgets/academy/sections";
import { LessonsSection } from "@/widgets/academy/lesson-view";
import { QuizSection } from "@/widgets/academy/quiz-view";

export function generateStaticParams() {
  return ACADEMY_SECTIONS.map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const locale = await getLocale();
  const t = getDict(locale);
  const known = ACADEMY_SECTIONS.includes(section as AcademySection);
  const name = known ? t.academy[section as AcademySection] : t.academy.title;
  return { title: `${t.common.appName} — ${name}` };
}

const VIEWS: Record<AcademySection, React.ComponentType> = {
  journey: JourneySection,
  lessons: LessonsSection,
  quiz: QuizSection,
  explorer: ExplorerSection,
  missions: MissionsSection,
  achievements: AchievementsSection,
  simulator: SimulatorSection,
  community: CommunitySection,
};

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!ACADEMY_SECTIONS.includes(section as AcademySection)) notFound();

  const id = section as AcademySection;
  const View = VIEWS[id];

  return (
    <AcademyShell section={id}>
      <View />
    </AcademyShell>
  );
}
