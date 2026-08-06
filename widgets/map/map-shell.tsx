"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Droplets, Factory, Bird, Fuel, Gauge, PanelRightClose, PanelRightOpen, Map as MapIcon, Satellite, Mountain } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { defaultLayersFor } from "@/shared/config/layers";
import { useMapStore, type ModuleId } from "@/shared/store/map-store";
import { LayerManager } from "./layer-manager";
import { TimelineSlider } from "./timeline-slider";
import { HoverCard } from "./hover-card";
import { EASE_FLUID } from "@/shared/lib/motion";

/* WebGL only in the browser, and only once the shell is on screen. */
const MapCanvas = dynamic(() => import("./map-canvas").then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => (
    <div className="bg-tint absolute inset-0 flex items-center justify-center">
      <div className="border-rule border-t-ink size-6 animate-spin rounded-full border-2" />
    </div>
  ),
});

const MODULES: { id: ModuleId; icon: typeof Droplets }[] = [
  { id: "water", icon: Droplets },
  { id: "pollution", icon: Factory },
  { id: "life", icon: Bird },
  { id: "resources", icon: Fuel },
  { id: "index", icon: Gauge },
];

/**
 * Two real columns — map and reading panel — rather than a panel floating over
 * the map. Nothing overlaps the module tabs, and the panel can be collapsed to
 * give the map the full width.
 */
export function MapShell({ module, panel }: { module: ModuleId; panel: React.ReactNode }) {
  const t = useT();
  const setLayers = useMapStore((s) => s.setLayers);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    setLayers(defaultLayersFor(module));
  }, [module, setLayers]);

  const showTimeline = module === "water" || module === "index";

  return (
    <div className="flex h-[100svh] flex-col pt-14">
      {/* module tabs — their own row, never covered by anything */}
      <div className="border-rule bg-paper flex items-center justify-between gap-4 border-b px-3 md:px-5">
        <nav className="scrollbar-none -mb-px flex overflow-x-auto">
          {MODULES.map(({ id, icon: Icon }) => {
            const active = id === module;
            return (
              <Link
                key={id}
                href={`/map/${id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 px-3 py-3 text-[13px] whitespace-nowrap transition-colors md:px-4",
                  active ? "text-ink" : "text-ink-2 hover:text-ink"
                )}
              >
                <Icon className="size-4" strokeWidth={1.5} />
                {t.nav[id]}
                {active && (
                  <motion.span
                    layoutId="module-underline"
                    className="bg-ink absolute inset-x-2 -bottom-px h-0.5"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="text-ink-2 hover:text-ink hidden shrink-0 items-center gap-1.5 text-[11px] tracking-wide uppercase transition-colors lg:flex"
          aria-expanded={panelOpen}
        >
          {panelOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          {panelOpen ? t.common.close : t.common.viewData}
        </button>
      </div>

      {/* Stacked on phones (map on top, reading below), two columns from md up.
          The map keeps a real height on mobile — a flex child with no basis
          collapses to nothing next to a full-width panel. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        {/* map column */}
        <div className="bg-tint relative h-[46svh] w-full shrink-0 md:h-auto md:min-w-0 md:flex-1">
          <MapCanvas module={module} />
          <HoverCard />

          <div className="pointer-events-none absolute top-3 left-3 z-20 md:top-4 md:left-4">
            <LayerManager module={module} />
          </div>

          {showTimeline && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_FLUID, delay: 0.2 }}
              className="pointer-events-none absolute right-3 bottom-3 left-3 z-20 md:right-4 md:bottom-4 md:left-4"
            >
              <div className="mx-auto max-w-[560px]">
                <TimelineSlider />
              </div>
            </motion.div>
          )}

          {/* backdrop switch — the drawn map is the only one that works offline */}
          <BasemapSwitch />

          {/* attribution — required by the JRC and OSM licences */}
          <Attribution />
        </div>

        {/* reading column */}
        {panelOpen && (
          <aside className="border-rule bg-paper w-full border-t px-5 py-6 md:w-[420px] md:shrink-0 md:overflow-y-auto md:border-t-0 md:border-l xl:w-[460px]">
            {panel}
          </aside>
        )}
      </div>
    </div>
  );
}

const BASEMAPS = [
  { id: "default" as const, icon: MapIcon, kk: "Әдепкі", ru: "Обычная" },
  { id: "satellite" as const, icon: Satellite, kk: "Спутник", ru: "Спутник" },
  { id: "terrain" as const, icon: Mountain, kk: "Бедер", ru: "Рельеф" },
];

/**
 * Switches the map backdrop. Satellite and terrain are raster tiles and need
 * the network, so the button says so rather than silently showing a blank map
 * during an offline demo.
 */
function BasemapSwitch() {
  const locale = useLocale();
  const { basemap, setBasemap } = useMapStore();

  return (
    <div className="pointer-events-auto absolute top-3 right-3 z-20 md:top-4 md:right-4">
      <div className="border-rule bg-paper flex overflow-hidden rounded-md border">
        {BASEMAPS.map(({ id, icon: Icon, kk, ru }) => {
          const active = basemap === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setBasemap(id)}
              aria-pressed={active}
              title={id === "default" ? undefined : locale === "ru" ? "Нужен интернет" : "Интернет қажет"}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] transition-colors",
                active ? "bg-ink text-paper" : "text-ink-2 hover:bg-tint hover:text-ink"
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">{locale === "ru" ? ru : kk}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Licence text changes with the backdrop, so it is rendered from the mode. */
function Attribution() {
  const basemap = useMapStore((s) => s.basemap);
  const base =
    basemap === "satellite"
      ? "Esri, Maxar, Earthstar Geographics"
      : basemap === "terrain"
        ? "© OpenTopoMap (CC-BY-SA), © OpenStreetMap contributors"
        : "Natural Earth";
  return (
    <div className="bg-paper/80 text-ink-2 pointer-events-none absolute bottom-0 left-0 z-10 hidden rounded-tr px-2 py-1 text-[10px] md:block">
      {base} · © OpenStreetMap contributors · Open-Meteo · EC JRC/Google
    </div>
  );
}
