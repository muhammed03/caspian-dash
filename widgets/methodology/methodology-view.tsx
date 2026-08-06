"use client";

import { ExternalLink, Sigma, ShieldCheck, FileText, FlaskConical } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useLocale, useT } from "@/shared/lib/i18n/client";

import { Display, Label, Lede, Plain, Reveal, RevealItem, SectionMark } from "@/shared/ui/primitives";
import { RISK_THRESHOLDS } from "@/shared/lib/analyze";
import { ecoIndexComponents } from "@/entities/ai-insight/compute";
import { SiteFooter } from "@/widgets/site-footer/site-footer";

import sourcesFile from "@/data/sources.json";
import coastlineIndex from "@/data/coastline-index.json";
import seaLevel from "@/data/sea-level.json";

type Block = {
  id: string;
  title: { kk: string; ru: string };
  formula: string;
  body: { kk: string; ru: string };
  limits: { kk: string; ru: string };
  sourceIds: string[];
};

const COMPONENT_LABELS: Record<string, { kk: string; ru: string }> = {
  water: { kk: "Су айдыны", ru: "Акватория" },
  purity: { kk: "Су тазалығы", ru: "Чистота воды" },
  biodiversity: { kk: "Балық қоры", ru: "Рыбные запасы" },
  seal: { kk: "Итбалық", ru: "Тюлень" },
  transparency: { kk: "Дерек ашықтығы", ru: "Открытость данных" },
};

const STATUS_META = {
  real: { Icon: ShieldCheck, cls: "text-good", dot: "bg-good" },
  semi: { Icon: FileText, cls: "text-warn", dot: "bg-warn" },
  mock: { Icon: FlaskConical, cls: "text-bad", dot: "bg-bad" },
} as const;

