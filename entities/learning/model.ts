/**
 * The progression model behind the Eco Academy.
 *
 * Two rules shape everything here, and they are the same rules the rest of the
 * platform lives by:
 *
 *  1. **Progress is derived, never stored.** The only thing persisted is an
 *     append-only log of what the reader actually did. Level, XP, streak and
 *     achievements are pure functions of that log, so they can never drift out
 *     of sync with each other and a corrupted counter cannot exist.
 *  2. **Points are awarded for understanding, not for time spent.** There is no
 *     idle accrual, no spend-to-win, and nothing that rewards clicking without
 *     reading. Every XP value below is attached to a piece of learning.
 */

export type LearningEventType =
  | "lesson_completed"
  | "quiz_answered"
  | "quiz_perfect"
  | "discovery_found"
  | "mission_completed"
  | "simulation_run";

export type LearningEvent = {
  type: LearningEventType;
  /** Lesson id, question id, discovery id — whatever the event is about. */
  ref: string;
  /** ISO timestamp. Local day boundaries are what streaks are counted on. */
  at: string;
  xp: number;
};

/** What each kind of action is worth. Kept in one place so the economy is legible. */
export const XP_VALUES: Record<LearningEventType, number> = {
  lesson_completed: 60,
  quiz_answered: 10,
  // paid on top of the per-answer XP, for a lesson check answered without a miss
  quiz_perfect: 25,
  discovery_found: 20,
  mission_completed: 40,
  simulation_run: 15,
};

/**
 * Cumulative XP needed to reach level n: 50·n·(n+1).
 * 100, 300, 600, 1000, 1500, 2100 … each level costs a little more than the
 * last, so early momentum is quick and later levels mean sustained study.
 */
export function xpForLevel(level: number): number {
  return 50 * level * (level + 1);
}

export const MAX_LEVEL = 7;

export type LevelState = {
  level: number;
  /** XP accumulated inside the current level. */
  intoLevel: number;
  /** XP the current level costs in total. */
  levelSpan: number;
  /** 0…1 through the current level. */
  progress: number;
  atMax: boolean;
};

export function levelFromXp(totalXp: number): LevelState {
  let level = 0;
  while (level < MAX_LEVEL && totalXp >= xpForLevel(level + 1)) level++;

  const floor = level === 0 ? 0 : xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  const atMax = level >= MAX_LEVEL;

  return {
    level,
    intoLevel: totalXp - floor,
    levelSpan: ceiling - floor,
    progress: atMax ? 1 : Math.min(1, (totalXp - floor) / (ceiling - floor)),
    atMax,
  };
}

/** Local calendar day, as YYYY-MM-DD. Streaks are a human notion, so local. */
export function localDay(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function dayBefore(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive days ending today (or yesterday — a streak is not broken until
 * the day after the one that was missed, which is how a reader experiences it).
 */
export function streakFrom(events: LearningEvent[], today: string): number {
  const days = new Set(events.map((e) => localDay(e.at)));
  if (days.size === 0) return 0;

  let cursor = days.has(today) ? today : dayBefore(today);
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = dayBefore(cursor);
  }
  return streak;
}

export type Progress = {
  events: LearningEvent[];
  totalXp: number;
  level: LevelState;
  streak: number;
  /** Distinct refs per event type — "which lessons are done", and so on. */
  done: Record<LearningEventType, Set<string>>;
  xpToday: number;
  daysActive: number;
};

const EMPTY_DONE = (): Record<LearningEventType, Set<string>> => ({
  lesson_completed: new Set(),
  quiz_answered: new Set(),
  quiz_perfect: new Set(),
  discovery_found: new Set(),
  mission_completed: new Set(),
  simulation_run: new Set(),
});

export function deriveProgress(events: LearningEvent[], today: string): Progress {
  const done = EMPTY_DONE();
  let totalXp = 0;
  let xpToday = 0;

  for (const event of events) {
    totalXp += event.xp;
    done[event.type]?.add(event.ref);
    if (localDay(event.at) === today) xpToday += event.xp;
  }

  return {
    events,
    totalXp,
    level: levelFromXp(totalXp),
    streak: streakFrom(events, today),
    done,
    xpToday,
    daysActive: new Set(events.map((e) => localDay(e.at))).size,
  };
}
