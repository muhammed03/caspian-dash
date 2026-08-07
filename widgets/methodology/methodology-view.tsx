"use client";

import { ExternalLink, Sigma, ShieldCheck, FileText, FlaskConical } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";
import { byLocale, formatFixed, formatNumber, pick, type Trio } from "@/shared/lib/i18n";
import { COMPONENT_LABELS } from "@/shared/config/eco-index";

import { Display, Label, Lede, Plain, Reveal, RevealItem, SectionMark } from "@/shared/ui/primitives";
import { RISK_THRESHOLDS } from "@/shared/lib/analyze";
import { ecoIndexComponents } from "@/entities/ai-insight/compute";
import { SiteFooter } from "@/widgets/site-footer/site-footer";

import sourcesFile from "@/data/sources.json";
import coastlineIndex from "@/data/coastline-index.json";
import seaLevel from "@/data/sea-level.json";

type Block = {
  id: string;
  title: Trio;
  formula: string;
  body: Trio;
  limits: Trio;
  sourceIds: string[];
};

/**
 * The land-block formula, one line per row. Kept as a list of per-locale rows
 * rather than one multi-line string per language so that every translated
 * fragment sits in its own `kk` / `ru` / `en` slot. Only the labels are
 * translated — the mathematics, the variable names and the numbers are
 * identical in all three languages.
 */
const LAND_FORMULA_LINES: Trio[] = [
  {
    kk: "Нестеров:   G = Σ T·(T − Td)   жауын-шашынсыз (≥ 3 мм) қатарынан келген күндер бойынша",
    ru: "Нестеров:  G = Σ T·(T − Td)   по дням подряд без осадков ≥ 3 мм",
    en: "Nesterov:    G = Σ T·(T − Td)   over consecutive days without precipitation ≥ 3 mm",
  },
  {
    kk: "            кластар: I <300 · II <1000 · III <4000 · IV <10000 · V ≥10000",
    ru: "           классы: I <300 · II <1000 · III <4000 · IV <10000 · V ≥10000",
    en: "             classes: I <300 · II <1000 · III <4000 · IV <10000 · V ≥10000",
  },
  {
    kk: "Td (Магнус): Td = b·α / (a − α),  α = a·T/(b+T) + ln(RH/100)",
    ru: "Td (Магнус): Td = b·α / (a − α),  α = a·T/(b+T) + ln(RH/100)",
    en: "Td (Magnus): Td = b·α / (a − α),  α = a·T/(b+T) + ln(RH/100)",
  },
  {
    kk: "Топырақ:    балл = 0–7 см ылғалдылық / 0,30 · 100",
    ru: "Почва:     балл = влажность 0–7 см / 0,30 · 100",
    en: "Soil:        score = soil moisture 0–7 cm / 0.30 · 100",
  },
  {
    kk: "Ылғалдылық: балл = 0,65·(жауын-шашын₉₀ / 90 мм) + 0,35·(1 − құрғақ күндер / 60 күн)",
    ru: "Увлажнение: балл = 0,65·(осадки₉₀ / 90 мм) + 0,35·(1 − сушь / 60 дней)",
    en: "Moisture:    score = 0.65·(precipitation₉₀ / 90 mm) + 0.35·(1 − dry spell / 60 days)",
  },
];

const STATUS_META = {
  real: { Icon: ShieldCheck, cls: "text-good", dot: "bg-good" },
  semi: { Icon: FileText, cls: "text-warn", dot: "bg-warn" },
  mock: { Icon: FlaskConical, cls: "text-bad", dot: "bg-bad" },
} as const;

