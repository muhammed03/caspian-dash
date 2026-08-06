"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

export function useDataset<T>(name: string, enabled = true) {
  // geo/* lives behind its own route so MapLibre and the app share one URL shape
  const path = name.startsWith("geo/") ? `/api/geo/${name.slice(4)}` : `/api/data/${name}`;
  return useQuery<T>({
    queryKey: ["dataset", name],
    queryFn: () => fetchJson<T>(path),
    staleTime: Infinity,
    enabled,
  });
}

export function useCoastline(year: number, enabled = true) {
  return useQuery({
    queryKey: ["coastline", year],
    queryFn: () => fetchJson<GeoJSON.FeatureCollection>(`/api/coastline/${year}`),
    staleTime: Infinity,
    enabled,
  });
}

export type AirReading = {
  city_id: string;
  name_kk: string;
  name_ru: string;
  lat: number;
  lon: number;
  time: string | null;
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  eaqi: number | null;
};

export function useAirQuality(enabled = true) {
  return useQuery<{ live: boolean; fetched_at?: string; readings: AirReading[] }>({
    queryKey: ["live", "air"],
    queryFn: () => fetchJson("/api/live/air"),
    staleTime: 10 * 60_000,
    enabled,
  });
}

export type WindPoint = { lat: number; lon: number; speed: number; direction: number; temp: number };

export function useWind(enabled = true) {
  return useQuery<{ live: boolean; fetched_at?: string; points: WindPoint[] }>({
    queryKey: ["live", "wind"],
    queryFn: () => fetchJson("/api/live/wind"),
    staleTime: 20 * 60_000,
    enabled,
  });
}
