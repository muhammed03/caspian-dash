"use client";

import { useQuery } from "@tanstack/react-query";
import type { BreezeConfidence, BreezeCriteria } from "@/shared/lib/breeze";

export type BreezeCityState = {
  id: string;
  available: true;
  name_kk: string;
  name_ru: string;
  name_en: string;
  lat: number;
  lon: number;
  coastNormal: number;
  distanceKm: number;
  seaElevation: number | null;
  caveat_kk: string | null;
  caveat_ru: string | null;
  caveat_en: string | null;
  suppressed: boolean;
  suppressedReason_kk: string | null;
  suppressedReason_ru: string | null;
  suppressedReason_en: string | null;
  now: {
    time: string;
    hour: number;
    onshore: number;
    windMs: number;
    tempLand: number;
    tempSea: number;
    deltaT: number;
  };
  criteria: BreezeCriteria;
  criteriaMet: number;
  confidence: BreezeConfidence;
  landBreeze: boolean;
  downgraded: boolean;
  signature: { amplitude: number; hasSignature: boolean };
  byHour: { hour: number; onshore: number; n: number }[];
  fumigation: { min: number; max: number };
};

export type BreezeEntry = BreezeCityState | { id: string; available: false };

type BreezeResponse = {
  available: boolean;
  reason?: string;
  method?: string;
  cities: BreezeEntry[];
  excluded: {
    id: string;
    name_kk: string;
    name_ru: string;
    name_en: string;
    distanceKm: number;
    reason_kk: string | null;
    reason_ru: string | null;
    reason_en: string | null;
  }[];
};

export function isBreezeAvailable(c: BreezeEntry): c is BreezeCityState {
  return c.available;
}

/**
 * Sea-breeze state per coastal city. Cities a breeze cannot reach are never
 * computed — they come back under `excluded` with the reason attached, so the
 * interface shows an explanation rather than an empty gauge.
 */
export function useBreeze(enabled = true) {
  return useQuery<BreezeResponse>({
    queryKey: ["live", "breeze"],
    queryFn: async () => {
      const res = await fetch("/api/live/breeze");
      if (!res.ok) throw new Error(`breeze ${res.status}`);
      return res.json();
    },
    staleTime: 30 * 60_000,
    enabled,
  });
}
