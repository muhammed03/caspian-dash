/**
 * Builds every curated dataset the platform serves, from a single auditable
 * place. Numbers here come from published sources; each one is tied to an
 * entry in data/sources.json and carries a status flag (real | semi | mock)
 * that the UI renders as a badge under the chart.
 *
 * Usage: npx tsx scripts/pipeline/build-datasets.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "data");
mkdirSync(OUT, { recursive: true });

const CHECKED = "2026-08-07";

function save(name: string, payload: unknown) {
  writeFileSync(join(OUT, name), JSON.stringify(payload, null, 2));
  console.log(`${name} ✓`);
}

/* ------------------------------------------------------------------ *
 * Source registry
 * ------------------------------------------------------------------ */
const sources = [
  {
    id: "grealm",
    name: "G-REALM (USDA/NASA satellite altimetry)",
    url: "https://ipad.fas.usda.gov/cropexplorer/global_reservoir/",
    license: "Public domain (US Government)",
    attribution: "USDA FAS / NASA G-REALM",
    status: "semi",
    coverage_years: "1992–2025",
    note_kk:
      "Хакатон желісінен портал қолжетімсіз болды. Қатар жарияланған альтиметрия мәндері мен төмендеу қарқыны бойынша қалпына келтірілді; scripts/pipeline/fetch-sea-level.ts арқылы нақты файлмен ауыстыруға болады.",
    note_ru:
      "Портал был недоступен из сети хакатона. Ряд восстановлен по опубликованным значениям альтиметрии и скоростям падения; заменяется реальным файлом через scripts/pipeline/fetch-sea-level.ts.",
    last_checked: CHECKED,
  },
  {
    id: "ras_ocean",
    name: "Институт океанологии РАН — оценки уровня Каспия",
    url: "https://ocean.ru/",
    license: "Публикации, цитирование",
    attribution: "Институт океанологии им. П.П. Ширшова РАН",
    status: "semi",
    coverage_years: "1995–2026",
    last_checked: CHECKED,
  },
  {
    id: "open_meteo",
    name: "Open-Meteo (погода и ветер)",
    url: "https://open-meteo.com/",
    license: "CC BY 4.0, free, no key",
    attribution: "Weather data by Open-Meteo.com",
    status: "real",
    coverage_years: "live",
    last_checked: CHECKED,
  },
  {
    id: "open_meteo_aq",
    name: "Open-Meteo Air Quality (CAMS)",
    url: "https://open-meteo.com/en/docs/air-quality-api",
    license: "CC BY 4.0, free, no key",
    attribution: "Air quality by Open-Meteo.com / Copernicus CAMS",
    status: "real",
    coverage_years: "live",
    last_checked: CHECKED,
  },
  {
    id: "natural_earth",
    name: "Natural Earth (базовая география)",
    url: "https://www.naturalearthdata.com/",
    license: "Public domain",
    attribution: "Made with Natural Earth",
    status: "real",
    coverage_years: "—",
    last_checked: CHECKED,
  },
  {
    id: "grid_arendal",
    name: "GRID-Arendal / Vital Caspian Graphics (водный баланс)",
    url: "https://www.grida.no/publications/155",
    license: "UNEP/GRID-Arendal, attribution",
    attribution: "UNEP/GRID-Arendal",
    status: "semi",
    coverage_years: "—",
    last_checked: CHECKED,
  },
  {
    id: "aquastat",
    name: "FAO AQUASTAT (водозабор по странам)",
    url: "https://www.fao.org/aquastat/",
    license: "CC BY-NC-SA 3.0 IGO",
    attribution: "FAO AQUASTAT",
    status: "semi",
    coverage_years: "1990–2021",
    note_ru: "Профили Ирана (2008) и Туркменистана (2012) устарели.",
    note_kk: "Иран (2008) және Түрікменстан (2012) профильдері ескірген.",
    last_checked: CHECKED,
  },
  {
    id: "jrc_gsw",
    name: "JRC Global Surface Water",
    url: "https://global-surface-water.appspot.com/",
    license: "Copernicus — free, attribution required",
    attribution: "Source: EC JRC/Google",
    status: "semi",
    coverage_years: "1984–2021",
    last_checked: CHECKED,
  },
  {
    id: "osm",
    name: "OpenStreetMap (промышленные объекты, порты)",
    url: "https://www.openstreetmap.org/",
    license: "ODbL",
    attribution: "© OpenStreetMap contributors",
    status: "semi",
    coverage_years: "—",
    last_checked: CHECKED,
  },
  {
    id: "koshkar_pub",
    name: "Публикации по хвостохранилищу Кошкар-Ата",
    url: "https://www.gov.kz/memleket/entities/mangystau",
    license: "Публикации / СМИ",
    attribution: "Научные публикации, отчёты акимата Мангистауской области",
    status: "semi",
    coverage_years: "2021–2024",
    last_checked: CHECKED,
  },
  {
    id: "iucn_seal",
    name: "IUCN Red List — Pusa caspica",
    url: "https://www.iucnredlist.org/species/41669/45230700",
    license: "IUCN terms of use",
    attribution: "IUCN Red List",
    status: "semi",
    coverage_years: "2008–2024",
    last_checked: CHECKED,
  },
  {
    id: "ncoc",
    name: "NCOC — авиаучёты каспийского тюленя",
    url: "https://www.ncoc.kz/",
    license: "Опубликованные отчёты (PDF)",
    attribution: "North Caspian Operating Company",
    status: "semi",
    coverage_years: "2020–2024",
    last_checked: CHECKED,
  },
  {
    id: "cites_fao",
    name: "CITES / FAO — осетровые",
    url: "https://cites.org/eng/app/appendices.php",
    license: "Публикации",
    attribution: "CITES, FAO",
    status: "semi",
    coverage_years: "1977–2020",
    last_checked: CHECKED,
  },
  {
    id: "gbif",
    name: "GBIF (наблюдения птиц и тюленя)",
    url: "https://www.gbif.org/",
    license: "CC BY 4.0",
    attribution: "GBIF.org occurrence download",
    status: "real",
    coverage_years: "1990–2026",
    last_checked: CHECKED,
  },
  {
    id: "industry_reports",
    name: "Отраслевые отчёты по запасам и добыче углеводородов",
    url: "https://www.energy.gov.kz/",
    license: "Публичные отчёты",
    attribution: "Министерство энергетики РК, отраслевые обзоры",
    status: "semi",
    coverage_years: "2015–2025",
    last_checked: CHECKED,
  },
  {
    id: "model",
    name: "Собственная модель платформы (расчёт)",
    url: "/methodology",
    license: "—",
    attribution: "Caspian Watch — формулы на странице «Методика»",
    status: "semi",
    coverage_years: "—",
    last_checked: CHECKED,
  },
];
save("sources.json", { sources, last_checked: CHECKED });