export function MethodologyView() {
  const t = useT();
  const locale = useLocale();

  const ref = seaLevel.reference;

  const BLOCKS: Block[] = [
    {
      id: "level",
      title: {
        kk: "Су көлемі мен ауданы",
        ru: "Объём и площадь воды",
        en: "Water volume and area",
      },
      formula: `S(h) = ${formatNumber(ref.area_km2, locale)} + ${formatNumber(
        ref.d_area_per_m,
        locale
      )} · (h − (${ref.level_m}))\nV(h) = ${formatNumber(
        ref.volume_km3,
        locale
      )} + ½ · (S₀ + S(h)) · (h − (${ref.level_m})) · 10⁻³`,
      body: {
        kk: "Ауданы мен көлемі деңгейден гипсометриялық коэффициент арқылы есептеледі: солтүстіктегі таяз қайраң басым болғандықтан, әр метр деңгей шамамен 12 500 км² айдын береді. Тірек нүкте — −27,0 м кезіндегі 371 000 км² және 78 200 км³.",
        ru: "Площадь и объём считаются из уровня через гипсометрический коэффициент: из-за преобладания мелководного северного шельфа каждый метр уровня даёт около 12 500 км² акватории. Опорная точка — 371 000 км² и 78 200 км³ при −27,0 м.",
        en: "Area and volume are derived from the level through a hypsometric coefficient: because the shallow northern shelf dominates, every metre of level accounts for roughly 12,500 km² of water surface. The reference point is 371,000 km² and 78,200 km³ at −27.0 m BS.",
      },
      limits: {
        kk: "Коэффициент бүкіл диапазонда тұрақты деп алынған. Нақты гипсометрия сызықты емес, сондықтан шеткі мәндерде қате өседі.",
        ru: "Коэффициент принят постоянным на всём диапазоне. Реальная гипсометрия нелинейна, поэтому на краях диапазона ошибка растёт.",
        en: "The coefficient is taken as constant across the whole range. Real hypsometry is non-linear, so the error grows towards the ends of the range.",
      },
      sourceIds: ["grealm", "ras_ocean"],
    },
    {
      id: "forecast",
      title: { kk: "Деңгей болжамы", ru: "Прогноз уровня", en: "Sea-level projection" },
      formula:
        `h(t) = a + b·t   (${byLocale(locale, {
          kk: "МНК, 2015 жылдан",
          ru: "МНК, с 2015 года",
          en: "least squares, from 2015",
        })})\nCI₉₅ = h(t) ± 1,96 · SE\nSE = √( Σ(hᵢ − ĥᵢ)² / (n − 2) )`,
      body: {
        kk: "Екі модель қатар есептеледі: ең кіші квадраттар әдісі бойынша сызықтық регрессия және деңгейдің тірек мәннен ауытқуы бойынша логарифмдік түрде салынған экспоненциалды модель. Қиылысу нүктесі 2015 жыл — дәл сол кезден төмендеу қарқыны күрт өсті. Графикте екеуі де көрсетіледі, өйткені олардың айырмашылығы белгісіздіктің шынайы шамасы.",
        ru: "Считаются две модели параллельно: линейная регрессия методом наименьших квадратов и экспоненциальная, построенная логарифмически по отклонению уровня от опорного значения. Точка отсечения — 2015 год, именно с него скорость падения резко выросла. На графике показаны обе, потому что расхождение между ними и есть честная величина неопределённости.",
        en: "Two models are computed side by side: a linear regression by least squares, and an exponential one fitted logarithmically to the level's deviation from the reference value. The cut-off is 2015 — the rate of decline rose sharply from that year on. The chart shows both, because the spread between them is the honest size of the uncertainty.",
      },
      limits: {
        kk: "Регрессия климаттық сценарийлерді, Еділ ағынының реттелуін және Қара-Боғаз-Гөлге ағуды ескермейді. 10 жылдан ұзақ көкжиекте болжам сенімсіз.",
        ru: "Регрессия не учитывает климатические сценарии, зарегулирование стока Волги и переток в Кара-Богаз-Гол. На горизонте свыше 10 лет прогноз ненадёжен.",
        en: "The regression does not account for climate scenarios, the regulation of Volga runoff, or the outflow into Kara-Bogaz-Gol. Beyond a 10-year horizon the extrapolation is unreliable.",
      },
      sourceIds: ["grealm", "grid_arendal"],
    },
    {
      id: "coastline",
      title: {
        kk: "Жағалау сызығының моделі",
        ru: "Модель береговой линии",
        en: "Shoreline model",
      },
      formula: "Δx = Δh / tan(β)",
      body: {
        kk: "Жағалаудың көлденең шегінуі деңгейдің төмендеуін жергілікті түп еңісіне бөлу арқылы алынады — жағалау геоморфологиясындағы стандартты тәсіл. Тірек сызық — Natural Earth жағалауы (2015 жылғы деңгейге сәйкестендірілген), әр төбе ішкі нормаль бойымен жылжытылады. Еңіс секторлар бойынша беріледі.",
        ru: "Горизонтальное отступание берега получается делением падения уровня на локальный уклон дна — стандартный приём береговой геоморфологии. Опорная линия — береговая линия Natural Earth (привязана к уровню 2015 года), каждая вершина смещается по внутренней нормали. Уклон задаётся посекторно.",
        en: "The cross-shore translation of the shoreline is obtained by dividing the drop in level by the local seabed slope — a standard technique in coastal geomorphology. The reference line is the Natural Earth coastline (tied to the 2015 level); every vertex is shifted along the inward normal. The slope is set per sector.",
      },
      limits: {
        kk: "Бұл — МОДЕЛЬ, спутниктік бақылау емес. Еңіс сектор ішінде тұрақты деп алынған, сгонды-нагонды құбылыстар мен шөгінді тасымалы ескерілмейді. Нақты өлшеу үшін Sentinel-2 бойынша NDWI маскасы қажет — ол жол scripts/ ішінде дайын.",
        ru: "Это МОДЕЛЬ, а не спутниковое наблюдение. Уклон принят постоянным внутри сектора, сгонно-нагонные явления и перенос наносов не учитываются. Для фактического измерения нужна маска NDWI по Sentinel-2 — этот путь заготовлен в scripts/.",
        en: "This is a MODEL, not a satellite observation. The slope is taken as constant within a sector; wind-driven set-up and set-down and sediment transport are not accounted for. An actual measurement would need an NDWI mask from Sentinel-2 — that path is stubbed out in scripts/.",
      },
      sourceIds: ["model", "natural_earth", "jrc_gsw"],
    },
    {
      id: "plume",
      title: {
        kk: "Шлейф таралуы (Гаусс моделі)",
        ru: "Рассеивание шлейфа (модель Гаусса)",
        en: "Plume dispersion (Gaussian model)",
      },
      formula:
        "σy(x) = k·x / √(1 + 0,0001·x)        k: A .22 B .16 C .11 D .08 E .06 F .04\n" +
        byLocale(locale, {
          kk: "жарты бұрыш = arctg(2·σy(L)/L) + σ_напр   σ_напр — 12 сағаттық дөңгелек стандартты ауытқу\n",
          ru: "полуугол = arctg(2·σy(L)/L) + σ_напр   σ_напр — круговое СКО за 12 ч\n",
          en: "half-angle = arctan(2·σy(L)/L) + σ_dir   σ_dir — circular SD over 12 h\n",
        }) +
        "C(x,y) ∝ exp(−y²/2σy²) / (π·σy·σz·u)   " +
        byLocale(locale, {
          kk: "салыстырмалы, 0…1",
          ru: "относительная, 0…1",
          en: "relative only, 0…1",
        }),
      body: {
        kk: "Шлейфтің ені тек желмен емес, Pasquill орнықтылық класымен анықталады: түнгі орнықты қабатта (F) шлейф жіңішке әрі алысқа жетеді, күндізгі орнықсызда (A/B) кең жайылып, тез сұйылады — айырма үш еседен асады. Класс жел жылдамдығы мен күн радиациясы (күндіз) немесе бұлттылық (түнде) бойынша есептеледі. Шлейф желдің КЕЛГЕН бағытына емес, ҚАРАМА-ҚАРСЫ жаққа кетеді: toBearing = fromBearing + 180°.",
        ru: "Ширина шлейфа определяется не только ветром, но классом устойчивости Пасквилла: в ночном устойчивом слое (F) шлейф узкий и уходит далеко, в дневном неустойчивом (A/B) он широкий и быстро разбавляется — разница больше чем втрое. Класс считается по скорости ветра и солнечной радиации (днём) или облачности (ночью). Направление ветра указывает, ОТКУДА он дует, поэтому шлейф уходит в противоположную сторону: toBearing = fromBearing + 180°.",
        en: "The width of the plume is set not by the wind alone but by the Pasquill stability class: in a stable night-time layer (F) the plume is narrow and travels far; in an unstable daytime one (A/B) it is wide and dilutes quickly — a difference of more than threefold. The class is derived from wind speed and solar radiation (by day) or cloud cover (by night). The plume travels in the direction OPPOSITE to the direction the wind comes from: toBearing = fromBearing + 180°.",
      },
      limits: {
        kk: "Құбыр биіктігі мен шлейфтің көтерілуі ескерілмейді. Шығарынды қарқыны (г/с) белгісіз, сондықтан концентрация тек САЛЫСТЫРМАЛЫ — µg/m³ ешқашан жазылмайды. Жер бедері мен ғимараттар ескерілмейді (ашық дала жуықтауы). Нәтиже — ықтимал таралу секторы, өлшенген ластану өрісі емес: тексеруге негіз, заңдық факт емес. Жел деректері болмаса анимация мүлдем көрсетілмейді.",
        ru: "Высота трубы и подъём шлейфа не учитываются. Интенсивность выброса (г/с) неизвестна, поэтому концентрация только ОТНОСИТЕЛЬНАЯ — µg/m³ нигде не приводится. Рельеф и застройка не учитываются (приближение открытой местности). Результат — вероятный сектор переноса, а не измеренное поле загрязнения: основание для проверки, а не юридический факт. Без данных о ветре анимация не показывается вовсе.",
        en: "Stack height and effective plume height are not accounted for. The emission rate (g/s) is unknown, so the concentration is RELATIVE only — µg/m³ is never quoted anywhere. Terrain and buildings are not accounted for (open-country approximation). The result is a probable advection sector, not a measured pollution field: grounds for an inspection, not a legal fact. Without wind data the animation is not shown at all.",
      },
      sourceIds: ["open_meteo", "open_meteo_aq", "osm"],
    },
    {
      id: "risk",
      title: { kk: "Тәуекел деңгейі", ru: "Уровень риска", en: "Risk level" },
      formula: `d = |(V − N) / N| · 100%\nlow: d < ${RISK_THRESHOLDS.medium}%   medium: ${RISK_THRESHOLDS.medium}–${RISK_THRESHOLDS.high}%   high: ${RISK_THRESHOLDS.high}–${RISK_THRESHOLDS.critical}%   critical: d ≥ ${RISK_THRESHOLDS.critical}%`,
      body: {
        kk: "Әр дашбордта бірнеше көрсеткіш нормадан ауытқу пайызы бойынша бағаланады, дашборд деңгейі — солардың ішіндегі ең жоғарысы. Норма ретінде тарихи орташа мән, заңнамалық ПДК немесе платформаның ашық жарияланған шегі алынады.",
        ru: "На каждом дашборде несколько показателей оцениваются по проценту отклонения от нормы, уровень дашборда — максимум из них. В качестве нормы берётся историческое среднее, законодательная ПДК или открыто заявленный порог платформы.",
        en: "On each dashboard several indicators are scored by their percentage deviation from a norm, and the level of the dashboard is the highest of them. The norm is a historical mean, a statutory maximum permissible concentration, or a threshold the platform states openly.",
      },
      limits: {
        kk: "Шектер сарапшылық түрде белгіленген және барлық көрсеткіш үшін бірдей. Салалық нормативтер әртүрлі болуы мүмкін.",
        ru: "Пороги заданы экспертно и одинаковы для всех показателей. Отраслевые нормативы могут отличаться.",
        en: "The thresholds are set by expert judgement and are the same for every indicator. Sector-specific standards may differ.",
      },
      sourceIds: ["model"],
    },
    {
      id: "land",
      title: {
        kk: "Топырақ, құрғақшылық және өрт қаупі",
        ru: "Почва, засуха и пожарная опасность",
        en: "Soil, drought and fire danger",
      },
      formula: LAND_FORMULA_LINES.map((line) => byLocale(locale, line)).join("\n"),
      body: {
        kk: "Үш көрсеткіш өлшенген ауа райы бойынша есептеледі. Өрт қаупі үшін Қазақстанда операциялық қолданылатын Нестеров индексі алынған — сондықтан ол жалпы «құрғақтық баллынан» артық. Шық нүктесі Магнус формуласымен есептеледі, өйткені Open-Meteo тәуліктік деңгейде ылғалдылықты береді. Үшеуі де жиынтық экоиндекске кіреді: су шегінген жағалау — сол шегінудің салдары, бөлек тақырып емес.",
        ru: "Три показателя считаются по измеренной погоде. Для пожарной опасности взят индекс Нестерова — методика, применяемая в Казахстане операционно, поэтому она предпочтительнее обобщённого «балла сухости». Точка росы вычисляется по формуле Магнуса, потому что Open-Meteo публикует влажность, а не точку росы на суточном уровне. Все три входят в сводный экоиндекс: пересыхающее побережье — следствие отступания моря, а не отдельная тема.",
        en: "All three indicators are computed from measured weather. For fire danger the Nesterov index is used — a method applied operationally in Kazakhstan, which makes it preferable to a generic “dryness score”. The dew point is derived with the Magnus formula, because Open-Meteo publishes relative humidity rather than a dew point at daily resolution. All three feed the composite eco-index: a drying coastline is a consequence of the sea retreating, not a separate topic.",
      },
      limits: {
        kk: "«Ылғалдылық» — ЖЕҢІЛДЕТІЛГЕН көрсеткіш: нақты SPI отыз жылдық бақылау қатарын талап етеді, ондай қатар платформада жоқ. «Топырақ» тек үстіңгі қабаттың ылғалдылығын білдіреді — тұздану, эрозия және ластану есепке алынбайды, сондықтан бұл «топырақтың жалпы жағдайы» емес. Нестеров индексі ашық даладағы жуықтау: жер бедері мен өсімдік түрі ескерілмейді. Есептеу бес нүкте бойынша жүреді, олар бүкіл жағалауды толық сипаттамайды.",
        ru: "«Увлажнение» — УПРОЩЁННЫЙ показатель: настоящий SPI требует тридцатилетнего ряда наблюдений, которого у платформы нет. «Почва» отражает только влажность верхнего слоя — засоление, эрозия и загрязнение не учитываются, поэтому это не «общее состояние почвы». Индекс Нестерова — приближение открытой местности: рельеф и тип растительности не учитываются. Расчёт идёт по пяти точкам, они не описывают всё побережье целиком.",
        en: "“Moisture” is a SIMPLIFIED indicator: a proper SPI needs a thirty-year series of observations, which the platform does not have. “Soil” reflects only the moisture of the top layer — salinisation, erosion and contamination are not accounted for, so this is not the “overall state of the soil”. The Nesterov index is an open-country approximation: terrain and vegetation type are not accounted for. The calculation runs over five points, and they do not describe the whole coastline.",
      },
      sourceIds: ["open_meteo", "model"],
    },
    {
      id: "eco-index",
      title: { kk: "Жиынтық экоиндекс", ru: "Сводный экоиндекс", en: "Composite eco-index" },
      formula: "I = Σ wᵢ · sᵢ ,  Σ wᵢ = 1",
      body: {
        kk: "Сегіз құраушының салмақталған қосындысы. Бесеуі теңіздің өзін, үшеуі жағалау құрлығын сипаттайды. Әр құраушы 0–100 шкаласына өз тірек мәні бойынша келтіріледі: айдын ауданы 1992 жылмен, балық қоры 1977 жылғы аулаумен, итбалық ХХ ғасыр басындағы санмен салыстырылады. Топырақ, ылғалдылық және өрт қаупі — өлшенген ауа райынан.",
        ru: "Взвешенная сумма восьми компонент: пять описывают само море, три — прибрежную сушу. Каждая приводится к шкале 0–100 по своему опорному значению: акватория сравнивается с 1992 годом, рыбные запасы — с выловом 1977 года, тюлень — с численностью начала XX века. Почва, увлажнение и пожарная опасность — по измеренной погоде.",
        en: "A weighted sum of eight components: five describe the sea itself, three the coastal land. Each is brought onto a 0–100 scale against its own reference value: the water surface is compared with 1992, fish stocks with the 1977 catch, the seal with its numbers at the start of the 20th century. Soil, moisture and fire danger come from measured weather.",
      },
      limits: {
        kk: "Салмақтар сарапшылық. Индекс — платформаның меншікті көрсеткіші, ресми мемлекеттік немесе халықаралық индекс емес. Жер бойынша үш құраушы желі жоқ кезде де жұмыс істеуі үшін сақталған суреттен алынады; дашбордта тірі мән бөлек көрсетіледі.",
        ru: "Веса экспертные. Индекс — собственный показатель платформы, а не официальный государственный или международный индекс. Три компоненты по суше берутся из сохранённого снимка, чтобы индекс считался и без сети; на дашборде живое значение показано отдельно.",
        en: "The weights are set by expert judgement. The index is the platform's own indicator, not an official national or international index. The three land components are read from a saved snapshot so that the index can still be computed with no network; the live value is shown separately on the dashboard.",
      },
      sourceIds: ["model"],
    },
    {
      id: "health",
      title: { kk: "Денсаулыққа әсер", ru: "Влияние на здоровье", en: "Health impact" },
      formula: "M = P · I₀ · (1 − exp(−β · ΔC))",
      body: {
        kk: "Ауа ластануына байланысты артық өлім-жітімнің WHO әдістемесі бойынша жылдық бағасы: халық саны, базалық ауру жиілігі және PM2.5 концентрациясының нормадан асуы бойынша «доза-эффект» функциясы.",
        ru: "Годовая оценка избыточной смертности, связанной с загрязнением воздуха, по методике ВОЗ: население, базовая частота заболеваний и функция «доза-эффект» по превышению концентрации PM2.5 над нормой.",
        en: "An annual estimate of the excess mortality associated with air pollution, following WHO methodology: population, baseline incidence, and an exposure-response function applied to PM2.5 concentration above the norm.",
      },
      limits: {
        kk: "Бұл — есептеу, өлшем емес. Нақты уақыттағы «өлім счётчигін» жасау ғылыми тұрғыдан дұрыс болмайды: мұндай дерек сағат сайын жиналмайды. Сондықтан платформа тек жылдық аралық көрсетеді.",
        ru: "Это расчёт, а не измерение. Делать «счётчик смертей» в реальном времени научно некорректно: такие данные не собираются по часам. Поэтому платформа показывает только годовой интервал.",
        en: "This is an estimate, not a measurement. A real-time “death counter” would be scientifically incorrect: such data are not collected hour by hour. The platform therefore shows only an annual range.",
      },
      sourceIds: ["model", "open_meteo_aq"],
    },
    {
      id: "ai",
      title: {
        kk: "AI-талдау қалай жұмыс істейді",
        ru: "Как работает AI-анализ",
        en: "How the AI analysis works",
      },
      formula: byLocale(locale, {
        kk: "дерек → детерминирленген есептеу → JSON схемасы → мәтін",
        ru: "data → детерминированный расчёт → JSON-схема → текст",
        en: "data → deterministic computation → JSON schema → text",
      }),
      body: {
        kk: "AI ешнәрсе өлшемейді. Тренд, ауытқулар, тәуекел деңгейі және болжам — бәрі жоғарыдағы формулалар бойынша детерминирленген түрде есептеледі және кілтсіз, желісіз де жұмыс істейді. Тілдік модельдің рөлі — сол сандарды адам оқитын мәтінге айналдыру, қатаң JSON схемасы арқылы. Модель сандық мәнді өзгерте алмайды.",
        ru: "AI ничего не измеряет. Тренд, отклонения, уровень риска и прогноз считаются детерминированно по формулам выше и работают без ключа и без сети. Роль языковой модели — превратить эти числа в человекочитаемый текст через строгую JSON-схему. Модель не может изменить численное значение.",
        en: "The AI measures nothing. Trend, deviations, risk level and projection are computed deterministically from the formulas above and work with no API key and no network. The role of the language model is to turn those numbers into human-readable text through a strict JSON schema. The model cannot change a numeric value.",
      },
      limits: {
        kk: "Модель қорытындысы ешқашан нақты компанияны немесе адамды айыптамайды — тек статистикалық ауытқуды сипаттайды. Дерек толық емес болса, бұл қорытындыда міндетті түрде айтылады.",
        ru: "Вывод модели никогда не обвиняет конкретную компанию или человека — только описывает статистическое отклонение. Если данные неполны, это обязательно указывается в выводе.",
        en: "The model's conclusion never accuses a specific company or person — it only describes a statistical deviation. If the data are incomplete, the conclusion says so explicitly.",
      },
      sourceIds: ["model"],
    },
  ];

  const components = ecoIndexComponents();

  return (
    <>
      <main className="mx-auto max-w-[1100px] px-5 pt-32 pb-20 md:px-12 md:pt-40">
        <Reveal>
          <RevealItem>
            <Label>{t.common.appName}</Label>
          </RevealItem>
          <RevealItem>
            <Display as="h1" className="mt-5">
              {t.methodology.title}
            </Display>
          </RevealItem>
          <RevealItem>
            <Lede className="mt-6 max-w-2xl">{t.methodology.intro}</Lede>
          </RevealItem>
        </Reveal>

        {/* formulas */}
        <div className="mt-16 space-y-4">
          {BLOCKS.map((block) => (
            <div key={block.id} className="border-rule rounded-lg border p-6 md:p-8">
              <div className="flex items-start gap-3">
                <Sigma className="text-accent mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold tracking-tight md:text-xl">
                    {block.title[locale]}
                  </h2>

                  <pre className="border-rule bg-tint text-ink mt-4 overflow-x-auto rounded-md border px-4 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre">
                    {block.formula}
                  </pre>

                  <p className="text-ink-2 mt-4 text-sm leading-relaxed">{block.body[locale]}</p>

                  <div className="border-warn/30 bg-warn/[0.05] mt-4 rounded-lg border-l-2 px-3.5 py-2.5">
                    <div className="text-warn/80 mb-1 text-[10px] font-medium tracking-[0.14em] uppercase">
                      {t.methodology.limitations}
                    </div>
                    <p className="text-ink-2 text-[12px] leading-relaxed">{block.limits[locale]}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {block.sourceIds.map((id) => {
                      const src = sourcesFile.sources.find((s) => s.id === id);
                      if (!src) return null;
                      const meta = STATUS_META[src.status as keyof typeof STATUS_META] ?? STATUS_META.semi;
                      return (
                        <a
                          key={id}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-ink-2 hover:text-ink inline-flex items-center gap-1.5 rounded-full border border-rule bg-tint px-2.5 py-1 text-[11px] transition-colors"
                        >
                          <span className={cn("size-1.5 rounded-full", meta.dot)} />
                          {src.name}
                          <ExternalLink className="size-3 opacity-50" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* eco index weights */}
        <div className="border-rule rounded-lg border mt-4 p-6 md:p-8">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t.index.components}
          </h2>
          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="text-ink-2 border-b border-rule text-left text-[11px] tracking-wide uppercase">
                <th className="pb-2 font-medium">
                  {byLocale(locale, { kk: "Құраушы", ru: "Компонента", en: "Component" })}
                </th>
                <th className="pb-2 text-right font-medium">
                  {byLocale(locale, { kk: "Салмақ", ru: "Вес", en: "Weight" })}
                </th>
                <th className="pb-2 text-right font-medium">
                  {byLocale(locale, { kk: "Мәні", ru: "Значение", en: "Value" })}
                </th>
              </tr>
            </thead>
            <tbody>
              {components.map((c) => (
                <tr key={c.id} className="border-b border-rule last:border-0">
                  <td className="text-ink-2 py-2.5">{COMPONENT_LABELS[c.id]?.[locale] ?? c.id}</td>
                  <td className="text-ink-2 tabular py-2.5 text-right">
                    {Math.round(c.weight * 100)}%
                  </td>
                  <td className="text-ink tabular py-2.5 text-right font-medium">{c.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* coastline sector slopes */}
        <div className="border-rule rounded-lg border mt-4 p-6 md:p-8">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {t.methodology.coastlineModel}
          </h2>
          <p className="text-ink-2 mt-2 text-[12px] leading-relaxed">
            {pick(coastlineIndex, "method", locale)}
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-ink-2 border-b border-rule text-left text-[11px] tracking-wide uppercase">
                  <th className="pb-2 font-medium">
                    {byLocale(locale, { kk: "Сектор", ru: "Сектор", en: "Sector" })}
                  </th>
                  <th className="pb-2 text-right font-medium">tan(β)</th>
                  <th className="pb-2 text-right font-medium">
                    {byLocale(locale, {
                      kk: "1 см деңгей →",
                      ru: "1 см уровня →",
                      en: "1 cm of level →",
                    })}
                  </th>
                </tr>
              </thead>
              <tbody>
                {coastlineIndex.sectors.map((s) => (
                  <tr key={s.id} className="border-b border-rule last:border-0">
                    <td className="text-ink-2 py-2.5">{pick(s, "name", locale)}</td>
                    <td className="text-ink-2 tabular py-2.5 text-right">{s.slope}</td>
                    <td className="text-ink tabular py-2.5 text-right font-medium">
                      {formatFixed(0.01 / s.slope, locale, 1)}{" "}
                      {byLocale(locale, { kk: "м", ru: "м", en: "m" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* source registry */}
        <div className="mt-16">
          <Display className="text-2xl md:text-3xl">{t.methodology.dataRegistry}</Display>
          <p className="text-ink-2 mt-3 max-w-2xl text-sm leading-relaxed">
            {byLocale(locale, {
              kk: "Сайттағы әр көрсеткіш осы тізілімдегі жазбаға байланған. Статус деректің машиналық оқылатындығы мен тексерілетіндігін көрсетеді.",
              ru: "Каждый показатель на сайте привязан к записи из этого реестра. Статус отражает, насколько данные машиночитаемы и проверяемы.",
              en: "Every indicator on the site is tied to a record in this registry. The status reflects how machine-readable and verifiable the data are.",
            })}
          </p>

          <div className="mt-6 space-y-2">
            {sourcesFile.sources.map((src) => {
              const meta = STATUS_META[src.status as keyof typeof STATUS_META] ?? STATUS_META.semi;
              const note = pick(src, "note", locale);
              return (
                <div key={src.id} className="border-rule rounded-lg border px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className={cn("inline-flex items-center gap-1.5 text-[11px]", meta.cls)}>
                      <span className={cn("size-1.5 rounded-full", meta.dot)} />
                      {src.status.toUpperCase()}
                    </span>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-ink hover:text-accent inline-flex items-center gap-1.5 text-sm transition-colors"
                    >
                      {src.name}
                      <ExternalLink className="size-3 opacity-50" />
                    </a>
                    <span className="text-ink-2 ml-auto text-[11px]">
                      {src.license} · {src.coverage_years}
                    </span>
                  </div>
                  {note && <p className="text-ink-2 mt-1.5 text-[11px] leading-snug">{note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
