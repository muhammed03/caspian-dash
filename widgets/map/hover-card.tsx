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
          className="border-rule bg-paper pointer-events-none absolute z-30 max-w-[260px] rounded-md border px-3 py-2 shadow-sm"
        >
          <div className="text-ink text-sm font-medium">
            {hover.kind === "plume"
              ? name((hover.payload.facility as Record<string, unknown>) ?? {})
              : name(hover.payload)}
          </div>

          {hover.kind === "factory" && (
            <div className="text-ink-2 mt-1 text-xs">
              {t.pollution.emissions}: <span className="tabular text-warn">{fmt(hover.payload.emissions_t)}</span>
            </div>
          )}

          {hover.kind === "air" && (
            <div className="text-ink-2 mt-1 space-y-0.5 text-xs">
              <div>
                EAQI: <span className="tabular text-ink">{fmt(hover.payload.eaqi)}</span>
              </div>
              <div>
                PM2.5: <span className="tabular text-ink">{fmt(hover.payload.pm2_5, 1)}</span> µg/m³
              </div>
            </div>
          )}

          {hover.kind === "habitat" && (
            <div className="text-ink-2 mt-1 space-y-0.5 text-xs">
              {Number(hover.payload.population) > 0 && (
                <div>
                  {t.map.population}: <span className="tabular text-ink">{fmt(hover.payload.population)}</span>
                </div>
              )}
              <div>
                {t.map.threat}:{" "}
                <span className="text-bad capitalize">{String(hover.payload.threat ?? "")}</span>
              </div>
            </div>
          )}

          {hover.kind === "field" && (
            <div className="text-ink-2 mt-1 text-xs">
              {t.resources.reserves}: <span className="tabular text-ink">{fmt(hover.payload.reserves_bbl, 1)}</span>{" "}
              {locale === "ru" ? "млрд барр." : "млрд барр."}
            </div>
          )}

          {hover.kind === "koshkar" && (
            <div className="text-ink-2 mt-1 text-xs">
              <span className="text-bad tabular">{fmt(hover.payload.waste_mt)}</span>{" "}
              {locale === "ru" ? "млн т отходов" : "млн т қалдық"}
            </div>
          )}

          {hover.kind === "plume" && (() => {
            const frame = hover.payload.frame as Record<string, unknown> | undefined;
            const facility = hover.payload.facility as Record<string, unknown> | undefined;
            return (
              <div className="text-ink-2 mt-1 space-y-0.5 text-xs">
                <div>
                  {String(frame?.hour ?? "")} ·{" "}
                  {String(locale === "ru" ? frame?.fromLabel_ru : frame?.fromLabel_kk)}{" "}
                  <span className="tabular text-ink">{fmt(frame?.speedMs, 1)}</span> м/с
                </div>
                <div>
                  {locale === "ru" ? "Класс" : "Класс"}{" "}
                  <span className="tabular text-ink">{String(frame?.stability ?? "")}</span> ·{" "}
                  <span className="tabular text-ink">{fmt(frame?.lengthKm, 1)}</span> км
                </div>
                {Boolean(facility?.approx) && (
                  <div className="text-warn">
                    {locale === "ru" ? "координата приблизительная" : "координата болжамды"}
                  </div>
                )}
                <div className="text-ink-3">
                  {locale === "ru" ? "вероятная зона переноса" : "ықтимал таралу аймағы"}
                </div>
              </div>
            );
          })()}

          {hover.kind === "availability" && (
            <div className="text-ink-2 mt-1 text-xs">
              {t.index.dataAvailability}: <span className="tabular text-ink">{fmt(hover.payload.score)}</span> / 100
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