export function MethodologyView() {
  const t = useT();
  const locale = useLocale();
  const L = locale === "ru" ? "ru" : "kk";

  const ref = seaLevel.reference;

  const BLOCKS: Block[] = [
    {
      id: "level",
      title: { kk: "Су көлемі мен ауданы", ru: "Объём и площадь воды" },
      formula: `S(h) = ${ref.area_km2.toLocaleString("ru-RU")} + ${ref.d_area_per_m.toLocaleString(
        "ru-RU"
      )} · (h − (${ref.level_m}))\nV(h) = ${ref.volume_km3.toLocaleString(
        "ru-RU"
      )} + ½ · (S₀ + S(h)) · (h − (${ref.level_m})) · 10⁻³`,
      body: {
        kk: "Ауданы мен көлемі деңгейден гипсометриялық коэффициент арқылы есептеледі: солтүстіктегі таяз қайраң басым болғандықтан, әр метр деңгей шамамен 12 500 км² айдын береді. Тірек нүкте — −27,0 м кезіндегі 371 000 км² және 78 200 км³.",
        ru: "Площадь и объём считаются из уровня через гипсометрический коэффициент: из-за преобладания мелководного северного шельфа каждый метр уровня даёт около 12 500 км² акватории. Опорная точка — 371 000 км² и 78 200 км³ при −27,0 м.",
      },
      limits: {
        kk: "Коэффициент бүкіл диапазонда тұрақты деп алынған. Нақты гипсометрия сызықты емес, сондықтан шеткі мәндерде қате өседі.",
        ru: "Коэффициент принят постоянным на всём диапазоне. Реальная гипсометрия нелинейна, поэтому на краях диапазона ошибка растёт.",
      },
      sourceIds: ["grealm", "ras_ocean"],
    },
    {
      id: "forecast",
      title: { kk: "Деңгей болжамы", ru: "Прогноз уровня" },
      formula:
        `h(t) = a + b·t   (${L === "ru" ? "МНК, с 2015 года" : "МНК, 2015 жылдан"})\nCI₉₅ = h(t) ± 1,96 · SE\nSE = √( Σ(hᵢ − ĥᵢ)² / (n − 2) )`,
      body: {
        kk: "Екі модель қатар есептеледі: ең кіші квадраттар әдісі бойынша сызықтық регрессия және деңгейдің тірек мәннен ауытқуы бойынша логарифмдік түрде салынған экспоненциалды модель. Қиылысу нүктесі 2015 жыл — дәл сол кезден төмендеу қарқыны күрт өсті. Графикте екеуі де көрсетіледі, өйткені олардың айырмашылығы белгісіздіктің шынайы шамасы.",
        ru: "Считаются две модели параллельно: линейная регрессия методом наименьших квадратов и экспоненциальная, построенная логарифмически по отклонению уровня от опорного значения. Точка отсечения — 2015 год, именно с него скорость падения резко выросла. На графике показаны обе, потому что расхождение между ними и есть честная величина неопределённости.",
      },
      limits: {
        kk: "Регрессия климаттық сценарийлерді, Еділ ағынының реттелуін және Қара-Боғаз-Гөлге ағуды ескермейді. 10 жылдан ұзақ көкжиекте болжам сенімсіз.",
        ru: "Регрессия не учитывает климатические сценарии, зарегулирование стока Волги и переток в Кара-Богаз-Гол. На горизонте свыше 10 лет прогноз ненадёжен.",
      },
      sourceIds: ["grealm", "grid_arendal"],
    },
    {
      id: "coastline",
      title: { kk: "Жағалау сызығының моделі", ru: "Модель береговой линии" },
      formula: "Δx = Δh / tan(β)",
      body: {
        kk: "Жағалаудың көлденең шегінуі деңгейдің төмендеуін жергілікті түп еңісіне бөлу арқылы алынады — жағалау геоморфологиясындағы стандартты тәсіл. Тірек сызық — Natural Earth жағалауы (2015 жылғы деңгейге сәйкестендірілген), әр төбе ішкі нормаль бойымен жылжытылады. Еңіс секторлар бойынша беріледі.",
        ru: "Горизонтальное отступание берега получается делением падения уровня на локальный уклон дна — стандартный приём береговой геоморфологии. Опорная линия — береговая линия Natural Earth (привязана к уровню 2015 года), каждая вершина смещается по внутренней нормали. Уклон задаётся посекторно.",
      },
      limits: {
        kk: "Бұл — МОДЕЛЬ, спутниктік бақылау емес. Еңіс сектор ішінде тұрақты деп алынған, сгонды-нагонды құбылыстар мен шөгінді тасымалы ескерілмейді. Нақты өлшеу үшін Sentinel-2 бойынша NDWI маскасы қажет — ол жол scripts/ ішінде дайын.",
        ru: "Это МОДЕЛЬ, а не спутниковое наблюдение. Уклон принят постоянным внутри сектора, сгонно-нагонные явления и перенос наносов не учитываются. Для фактического измерения нужна маска NDWI по Sentinel-2 — этот путь заготовлен в scripts/.",
      },
      sourceIds: ["model", "natural_earth", "jrc_gsw"],
    },
    {
      id: "plume",
      title: { kk: "Шлейф таралуы (Гаусс моделі)", ru: "Рассеивание шлейфа (модель Гаусса)" },
      formula:
        "σy(x) = k·x / √(1 + 0,0001·x)        k: A .22 B .16 C .11 D .08 E .06 F .04\n" +
        "полуугол = arctg(2·σy(L)/L) + σ_напр   σ_напр — круговое СКО за 12 ч\n" +
        "C(x,y) ∝ exp(−y²/2σy²) / (π·σy·σz·u)   относительная, 0…1",
      body: {
        kk: "Шлейфтің ені тек желмен емес, Pasquill орнықтылық класымен анықталады: түнгі орнықты қабатта (F) шлейф жіңішке әрі алысқа жетеді, күндізгі орнықсызда (A/B) кең жайылып, тез сұйылады — айырма үш еседен асады. Класс жел жылдамдығы мен күн радиациясы (күндіз) немесе бұлттылық (түнде) бойынша есептеледі. Шлейф желдің КЕЛГЕН бағытына емес, ҚАРАМА-ҚАРСЫ жаққа кетеді: toBearing = fromBearing + 180°.",
        ru: "Ширина шлейфа определяется не только ветром, но классом устойчивости Пасквилла: в ночном устойчивом слое (F) шлейф узкий и уходит далеко, в дневном неустойчивом (A/B) он широкий и быстро разбавляется — разница больше чем втрое. Класс считается по скорости ветра и солнечной радиации (днём) или облачности (ночью). Шлейф идёт в сторону, ПРОТИВОПОЛОЖНУЮ направлению ветра: toBearing = fromBearing + 180°.",
      },
      limits: {
        kk: "Құбыр биіктігі мен шлейфтің көтерілуі ескерілмейді. Шығарынды қарқыны (г/с) белгісіз, сондықтан концентрация тек САЛЫСТЫРМАЛЫ — µg/m³ ешқашан жазылмайды. Жер бедері мен ғимараттар ескерілмейді (ашық дала жуықтауы). Нәтиже — ықтимал таралу секторы, өлшенген ластану өрісі емес: тексеруге негіз, заңдық факт емес. Жел деректері болмаса анимация мүлдем көрсетілмейді.",
        ru: "Высота трубы и подъём шлейфа не учитываются. Интенсивность выброса (г/с) неизвестна, поэтому концентрация только ОТНОСИТЕЛЬНАЯ — µg/m³ нигде не приводится. Рельеф и застройка не учитываются (приближение открытой местности). Результат — вероятный сектор переноса, а не измеренное поле загрязнения: основание для проверки, а не юридический факт. Без данных о ветре анимация не показывается вовсе.",
      },
      sourceIds: ["open_meteo", "open_meteo_aq", "osm"],
    },
    {
      id: "risk",
      title: { kk: "Тәуекел деңгейі", ru: "Уровень риска" },
      formula: `d = |(V − N) / N| · 100%\nlow: d < ${RISK_THRESHOLDS.medium}%   medium: ${RISK_THRESHOLDS.medium}–${RISK_THRESHOLDS.high}%   high: ${RISK_THRESHOLDS.high}–${RISK_THRESHOLDS.critical}%   critical: d ≥ ${RISK_THRESHOLDS.critical}%`,
      body: {
        kk: "Әр дашбордта бірнеше көрсеткіш нормадан ауытқу пайызы бойынша бағаланады, дашборд деңгейі — солардың ішіндегі ең жоғарысы. Норма ретінде тарихи орташа мән, заңнамалық ПДК немесе платформаның ашық жарияланған шегі алынады.",
        ru: "На каждом дашборде несколько показателей оцениваются по проценту отклонения от нормы, уровень дашборда — максимум из них. В качестве нормы берётся историческое среднее, законодательная ПДК или открыто заявленный порог платформы.",
      },
      limits: {
        kk: "Шектер сарапшылық түрде белгіленген және барлық көрсеткіш үшін бірдей. Салалық нормативтер әртүрлі болуы мүмкін.",
        ru: "Пороги заданы экспертно и одинаковы для всех показателей. Отраслевые нормативы могут отличаться.",
      },
      sourceIds: ["model"],
    },
    {
      id: "eco-index",
      title: { kk: "Жиынтық экоиндекс", ru: "Сводный экоиндекс" },
      formula: "I = Σ wᵢ · sᵢ ,  Σ wᵢ = 1",
      body: {
        kk: "Бес құраушының салмақталған қосындысы. Әр құраушы 0–100 шкаласына өз тірек мәні бойынша келтіріледі: айдын ауданы 1992 жылмен, балық қоры 1977 жылғы аулаумен, итбалық ХХ ғасыр басындағы санмен салыстырылады.",
        ru: "Взвешенная сумма пяти компонент. Каждая приводится к шкале 0–100 по своему опорному значению: акватория сравнивается с 1992 годом, рыбные запасы — с выловом 1977 года, тюлень — с численностью начала XX века.",
      },
      limits: {
        kk: "Салмақтар сарапшылық. Индекс — платформаның меншікті көрсеткіші, ресми мемлекеттік немесе халықаралық индекс емес.",
        ru: "Веса экспертные. Индекс — собственный показатель платформы, а не официальный государственный или международный индекс.",
      },
      sourceIds: ["model"],
    },
    {
      id: "health",
      title: { kk: "Денсаулыққа әсер", ru: "Влияние на здоровье" },
      formula: "M = P · I₀ · (1 − exp(−β · ΔC))",
      body: {
        kk: "Ауа ластануына байланысты артық өлім-жітімнің WHO әдістемесі бойынша жылдық бағасы: халық саны, базалық ауру жиілігі және PM2.5 концентрациясының нормадан асуы бойынша «доза-эффект» функциясы.",
        ru: "Годовая оценка избыточной смертности, связанной с загрязнением воздуха, по методике ВОЗ: население, базовая частота заболеваний и функция «доза-эффект» по превышению концентрации PM2.5 над нормой.",
      },
      limits: {
        kk: "Бұл — есептеу, өлшем емес. Нақты уақыттағы «өлім счётчигін» жасау ғылыми тұрғыдан дұрыс болмайды: мұндай дерек сағат сайын жиналмайды. Сондықтан платформа тек жылдық аралық көрсетеді.",
        ru: "Это расчёт, а не измерение. Делать «счётчик смертей» в реальном времени научно некорректно: такие данные не собираются по часам. Поэтому платформа показывает только годовой интервал.",
      },
      sourceIds: ["model", "open_meteo_aq"],
    },
    {
      id: "ai",
      title: { kk: "AI-талдау қалай жұмыс істейді", ru: "Как работает AI-анализ" },
      formula: "data → детерминированный расчёт → JSON-схема → текст",
      body: {
        kk: "AI ешнәрсе өлшемейді. Тренд, ауытқулар, тәуекел деңгейі және болжам — бәрі жоғарыдағы формулалар бойынша детерминирленген түрде есептеледі және кілтсіз, желісіз де жұмыс істейді. Тілдік модельдің рөлі — сол сандарды адам оқитын мәтінге айналдыру, қатаң JSON схемасы арқылы. Модель сандық мәнді өзгерте алмайды.",
        ru: "AI ничего не измеряет. Тренд, отклонения, уровень риска и прогноз считаются детерминированно по формулам выше и работают без ключа и без сети. Роль языковой модели — превратить эти числа в человекочитаемый текст через строгую JSON-схему. Модель не может изменить численное значение.",
      },
      limits: {
        kk: "Модель қорытындысы ешқашан нақты компанияны немесе адамды айыптамайды — тек статистикалық ауытқуды сипаттайды. Дерек толық емес болса, бұл қорытындыда міндетті түрде айтылады.",
        ru: "Вывод модели никогда не обвиняет конкретную компанию или человека — только описывает статистическое отклонение. Если данные неполны, это обязательно указывается в выводе.",
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
                    {block.title[L]}
                  </h2>

                  <pre className="border-rule bg-tint text-ink mt-4 overflow-x-auto rounded-md border px-4 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre">
                    {block.formula}
                  </pre>

                  <p className="text-ink-2 mt-4 text-sm leading-relaxed">{block.body[L]}</p>

                  <div className="border-warn/30 bg-warn/[0.05] mt-4 rounded-lg border-l-2 px-3.5 py-2.5">
                    <div className="text-warn/80 mb-1 text-[10px] font-medium tracking-[0.14em] uppercase">
                      {t.methodology.limitations}
                    </div>
                    <p className="text-ink-2 text-[12px] leading-relaxed">{block.limits[L]}</p>
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
                <th className="pb-2 font-medium">{L === "ru" ? "Компонента" : "Құраушы"}</th>
                <th className="pb-2 text-right font-medium">{L === "ru" ? "Вес" : "Салмақ"}</th>
                <th className="pb-2 text-right font-medium">{L === "ru" ? "Значение" : "Мәні"}</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c) => (
                <tr key={c.id} className="border-b border-rule last:border-0">
                  <td className="text-ink-2 py-2.5">{COMPONENT_LABELS[c.id][L]}</td>
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
            {L === "ru" ? coastlineIndex.method_ru : coastlineIndex.method_kk}
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-ink-2 border-b border-rule text-left text-[11px] tracking-wide uppercase">
                  <th className="pb-2 font-medium">{L === "ru" ? "Сектор" : "Сектор"}</th>
                  <th className="pb-2 text-right font-medium">tan(β)</th>
                  <th className="pb-2 text-right font-medium">
                    {L === "ru" ? "1 см уровня →" : "1 см деңгей →"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {coastlineIndex.sectors.map((s) => (
                  <tr key={s.id} className="border-b border-rule last:border-0">
                    <td className="text-ink-2 py-2.5">{L === "ru" ? s.name_ru : s.name_kk}</td>
                    <td className="text-ink-2 tabular py-2.5 text-right">{s.slope}</td>
                    <td className="text-ink tabular py-2.5 text-right font-medium">
                      {(0.01 / s.slope).toFixed(1)} м
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
            {L === "ru"
              ? "Каждый показатель на сайте привязан к записи из этого реестра. Статус отражает, насколько данные машиночитаемы и проверяемы."
              : "Сайттағы әр көрсеткіш осы тізілімдегі жазбаға байланған. Статус деректің машиналық оқылатындығы мен тексерілетіндігін көрсетеді."}
          </p>

          <div className="mt-6 space-y-2">
            {sourcesFile.sources.map((src) => {
              const meta = STATUS_META[src.status as keyof typeof STATUS_META] ?? STATUS_META.semi;
              const note = L === "ru" ? src.note_ru : src.note_kk;
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
