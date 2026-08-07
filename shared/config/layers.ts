import type { ModuleId } from "@/shared/store/map-store";

export type LayerDef = {
  id: string;
  module: ModuleId[];
  label_kk: string;
  label_ru: string;
  label_en: string;
  /** Shown on by default when its module opens. */
  defaultOn?: boolean;
  sourceId: string;
  legend?: { color: string; label_kk: string; label_ru: string; label_en: string }[];
};

/**
 * Single registry the LayerManager, legend and deck.gl builder all read from,
 * so a new layer is one entry rather than three edits.
 */
export const LAYERS: LayerDef[] = [
  {
    id: "coastline-year",
    module: ["water", "index"],
    label_kk: "Жағалау сызығы (жыл бойынша)",
    label_ru: "Береговая линия (по годам)",
    label_en: "Shoreline (by year)",
    defaultOn: true,
    sourceId: "model",
    legend: [
      {
        color: "#1d6fd0",
        label_kk: "Таңдалған жыл",
        label_ru: "Выбранный год",
        label_en: "Selected year",
      },
      {
        color: "#969691",
        label_kk: "1992 (тірек)",
        label_ru: "1992 (опорная)",
        label_en: "1992 (baseline)",
      },
    ],
  },
  {
    id: "exposed-bed",
    module: ["water"],
    label_kk: "Құрғаған теңіз түбі",
    label_ru: "Обнажённое дно",
    label_en: "Exposed seabed",
    defaultOn: true,
    sourceId: "model",
    legend: [
      {
        color: "#e0c4a8",
        label_kk: "Судан босаған алаң",
        label_ru: "Освободившаяся площадь",
        label_en: "Area left by the water",
      },
    ],
  },
  {
    id: "rivers-flow",
    module: ["water"],
    label_kk: "Құятын өзендер",
    label_ru: "Впадающие реки",
    label_en: "Inflowing rivers",
    defaultOn: true,
    sourceId: "grid_arendal",
    legend: [
      {
        color: "#0f8f66",
        label_kk: "Ағын көлеміне пропорционал",
        label_ru: "Толщина ∝ стоку",
        label_en: "Width ∝ flow",
      },
    ],
  },
  {
    id: "factories",
    module: ["pollution", "index"],
    label_kk: "Өнеркәсіп нысандары",
    label_ru: "Промышленные объекты",
    label_en: "Industrial facilities",
    defaultOn: true,
    sourceId: "osm",
    legend: [
      {
        color: "#be185d",
        label_kk: "Радиус ∝ шығарынды",
        label_ru: "Радиус ∝ выбросам",
        label_en: "Radius ∝ emissions",
      },
    ],
  },
  {
    id: "koshkar-ata",
    module: ["pollution"],
    label_kk: "Қошқар-Ата қоймасы",
    label_ru: "Кошкар-Ата",
    label_en: "Koshkar-Ata",
    defaultOn: true,
    sourceId: "koshkar_pub",
    legend: [
      {
        color: "#9f1239",
        label_kk: "105 млн т қалдық",
        label_ru: "105 млн т отходов",
        label_en: "105 Mt of waste",
      },
    ],
  },
  {
    id: "air-quality",
    module: ["pollution", "index"],
    label_kk: "Ауа сапасы (live)",
    label_ru: "Качество воздуха (live)",
    label_en: "Air quality (live)",
    defaultOn: true,
    sourceId: "open_meteo_aq",
    legend: [
      { color: "#0f8f66", label_kk: "Жақсы", label_ru: "Хорошо", label_en: "Good" },
      { color: "#a16207", label_kk: "Орташа", label_ru: "Умеренно", label_en: "Moderate" },
      { color: "#be185d", label_kk: "Нашар", label_ru: "Плохо", label_en: "Poor" },
    ],
  },
  {
    id: "wind",
    module: ["pollution"],
    label_kk: "Жел бағыты (live)",
    label_ru: "Ветер (live)",
    label_en: "Wind (live)",
    sourceId: "open_meteo",
    legend: [
      {
        color: "#1d6fd0",
        label_kk: "Ұзындығы ∝ жылдамдық",
        label_ru: "Длина ∝ скорости",
        label_en: "Length ∝ speed",
      },
    ],
  },
  {
    id: "plume",
    module: ["pollution"],
    label_kk: "Шлейф таралуы (Гаусс моделі)",
    label_ru: "Шлейф выбросов (модель Гаусса)",
    label_en: "Emission plume (Gaussian model)",
    sourceId: "open_meteo",
    legend: [
      {
        color: "#be185d",
        label_kk: "Ластану анықталды",
        label_ru: "Загрязнение обнаружено",
        label_en: "Pollution detected",
      },
      {
        color: "#38bdf8",
        label_kk: "Тек жел бағыты",
        label_ru: "Только направление ветра",
        label_en: "Wind direction only",
      },
    ],
  },
  {
    id: "drift",
    module: ["pollution"],
    label_kk: "Болжамды таралу аймағы",
    label_ru: "Прогноз зоны распространения",
    label_en: "Projected dispersion zone",
    sourceId: "open_meteo",
    legend: [
      { color: "#be185d", label_kk: "+30 мин", label_ru: "через 30 мин", label_en: "in 30 min" },
      { color: "#d4467f", label_kk: "+1 сағат", label_ru: "через 1 час", label_en: "in 1 hour" },
      { color: "#e494b4", label_kk: "+3 сағат", label_ru: "через 3 часа", label_en: "in 3 hours" },
    ],
  },
  {
    id: "breeze",
    module: ["pollution"],
    label_kk: "Теңіз бризі",
    label_ru: "Морской бриз",
    label_en: "Sea breeze",
    sourceId: "open_meteo",
    legend: [
      {
        color: "#0e74be",
        label_kk: "Теңізден құрлыққа",
        label_ru: "С моря на сушу",
        label_en: "From sea to land",
      },
    ],
  },
  {
    id: "habitats",
    module: ["life", "index"],
    label_kk: "Мекендеу орындары",
    label_ru: "Места обитания",
    label_en: "Habitats",
    defaultOn: true,
    sourceId: "iucn_seal",
    legend: [
      { color: "#1d6fd0", label_kk: "Итбалық", label_ru: "Тюлень", label_en: "Seal" },
      { color: "#5b21b6", label_kk: "Бекіре", label_ru: "Осетровые", label_en: "Sturgeon" },
      { color: "#0f8f66", label_kk: "Құстар", label_ru: "Птицы", label_en: "Birds" },
    ],
  },
  {
    id: "fields",
    module: ["resources"],
    label_kk: "Кен орындары",
    label_ru: "Месторождения",
    label_en: "Fields",
    defaultOn: true,
    sourceId: "industry_reports",
    legend: [
      { color: "#a16207", label_kk: "Мұнай", label_ru: "Нефть", label_en: "Oil" },
      { color: "#1d6fd0", label_kk: "Газ", label_ru: "Газ", label_en: "Gas" },
    ],
  },
  {
    id: "data-availability",
    module: ["index"],
    label_kk: "Дерек қолжетімділігі",
    label_ru: "Доступность данных",
    label_en: "Data availability",
    defaultOn: true,
    sourceId: "model",
    legend: [
      { color: "#0f8f66", label_kk: "Ашық", label_ru: "Открыто", label_en: "Open" },
      { color: "#a16207", label_kk: "Ішінара", label_ru: "Частично", label_en: "Partial" },
      { color: "#be185d", label_kk: "Жабық", label_ru: "Закрыто", label_en: "Closed" },
    ],
  },
  {
    id: "cities",
    module: ["water", "pollution", "life", "resources", "index"],
    label_kk: "Қалалар",
    label_ru: "Города",
    label_en: "Cities",
    defaultOn: true,
    sourceId: "natural_earth",
  },
];

export function layersForModule(module: ModuleId): LayerDef[] {
  return LAYERS.filter((l) => l.module.includes(module));
}

export function defaultLayersFor(module: ModuleId): string[] {
  return layersForModule(module)
    .filter((l) => l.defaultOn)
    .map((l) => l.id);
}
