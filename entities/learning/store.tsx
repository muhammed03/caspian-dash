"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  deriveProgress,
  localDay,
  XP_VALUES,
  type LearningEvent,
  type LearningEventType,
  type Progress,
} from "./model";

const STORAGE_KEY = "caspian-watch:learning:v1";

/**
 * The learning log lives in this browser and nowhere else. There is no account,
 * no server and no tracking — which is the honest arrangement for a platform
 * that has no backend, and it means the module works offline like the rest of
 * the site. The cost is that progress does not follow the reader to another
 * device, and the interface says so rather than implying otherwise.
 */
function readLog(): LearningEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is LearningEvent =>
        e && typeof e.type === "string" && typeof e.ref === "string" && typeof e.at === "string"
    );
  } catch {
    return [];
  }
}

function writeLog(events: LearningEvent[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // A full or blocked storage must never break the lesson the reader is in.
  }
}

export type Award = { type: LearningEventType; ref: string; xp: number };

type LearningContext = {
  progress: Progress;
  /** False until the log has been read from storage — see the note below. */
  ready: boolean;
  /** Records an event once per ref; repeating a lesson never re-pays. */
  record: (type: LearningEventType, ref: string, options?: { repeatable?: boolean }) => Award | null;
  has: (type: LearningEventType, ref: string) => boolean;
  reset: () => void;
  /** The most recent award, for the XP toast. Cleared by `clearAward`. */
  lastAward: Award | null;
  clearAward: () => void;
};

const Ctx = createContext<LearningContext | null>(null);

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAward, setLastAward] = useState<Award | null>(null);

  // Read after mount, never during render: the server has no localStorage, so
  // reading it inline would make the first client paint disagree with the HTML.
  useEffect(() => {
    setEvents(readLog());
    setReady(true);
  }, []);

  const today = ready ? localDay(new Date().toISOString()) : "";
  const progress = useMemo(() => deriveProgress(events, today), [events, today]);

  const has = useCallback(
    (type: LearningEventType, ref: string) => progress.done[type]?.has(ref) ?? false,
    [progress]
  );

  const record = useCallback<LearningContext["record"]>(
    (type, ref, options) => {
      let award: Award | null = null;

      setEvents((current) => {
        const already = current.some((e) => e.type === type && e.ref === ref);
        if (already && !options?.repeatable) return current;

        const event: LearningEvent = {
          type,
          ref,
          at: new Date().toISOString(),
          xp: XP_VALUES[type],
        };
        award = { type, ref, xp: event.xp };

        const next = [...current, event];
        writeLog(next);
        return next;
      });

      // setEvents' updater runs synchronously here, so `award` is already set.
      if (award) setLastAward(award);
      return award;
    },
    []
  );

  const reset = useCallback(() => {
    setEvents([]);
    setLastAward(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to do */
    }
  }, []);

  const value = useMemo(
    () => ({
      progress,
      ready,
      record,
      has,
      reset,
      lastAward,
      clearAward: () => setLastAward(null),
    }),
    [progress, ready, record, has, reset, lastAward]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLearning(): LearningContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLearning must be used inside <LearningProvider>");
  return ctx;
}
