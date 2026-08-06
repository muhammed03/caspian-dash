"use client";

import { create } from "zustand";
import { CASPIAN_CENTER } from "@/shared/config/map-style";

export type ModuleId = "water" | "pollution" | "life" | "resources" | "index";

export type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

export type HoverInfo = {
  x: number;
  y: number;
  kind: string;
  payload: Record<string, unknown>;
} | null;

type MapState = {
  /** Camera survives module switches — required by the spec. */
  view: ViewState;
  setView: (v: Partial<ViewState>) => void;

  year: number;
  setYear: (y: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;

  activeLayers: Set<string>;
  toggleLayer: (id: string) => void;
  setLayers: (ids: string[]) => void;

  hover: HoverInfo;
  setHover: (h: HoverInfo) => void;

  selected: { kind: string; payload: Record<string, unknown> } | null;
  select: (s: { kind: string; payload: Record<string, unknown> } | null) => void;

  satellite: boolean;
  toggleSatellite: () => void;

  /** Hour being shown by the plume animation, and whether it is running. */
  plumeFrame: number;
  setPlumeFrame: (i: number) => void;
  plumePlaying: boolean;
  setPlumePlaying: (p: boolean) => void;
  /** "past" walks measured wind, "forecast" walks predicted wind. */
  plumeMode: "past" | "forecast";
  setPlumeMode: (m: "past" | "forecast") => void;
};

export const COASTLINE_YEARS = [
  1992, 1995, 2000, 2005, 2010, 2015, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2030, 2035,
];

export const useMapStore = create<MapState>((set) => ({
  view: {
    longitude: CASPIAN_CENTER[0],
    latitude: CASPIAN_CENTER[1],
    zoom: 4.6,
    pitch: 0,
    bearing: 0,
  },
  setView: (v) => set((s) => ({ view: { ...s.view, ...v } })),

  year: 2025,
  setYear: (year) => set({ year }),
  playing: false,
  setPlaying: (playing) => set({ playing }),

  activeLayers: new Set<string>(),
  toggleLayer: (id) =>
    set((s) => {
      const next = new Set(s.activeLayers);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { activeLayers: next };
    }),
  setLayers: (ids) => set({ activeLayers: new Set(ids) }),

  hover: null,
  setHover: (hover) => set({ hover }),

  selected: null,
  select: (selected) => set({ selected }),

  satellite: false,
  toggleSatellite: () => set((s) => ({ satellite: !s.satellite })),

  plumeFrame: 0,
  setPlumeFrame: (plumeFrame) => set({ plumeFrame }),
  plumePlaying: false,
  setPlumePlaying: (plumePlaying) => set({ plumePlaying }),
  plumeMode: "past",
  setPlumeMode: (plumeMode) => set({ plumeMode, plumeFrame: 0 }),
}));