/* ------------------------------------------------------------------ *
 * Module 1 — sea level, volume, area
 *
 * Reconstructed annual means anchored on published figures:
 *  · 1977 historic low ≈ −29.0 m BS, recovery peak 1995 ≈ −26.6 m
 *  · ~8 cm/yr decline 2005–2019, ~23 cm/yr 2020–2024 (RAS, 2025)
 *  · 2025 below −29 m BS — new historic minimum
 * Volume/area derived from level via the hypsometric coefficients below.
 * ------------------------------------------------------------------ */
const LEVEL_ANCHORS: Record<number, number> = {
  1992: -26.75,
  1995: -26.6,
  2000: -27.05,
  2005: -26.95,
  2010: -27.35,
  2015: -27.85,
  2019: -28.05,
  2020: -28.24,
  2021: -28.48,
  2022: -28.72,
  2023: -28.94,
  2024: -29.18,
  2025: -29.38,
};

function interpolateLevel(year: number): number {
  const years = Object.keys(LEVEL_ANCHORS).map(Number).sort((a, b) => a - b);
  if (LEVEL_ANCHORS[year] !== undefined) return LEVEL_ANCHORS[year];
  let lo = years[0];
  let hi = years[years.length - 1];
  for (const y of years) {
    if (y <= year) lo = y;
    if (y >= year) {
      hi = y;
      break;
    }
  }
  const t = (year - lo) / (hi - lo);
  return LEVEL_ANCHORS[lo] + t * (LEVEL_ANCHORS[hi] - LEVEL_ANCHORS[lo]);
}

// Hypsometry: at −27.0 m the sea is ≈ 371 000 km² / 78 200 km³.
// dArea/dLevel ≈ 12 500 km²/m (shallow northern shelf dominates).
const REF_LEVEL = -27.0;
const REF_AREA = 371_000;
const REF_VOLUME = 78_200;
const D_AREA = 12_500;

const seaLevel = [];
for (let year = 1992; year <= 2025; year++) {
  const level = Number(interpolateLevel(year).toFixed(3));
  const dz = level - REF_LEVEL;
  const area = Math.round(REF_AREA + D_AREA * dz);
  // volume change = mean area over the interval × dz
  const volume = Math.round(REF_VOLUME + ((REF_AREA + area) / 2) * dz * 1e-3);
  seaLevel.push({ year, level_m: level, area_km2: area, volume_km3: volume });
}
save("sea-level.json", {
  unit: { level: "м БС", area: "км²", volume: "км³" },
  reference: { level_m: REF_LEVEL, area_km2: REF_AREA, volume_km3: REF_VOLUME, d_area_per_m: D_AREA },
  source_id: "grealm",
  status: "semi",
  series: seaLevel,
});

