"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Droplets, Factory, Bird, Fuel, Gauge } from "lucide-react";
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
    <div className="bg-abyss absolute inset-0 flex items-center justify-center">
      <div className="border-glow/30 border-t-glow size-8 animate-spin rounded-full border-2" />
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

export function MapShell({
  module,
  panel,
}: {
  module: ModuleId;
  panel: React.ReactNode;
}) {
  const t = useT();
  const setLayers = useMapStore((s) => s.setLayers);

  useEffect(() => {
    setLayers(defaultLayersFor(module));
  }, [module, setLayers]);

  const showTimeline = module === "water" || module === "index";

  return (
    <div className="relative h-[100svh] w-full overflow-hidden pt-16">
      <div className="absolute inset-0">
        <MapCanvas module={module} />
      </div>
      <HoverCard />

      {/* module rail */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4 pt-4">
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_FLUID }}
          className="glass-strong pointer-events-auto flex gap-1 rounded-full p-1"
        >
          {MODULES.map(({ id, icon: Icon }) => {
            const active = id === module;
            return (
              <Link
                key={id}
                href={`/map/${id}`}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] transition-colors duration-300 md:px-4",
                  active ? "text-glow" : "text-mist/60 hover:text-foam"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="module-pill"
                    className="bg-glow/15 ring-glow absolute inset-0 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                <Icon className="relative size-4" strokeWidth={1.5} />
                <span className="relative hidden md:inline">{t.nav[id]}</span>
              </Link>
            );
          })}
        </motion.nav>
      </div>

      {/* layers, left */}
      <div className="pointer-events-none absolute left-4 top-32 z-20 hidden md:block">
        <LayerManager module={module} />
      </div>

      {/* data panel, right */}
      <motion.aside
        initial={{ opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: EASE_FLUID, delay: 0.15 }}
        className={cn(
          "absolute right-0 top-16 z-20 h-[calc(100svh-4rem)] w-full overflow-y-auto md:w-[440px]",
          // top padding clears the floating module rail
          "glass-strong border-y-0 border-r-0 px-5 pb-6 pt-24"
        )}
      >
        {panel}
      </motion.aside>

      {/* timeline, bottom */}
      {showTimeline && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_FLUID, delay: 0.25 }}
          className="pointer-events-none absolute bottom-5 left-4 z-20 hidden w-[520px] max-w-[calc(100%-500px)] md:block"
        >
          <TimelineSlider />
        </motion.div>
      )}

      {/* attribution — required by the JRC and OSM licences */}
      <div className="text-mist/35 pointer-events-none absolute bottom-1.5 left-4 z-10 hidden text-[10px] md:block">
        Natural Earth · © OpenStreetMap contributors · Open-Meteo · EC JRC/Google
      </div>
    </div>
  );
}
