"use client";

import { motion, AnimatePresence } from "motion/react";
import { Layers, Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { layersForModule } from "@/shared/config/layers";
import { useMapStore, type ModuleId } from "@/shared/store/map-store";
import { EASE_FLUID } from "@/shared/lib/motion";

/** Layer list floating over the map plate. */
export function LayerManager({ module }: { module: ModuleId }) {
  const t = useT();
  const locale = useLocale();
  // Collapsed by default on phones, where the map itself is only ~46svh tall
  // and an open list would cover most of it.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(window.matchMedia("(min-width: 768px)").matches);
  }, []);
  const { activeLayers, toggleLayer } = useMapStore();
  const layers = layersForModule(module);

  return (
    <div className="pointer-events-auto w-[210px] md:w-[250px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md border-rule bg-paper text-ink hover:border-ink border px-3 py-2.5 text-[13px] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Layers className="size-3.5" strokeWidth={1.5} />
          {t.map.layers}
        </span>
        <span className="flex items-center gap-1.5 text-ink-3 text-[11px]">
          {activeLayers.size}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE_FLUID }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 max-h-[26svh] md:max-h-[calc(100svh-17rem)] space-y-0.5 overflow-y-auto rounded-md border-rule bg-paper border p-1.5">
              {layers.map((layer) => {
                const on = activeLayers.has(layer.id);
                return (
                  <div key={layer.id}>
                    <button
                      type="button"
                      onClick={() => toggleLayer(layer.id)}
                      aria-pressed={on}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded px-2 py-1.5 text-left text-[12.5px] transition-colors",
                        on ? "text-ink" : "text-ink-2 hover:bg-tint hover:text-ink"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                          on ? "border-ink bg-ink text-paper" : "border-neutral-300"
                        )}
                      >
                        {on && <Check className="size-2.5" strokeWidth={3.5} />}
                      </span>
                      <span className="leading-snug">
                        {locale === "ru" ? layer.label_ru : layer.label_kk}
                      </span>
                    </button>

                    {on && layer.legend && (
                      <ul className="mt-0.5 mb-1.5 ml-8 space-y-0.5">
                        {layer.legend.map((item) => (
                          <li
                            key={item.label_ru}
                            className="flex items-center gap-2 text-ink-3 text-[11px]"
                          >
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ background: item.color }}
                            />
                            {locale === "ru" ? item.label_ru : item.label_kk}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
