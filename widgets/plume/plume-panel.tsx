"use client";

import { useEffect, useMemo } from "react";
import { Play, Pause, Wind, AlertTriangle } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { byLocale, pick, formatFixed, type Trio } from "@/shared/lib/i18n";
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
              {byLocale(locale, PLUME_TITLE)}
            </h3>
            <Plain className="mt-2">
              {byLocale(locale, {
                kk: "Модель кәсіпорын шығарындысын жел қай жаққа апаратынын көрсетеді — өткен тәуліктегі өлшенген жел және алдағы тәулікке болжам бойынша.",
                ru: "Модель показывает, куда ветер сносит выбросы предприятия — по измеренному ветру за прошедшие сутки и прогнозу на сутки вперёд.",
                en: "The model shows where the wind carries a plant's emissions — from the measured wind over the past 24 hours and the forecast for the next 24.",
              })}
            </Plain>
          </div>
          <button
            type="button"
            onClick={() => toggleLayer("plume")}
            className="border-rule text-ink hover:bg-ink hover:text-paper shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition-colors"
          >
            {byLocale(locale, { kk: "Көрсету", ru: "Показать", en: "Show" })}
          </button>
        </div>
      </section>
    );
  }

  if (plume.isLoading) {
    return (
      <section className="rule-t pt-4">
        <Label>{byLocale(locale, PLUME_TITLE)}</Label>
        <div className="bg-tint mt-3 h-24 animate-pulse rounded" />
      </section>
    );
  }

  /* Rule 1: without measured wind there is no animation, and the reason is stated. */
  if (!plume.data?.available || !frame || !lead) {
    return (
      <section className="rule-t pt-4">
        <Label>{byLocale(locale, PLUME_TITLE)}</Label>
        <div className="border-warn/40 bg-warn/5 mt-3 flex gap-2.5 rounded border-l-2 p-3">
          <AlertTriangle className="text-warn mt-0.5 size-4 shrink-0" />
          <p className="text-ink-2 text-[12.5px] leading-relaxed">
            {byLocale(locale, {
              kk: "Жел деректері қолжетімсіз — анимация көрсетілмейді. Модель өлшенген желсіз бағыт салмайды.",
              ru: "Данные о ветре недоступны — анимация не показывается. Модель не рисует направление без измеренного ветра.",
              en: "Wind data is unavailable — no animation is shown. The model does not draw a direction without measured wind.",
            })}
          </p>
        </div>
      </section>
    );
  }

  const stability = STABILITY_TEXT[frame.stability][locale];
  const detectedCount = 0; // colour is decided per facility on the map

  return (
    <section className="rule-t pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-ink text-[15px] font-semibold tracking-tight">
            {byLocale(locale, PLUME_TITLE)}
          </h3>
          <Label className="mt-1">
            {byLocale(locale, {
              kk: "Гаусс моделі · Pasquill–Briggs",
              ru: "модель Гаусса · Pasquill–Briggs",
              en: "Gaussian model · Pasquill–Briggs",
            })}
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
          {byLocale(locale, { kk: "Жасыру", ru: "Скрыть", en: "Hide" })}
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
              ? byLocale(locale, {
                  kk: "Өткен тәулік",
                  ru: "Прошедшие сутки",
                  en: "Past 24 hours",
                })
              : byLocale(locale, {
                  kk: "Тәулікке болжам",
                  ru: "Прогноз на сутки",
                  en: "24-hour forecast",
                })}
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
              {pick(frame, "fromLabel", locale)}
              <span className="tabular">{frame.speedMs}</span>
              <span className="text-ink-3">{byLocale(locale, UNIT_MS)}</span>
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
            aria-label={byLocale(locale, { kk: "Сағат", ru: "Час", en: "Hour" })}
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
            {byLocale(locale, {
              kk: "Орнықтылық класы",
              ru: "Класс устойчивости",
              en: "Pasquill stability class",
            })}
          </dt>
          <dd className="text-ink text-[12px] font-medium">{frame.stability}</dd>
        </div>
        <Plain>{stability}</Plain>

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-2 text-[12px]">
            {byLocale(locale, {
              kk: "Шлейф ұзындығы",
              ru: "Длина шлейфа",
              en: "Plume length",
            })}
          </dt>
          <dd className="text-ink tabular text-[12px] font-medium">
            {frame.lengthKm} {byLocale(locale, UNIT_KM)}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-2 text-[12px]">
            {byLocale(locale, {
              kk: "Конустың жарты бұрышы",
              ru: "Полуугол конуса",
              en: "Cone half-angle",
            })}
          </dt>
          <dd className="text-ink tabular text-[12px] font-medium">{frame.angle.total}°</dd>
        </div>
        {/* the split matters: one part is dispersion, the other is uncertainty */}
        <Plain>
          {frame.angle.total}° = {frame.angle.physical}°{" "}
          {byLocale(locale, {
            kk: "физикалық жайылу",
            ru: "физического рассеивания",
            en: "physical dispersion",
          })}{" "}
          + {frame.angle.wind}°{" "}
          {byLocale(locale, {
            kk: "жел ауытқуы",
            ru: "отклонения ветра",
            en: "wind direction variability",
          })}
        </Plain>
      </dl>

      {/* breeze — the most dangerous regime for a coastal plant */}
      <BreezeBlock />

      {/* colour semantics, spelled out */}
      <ul className="mt-4 space-y-1.5">
        <li className="text-ink-2 flex items-center gap-2 text-[11.5px]">
          <span className="size-2.5 rounded-[2px] bg-[#ef4444]/40 ring-1 ring-[#f87171]" />
          {byLocale(locale, {
            kk: "Ластану жақын өлшеммен расталды",
            ru: "Загрязнение подтверждено замером рядом",
            en: "Pollution confirmed by a nearby measurement",
          })}
        </li>
        <li className="text-ink-2 flex items-center gap-2 text-[11.5px]">
          <span className="size-2.5 rounded-[2px] bg-[#7dd3fc]/40 ring-1 ring-[#7dd3fc]" />
          {byLocale(locale, {
            kk: "Тек жел бағыты, асып кету жоқ",
            ru: "Только направление ветра, превышения нет",
            en: "Wind direction only, no exceedance",
          })}
        </li>
      </ul>

      {/* limitations, verbatim — this is the part that keeps the model honest */}
      <div className="border-rule mt-4 border-l-2 pl-3">
        <Label>
          {byLocale(locale, { kk: "Шектеулер", ru: "Ограничения", en: "Limitations" })}
        </Label>
        <ul className="text-ink-2 mt-2 space-y-1.5 text-[11.5px] leading-relaxed">
          {LIMITATIONS.map((line) => byLocale(locale, line)).map((line) => (
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
        {byLocale(locale, {
          kk: `Модель: орнықтылық класы үшін Pasquill–Turner (1961/64), σy/σz үшін Briggs (1973). Есептеудегі нысан саны: ${facilities.length}.`,
          ru: `Модель: Pasquill–Turner (1961/64) для класса устойчивости, Briggs (1973) для σy/σz. Объектов в расчёте: ${facilities.length}.`,
          en: `Model: Pasquill–Turner (1961/64) for the stability class, Briggs (1973) for σy/σz. Facilities in the calculation: ${facilities.length}.`,
        })}
      </Plain>
    </section>
  );
}

const PLUME_TITLE: Trio = {
  kk: "Шлейф таралуы",
  ru: "Шлейф выбросов",
  en: "Emission plume",
};

const UNIT_KM: Trio = { kk: "км", ru: "км", en: "km" };
const UNIT_MS: Trio = { kk: "м/с", ru: "м/с", en: "m/s" };

const LIMITATIONS: Trio[] = [
  {
    kk: "Құбыр биіктігі мен шлейфтің көтерілуі ескерілмейді",
    ru: "Высота трубы и подъём шлейфа не учитываются",
    en: "Stack height and plume rise are not modelled",
  },
  {
    kk: "Шығарынды қарқыны белгісіз → концентрация САЛЫСТЫРМАЛЫ, µg/m³ жоқ",
    ru: "Интенсивность выброса неизвестна → концентрация ОТНОСИТЕЛЬНАЯ, без µg/m³",
    en: "Emission rate is unknown → concentration is RELATIVE, not in µg/m³",
  },
  {
    kk: "Жер бедері мен ғимараттар ескерілмейді (ашық дала жуықтауы)",
    ru: "Рельеф и застройка не учитываются (приближение открытой местности)",
    en: "Terrain and buildings are not modelled (open-country approximation)",
  },
  {
    kk: "Нәтиже — ықтимал таралу аймағы, өлшенген өріс емес; тексеруге негіз, заңдық факт емес",
    ru: "Результат — вероятная зона переноса, а не измеренное поле; основание для проверки, а не юридический факт",
    en: "The result is a probable transport zone, not a measured field — grounds for an inspection, not a legal fact",
  },
];

const CRITERIA_TEXT: Record<string, Trio> = {
  onshoreWind: {
    kk: "жел теңіз жағынан",
    ru: "ветер со стороны моря",
    en: "onshore wind",
  },
  thermalContrast: {
    kk: "термиялық контраст > 3 °C",
    ru: "термический контраст > 3 °C",
    en: "thermal contrast > 3 °C",
  },
  weakSynoptic: {
    kk: "синоптикалық жел әлсіз",
    ru: "синоптический ветер слабый",
    en: "weak synoptic wind",
  },
  daytimeWindow: {
    kk: "күндізгі терезе 10–20 сағ",
    ru: "дневное окно 10–20 ч",
    en: "daytime window 10:00–20:00",
  },
  diurnalReversal: {
    kk: "түнде бағыт кері болған",
    ru: "ночью направление менялось на обратное",
    en: "direction reversed overnight",
  },
};

const BREEZE_TITLE: Trio = {
  kk: "Теңіз бризі",
  ru: "Морской бриз",
  en: "Sea breeze",
};

/**
 * Sea breeze, stated as evidence rather than as a fact. Onshore wind alone
 * proves nothing — an ordinary westerly does the same thing — so the block
 * lists which of the five criteria actually hold and never says "there is a
 * breeze".
 */
function BreezeBlock() {
  const locale = useLocale();
  const breeze = useBreeze(true);

  if (breeze.isLoading) {
    return (
      <div className="rule-t mt-4 pt-3">
        <Label>{byLocale(locale, BREEZE_TITLE)}</Label>
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
        <Label>{byLocale(locale, BREEZE_TITLE)}</Label>
        <span className="text-ink-2 text-[11.5px]">{pick(lead, "name", locale)}</span>
      </div>

      {lead.suppressed ? (
        <Plain className="mt-2">{pick(lead, "suppressedReason", locale)}</Plain>
      ) : (
        <>
          <p className="text-ink mt-2 text-[13px]">
            {CONFIDENCE_TEXT[lead.confidence][locale]}
            <span className="text-ink-3"> · {lead.criteriaMet}/5</span>
            {lead.downgraded && (
              <span className="text-warn">
                {" "}
                ·{" "}
                {byLocale(locale, {
                  kk: "төмендетілген (теңізден 30 км)",
                  ru: "понижено (30 км от моря)",
                  en: "downgraded (30 km from the sea)",
                })}
              </span>
            )}
          </p>

          <dl className="mt-2 space-y-1 text-[11.5px]">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">onshore</dt>
              <dd className="tabular text-ink">{formatFixed(lead.now.onshore, locale, 2)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">
                ΔT ({byLocale(locale, { kk: "құрлық − теңіз", ru: "суша − море", en: "land − sea" })})
              </dt>
              <dd className="tabular text-ink">{formatFixed(lead.now.deltaT, locale, 1)} °C</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-2">
                {byLocale(locale, { kk: "жел", ru: "ветер", en: "wind" })}
              </dt>
              <dd className="tabular text-ink">
                {formatFixed(lead.now.windMs, locale, 1)} {byLocale(locale, UNIT_MS)}
              </dd>
            </div>
          </dl>

          {met.length > 0 && (
            <ul className="mt-2 space-y-1">
              {met.map(([k]) => (
                <li key={k} className="text-ink-2 flex gap-2 text-[11.5px]">
                  <span className="text-good">✓</span>
                  {CRITERIA_TEXT[k] ? byLocale(locale, CRITERIA_TEXT[k]) : k}
                </li>
              ))}
            </ul>
          )}

          {/* the falsifiable test, reported whatever it says */}
          <Plain className="mt-2">
            {lead.signature.hasSignature
              ? byLocale(locale, {
                  kk: `Айлық тәуліктік қисық айқын циклді көрсетеді (амплитуда ${lead.signature.amplitude}) — мұнда бриз шынымен болады.`,
                  ru: `Суточная кривая за месяц показывает чёткий цикл (амплитуда ${lead.signature.amplitude}) — бриз здесь действительно бывает.`,
                  en: `The monthly diurnal signature shows a clear cycle (amplitude ${lead.signature.amplitude}) — a sea breeze does occur here.`,
                })
              : byLocale(locale, {
                  kk: `Айлық тәуліктік қисық тегіс (амплитуда ${lead.signature.amplitude}) — мұнда тұрақты бриз байқалмайды, сондықтан ол туралы тұжырым жасауға болмайды.`,
                  ru: `Суточная кривая за месяц плоская (амплитуда ${lead.signature.amplitude}) — устойчивого бриза здесь не наблюдается, поэтому выводы о нём делать нельзя.`,
                  en: `The monthly diurnal signature is flat (amplitude ${lead.signature.amplitude}) — no persistent sea breeze is observed here, so no conclusions can be drawn about one.`,
                })}
          </Plain>

          {(lead.confidence === "high" || lead.confidence === "medium") && (
            <div className="border-warn/40 bg-warn/5 mt-2 rounded border-l-2 px-3 py-2">
              <p className="text-ink-2 text-[11.5px] leading-relaxed">
                {byLocale(locale, {
                  kk: `Бриз режимі жағалау зауыты үшін ең қауіпті: шлейф қалаға бағытталады, ал салқын судан ыстық жағаға өткенде жағадан шамамен ${lead.fumigation.min}–${lead.fumigation.max} км жерде фумигация болуы мүмкін. Аралық болжамды: құбыр биіктігі белгісіз.`,
                  ru: `Бризовый режим — самый опасный для прибрежного завода: шлейф направлен на город, а при переходе с холодной воды на горячий берег возможна фумигация примерно в ${lead.fumigation.min}–${lead.fumigation.max} км от берега. Диапазон оценочный: высота трубы неизвестна.`,
                  en: `The breeze regime is the most dangerous one for a coastal plant: the plume heads for the city, and as it crosses from cold water onto a hot shore fumigation is possible roughly ${lead.fumigation.min}–${lead.fumigation.max} km inland. The range is indicative: stack height is unknown.`,
                })}
              </p>
            </div>
          )}
        </>
      )}

      {breeze.data.excluded.length > 0 && (
        <Plain className="mt-2">
          {breeze.data.excluded
            .map((e) => `${pick(e, "name", locale)}: ${pick(e, "reason", locale)}`)
            .join(" ")}
        </Plain>
      )}
    </div>
  );
}

const DRIFT_TITLE: Trio = {
  kk: "Болжамды таралу аймағы",
  ru: "Прогноз зоны распространения",
  en: "Forecast dispersion zone",
};

/**
 * The API sends a horizon key rather than a caption, so the wording lives here
 * and each locale gets its own units.
 */
const DRIFT_HORIZON: Record<string, Trio> = {
  m30: { kk: "+30 мин", ru: "+30 мин", en: "+30 min" },
  h1: { kk: "+1 сағат", ru: "+1 час", en: "+1 hour" },
  h3: { kk: "+3 сағат", ru: "+3 часа", en: "+3 hours" },
};

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
              {byLocale(locale, DRIFT_TITLE)}
            </h3>
            <Plain className="mt-2">
              {byLocale(locale, {
                kk: "Қазір шыққан шығарынды желмен қайда жетеді: 30 минуттан, бір және үш сағаттан кейінгі бұлттың орны мен көлемі.",
                ru: "Куда ветер унесёт выброс, сделанный сейчас: положение и размер облака через 30 минут, час и три часа.",
                en: "Where the wind will carry an emission released now: the position and size of the cloud after 30 minutes, one hour and three hours.",
              })}
            </Plain>
          </div>
          <button
            type="button"
            onClick={() => toggleLayer("drift")}
            className="border-rule text-ink hover:bg-ink hover:text-paper shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition-colors"
          >
            {byLocale(locale, { kk: "Көрсету", ru: "Показать", en: "Show" })}
          </button>
        </div>
      </section>
    );
  }

  if (plume.isLoading) {
    return (
      <section className="rule-t pt-4">
        <Label>{byLocale(locale, DRIFT_TITLE)}</Label>
        <div className="bg-tint mt-3 h-20 animate-pulse rounded" />
      </section>
    );
  }

  if (!plume.data?.available || !lead) {
    return (
      <section className="rule-t pt-4">
        <Label>{byLocale(locale, DRIFT_TITLE)}</Label>
        <div className="border-warn/40 bg-warn/5 mt-3 flex gap-2.5 rounded border-l-2 p-3">
          <AlertTriangle className="text-warn mt-0.5 size-4 shrink-0" />
          <p className="text-ink-2 text-[12.5px] leading-relaxed">
            {byLocale(locale, {
              kk: "Жел деректері қолжетімсіз — болжам құрылмайды.",
              ru: "Данные о ветре недоступны — прогноз не строится.",
              en: "Wind data is unavailable — no forecast is produced.",
            })}
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
            {byLocale(locale, DRIFT_TITLE)}
          </h3>
          <Label className="mt-1">{lead.short}</Label>
        </div>
        <button
          type="button"
          onClick={() => toggleLayer("drift")}
          className="text-ink-2 hover:text-ink shrink-0 text-[12px] transition-colors"
        >
          {byLocale(locale, { kk: "Жасыру", ru: "Скрыть", en: "Hide" })}
        </button>
      </div>

      <table className="mt-3 w-full text-[12px]">
        <thead>
          <tr className="text-ink-3 rule-b text-left">
            <th className="pb-1.5 font-normal">
              {byLocale(locale, { kk: "Кейін", ru: "Через", en: "After" })}
            </th>
            <th className="pb-1.5 text-right font-normal">
              {byLocale(locale, { kk: "Қашықтық", ru: "Унесёт на", en: "Distance" })}
            </th>
            <th className="pb-1.5 text-right font-normal">
              {byLocale(locale, { kk: "Радиус", ru: "Радиус", en: "Radius" })}
            </th>
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
                  {DRIFT_HORIZON[m.label] ? byLocale(locale, DRIFT_HORIZON[m.label]) : m.label}
                </td>
                <td className="tabular text-ink py-2 text-right">
                  {m.distanceKm} {byLocale(locale, UNIT_KM)}
                </td>
                <td className="tabular text-ink-2 py-2 text-right">
                  ± {m.radiusKm} {byLocale(locale, UNIT_KM)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Plain className="mt-3">
        {byLocale(locale, {
          kk: "Картада бір таңдалған көкжиек көрсетіледі — ауыстыру үшін жолды басыңыз. Орны сағаттық жел болжамы бойынша есептеледі, сондықтан жел бұрылғанда трек иіледі. Радиус — өтілген қашықтықтағы көлденең жайылу (2σy), өлшенген ластану шекарасы емес.",
          ru: "На карте показан один выбранный горизонт — нажмите строку, чтобы переключить. Положение считается по почасовому прогнозу ветра, поэтому при повороте ветра трек изгибается. Радиус — поперечное рассеивание (2σy) на пройденном расстоянии, а не измеренная граница загрязнения.",
          en: "The map shows one selected horizon — click a row to switch. The position is computed from the hourly wind forecast, so the track bends when the wind turns. The radius is crosswind dispersion (2σy) over the distance travelled, not a measured pollution boundary.",
        })}
      </Plain>

      <div className="mt-3">
        <SourceBadge sourceId="open_meteo" status="real" />
      </div>
    </section>
  );
}
