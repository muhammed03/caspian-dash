"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Droplets, Factory, Bird, Fuel, Gauge, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useT } from "@/shared/lib/i18n/client";
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

      <div className="flex min-h-0 flex-1">
        {/* map column */}
        <div className="bg-tint relative min-w-0 flex-1">
          <MapCanvas module={module} />
          <HoverCard />

          <div className="pointer-events-none absolute top-4 left-4 z-20 hidden md:block">
            <LayerManager module={module} />
          </div>

          {showTimeline && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_FLUID, delay: 0.2 }}
              className="pointer-events-none absolute right-4 bottom-4 left-4 z-20 hidden md:block"
            >
              <div className="mx-auto max-w-[560px]">
                <TimelineSlider />
              </div>
            </motion.div>
          )}

          {/* attribution — required by the JRC and OSM licences */}
          <div className="bg-paper/80 text-ink-2 pointer-events-none absolute bottom-0 left-0 z-10 hidden rounded-tr px-2 py-1 text-[10px] md:block">
            Natural Earth · © OpenStreetMap contributors · Open-Meteo · EC JRC/Google
          </div>
        </div>

        {/* reading column */}
        {panelOpen && (
          <aside className="border-rule bg-paper w-full shrink-0 overflow-y-auto border-l px-5 py-6 md:w-[420px] xl:w-[460px]">
            {panel}
          </aside>
        )}
      </div>
    </div>
  );
}
