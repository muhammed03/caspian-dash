"use client";

import { useEffect, useMemo } from "react";
import { Play, Pause, Wind, AlertTriangle } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { Label, Plain } from "@/shared/ui/primitives";
import { SourceBadge } from "@/shared/ui/source-badge";
import { useMapStore } from "@/shared/store/map-store";
import { usePlume, isAvailable, type PlumeFacility } from "@/entities/plume/use-plume";
import { STABILITY_TEXT } from "@/shared/lib/plume";

/**
 * Drives the plume animation and states, in words, everything the model
 * assumed. The numbers here are the true ones — the map widens very narrow
 * cones by a few degrees so they stay visible, but nothing printed here is
 * adjusted for drawing.
 */
export function PlumePanel() {
  const t = useT();
  const locale = useLocale();
  const L = locale === "ru" ? "ru" : "kk";

  const { activeLayers, toggleLayer, plumeFrame, setPlumeFrame, plumePlaying, setPlumePlaying, plumeMode, setPlumeMode } =
    useMapStore();
  const on = activeLayers.has("plume");
  const plume = usePlume(on);

  const facilities = useMemo(
    () => (plume.data?.facilities ?? []).filter(isAvailable),
    [plume.data]
  );
  const lead: PlumeFacility | undefined = facilities[0];
  const list = plumeMode === "forecast" ? lead?.forecastFrames : lead?.frames;
  const frame = list?.[Math.min(plumeFrame, (list?.length ?? 1) - 1)];

  // 450 ms per hour: a full day reads in about eleven seconds. Faster and the
  // wind shift is invisible, slower and nobody waits for it.
  useEffect(() => {
    if (!plumePlaying || !list?.length) return;
    const timer = setInterval(() => {
      setPlumeFrame((useMapStore.getState().plumeFrame + 1) % list.length);
    }, 450);
    return () => clearInterval(timer);
  }, [plumePlaying, list, setPlumeFrame]);

  if (!on) {
    return (
      <section className="rule-t pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-ink text-[15px] font-semibold tracking-tight">
              {locale === "ru" ? "Шлейф выбросов" : "Шлейф таралуы"}
            </h3>
            <Plain className="mt-2">
              {locale === "ru"
                ? "Модель показывает, куда ветер сносит выбросы предприятия — по измеренному ветру за прошедшие сутки и прогнозу на сутки вперёд."
                : "Модель кәсіпорын шығарындысын жел қай жаққа апаратынын көрсетеді — өткен тәуліктегі өлшенген жел және алдағы тәулікке болжам бойынша."}
            </Plain>
          </div>
          <button
            type="button"
            onClick={() => toggleLayer("plume")}
            className="border-rule text-ink hover:bg-ink hover:text-paper shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition-colors"
          >
            {locale === "ru" ? "Показать" : "Көрсету"}
          </button>
        </div>
      </section>
    );
  }

  if (plume.isLoading) {
    return (
      <section className="rule-t pt-4">
        <Label>{locale === "ru" ? "Шлейф выбросов" : "Шлейф таралуы"}</Label>
        <div className="bg-tint mt-3 h-24 animate-pulse rounded" />
      </section>
    );
  }

  /* Rule 1: without measured wind there is no animation, and the reason is stated. */
  if (!plume.data?.available || !frame || !lead) {
    return (
      <section className="rule-t pt-4">
        <Label>{locale === "ru" ? "Шлейф выбросов" : "Шлейф таралуы"}</Label>
        <div className="border-warn/40 bg-warn/5 mt-3 flex gap-2.5 rounded border-l-2 p-3">
          <AlertTriangle className="text-warn mt-0.5 size-4 shrink-0" />
          <p className="text-ink-2 text-[12.5px] leading-relaxed">
            {locale === "ru"
              ? "Данные о ветре недоступны — анимация не показывается. Модель не рисует направление без измеренного ветра."
              : "Жел деректері қолжетімсіз — анимация көрсетілмейді. Модель өлшенген желсіз бағыт салмайды."}
          </p>
        </div>
      </section>
    );
  }

  const stability = STABILITY_TEXT[frame.stability][L];
  const detectedCount = 0; // colour is decided per facility on the map

  return (
    <section className="rule-t pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-ink text-[15px] font-semibold tracking-tight">
            {locale === "ru" ? "Шлейф выбросов" : "Шлейф таралуы"}
          </h3>
          <Label className="mt-1">
            {locale === "ru" ? "модель Гаусса · Pasquill–Briggs" : "Гаусс моделі · Pasquill–Briggs"}
          </Label>
        </div>
        <button
          type="button"
          onClick={() => {
            setPlumePlaying(false);
            toggleLayer("plume");
          }}
          className="text-ink-2 hover:text-ink shrink-0 text-[12px] transition-colors"
        >
          {locale === "ru" ? "Скрыть" : "Жасыру"}
        </button>
      </div>

      {/* measured past vs predicted future */}
      <div className="border-rule mt-3 inline-flex rounded-full border p-0.5">
        {(["past", "forecast"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setPlumeMode(m)}
            className={cn(
              "rounded-full px-3 py-1 text-[11.5px] transition-colors",
              plumeMode === m ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
            )}
          >
            {m === "past"
              ? locale === "ru"
                ? "Прошедшие сутки"
                : "Өткен тәулік"
              : locale === "ru"
                ? "Прогноз на сутки"
                : "Тәулікке болжам"}
          </button>
        ))}
      </div>

      {/* the animation control */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlumePlaying(!plumePlaying)}
          aria-label={plumePlaying ? t.common.pause : t.common.play}
          className="border-rule text-ink hover:bg-ink hover:text-paper flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors"
        >
          {plumePlaying ? <Pause className="size-3.5" /> : <Play className="ml-0.5 size-3.5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-ink mb-1.5 flex items-baseline gap-2 text-sm">
            <span className="tabular font-semibold">{frame.hour}</span>
            <span className="text-ink-2 inline-flex items-center gap-1">
              <Wind className="size-3.5" />
              {L === "ru" ? frame.fromLabel_ru : frame.fromLabel_kk}
              <span className="tabular">{frame.speedMs}</span>
              <span className="text-ink-3">{locale === "ru" ? "м/с" : "м/с"}</span>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={(list?.length ?? 1) - 1}
            value={Math.min(plumeFrame, (list?.length ?? 1) - 1)}
            onChange={(e) => {
              setPlumePlaying(false);
              setPlumeFrame(Number(e.target.value));
            }}
            aria-label={locale === "ru" ? "Час" : "Сағат"}
            aria-valuetext={frame.hour}
            className={cn(
              "h-1 w-full cursor-pointer appearance-none rounded-full",
              "[&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink",
              "[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink"
            )}
            style={{
              background: `linear-gradient(to right, #0a0a0a 0%, #0a0a0a ${
                (plumeFrame / Math.max((list?.length ?? 1) - 1, 1)) * 100
              }%, #e6e6e3 ${(plumeFrame / Math.max((list?.length ?? 1) - 1, 1)) * 100}%, #e6e6e3 100%)`,
            }}
          />
        </div>
      </div>

      {/* what the model concluded for this hour */}
      <dl className="mt-4 space-y-2.5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-2 text-[12px]">
            {locale === "ru" ? "Класс устойчивости" : "Орнықтылық класы"}
          </dt>
          <dd className="text-ink text-[12px] font-medium">{frame.stability}</dd>
        </div>
        <Plain>{stability}</Plain>

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-2 text-[12px]">
            {locale === "ru" ? "Длина шлейфа" : "Шлейф ұзындығы"}
          </dt>
          <dd className="text-ink tabular text-[12px] font-medium">{frame.lengthKm} км</dd>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-2 text-[12px]">
            {locale === "ru" ? "Полуугол конуса" : "Конустың жарты бұрышы"}
          </dt>
          <dd className="text-ink tabular text-[12px] font-medium">{frame.angle.total}°</dd>
        </div>
        {/* the split matters: one part is dispersion, the other is uncertainty */}
        <Plain>
          {frame.angle.total}° = {frame.angle.physical}°{" "}
          {locale === "ru" ? "физического рассеивания" : "физикалық жайылу"} + {frame.angle.wind}°{" "}
          {locale === "ru" ? "отклонения ветра" : "жел ауытқуы"}
        </Plain>
      </dl>

      {/* colour semantics, spelled out */}
      <ul className="mt-4 space-y-1.5">
        <li className="text-ink-2 flex items-center gap-2 text-[11.5px]">
          <span className="size-2.5 rounded-[2px] bg-[#ef4444]/40 ring-1 ring-[#f87171]" />
          {locale === "ru"
            ? "Загрязнение подтверждено замером рядом"
            : "Ластану жақын өлшеммен расталды"}
        </li>
        <li className="text-ink-2 flex items-center gap-2 text-[11.5px]">
          <span className="size-2.5 rounded-[2px] bg-[#7dd3fc]/40 ring-1 ring-[#7dd3fc]" />
          {locale === "ru"
            ? "Только направление ветра, превышения нет"
            : "Тек жел бағыты, асып кету жоқ"}
        </li>
      </ul>

      {/* limitations, verbatim — this is the part that keeps the model honest */}
      <div className="border-rule mt-4 border-l-2 pl-3">
        <Label>{locale === "ru" ? "Ограничения" : "Шектеулер"}</Label>
        <ul className="text-ink-2 mt-2 space-y-1.5 text-[11.5px] leading-relaxed">
          {(locale === "ru"
            ? [
                "Высота трубы и подъём шлейфа не учитываются",
                "Интенсивность выброса неизвестна → концентрация ОТНОСИТЕЛЬНАЯ, без µg/m³",
                "Рельеф и застройка не учитываются (приближение открытой местности)",
                "Результат — вероятная зона переноса, а не измеренное поле; основание для проверки, а не юридический факт",
              ]
            : [
                "Құбыр биіктігі мен шлейфтің көтерілуі ескерілмейді",
                "Шығарынды қарқыны белгісіз → концентрация САЛЫСТЫРМАЛЫ, µg/m³ жоқ",
                "Жер бедері мен ғимараттар ескерілмейді (ашық дала жуықтауы)",
                "Нәтиже — ықтимал таралу аймағы, өлшенген өріс емес; тексеруге негіз, заңдық факт емес",
              ]
          ).map((line) => (
            <li key={line} className="flex gap-2">
              <span className="bg-ink-3 mt-[7px] size-1 shrink-0 rounded-full" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <SourceBadge sourceId="open_meteo" status="real" />
      </div>
      <Plain className="mt-2">
        {locale === "ru"
          ? `Модель: Pasquill–Turner (1961/64) для класса устойчивости, Briggs (1973) для σy/σz. Объектов в расчёте: ${facilities.length}.`
          : `Модель: орнықтылық класы үшін Pasquill–Turner (1961/64), σy/σz үшін Briggs (1973). Есептеудегі нысан саны: ${facilities.length}.`}
      </Plain>
    </section>
  );
}
