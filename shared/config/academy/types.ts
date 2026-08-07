import type { Trio } from "@/shared/lib/i18n";
import type { ModuleId } from "@/shared/store/map-store";

/**
 * The Academy's content model.
 *
 * Content is written in TypeScript rather than JSON on purpose: every string is
 * a `Trio`, so a lesson that is missing its Kazakh or English text fails the
 * build instead of quietly showing the reader another language.
 *
 * The other deliberate constraint is that **no lesson states a number of its
 * own**. Figures come from the same committed datasets the dashboards read,
 * through the metric registry, so a lesson can never drift away from the data
 * it is teaching about.
 */

export type Track = "sea" | "coast" | "pollution" | "life" | "resources" | "future";

/** Id of a value resolved from the real datasets — see `metrics.ts`. */
export type MetricId =
  | "seaLevelNow"
  | "seaLevelDrop"
  | "areaLost"
  | "declineRate"
  | "volgaShare"
  | "riversTotal"
  | "retreatMax"
  | "sealDeclinePercent"
  | "sealLow"
  | "sealHigh"
  | "sturgeonThen"
  | "sturgeonNow"
  | "koshkarWaste"
  | "oilShare"
  | "purityWorst"
  | "healthLow"
  | "oilReserves"
  | "gasReserves"
  | "oilDepletion"
  | "ecoIndex"
  | "openDataShare";

export type LessonCard =
  /** Prose. The backbone of a lesson. */
  | { kind: "text"; title: Trio; body: Trio }
  /** A real figure from the datasets, with the plain-language note under it. */
  | { kind: "stat"; metric: MetricId; label: Trio; plain: Trio; tone?: "neutral" | "warn" | "bad" }
  /** A chart the platform already draws elsewhere, reused verbatim. */
  | { kind: "chart"; chart: ChartId; caption: Trio }
  /** The shoreline before/after comparison — the existing year slider. */
  | { kind: "compare"; fromYear: number; toYear: number; caption: Trio }
  /** Sends the reader into the live map with the right layers already on. */
  | { kind: "map"; module: ModuleId; layers: string[]; prompt: Trio }
  /** An inline comprehension check. Answering it is what completes a lesson. */
  | { kind: "check"; question: string };

export type ChartId = "seaLevel" | "sturgeonCatch" | "riverInflow" | "pollutionStructure";

export type Lesson = {
  id: string;
  track: Track;
  /** Reading time in minutes, honestly estimated from the content length. */
  minutes: number;
  /** Source ids from data/sources.json — every lesson shows where it comes from. */
  sourceIds: string[];
  title: Trio;
  hook: Trio;
  cards: LessonCard[];
};

export type QuizDifficulty = "basic" | "applied" | "expert";

export type QuizQuestion = {
  id: string;
  difficulty: QuizDifficulty;
  track: Track;
  /** How the question is posed — the map/figure kinds make it more than trivia. */
  format: "choice" | "metric" | "map" | "scenario";
  prompt: Trio;
  options: Trio[];
  /** Index into `options`. */
  answer: number;
  /** Shown after answering, right or wrong. Never just "correct". */
  explain: Trio;
  sourceId?: string;
};

export type AchievementTier = "bronze" | "silver" | "gold";

export type Achievement = {
  id: string;
  tier: AchievementTier;
  title: Trio;
  requirement: Trio;
  /** Evaluated against derived progress; pure, so it can never disagree. */
  test: (p: AchievementInput) => boolean;
  /** Current value and target, for the partial-progress ring. */
  measure: (p: AchievementInput) => { have: number; need: number };
};

export type AchievementInput = {
  lessons: number;
  totalLessons: number;
  quizAnswered: number;
  perfectChecks: number;
  discoveries: number;
  totalDiscoveries: number;
  missions: number;
  simulations: number;
  streak: number;
  level: number;
  tracksCompleted: number;
};

export type MissionKind = "daily" | "weekly" | "standing";

export type Mission = {
  id: string;
  kind: MissionKind;
  title: Trio;
  detail: Trio;
  /** Where the mission is carried out. */
  href: string;
  /** Progress towards the mission, derived from the learning log. */
  measure: (p: AchievementInput) => { have: number; need: number };
};

export type Discovery = {
  id: string;
  lat: number;
  lng: number;
  /** Which map module reveals it. */
  module: ModuleId;
  kind: "species" | "habitat" | "hotspot" | "coastline" | "facility";
  title: Trio;
  fact: Trio;
  sourceId: string;
};
