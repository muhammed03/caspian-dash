import type { Trio } from "@/shared/lib/i18n";

/**
 * Display text for everything the analysis engine emits.
 *
 * entities/ai-insight/compute.ts used to build these strings itself, in
 * Russian only — a Kazakh reader saw Russian metric names inside an otherwise
 * Kazakh card. The engine now returns stable keys and knows nothing about
 * language; the resolution happens once, at render time, in
 * widgets/ai-insight/ai-insight-card.tsx.
 *
 * `Trio` requires all three locales, so a new metric cannot ship with a
 * missing translation.
 */

/**
 * One row per anomaly the engine can produce (17 of them, across the five
 * dashboards). Keys match the first argument of `anomaly()` in compute.ts.
 *
 * `waterPurityWorstRegion` carries a `{region}` placeholder: the region name
 * comes from the dataset, not from this table, and is substituted at render
 * time with `pick(region, "name", locale)`.
 */
export const ANOMALY_LABELS: Record<string, Trio> = {
  // water
  waterLevelRate: {
    kk: "Деңгейдің төмендеу қарқыны, см/жыл",
    ru: "Скорость падения уровня, см/год",
    en: "Rate of sea-level decline, cm/year",
  },
  seaLevel: {
    kk: "Теңіз деңгейі, м (Балтық жүйесі)",
    ru: "Уровень моря, м БС",
    en: "Sea level, m BS",
  },
  volgaFlow: {
    kk: "Еділ ағыны, км³/жыл",
    ru: "Сток Волги, км³/год",
    en: "Volga flow, km³/year",
  },

  // pollution
  waterPurityMean: {
    kk: "Су тазалығы индексі (орташа), %",
    ru: "Индекс чистоты воды (среднее), %",
    en: "Water purity index (mean), %",
  },
  waterPurityWorstRegion: {
    kk: "Су тазалығы индексі — {region}, %",
    ru: "Индекс чистоты воды — {region}, %",
    en: "Water purity index — {region}, %",
  },
  oilShare: {
    kk: "Ластану құрылымындағы мұнай өнімдерінің үлесі, %",
    ru: "Доля нефтепродуктов в структуре загрязнения, %",
    en: "Share of oil products in the pollution structure, %",
  },

  // life
  sturgeonCatch: {
    kk: "Бекіре аулауы, т/жыл",
    ru: "Вылов осетровых, т/год",
    en: "Sturgeon catch, t/year",
  },
  sealPopulation: {
    kk: "Итбалық популяциясы (авиаесеп)",
    ru: "Популяция тюленя (авиаучёт)",
    en: "Seal population (aerial survey)",
  },
  mangystauNdvi: {
    kk: "Маңғыстау жағалауының NDVI көрсеткіші",
    ru: "NDVI побережья Мангистау",
    en: "NDVI of the Mangystau coast",
  },

  // resources
  oilProduction: {
    kk: "Мұнай өндіру, млн т/жыл",
    ru: "Добыча нефти, млн т/год",
    en: "Oil production, million t/year",
  },
  oilDepletionYears: {
    kk: "Мұнай қорының жету мерзімі, жыл",
    ru: "Срок исчерпания нефти, лет",
    en: "Years to oil depletion",
  },
  gasDepletionYears: {
    kk: "Газ қорының жету мерзімі, жыл",
    ru: "Срок исчерпания газа, лет",
    en: "Years to gas depletion",
  },

  // index
  seaArea: {
    kk: "Айдын ауданы, км²",
    ru: "Площадь акватории, км²",
    en: "Sea surface area, km²",
  },
  waterPurityIndex: {
    kk: "Су тазалығы индексі, %",
    ru: "Индекс чистоты воды, %",
    en: "Water purity index, %",
  },
  topsoilMoisture: {
    kk: "Топырақтың үстіңгі қабатының ылғалдылығы, балл",
    ru: "Влажность верхнего слоя почвы, балл",
    en: "Topsoil moisture, points",
  },
  fireDanger: {
    kk: "Өрт қаупі (Нестеров индексі), балл",
    ru: "Пожарная опасность (Нестеров), балл",
    en: "Fire danger (Nesterov index), points",
  },
  dataOpenness: {
    kk: "Экологиялық дерек ашықтығы, %",
    ru: "Открытость экологических данных, %",
    en: "Openness of environmental data, %",
  },
};

/**
 * Units of the forecast value, one per dashboard. Several of them state that
 * the figure is a model estimate or an extrapolation rather than a
 * measurement — that qualification is part of the unit and is kept in every
 * language.
 */
export const ANOMALY_UNITS: Record<string, Trio> = {
  mBS: {
    kk: "м (Балтық жүйесі)",
    ru: "м БС",
    en: "m BS",
  },
  casesPerYearWho: {
    kk: "оқиға/жыл (ДДҰ модельдік бағасы)",
    ru: "случаев/год (модельная оценка ВОЗ)",
    en: "cases/year (WHO model estimate)",
  },
  sealIndividuals: {
    kk: "дара (авиаесеп бойынша сызықтық экстраполяция)",
    ru: "особей (линейная экстраполяция авиаучётов)",
    en: "individuals (linear extrapolation of aerial surveys)",
  },
  yearsAtCurrentRate: {
    kk: "жыл (ағымдағы өндіру қарқынымен)",
    ru: "лет при текущем темпе добычи",
    en: "years at the current rate of production",
  },
  indexPoints: {
    kk: "жиынтық индекс баллы",
    ru: "баллов сводного индекса",
    en: "points of the composite index",
  },
};
