"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { byLocale, formatNumber, pick, type Locale } from "@/shared/lib/i18n";
import { useMapStore } from "@/shared/store/map-store";

function fmt(n: unknown, locale: Locale, digits = 0) {
  return formatNumber(Number(n), locale, { maximumFractionDigits: digits });
}

/** Follows the cursor over any picked feature; content depends on layer kind. */
export function HoverCard() {
  const hover = useMapStore((s) => s.hover);
  const locale = useLocale();
  const t = useT();

  const name = (p: Record<string, unknown>) => pick(p, "name", locale);

  const unitKm3Year = byLocale(locale, { kk: "км³/жыл", ru: "км³/год", en: "km³/year" });
  const unitMs = byLocale(locale, { kk: "м/с", ru: "м/с", en: "m/s" });
  const unitKm = byLocale(locale, { kk: "км", ru: "км", en: "km" });

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
              {t.pollution.emissions}:{" "}
              <span className="tabular text-warn">{fmt(hover.payload.emissions_t, locale)}</span>
            </div>
          )}

          {hover.kind === "air" && (
            <div className="text-ink-2 mt-1 space-y-0.5 text-xs">
              <div>
                EAQI: <span className="tabular text-ink">{fmt(hover.payload.eaqi, locale)}</span>
              </div>
              <div>
                PM2.5: <span className="tabular text-ink">{fmt(hover.payload.pm2_5, locale, 1)}</span> µg/m³
              </div>
            </div>
          )}

          {hover.kind === "habitat" && (
            <div className="text-ink-2 mt-1 space-y-0.5 text-xs">
              {Number(hover.payload.population) > 0 && (
                <div>
                  {t.map.population}:{" "}
                  <span className="tabular text-ink">{fmt(hover.payload.population, locale)}</span>
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
              {t.resources.reserves}:{" "}
              <span className="tabular text-ink">{fmt(hover.payload.reserves_bbl, locale, 1)}</span>{" "}
              {byLocale(locale, { kk: "млрд барр.", ru: "млрд барр.", en: "bn bbl" })}
            </div>
          )}

          {hover.kind === "koshkar" && (
            <div className="text-ink-2 mt-1 text-xs">
              <span className="text-bad tabular">{fmt(hover.payload.waste_mt, locale)}</span>{" "}
              {byLocale(locale, { kk: "млн т қалдық", ru: "млн т отходов", en: "Mt of waste" })}
            </div>
          )}

          {hover.kind === "river" && (
            <div className="text-ink-2 mt-1 space-y-0.5 text-xs">
              <div>
                {byLocale(locale, { kk: "Қазіргі ағын", ru: "Сток сейчас", en: "Flow now" })}:{" "}
                <span className="tabular text-ink">{fmt(hover.payload.current, locale, 1)}</span> {unitKm3Year}
              </div>
              <div>
                {byLocale(locale, { kk: "1930 жылдары", ru: "Было в 1930-х", en: "In the 1930s" })}:{" "}
                <span className="tabular text-ink-2">{fmt(hover.payload.historic_1930, locale, 1)}</span>{" "}
                {unitKm3Year}
              </div>
              <div className="text-warn">
                {byLocale(locale, { kk: "Құйылым үлесі", ru: "Доля притока", en: "Share of inflow" })}:{" "}
                <span className="tabular">{fmt(hover.payload.share_percent, locale)}%</span>
              </div>
            </div>
          )}

          {hover.kind === "plume" && (() => {
            const frame = hover.payload.frame as Record<string, unknown> | undefined;
            const facility = hover.payload.facility as Record<string, unknown> | undefined;
            return (
              <div className="text-ink-2 mt-1 space-y-0.5 text-xs">
                <div>
                  {String(frame?.hour ?? "")} · {pick(frame, "fromLabel", locale)}{" "}
                  <span className="tabular text-ink">{fmt(frame?.speedMs, locale, 1)}</span> {unitMs}
                </div>
                <div>
                  {byLocale(locale, { kk: "Класс", ru: "Класс", en: "Class" })}{" "}
                  <span className="tabular text-ink">{String(frame?.stability ?? "")}</span> ·{" "}
                  <span className="tabular text-ink">{fmt(frame?.lengthKm, locale, 1)}</span> {unitKm}
                </div>
                {Boolean(facility?.approx) && (
                  <div className="text-warn">
                    {byLocale(locale, {
                      kk: "координата болжамды",
                      ru: "координата приблизительная",
                      en: "approximate coordinates",
                    })}
                  </div>
                )}
                <div className="text-ink-3">
                  {byLocale(locale, {
                    kk: "ықтимал таралу аймағы",
                    ru: "вероятная зона переноса",
                    en: "likely dispersion area",
                  })}
                </div>
              </div>
            );
          })()}

          {hover.kind === "availability" && (
            <div className="text-ink-2 mt-1 text-xs">
              {t.index.dataAvailability}:{" "}
              <span className="tabular text-ink">{fmt(hover.payload.score, locale)}</span> / 100
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
