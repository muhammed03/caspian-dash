import type { ModuleId } from "@/shared/store/map-store";

export type LayerDef = {
  id: string;
  module: ModuleId[];
  label_kk: string;
  label_ru: string;
  /** Shown on by default when its module opens. */
  defaultOn?: boolean;
  sourceId: string;
  legend?: { color: string; label_kk: string; label_ru: string }[];
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
    defaultOn: true,
    sourceId: "model",
    legend: [
      { color: "#1d6fd0", label_kk: "Таңдалған жыл", label_ru: "Выбранный год" },
      { color: "#969691", label_kk: "1992 (тірек)", label_ru: "1992 (опорная)" },
    ],
  },
  {
    id: "exposed-bed",
    module: ["water"],
    label_kk: "Құрғаған теңіз түбі",
    label_ru: "Обнажённое дно",
    defaultOn: true,
    sourceId: "model",
    legend: [{ color: "#e0c4a8", label_kk: "Судан босаған алаң", label_ru: "Освободившаяся площадь" }],
  },
  {
    id: "rivers-flow",
    module: ["water"],
    label_kk: "Құятын өзендер",
    label_ru: "Впадающие реки",
    defaultOn: true,
    sourceId: "grid_arendal",
    legend: [{ color: "#0f8f66", label_kk: "Ағын көлеміне пропорционал", label_ru: "Толщина ∝ стоку" }],
  },
  {
    id: "factories",
    module: ["pollution", "index"],
    label_kk: "Өнеркәсіп нысандары",
    label_ru: "Промышленные объекты",
    defaultOn: true,
    sourceId: "osm",
    legend: [{ color: "#be185d", label_kk: "Радиус ∝ шығарынды", label_ru: "Радиус ∝ выбросам" }],
  },
  {
    id: "koshkar-ata",
    module: ["pollution"],
    label_kk: "Қошқар-Ата қоймасы",
    label_ru: "Кошкар-Ата",
    defaultOn: true,
    sourceId: "koshkar_pub",
    legend: [{ color: "#9f1239", label_kk: "105 млн т қалдық", label_ru: "105 млн т отходов" }],
  },
  {
    id: "air-quality",
    module: ["pollution", "index"],
    label_kk: "Ауа сапасы (live)",
    label_ru: "Качество воздуха (live)",
    defaultOn: true,
    sourceId: "open_meteo_aq",
    legend: [
      { color: "#0f8f66", label_kk: "Жақсы", label_ru: "Хорошо" },
      { color: "#a16207", label_kk: "Орташа", label_ru: "Умеренно" },
      { color: "#be185d", label_kk: "Нашар", label_ru: "Плохо" },
    ],
  },
  {
    id: "wind",
    module: ["pollution"],
    label_kk: "Жел бағыты (live)",
    label_ru: "Ветер (live)",
    sourceId: "open_meteo",
    legend: [{ color: "#1d6fd0", label_kk: "Ұзындығы ∝ жылдамдық", label_ru: "Длина ∝ скорости" }],
  },
  {
    id: "plume",
    module: ["pollution"],
    label_kk: "Шлейф таралуы (Гаусс моделі)",
    label_ru: "Шлейф выбросов (модель Гаусса)",
    sourceId: "open_meteo",
    legend: [
      { color: "#be185d", label_kk: "Ластану анықталды", label_ru: "Загрязнение обнаружено" },
      { color: "#38bdf8", label_kk: "Тек жел бағыты", label_ru: "Только направление ветра" },
    ],
  },
  {
    id: "habitats",
    module: ["life", "index"],
    label_kk: "Мекендеу орындары",
    label_ru: "Места обитания",
    defaultOn: true,
    sourceId: "iucn_seal",
    legend: [
      { color: "#1d6fd0", label_kk: "Итбалық", label_ru: "Тюлень" },
      { color: "#5b21b6", label_kk: "Бекіре", label_ru: "Осетровые" },
      { color: "#0f8f66", label_kk: "Құстар", label_ru: "Птицы" },
    ],
  },
  {
    id: "fields",
    module: ["resources"],
    label_kk: "Кен орындары",
    label_ru: "Месторождения",
    defaultOn: true,
    sourceId: "industry_reports",
    legend: [
      { color: "#a16207", label_kk: "Мұнай", label_ru: "Нефть" },
      { color: "#1d6fd0", label_kk: "Газ", label_ru: "Газ" },
    ],
  },
  {
    id: "data-availability",
    module: ["index"],
    label_kk: "Дерек қолжетімділігі",
    label_ru: "Доступность данных",
    defaultOn: true,
    sourceId: "model",
    legend: [
      { color: "#0f8f66", label_kk: "Ашық", label_ru: "Открыто" },
      { color: "#a16207", label_kk: "Ішінара", label_ru: "Частично" },
      { color: "#be185d", label_kk: "Жабық", label_ru: "Закрыто" },
    ],
  },
  {
    id: "cities",
    module: ["water", "pollution", "life", "resources", "index"],
    label_kk: "Қалалар",
    label_ru: "Города",
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
