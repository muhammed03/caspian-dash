"use client";

import { motion, AnimatePresence } from "motion/react";
import { Layers, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { layersForModule } from "@/shared/config/layers";
import { useMapStore, type ModuleId } from "@/shared/store/map-store";
import { GlassCard } from "@/shared/ui/glass-card";
import { SourceBadge } from "@/shared/ui/source-badge";
import { EASE_FLUID } from "@/shared/lib/motion";

export function LayerManager({ module }: { module: ModuleId }) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(true);
  const { activeLayers, toggleLayer } = useMapStore();
  const layers = layersForModule(module);

  return (
    <div className="pointer-events-auto w-[268px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="glass-strong text-foam hover:border-glow/30 mb-2 flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors"
      >
        <span className="flex items-center gap-2">
          <Layers className="text-glow size-4" strokeWidth={1.5} />
          {t.map.layers}
        </span>
        <span className="text-mist/50 text-xs">{activeLayers.size}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: EASE_FLUID }}
            className="overflow-hidden"
          >
            {/* capped so a long layer list never reaches the timeline below */}
            <GlassCard
              static
              className="glass-strong max-h-[calc(100svh-19rem)] space-y-1 overflow-y-auto p-2"
            >
              {layers.map((layer) => {
                const on = activeLayers.has(layer.id);
                return (
                  <div key={layer.id}>
                    <button
                      type="button"
                      onClick={() => toggleLayer(layer.id)}
                      aria-pressed={on}
                      className={cn(
                        "group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                        on ? "bg-glow/10 text-foam" : "text-mist/60 hover:bg-white/[0.04] hover:text-foam"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                          on ? "border-glow bg-glow/25 text-glow" : "border-white/20"
                        )}
                      >
                        {on && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span className="leading-snug">
                        {locale === "ru" ? layer.label_ru : layer.label_kk}
                      </span>
                    </button>
                    {on && layer.legend && (
                      <ul className="mt-1 mb-1 ml-9 space-y-1">
                        {layer.legend.map((item) => (
                          <li key={item.label_ru} className="text-mist/55 flex items-center gap-2 text-[11px]">
                            <span
                              className="size-2 rounded-full"
                              style={{ background: item.color, boxShadow: `0 0 8px ${item.color}80` }}
                            />
                            {locale === "ru" ? item.label_ru : item.label_kk}
                          </li>
                        ))}
                      </ul>
                    )}
                    {on && (
                      <div className="mb-1 ml-9">
                        <SourceBadge sourceId={layer.sourceId} />
                      </div>
                    )}
                  </div>
                );
              })}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