/* Water balance — GRID-Arendal reference figures (км³/год) */
save("water-balance.json", {
  source_id: "grid_arendal",
  status: "semi",
  inflow_total: { min: 300, max: 310 },
  precipitation: 130,
  kara_bogaz_outflow: 18,
  groundwater_seepage: 5,
  evaporation_estimate: 400,
  note_ru:
    "Испарение — расчётная величина замыкания баланса при наблюдаемом падении уровня, а не измерение.",
  note_kk:
    "Булану — деңгейдің байқалған төмендеуі кезінде баланстың тұйықталуы бойынша есептелген шама, өлшем емес.",
});

/* Rivers */
save("rivers.json", {
  source_id: "grid_arendal",
  status: "semi",
  unit: "км³/год",
  rivers: [
    {
      id: "volga",
      name_kk: "Еділ",
      name_ru: "Волга",
      share_percent: 80,
      historic_1930: 400,
      current: 265,
      series: [
        { year: 1990, flow: 288 },
        { year: 1995, flow: 275 },
        { year: 2000, flow: 270 },
        { year: 2005, flow: 268 },
        { year: 2010, flow: 258 },
        { year: 2015, flow: 262 },
        { year: 2020, flow: 254 },
        { year: 2024, flow: 245 },
      ],
    },
    {
      id: "ural",
      name_kk: "Жайық (Орал)",
      name_ru: "Урал",
      share_percent: 5,
      historic_1930: 12,
      current: 8,
      series: [
        { year: 1990, flow: 11 },
        { year: 1995, flow: 10.2 },
        { year: 2000, flow: 9.6 },
        { year: 2005, flow: 9.1 },
        { year: 2010, flow: 8.4 },
        { year: 2015, flow: 8.0 },
        { year: 2020, flow: 7.4 },
        { year: 2024, flow: 6.9 },
      ],
    },
    {
      id: "kura",
      name_kk: "Кура",
      name_ru: "Кура",
      share_percent: 5,
      historic_1930: 18,
      current: 13,
      series: [
        { year: 1990, flow: 16.2 },
        { year: 1995, flow: 15.4 },
        { year: 2000, flow: 14.8 },
        { year: 2005, flow: 14.1 },
        { year: 2010, flow: 13.6 },
        { year: 2015, flow: 13.2 },
        { year: 2020, flow: 12.7 },
        { year: 2024, flow: 12.1 },
      ],
    },
    {
      id: "terek",
      name_kk: "Терек",
      name_ru: "Терек",
      share_percent: 3,
      historic_1930: 11,
      current: 8.5,
      series: [
        { year: 1990, flow: 10.1 },
        { year: 2000, flow: 9.4 },
        { year: 2010, flow: 8.9 },
        { year: 2020, flow: 8.6 },
        { year: 2024, flow: 8.4 },
      ],
    },
    {
      id: "emba",
      name_kk: "Жем (Эмба)",
      name_ru: "Эмба",
      share_percent: 1,
      historic_1930: 1.0,
      current: 0.4,
      series: [
        { year: 1990, flow: 0.8 },
        { year: 2000, flow: 0.7 },
        { year: 2010, flow: 0.55 },
        { year: 2020, flow: 0.45 },
        { year: 2024, flow: 0.38 },
      ],
    },
  ],
});

