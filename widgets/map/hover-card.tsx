"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { useMapStore } from "@/shared/store/map-store";

function fmt(n: unknown, digits = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("ru-RU", { maximumFractionDigits: digits });
}

/** Follows the cursor over any picked feature; content depends on layer kind. */
export function HoverCard() {
  const hover = useMapStore((s) => s.hover);
  const locale = useLocale();
  const t = useT();

  const name = (p: Record<string, unknown>) =>
    String((locale === "ru" ? p.name_ru : p.name_kk) ?? p.name_en ?? "");

  return (
    <AnimatePresence>
      {hover && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16 }}
          style={{ left: hover.x + 16, top: hover.y + 16 }}
          className="glass-strong pointer-events-none absolute z-30 max-w-[260px] rounded-xl px-3.5 py-2.5"
        >
          <div className="text-foam text-sm font-medium">{name(hover.payload)}</div>

          {hover.kind === "factory" && (
            <div className="text-mist/70 mt-1 text-xs">
              {t.pollution.emissions}: <span className="text-warn tabular">{fmt(hover.payload.emissions_t)}</span>
            </div>
          )}

          {hover.kind === "air" && (
            <div className="text-mist/70 mt-1 space-y-0.5 text-xs">
              <div>
                EAQI: <span className="text-foam tabular">{fmt(hover.payload.eaqi)}</span>
              </div>
              <div>
                PM2.5: <span className="text-foam tabular">{fmt(hover.payload.pm2_5, 1)}</span> µg/m³
              </div>
            </div>
          )}

          {hover.kind === "habitat" && (
            <div className="text-mist/70 mt-1 space-y-0.5 text-xs">
              {Number(hover.payload.population) > 0 && (
                <div>
                  {t.map.population}: <span className="text-foam tabular">{fmt(hover.payload.population)}</span>
                </div>
              )}
              <div>
                {t.map.threat}:{" "}
                <span className="text-danger capitalize">{String(hover.payload.threat ?? "")}</span>
              </div>
            </div>
          )}

          {hover.kind === "field" && (
            <div className="text-mist/70 mt-1 text-xs">
              {t.resources.reserves}: <span className="text-foam tabular">{fmt(hover.payload.reserves_bbl, 1)}</span>{" "}
              {locale === "ru" ? "млрд барр." : "млрд барр."}
            </div>
          )}

          {hover.kind === "koshkar" && (
            <div className="text-mist/70 mt-1 text-xs">
              <span className="text-danger tabular">{fmt(hover.payload.waste_mt)}</span>{" "}
              {locale === "ru" ? "млн т отходов" : "млн т қалдық"}
            </div>
          )}

          {hover.kind === "availability" && (
            <div className="text-mist/70 mt-1 text-xs">
              {t.index.dataAvailability}: <span className="text-foam tabular">{fmt(hover.payload.score)}</span> / 100
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
