import type { Trio } from "@/shared/lib/i18n/pick";

/**
 * Names of the eco-index components. Shared by the index panel and the
 * methodology page, which used to hold identical copies and drifted apart
 * whenever a component was added.
 */
export const COMPONENT_LABELS: Record<string, Trio> = {
  water: { kk: "Су айдыны", ru: "Акватория", en: "Water surface" },
  purity: { kk: "Су тазалығы", ru: "Чистота воды", en: "Water purity" },
  biodiversity: { kk: "Балық қоры", ru: "Рыбные запасы", en: "Fish stocks" },
  seal: { kk: "Итбалық", ru: "Тюлень", en: "Seal" },
  soil: { kk: "Топырақ", ru: "Почва", en: "Soil" },
  drought: { kk: "Ылғалдылық", ru: "Увлажнение", en: "Moisture" },
  fire: { kk: "Өрт қаупі", ru: "Пожарная опасность", en: "Fire danger" },
  transparency: { kk: "Дерек ашықтығы", ru: "Открытость данных", en: "Data openness" },
};
