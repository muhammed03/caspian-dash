"use client";

import { useEffect, useMemo } from "react";
import { Play, Pause, Wind, AlertTriangle } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { Label, Plain } from "@/shared/ui/primitives";
import { SourceBadge } from "@/shared/ui/source-badge";
import { useMapStore } from "@/shared/store/map-store";
import { usePlume, isAvailable, type PlumeFacility } from "@/entities/plume/use-plume";
import { useBreeze, isBreezeAvailable } from "@/entities/breeze/use-breeze";
import { CONFIDENCE_TEXT } from "@/shared/lib/breeze";
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

      {/* breeze — the most dangerous regime for a coastal plant */}
      <BreezeBlock />

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

const CRITERIA_TEXT: Record<string, { kk: string; ru: string }> = {
  onshoreWind: { kk: "жел теңіз жағынан", ru: "ветер со стороны моря" },
  thermalContrast: { kk: "термиялық контраст > 3 °C", ru: "термический контраст > 3 °C" },
  weakSynoptic: { kk: "синоптикалық жел әлсіз", ru: "синоптический ветер слабый" },
  daytimeWindow: { kk: "күндізгі терезе 10–20 сағ", ru: "дневное окно 10–20 ч" },
  diurnalReversal: { kk: "түнде бағыт кері болған", ru: "ночью направление менялось на обратное" },
};

/**
 * Sea breeze, stated as evidence rather than as a fact. Onshore wind alone
 * proves nothing — an ordinary westerly does the same thing — so the block
 * lists which of the five criteria actually hold and never says "there is a
 * breeze".
 */
