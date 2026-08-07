"use client";

import { useQuery } from "@tanstack/react-query";
import type { StabilityClass, ConeAngle } from "@/shared/lib/plume";

export type PlumeFrame = {
  time: string;
  hour: string;
  fromBearing: number;
  toBearing: number;
  fromLabel_kk: string;
  fromLabel_ru: string;
  fromLabel_en: string;
  speedMs: number;
  stability: StabilityClass;
  lengthKm: number;
  angle: ConeAngle;
  cone: [number, number][];
};

export type DriftMark = {
  minutes: number;
  /** Horizon key — "m30" | "h1" | "h3"; the wording is chosen at render time. */
  label: string;
  lat: number;
  lng: number;
  distanceKm: number;
  radiusKm: number;
  bearing: number;
};

export type PlumeFacility = {
  id: string;
  available: true;
  name_kk: string;
  name_ru: string;
  name_en: string;
  short_kk: string;
  short_ru: string;
  short_en: string;
  kind_kk: string;
  kind_ru: string;
  kind_en: string;
  country: string;
  source: string;
  approx: boolean;
  profile: { so2: number; no2: number; pm: number; voc: number };
  lat: number;
  lng: number;
  dirSigma: number;
  /** Where a parcel released now will have drifted to. */
  drift: DriftMark[];
  frames: PlumeFrame[];
  forecastFrames: PlumeFrame[];
  current: PlumeFrame | null;
};

type PlumeResponse = {
  available: boolean;
  reason?: string;
  fetched_at?: string;
  model?: string;
  facilities: (PlumeFacility | { id: string; available: false })[];
};

/**
 * Dispersion cones computed on the server from measured wind. If the wind
 * data could not be fetched, `available` is false and the caller must say so
 * rather than draw anything.
 */
export function usePlume(enabled = true) {
  return useQuery<PlumeResponse>({
    queryKey: ["live", "plume"],
    queryFn: async () => {
      const res = await fetch("/api/live/plume");
      if (!res.ok) throw new Error(`plume ${res.status}`);
      return res.json();
    },
    staleTime: 30 * 60_000,
    enabled,
  });
}

export function isAvailable(
  f: PlumeFacility | { id: string; available: false }
): f is PlumeFacility {
  return f.available;
}