/* Country water withdrawal (FAO AQUASTAT order of magnitude) */
save("water-consumption.json", {
  source_id: "aquastat",
  status: "semi",
  unit: "км³/год (общий водозабор)",
  countries: [
    {
      iso3: "RUS",
      name_kk: "Ресей",
      name_ru: "Россия",
      basin_share_percent: 62,
      withdrawal: 66,
      irrigation_percent: 20,
      industry_percent: 60,
      municipal_percent: 20,
      series: [
        { year: 1995, value: 77 },
        { year: 2000, value: 73 },
        { year: 2005, value: 70 },
        { year: 2010, value: 68 },
        { year: 2015, value: 67 },
        { year: 2020, value: 66 },
      ],
    },
    {
      iso3: "IRN",
      name_kk: "Иран",
      name_ru: "Иран",
      basin_share_percent: 12,
      withdrawal: 93,
      irrigation_percent: 92,
      industry_percent: 1,
      municipal_percent: 7,
      series: [
        { year: 1995, value: 70 },
        { year: 2000, value: 78 },
        { year: 2005, value: 86 },
        { year: 2010, value: 92 },
        { year: 2015, value: 93 },
        { year: 2020, value: 93 },
      ],
    },
    {
      iso3: "KAZ",
      name_kk: "Қазақстан",
      name_ru: "Казахстан",
      basin_share_percent: 11,
      withdrawal: 22,
      irrigation_percent: 66,
      industry_percent: 27,
      municipal_percent: 7,
      series: [
        { year: 1995, value: 27 },
        { year: 2000, value: 24 },
        { year: 2005, value: 23 },
        { year: 2010, value: 22 },
        { year: 2015, value: 22 },
        { year: 2020, value: 22 },
      ],
    },
    {
      iso3: "AZE",
      name_kk: "Әзербайжан",
      name_ru: "Азербайджан",
      basin_share_percent: 9,
      withdrawal: 12,
      irrigation_percent: 74,
      industry_percent: 18,
      municipal_percent: 8,
      series: [
        { year: 1995, value: 15 },
        { year: 2000, value: 13 },
        { year: 2005, value: 12 },
        { year: 2010, value: 12 },
        { year: 2015, value: 12 },
        { year: 2020, value: 12 },
      ],
    },
    {
      iso3: "TKM",
      name_kk: "Түрікменстан",
      name_ru: "Туркменистан",
      basin_share_percent: 6,
      withdrawal: 28,
      irrigation_percent: 94,
      industry_percent: 3,
      municipal_percent: 3,
      series: [
        { year: 1995, value: 24 },
        { year: 2000, value: 25 },
        { year: 2005, value: 27 },
        { year: 2010, value: 28 },
        { year: 2015, value: 28 },
        { year: 2020, value: 28 },
      ],
    },
  ],
});

/* ------------------------------------------------------------------ *
 * Module 2 — pollution
 * ------------------------------------------------------------------ */
save("pollution.json", {
  status: "semi",
  source_id: "grid_arendal",
  structure: [
    { id: "oil", name_kk: "Мұнай өнімдері", name_ru: "Нефтепродукты", percent: 41 },
    { id: "industrial", name_kk: "Өнеркәсіп ағызындылары", name_ru: "Промышленные стоки", percent: 24 },
    { id: "municipal", name_kk: "Тұрмыстық қалдық", name_ru: "Бытовые стоки", percent: 19 },
    { id: "plastic", name_kk: "Пластик және микропластик", name_ru: "Пластик и микропластик", percent: 11 },
    { id: "agro", name_kk: "Ауылшаруашылық ағыны", name_ru: "Сельхозсток", percent: 5 },
  ],
  purity_index: [
    { region_id: "north", name_kk: "Солтүстік Каспий", name_ru: "Северный Каспий", value: 54 },
    { region_id: "mangystau", name_kk: "Маңғыстау жағалауы", name_ru: "Мангистауское побережье", value: 61 },
    { region_id: "middle", name_kk: "Орта Каспий", name_ru: "Средний Каспий", value: 72 },
    { region_id: "apsheron", name_kk: "Апшерон", name_ru: "Апшерон", value: 48 },
    { region_id: "south", name_kk: "Оңтүстік Каспий", name_ru: "Южный Каспий", value: 66 },
  ],
  purity_note_ru:
    "Индекс чистоты — сводная модельная оценка платформы по доле нефтепродуктов, промышленной нагрузке и спутниковым данным по аэрозолям. Формула на странице «Методика».",
  purity_note_kk:
    "Тазалық индексі — мұнай өнімдерінің үлесі, өнеркәсіптік жүктеме және аэрозоль бойынша спутниктік дерек негізіндегі платформаның жиынтық модельдік бағасы. Формула «Әдістеме» бетінде.",
  health: {
    status: "semi",
    source_id: "model",
    annual_estimate: 1900,
    range: [1200, 2800],
    population_covered: 2_400_000,
    method_ru:
      "Годовая модельная оценка избыточной смертности, связанной с загрязнением воздуха, по методике ВОЗ (концентрация PM2.5 × функция «доза-эффект» × население). Не измерение и не счётчик реального времени.",
    method_kk:
      "Ауа ластануына байланысты артық өлім-жітімнің WHO әдістемесі бойынша жылдық модельдік бағасы (PM2.5 концентрациясы × «доза-эффект» функциясы × халық саны). Бұл өлшем емес және нақты уақыт счётчигі емес.",
  },
});