function BreezeBlock() {
  const locale = useLocale();
  const L = locale === "ru" ? "ru" : "kk";
  const breeze = useBreeze(true);

  if (breeze.isLoading) {
    return (
      <div className="rule-t mt-4 pt-3">
        <Label>{locale === "ru" ? "Морской бриз" : "Теңіз бризі"}</Label>
        <div className="bg-tint mt-2 h-20 animate-pulse rounded" />
      </div>
    );
  }
  if (!breeze.data?.available) return null;

  const cities = breeze.data.cities.filter(isBreezeAvailable);
  if (!cities.length) return null;

  // the city with the strongest current evidence leads
  const order = { high: 3, medium: 2, low: 1, none: 0 } as const;
  const lead = [...cities].sort((a, b) => order[b.confidence] - order[a.confidence])[0];
  const met = Object.entries(lead.criteria).filter(([, v]) => v);

  return (
    <div className="rule-t mt-4 pt-3">
      <div className="flex items-baseline justify-between gap-3">
        <Label>{locale === "ru" ? "Морской бриз" : "Теңіз бризі"}</Label>
        <span className="text-ink-2 text-[11.5px]">{L === "ru" ? lead.name_ru : lead.name_kk}</span>
      </div>

      {lead.suppressed ? (
        <Plain className="mt-2">
          {L === "ru" ? lead.suppressedReason_ru : lead.suppressedReason_kk}
        </Plain>
      ) : (
        <>
          <p className="text-ink mt-2 text-[13px]">
            {CONFIDENCE_TEXT[lead.confidence][L]}
            <span className="text-ink-3"> · {lead.criteriaMet}/5</span>
            {lead.downgraded && (
              <span className="text-warn">
                {" "}
                · {locale === "ru" ? "понижено (30 км от моря)" : "төмендетілген (теңізден 30 км)"}
              </span>
            )}
          </p>

          <dl className="mt-2 space-y-1 text-[11.5px]">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">onshore</dt>
              <dd className="tabular text-ink">{lead.now.onshore.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">
                ΔT ({locale === "ru" ? "суша − море" : "құрлық − теңіз"})
              </dt>
              <dd className="tabular text-ink">{lead.now.deltaT.toFixed(1)} °C</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">{locale === "ru" ? "ветер" : "жел"}</dt>
              <dd className="tabular text-ink">{lead.now.windMs.toFixed(1)} м/с</dd>
            </div>
          </dl>

          {met.length > 0 && (
            <ul className="mt-2 space-y-1">
              {met.map(([k]) => (
                <li key={k} className="text-ink-2 flex gap-2 text-[11.5px]">
                  <span className="text-good">✓</span>
                  {CRITERIA_TEXT[k]?.[L] ?? k}
                </li>
              ))}
            </ul>
          )}

          {/* the falsifiable test, reported whatever it says */}
          <Plain className="mt-2">
            {lead.signature.hasSignature
              ? locale === "ru"
                ? `Суточная кривая за месяц показывает чёткий цикл (амплитуда ${lead.signature.amplitude}) — бриз здесь действительно бывает.`
                : `Айлық тәуліктік қисық айқын циклді көрсетеді (амплитуда ${lead.signature.amplitude}) — мұнда бриз шынымен болады.`
              : locale === "ru"
                ? `Суточная кривая за месяц плоская (амплитуда ${lead.signature.amplitude}) — устойчивого бриза здесь не наблюдается, поэтому выводы о нём делать нельзя.`
                : `Айлық тәуліктік қисық тегіс (амплитуда ${lead.signature.amplitude}) — мұнда тұрақты бриз байқалмайды, сондықтан ол туралы тұжырым жасауға болмайды.`}
          </Plain>

          {(lead.confidence === "high" || lead.confidence === "medium") && (
            <div className="border-warn/40 bg-warn/5 mt-2 rounded border-l-2 px-3 py-2">
              <p className="text-ink-2 text-[11.5px] leading-relaxed">
                {locale === "ru"
                  ? `Бризовый режим — самый опасный для прибрежного завода: шлейф направлен на город, а при переходе с холодной воды на горячий берег возможна фумигация примерно в ${lead.fumigation.min}–${lead.fumigation.max} км от берега. Диапазон оценочный: высота трубы неизвестна.`
                  : `Бриз режимі жағалау зауыты үшін ең қауіпті: шлейф қалаға бағытталады, ал салқын судан ыстық жағаға өткенде жағадан шамамен ${lead.fumigation.min}–${lead.fumigation.max} км жерде фумигация болуы мүмкін. Аралық болжамды: құбыр биіктігі белгісіз.`}
              </p>
            </div>
          )}
        </>
      )}

      {breeze.data.excluded.length > 0 && (
        <Plain className="mt-2">
          {L === "ru"
            ? breeze.data.excluded.map((e) => `${e.name_ru}: ${e.reason_ru}`).join(" ")
            : breeze.data.excluded.map((e) => `${e.name_kk}: ${e.reason_kk}`).join(" ")}
        </Plain>
      )}
    </div>
  );
}

/**
 * Forecast spread zone, on its own switch.
 *
 * The positions are computed on the server by stepping through the hourly
 * forecast wind, so a turning wind bends the track. Nothing is recomputed
 * here — a client that re-derived these from the "current" wind would draw
 * circles kilometres away from the numbers printed beside them.
 */
export function DriftPanel() {
  const locale = useLocale();
  const { activeLayers, toggleLayer, driftHorizon, setDriftHorizon } = useMapStore();
  const on = activeLayers.has("drift");
  const plume = usePlume(on);

  const lead = useMemo(() => {
    const list = (plume.data?.facilities ?? []).filter(isAvailable).filter((f) => f.drift?.length);
    return list[0];
  }, [plume.data]);

  if (!on) {
    return (
      <section className="rule-t pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-ink text-[15px] font-semibold tracking-tight">
              {locale === "ru" ? "Прогноз зоны распространения" : "Болжамды таралу аймағы"}
            </h3>
            <Plain className="mt-2">
              {locale === "ru"
                ? "Куда ветер унесёт выброс, сделанный сейчас: положение и размер облака через 30 минут, час и три часа."
                : "Қазір шыққан шығарынды желмен қайда жетеді: 30 минуттан, бір және үш сағаттан кейінгі бұлттың орны мен көлемі."}
            </Plain>
          </div>
          <button
            type="button"
            onClick={() => toggleLayer("drift")}
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
        <Label>{locale === "ru" ? "Прогноз зоны распространения" : "Болжамды таралу аймағы"}</Label>
        <div className="bg-tint mt-3 h-20 animate-pulse rounded" />
      </section>
    );
  }

  if (!plume.data?.available || !lead) {
    return (
      <section className="rule-t pt-4">
        <Label>{locale === "ru" ? "Прогноз зоны распространения" : "Болжамды таралу аймағы"}</Label>
        <div className="border-warn/40 bg-warn/5 mt-3 flex gap-2.5 rounded border-l-2 p-3">
          <AlertTriangle className="text-warn mt-0.5 size-4 shrink-0" />
          <p className="text-ink-2 text-[12.5px] leading-relaxed">
            {locale === "ru"
              ? "Данные о ветре недоступны — прогноз не строится."
              : "Жел деректері қолжетімсіз — болжам құрылмайды."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rule-t pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-ink text-[15px] font-semibold tracking-tight">
            {locale === "ru" ? "Прогноз зоны распространения" : "Болжамды таралу аймағы"}
          </h3>
          <Label className="mt-1">{lead.short}</Label>
        </div>
        <button
          type="button"
          onClick={() => toggleLayer("drift")}
          className="text-ink-2 hover:text-ink shrink-0 text-[12px] transition-colors"
        >
          {locale === "ru" ? "Скрыть" : "Жасыру"}
        </button>
      </div>

      <table className="mt-3 w-full text-[12px]">
        <thead>
          <tr className="text-ink-3 rule-b text-left">
            <th className="pb-1.5 font-normal">{locale === "ru" ? "Через" : "Кейін"}</th>
            <th className="pb-1.5 text-right font-normal">{locale === "ru" ? "Унесёт на" : "Қашықтық"}</th>
            <th className="pb-1.5 text-right font-normal">{locale === "ru" ? "Радиус" : "Радиус"}</th>
          </tr>
        </thead>
        <tbody>
          {lead.drift.map((m) => {
            const active = m.minutes === driftHorizon;
            return (
              <tr
                key={m.minutes}
                onClick={() => setDriftHorizon(m.minutes as 30 | 60 | 180)}
                className={cn(
                  "border-rule cursor-pointer border-b last:border-0",
                  active ? "bg-tint" : "hover:bg-tint/60"
                )}
              >
                <td className={cn("py-2", active ? "text-ink font-semibold" : "text-ink-2")}>
                  {active && <span className="bg-ink mr-1.5 inline-block size-1.5 rounded-full align-middle" />}
                  {m.label}
                </td>
                <td className="tabular text-ink py-2 text-right">{m.distanceKm} км</td>
                <td className="tabular text-ink-2 py-2 text-right">± {m.radiusKm} км</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Plain className="mt-3">
        {locale === "ru"
          ? "На карте показан один выбранный горизонт — нажмите строку, чтобы переключить. Положение считается по почасовому прогнозу ветра, поэтому при повороте ветра трек изгибается. Радиус — поперечное рассеивание (2σy) на пройденном расстоянии, а не измеренная граница загрязнения."
          : "Картада бір таңдалған көкжиек көрсетіледі — ауыстыру үшін жолды басыңыз. Орны сағаттық жел болжамы бойынша есептеледі, сондықтан жел бұрылғанда трек иіледі. Радиус — өтілген қашықтықтағы көлденең жайылу (2σy), өлшенген ластану шекарасы емес."}
      </Plain>

      <div className="mt-3">
        <SourceBadge sourceId="open_meteo" status="real" />
      </div>
    </section>
  );
}
