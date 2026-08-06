"use client";

import { useQuery } from "@tanstack/react-query";
import type { LandIndices } from "@/shared/lib/land-indices";

export type LandRegion = LandIndices & {
  id: string;
  name_kk: string;
  name_ru: string;
  lat: number;
  lon: number;
  soilTemperature: number | null;
};

type LandResponse = {
  live: boolean;
  fetched_at?: string;
  method?: string;
  regions: LandRegion[];
  summary: { soil: number; drought: number; fire: number } | null;
};

/**
 * Soil moisture, dryness and fire danger for the coastal strip. Live from
 * Open-Meteo, falling back to the committed snapshot with `live: false` so the
 * interface can say which one the viewer is seeing.
 */
export function useLandIndices(enabled = true) {
  return useQuery<LandResponse>({
    queryKey: ["live", "land"],
    queryFn: async () => {
      const res = await fetch("/api/live/land");
      if (!res.ok) throw new Error(`land ${res.status}`);
      return res.json();
    },
    staleTime: 60 * 60_000,
    enabled,
  });
}