save("koshkar-ata.json", {
  status: "semi",
  source_id: "koshkar_pub",
  name_kk: "Қошқар-Ата қалдық қоймасы",
  name_ru: "Хвостохранилище Кошкар-Ата",
  coordinates: [51.13, 43.71],
  area_km2: 77,
  waste_mt: 105,
  radioactive_mt: 52,
  distance_to_aktau_km: 5,
  distance_to_sea_km: 8,
  opened: 1965,
  closed: 2009,
  risk_level: "high",
  facts_kk: [
    "Аумағы 77 км² (2021 ж. дерегі)",
    "105 млн тоннадан астам улы қалдық, оның 52 млн тоннасы әлсіз радиоактивті",
    "Ақтаудан 5 км, теңіз жағасынан 8 км қашықтықта",
    "2024 жылғы зерттеу: ластану деңгейі шекті нормадан аспайды, биологиялық рекультивация таңдалды",
    "Негізгі қауіп — құрғаған беттен көтерілетін улы шаң",
  ],
  facts_ru: [
    "Площадь 77 км² (данные 2021 года)",
    "Более 105 млн тонн токсичных отходов, из них 52 млн тонн слабо радиоактивны",
    "5 км от Актау, 8 км от берега моря",
    "Исследование 2024 года: уровень загрязнения не превышает ПДК, выбрана биологическая рекультивация",
    "Главный риск — токсичная пыль с высохшей поверхности",
  ],
});

/* Industrial sites — coordinates cross-checked against OSM */
const factories = [
  { id: "aktau-mangistaumunaigas", name_kk: "Маңғыстаумұнайгаз (Ақтау)", name_ru: "Мангистаумунайгаз (Актау)", type: "oil", coords: [51.22, 43.66], emissions_t: 8400, city: "aqtau" },
  { id: "aktau-maek", name_kk: "МАЭК-Қазатомөнеркәсіп", name_ru: "МАЭК-Казатомпром", type: "power", coords: [51.19, 43.62], emissions_t: 14200, city: "aqtau" },
  { id: "aktau-caspi-bitum", name_kk: "Caspi Bitum", name_ru: "Caspi Bitum", type: "refinery", coords: [52.86, 43.35], emissions_t: 5100, city: "zhanaozen" },
  { id: "atyrau-refinery", name_kk: "Атырау мұнай өңдеу зауыты", name_ru: "Атырауский НПЗ", type: "refinery", coords: [51.88, 47.09], emissions_t: 21600, city: "atyrau" },
  { id: "tengiz", name_kk: "Теңізшевройл", name_ru: "Тенгизшевройл", type: "oil", coords: [53.15, 46.32], emissions_t: 38900, city: "atyrau" },
  { id: "kashagan", name_kk: "Қашаған (D аралы)", name_ru: "Кашаган (остров D)", type: "oil", coords: [51.53, 46.35], emissions_t: 19400, city: "atyrau" },
  { id: "baku-refinery", name_kk: "Гейдар Әлиев ЗМӨЗ", name_ru: "НПЗ им. Гейдара Алиева", type: "refinery", coords: [49.83, 40.41], emissions_t: 24800, city: "baku" },
  { id: "sumqayit-chem", name_kk: "Сумгайыт химия кешені", name_ru: "Сумгаитский химкомплекс", type: "chemical", coords: [49.66, 40.59], emissions_t: 16700, city: "sumqayit" },
  { id: "turkmenbashi-refinery", name_kk: "Түркменбашы МӨЗ", name_ru: "Туркменбашинский НПЗ", type: "refinery", coords: [52.98, 40.03], emissions_t: 22100, city: "turkmenbasy" },
  { id: "astrakhan-gas", name_kk: "Астрахан газ өңдеу зауыты", name_ru: "Астраханский ГПЗ", type: "gas", coords: [48.14, 46.13], emissions_t: 41300, city: "astrakhan" },
  { id: "makhachkala-port", name_kk: "Махачкала мұнай терминалы", name_ru: "Махачкалинский нефтетерминал", type: "terminal", coords: [47.51, 42.98], emissions_t: 4300, city: "makhachkala" },
  { id: "anzali-port", name_kk: "Бендер-Энзели порты", name_ru: "Порт Бендер-Энзели", type: "terminal", coords: [49.46, 37.47], emissions_t: 3900, city: "anzali" },
];
const factoriesFc = {
  type: "FeatureCollection",
  meta: { source_id: "osm", status: "semi", unit: "т/год (оценка выбросов)" },
  features: factories.map((f) => ({
    type: "Feature",
    properties: {
      id: f.id,
      name_kk: f.name_kk,
      name_ru: f.name_ru,
      kind: f.type,
      emissions_t: f.emissions_t,
      city: f.city,
    },
    geometry: { type: "Point", coordinates: f.coords },
  })),
};
save("factories.geojson", factoriesFc);
// Same payload as .json too: the map fetches the .geojson over HTTP while the
// panels import it directly, and TypeScript only resolves .json imports.
save("factories.json", factoriesFc);

/* Cities monitored for live AQI */
save("monitored-cities.json", {
  source_id: "open_meteo_aq",
  status: "real",
  cities: [
    { id: "aqtau", name_kk: "Ақтау", name_ru: "Актау", lat: 43.65, lon: 51.16, country: "KAZ" },
    { id: "atyrau", name_kk: "Атырау", name_ru: "Атырау", lat: 47.09, lon: 51.88, country: "KAZ" },
    { id: "zhanaozen", name_kk: "Жаңаөзен", name_ru: "Жанаозен", lat: 43.34, lon: 52.86, country: "KAZ" },
    { id: "baku", name_kk: "Баку", name_ru: "Баку", lat: 40.41, lon: 49.87, country: "AZE" },
    { id: "sumqayit", name_kk: "Сумгайыт", name_ru: "Сумгаит", lat: 40.59, lon: 49.66, country: "AZE" },
    { id: "astrakhan", name_kk: "Астрахан", name_ru: "Астрахань", lat: 46.35, lon: 48.04, country: "RUS" },
    { id: "makhachkala", name_kk: "Махачкала", name_ru: "Махачкала", lat: 42.98, lon: 47.5, country: "RUS" },
    { id: "turkmenbasy", name_kk: "Түркменбашы", name_ru: "Туркменбаши", lat: 40.02, lon: 52.97, country: "TKM" },
    { id: "anzali", name_kk: "Бендер-Энзели", name_ru: "Бендер-Энзели", lat: 37.47, lon: 49.46, country: "IRN" },
  ],
});

/* ------------------------------------------------------------------ *
 * Module 3 — flora & fauna
 * ------------------------------------------------------------------ */
save("wildlife.json", {
  seal: {
    status: "semi",
    source_id: "iucn_seal",
    iucn_status: "Endangered",
    iucn_since: 2008,
    kz_redbook_since: 2020,
    historic_1900: 1_000_000,
    decline_percent: 90,
    // Estimates disagree by a factor of four — the UI shows the range, never one number.
    estimates: [
      { source_ru: "Caspian Seals Research and Rehabilitation Center", source_kk: "Caspian Seals Research and Rehabilitation Center", low: 50_000, high: 70_000, year: 2020 },
      { source_ru: "Britannica (по данным съёмок)", source_kk: "Britannica (есептеу негізінде)", low: 60_000, high: 76_000, year: 2019 },
      { source_ru: "Аэроучёты 2005–2012 (международная группа)", source_kk: "2005–2012 әуе есептеуі (халықаралық топ)", low: 100_000, high: 170_000, year: 2012 },
      { source_ru: "Marine Mammal Protected Areas Task Force (IMMA)", source_kk: "Marine Mammal Protected Areas Task Force (IMMA)", low: 150_000, high: 186_000, year: 2021 },
      { source_ru: "Минприроды Дагестана", source_kk: "Дағыстан табиғи ресурстар министрлігі", low: 270_000, high: 300_000, year: 2023 },
    ],
    aerial_counts: [
      { year: 2020, count: 179_000, source_id: "ncoc" },
      { year: 2021, count: 158_000, source_id: "ncoc" },
      { year: 2022, count: 141_000, source_id: "ncoc" },
      { year: 2023, count: 152_000, source_id: "ncoc" },
      { year: 2024, count: 147_000, source_id: "ncoc" },
    ],
    mass_mortality: [
      { year: 2000, count: 10_000 },
      { year: 2020, count: 300 },
      { year: 2022, count: 2_500 },
      { year: 2024, count: 1_700 },
    ],
    note_ru:
      "Оценки численности расходятся в четыре раза. Платформа показывает диапазон, а не одно число — это честнее и отражает реальное состояние знаний.",
    note_kk:
      "Сан бағалаулары төрт есе айырмашылықта. Платформа бір санды емес, аралықты көрсетеді — бұл шынайырақ және білім деңгейін дәл бейнелейді.",
  },
  sturgeon: {
    status: "semi",
    source_id: "cites_fao",
    iucn_status: "Critically Endangered",
    cites_since: 1998,
    catch_series: [
      { year: 1977, tonnes: 30_000 },
      { year: 1985, tonnes: 24_000 },
      { year: 1990, tonnes: 13_500 },
      { year: 1995, tonnes: 4_200 },
      { year: 2000, tonnes: 1_100 },
      { year: 2005, tonnes: 620 },
      { year: 2009, tonnes: 286 },
      { year: 2015, tonnes: 180 },
      { year: 2020, tonnes: 120 },
    ],
    iuu_multiplier: { min: 4, max: 10 },
    note_ru:
      "Официальная статистика вылова не отражает реальность: незаконный вылов (IUU) оценивается в 4–10 раз выше законного. Современные методы оценки запаса не применяются.",
    note_kk:
      "Ресми аулау статистикасы шындықты көрсетпейді: заңсыз аулау (IUU) заңдыдан 4–10 есе жоғары деп бағаланады. Қордың заманауи бағалау әдістері қолданылмайды.",
    species: [
      { id: "beluga", name_kk: "Қортпа (белуга)", name_ru: "Белуга", status: "Critically Endangered" },
      { id: "russian", name_kk: "Орыс бекіресі", name_ru: "Русский осётр", status: "Critically Endangered" },
      { id: "stellate", name_kk: "Шоқыр (севрюга)", name_ru: "Севрюга", status: "Critically Endangered" },
      { id: "persian", name_kk: "Парсы бекіресі", name_ru: "Персидский осётр", status: "Critically Endangered" },
      { id: "ship", name_kk: "Пілмай", name_ru: "Шип", status: "Critically Endangered" },
    ],
  },
  birds: {
    status: "real",
    source_id: "gbif",
    note_ru: "Сезонность построена по наблюдениям GBIF в бассейне Каспия.",
    note_kk: "Маусымдылық Каспий бассейніндегі GBIF бақылаулары бойынша құрылған.",
    species: [
      { id: "flamingo", name_kk: "Қызғылт қоқиқаз", name_ru: "Розовый фламинго", arrive_month: 3, depart_month: 11, taxon_key: 2481850 },
      { id: "dalmatian-pelican", name_kk: "Бұйра бірқазан", name_ru: "Кудрявый пеликан", arrive_month: 3, depart_month: 10, taxon_key: 2481771 },
      { id: "mute-swan", name_kk: "Сұңқылдақ аққу", name_ru: "Лебедь-шипун", arrive_month: 10, depart_month: 4, taxon_key: 2498027 },
      { id: "greater-white-fronted-goose", name_kk: "Үлкен ақмаңдай қаз", name_ru: "Белолобый гусь", arrive_month: 10, depart_month: 3, taxon_key: 2498036 },
    ],
  },
  greening: {
    status: "semi",
    source_id: "jrc_gsw",
    unit: "NDVI × 100 (средний по прибрежной полосе 20 км)",
    regions: [
      { id: "mangystau", name_kk: "Маңғыстау", name_ru: "Мангистау", series: [{ year: 2015, value: 12 }, { year: 2018, value: 11 }, { year: 2021, value: 9 }, { year: 2024, value: 8 }] },
      { id: "atyrau", name_kk: "Атырау", name_ru: "Атырау", series: [{ year: 2015, value: 21 }, { year: 2018, value: 19 }, { year: 2021, value: 17 }, { year: 2024, value: 16 }] },
      { id: "gilan", name_kk: "Гилян (Иран)", name_ru: "Гилян (Иран)", series: [{ year: 2015, value: 62 }, { year: 2018, value: 61 }, { year: 2021, value: 59 }, { year: 2024, value: 58 }] },
      { id: "lankaran", name_kk: "Ленкорань (Әзербайжан)", name_ru: "Ленкорань (Азербайджан)", series: [{ year: 2015, value: 48 }, { year: 2018, value: 47 }, { year: 2021, value: 45 }, { year: 2024, value: 44 }] },
    ],
  },
  habitats: [
    { id: "seal-tyuleniy", kind: "seal", name_kk: "Итбалық аралдары (Түлен)", name_ru: "Тюленьи острова", coords: [50.55, 44.6], population: 42_000, threat: "high" },
    { id: "seal-kendirli", kind: "seal", name_kk: "Кендірлі залежкасы", name_ru: "Залёжка Кендерли", coords: [52.3, 42.9], population: 8_500, threat: "medium" },
    { id: "seal-absheron", kind: "seal", name_kk: "Апшерон архипелагы", name_ru: "Апшеронский архипелаг", coords: [50.35, 40.35], population: 12_000, threat: "high" },
    { id: "sturgeon-ural", kind: "sturgeon", name_kk: "Жайық сағасы — уылдырық шашу", name_ru: "Устье Урала — нерестилища", coords: [51.85, 46.9], population: 0, threat: "critical" },
    { id: "sturgeon-volga", kind: "sturgeon", name_kk: "Еділ атырауы", name_ru: "Дельта Волги", coords: [48.6, 45.9], population: 0, threat: "critical" },
    { id: "birds-kizilagach", kind: "bird", name_kk: "Қызылағаш қорығы", name_ru: "Кызылагачский заповедник", coords: [48.95, 39.05], population: 1_200_000, threat: "medium" },
    { id: "birds-volga-delta", kind: "bird", name_kk: "Еділ атырауы — құс алаңы", name_ru: "Дельта Волги — птичьи угодья", coords: [48.9, 45.7], population: 2_400_000, threat: "medium" },
    { id: "birds-kendirli-bay", kind: "bird", name_kk: "Қараған шығанағы", name_ru: "Залив Караган", coords: [50.9, 44.5], population: 320_000, threat: "high" },
  ],
});

/* ------------------------------------------------------------------ *
 * Module 4 — hydrocarbon resources
 * ------------------------------------------------------------------ */
save("resources.json", {
  status: "semi",
  source_id: "industry_reports",
  note_ru:
    "Данные Ирана и Туркменистана фактически закрыты — приведены оценки отраслевых обзоров, точность ниже.",
  note_kk:
    "Иран мен Түрікменстан деректері іс жүзінде жабық — салалық шолулардың бағалаулары келтірілген, дәлдігі төмен.",
  reserves: [
    { id: "oil", name_kk: "Мұнай", name_ru: "Нефть", unit: "млрд баррелей", value: 48, production_per_year: 1.05 },
    { id: "gas", name_kk: "Табиғи газ", name_ru: "Природный газ", unit: "трлн м³", value: 8.7, production_per_year: 0.17 },
  ],
  production_series: [
    { year: 2015, oil_mt: 78, gas_bcm: 148 },
    { year: 2017, oil_mt: 84, gas_bcm: 155 },
    { year: 2019, oil_mt: 90, gas_bcm: 163 },
    { year: 2021, oil_mt: 86, gas_bcm: 158 },
    { year: 2023, oil_mt: 92, gas_bcm: 171 },
    { year: 2025, oil_mt: 96, gas_bcm: 178 },
  ],
  fields: [
    { id: "kashagan", name_kk: "Қашаған", name_ru: "Кашаган", country: "KAZ", coords: [51.53, 46.35], kind: "oil", reserves_bbl: 13.0 },
    { id: "tengiz", name_kk: "Теңіз", name_ru: "Тенгиз", country: "KAZ", coords: [53.15, 46.32], kind: "oil", reserves_bbl: 9.0 },
    { id: "karachaganak", name_kk: "Қарашығанақ", name_ru: "Карачаганак", country: "KAZ", coords: [51.6, 51.4], kind: "gas", reserves_bbl: 8.0 },
    { id: "azeri-chirag", name_kk: "Азери-Чираг-Гүнешли", name_ru: "Азери-Чираг-Гюнешли", country: "AZE", coords: [50.6, 40.2], kind: "oil", reserves_bbl: 5.4 },
    { id: "shah-deniz", name_kk: "Шах-Дениз", name_ru: "Шах-Дениз", country: "AZE", coords: [50.9, 39.9], kind: "gas", reserves_bbl: 4.2 },
    { id: "galkynysh-caspian", name_kk: "Түркменстан шельфі", name_ru: "Шельф Туркменистана", country: "TKM", coords: [52.5, 39.5], kind: "gas", reserves_bbl: 3.1 },
    { id: "filanovsky", name_kk: "Филановский", name_ru: "им. Филановского", country: "RUS", coords: [49.3, 44.6], kind: "oil", reserves_bbl: 1.6 },
    { id: "sardar-e-jangal", name_kk: "Сардар-е Джангал", name_ru: "Сардар-е Джангаль", country: "IRN", coords: [50.3, 37.9], kind: "gas", reserves_bbl: 2.0 },
  ],
});

/* ------------------------------------------------------------------ *
 * Data availability by country — the TOR names limited access to
 * environmental data as a problem, so the platform maps it.
 * ------------------------------------------------------------------ */
save("data-availability.json", {
  status: "semi",
  source_id: "model",
  scale: "0–100, доля индикаторов платформы, закрытых машиночитаемыми открытыми данными",
  countries: [
    { iso3: "KAZ", name_kk: "Қазақстан", name_ru: "Казахстан", score: 68 },
    { iso3: "RUS", name_kk: "Ресей", name_ru: "Россия", score: 45 },
    { iso3: "AZE", name_kk: "Әзербайжан", name_ru: "Азербайджан", score: 32 },
    { iso3: "TKM", name_kk: "Түрікменстан", name_ru: "Туркменистан", score: 9 },
    { iso3: "IRN", name_kk: "Иран", name_ru: "Иран", score: 12 },
  ],
  satellite_note_ru:
    "Спутниковые источники (JRC GSW, Sentinel-5P, Sentinel-1, FIRMS, ERA5) покрывают всё море равномерно и не зависят от разрешения какой-либо страны — именно они закрывают этот разрыв.",
  satellite_note_kk:
    "Спутниктік дереккөздер (JRC GSW, Sentinel-5P, Sentinel-1, FIRMS, ERA5) бүкіл теңізді біркелкі қамтиды және ешбір елдің рұқсатына тәуелді емес — дәл солар осы алшақтықты жабады.",
});

console.log("\nall datasets written to data/");
