import type { Lesson } from "./types";

/**
 * The curriculum. Six lessons, one per track, each ending in a comprehension
 * check drawn from the shared question bank.
 *
 * Every `stat` card names a metric id rather than a number, so the figures are
 * pulled from the datasets at render time (see `metrics.ts`), and every lesson
 * carries the source ids its claims rest on.
 */
export const LESSONS: Lesson[] = [
  {
    id: "why-falling",
    track: "sea",
    minutes: 4,
    sourceIds: ["grealm", "grid_arendal"],
    title: {
      kk: "Теңіз неге кетіп барады",
      ru: "Почему море уходит",
      en: "Why the sea is leaving",
    },
    hook: {
      kk: "Каспийдің тағдыры одан мыңдаған шақырым жоғарыда шешіледі.",
      ru: "Судьба Каспия решается за тысячи километров от него.",
      en: "The Caspian's fate is decided thousands of kilometres upstream.",
    },
    cards: [
      {
        kind: "text",
        title: { kk: "Жабық су айдыны", ru: "Замкнутый водоём", en: "A closed basin" },
        body: {
          kk: "Каспий — мұхитпен байланысы жоқ, жер шарындағы ең үлкен тұйық су айдыны. Одан су ағып шықпайды: кіріс — өзендер мен жауын-шашын, шығыс — тек булану. Сондықтан деңгей осы екі шаманың айырмасы ретінде тікелей есептеледі, ал теңіз климаттың өлшеуішіне айналады.",
          ru: "Каспий — крупнейший на планете замкнутый водоём, не связанный с океаном. Вода из него не вытекает: приход — реки и осадки, расход — только испарение. Поэтому уровень напрямую равен разнице этих величин, а море работает как измерительный прибор климата.",
          en: "The Caspian is the largest enclosed body of water on Earth, with no connection to the ocean. Nothing flows out of it: the input is rivers and rainfall, the output is evaporation alone. The level is therefore the direct difference between the two, which turns the sea into an instrument for measuring climate.",
        },
      },
      {
        kind: "stat",
        metric: "volgaShare",
        label: { kk: "Еділдің ағындағы үлесі, %", ru: "Доля Волги в стоке, %", en: "Volga share of inflow, %" },
        plain: {
          kk: "Бір өзен бүкіл тұщы су кірісінің басым бөлігін береді. Еділ бассейніндегі бөгендер мен су алу тікелей Каспий деңгейіне шығады.",
          ru: "Одна река даёт основную часть всего пресного притока. Водохранилища и водозабор в бассейне Волги напрямую отражаются на уровне Каспия.",
          en: "A single river supplies most of the fresh inflow. Reservoirs and abstraction in the Volga basin feed straight through to the Caspian's level.",
        },
      },
      {
        kind: "chart",
        chart: "seaLevel",
        caption: {
          kk: "1992 жылдан бергі деңгей. 2020–2024 жылдары төмендеу қарқыны үш есе өсті.",
          ru: "Уровень с 1992 года. В 2020–2024 годах скорость падения выросла втрое.",
          en: "The level since 1992. Between 2020 and 2024 the rate of decline tripled.",
        },
      },
      {
        kind: "stat",
        metric: "seaLevelDrop",
        tone: "bad",
        label: { kk: "1992 жылдан бергі төмендеу, м", ru: "Падение с 1992 года, м", en: "Fall since 1992, m" },
        plain: {
          kk: "Бұл қатар альтиметрия жарияланымдарынан қалпына келтірілген, өйткені G-REALM порталы қолжетімсіз болды. Сондықтан ол «нақты дерек» емес, «жарияланымнан енгізілген» деп белгіленген.",
          ru: "Ряд восстановлен по публикациям альтиметрии, поскольку портал G-REALM был недоступен. Поэтому он помечен не как «реальные данные», а как «введено из публикации».",
          en: "This series was reconstructed from published altimetry because the G-REALM portal was unreachable. That is why it is badged 'entered from a publication' rather than 'measured data'.",
        },
      },
      { kind: "check", question: "volga-share" },
      { kind: "check", question: "level-drop" },
    ],
  },
  {
    id: "shore-retreat",
    track: "coast",
    minutes: 4,
    sourceIds: ["model", "grealm"],
    title: {
      kk: "Бір сантиметр неге ондаған метр береді",
      ru: "Почему сантиметр даёт десятки метров",
      en: "Why one centimetre yields tens of metres",
    },
    hook: {
      kk: "Жайпақ жағада тік өзгеріс көлденең апатқа айналады.",
      ru: "На пологом берегу вертикальное изменение превращается в горизонтальную катастрофу.",
      en: "On a flat shore a vertical change becomes a horizontal catastrophe.",
    },
    cards: [
      {
        kind: "text",
        title: { kk: "Қарапайым геометрия", ru: "Простая геометрия", en: "Simple geometry" },
        body: {
          kk: "Су шегінген қашықтық түптің еңісіне тәуелді: Δx = Δh / tan(β). Солтүстік Каспийдің еңісі 0,00025-ке жуық — яғни деңгей бір сантиметрге түскенде жағалау сызығы ондаған метрге жылжиды. Тереңдігі көп оңтүстікте дәл сол сантиметр әрең байқалады.",
          ru: "Расстояние отступания зависит от уклона дна: Δx = Δh / tan(β). Уклон северного Каспия около 0,00025 — то есть при падении уровня на сантиметр береговая линия смещается на десятки метров. На глубоком юге тот же сантиметр почти незаметен.",
          en: "How far the water withdraws depends on the seabed slope: Δx = Δh / tan(β). The northern Caspian's slope is around 0.00025, so a one-centimetre drop moves the shoreline by tens of metres. In the deep south the same centimetre is barely visible.",
        },
      },
      {
        kind: "compare",
        fromYear: 1992,
        toYear: 2025,
        caption: {
          kk: "Слайдерді жылжытыңыз: көк — таңдалған жылдағы су, сұр — 1992 жылғы тірек сызық.",
          ru: "Потяните слайдер: синим — вода в выбранный год, серым — опорная линия 1992 года.",
          en: "Drag the slider: blue is the water in the selected year, grey is the 1992 baseline.",
        },
      },
      {
        kind: "stat",
        metric: "areaLost",
        tone: "warn",
        label: { kk: "Жоғалған айдын, км²", ru: "Потеряно акватории, км²", en: "Water area lost, km²" },
        plain: {
          kk: "1992 жылдан бері жоғалған су айдыны — шамамен Қырым көлеміндей аумақ.",
          ru: "Потерянная с 1992 года акватория — примерно площадь Крыма.",
          en: "The water surface lost since 1992 is roughly the area of Crimea.",
        },
      },
      {
        kind: "text",
        title: { kk: "Бұл — модель", ru: "Это модель", en: "This is a model" },
        body: {
          kk: "Картадағы жағалау сызығы — спутниктік бақылау емес, есептеу. Еңіс секторлар бойынша батиметрия әдебиетінен алынған, сызық ішкі нормаль бойымен жылжытылады. Платформа мұны жасырмайды: әр жерде «модельдік баға» деген белгі тұр. Егер еңіс қате болса, нәтиже де қате.",
          ru: "Береговая линия на карте — не спутниковое наблюдение, а расчёт. Уклон взят по секторам из литературы по батиметрии, линия смещается по внутренней нормали. Платформа этого не скрывает: везде стоит пометка «модельная оценка». Если уклон неверен, ошибётся и результат.",
          en: "The shoreline on the map is a calculation, not a satellite observation. The slope comes per sector from the bathymetric literature, and the line is shifted along the inward normal. The platform does not hide this — the 'model estimate' badge is on every instance. If the slope is wrong, the answer is wrong.",
        },
      },
      { kind: "check", question: "coastline-model" },
    ],
  },
  {
    id: "what-pollutes",
    track: "pollution",
    minutes: 5,
    sourceIds: ["grid_arendal", "koshkar_pub", "model"],
    title: {
      kk: "Теңізді не ластайды",
      ru: "Что загрязняет море",
      en: "What pollutes the sea",
    },
    hook: {
      kk: "Ең үлкен қауіп теңізде емес — одан бес шақырым жерде, құрлықта.",
      ru: "Самая большая опасность не в море, а в пяти километрах от него, на суше.",
      en: "The greatest hazard is not in the sea but five kilometres inland.",
    },
    cards: [
      {
        kind: "chart",
        chart: "pollutionStructure",
        caption: {
          kk: "Ластану құрылымы. Мұнай өнімдері басым, бірақ бұл — жарияланымдардан алынған жиынтық баға.",
          ru: "Структура загрязнения. Преобладают нефтепродукты, но это сводная оценка из публикаций.",
          en: "The structure of pollution. Oil products dominate, but this is a composite estimate from the literature.",
        },
      },
      {
        kind: "stat",
        metric: "koshkarWaste",
        tone: "bad",
        label: { kk: "Қошқар-Ата: қалдық, млн т", ru: "Кошкар-Ата: отходы, млн т", en: "Koshkar-Ata: waste, Mt" },
        plain: {
          kk: "Оның 52 млн тоннасы әлсіз радиоактивті. Қойма 1965 жылы ашылып, 2009 жылы жабылды, бірақ 77 км² құрғаған беттен көтерілетін улы шаң басты қауіп болып қалады.",
          ru: "Из них 52 млн тонн слабо радиоактивных. Хранилище открыто в 1965-м и закрыто в 2009-м, но токсичная пыль с высохшей поверхности площадью 77 км² остаётся главным риском.",
          en: "Of which 52 million tonnes are low-level radioactive. The pond opened in 1965 and closed in 2009, but toxic dust blown off its 77 km² dried surface remains the main hazard.",
        },
      },
      {
        kind: "map",
        module: "pollution",
        layers: ["factories", "koshkar-ata", "air-quality"],
        prompt: {
          kk: "Картаны ашып, зауыттарды және Қошқар-Атаны Ақтауға қатысты қараңыз.",
          ru: "Откройте карту и посмотрите на заводы и Кошкар-Ата относительно Актау.",
          en: "Open the map and look at the facilities and Koshkar-Ata relative to Aktau.",
        },
      },
      {
        kind: "text",
        title: {
          kk: "Есептелген нәрсені өлшенгеннен ажырату",
          ru: "Отличать расчётное от измеренного",
          en: "Telling the computed from the measured",
        },
        body: {
          kk: "Ауа сапасы — нақты өлшеу (Open-Meteo/CAMS, live). Ал денсаулыққа әсер — ДДҰ әдістемесі бойынша модельдік баға, аралығы кең. Шлейф конусы да — өлшенген желден есептелген ықтимал сектор, концентрациясы тек салыстырмалы: шығарынды қарқыны белгісіз болғандықтан, платформада бірде-бір мкг/м³ саны жоқ.",
          ru: "Качество воздуха — реальное измерение (Open-Meteo/CAMS, live). А влияние на здоровье — модельная оценка по методике ВОЗ с широким диапазоном. Конус шлейфа тоже расчётный: это вероятный сектор из измеренного ветра, концентрация только относительная — мощность выброса неизвестна, поэтому на платформе нет ни одного значения в мкг/м³.",
          en: "Air quality is a real measurement (Open-Meteo/CAMS, live). The health figure is a model estimate following WHO methodology, with a wide range. The plume cone is computed too — a probable sector from measured wind, with relative concentration only: the emission rate is unknown, so not a single µg/m³ value appears anywhere on the platform.",
        },
      },
      { kind: "check", question: "koshkar-scale" },
      { kind: "check", question: "plume-relative" },
    ],
  },
  {
    id: "life-vanishing",
    track: "life",
    minutes: 5,
    sourceIds: ["iucn_seal", "cites_fao"],
    title: {
      kk: "Санай алмайтынымызды қалай айту керек",
      ru: "Как говорить о том, что мы не умеем сосчитать",
      en: "How to talk about what we cannot count",
    },
    hook: {
      kk: "Итбалық саны туралы дереккөздер төрт есе алшақтайды. Бұл да — дерек.",
      ru: "Оценки численности тюленя расходятся вчетверо. Это тоже данные.",
      en: "Estimates of the seal population differ fourfold. That, too, is data.",
    },
    cards: [
      {
        kind: "stat",
        metric: "sealDeclinePercent",
        tone: "bad",
        label: { kk: "Итбалық санының азаюы, %", ru: "Сокращение популяции тюленя, %", en: "Seal population decline, %" },
        plain: {
          kk: "ХХ ғасыр басымен салыстырғанда. IUCN 2008 жылдан бері Endangered мәртебесін берген, 2020 жылдан ҚР Қызыл кітабында.",
          ru: "По сравнению с началом XX века. IUCN присвоил статус Endangered в 2008 году, с 2020-го вид в Красной книге РК.",
          en: "Compared with the start of the 20th century. IUCN listed the species as Endangered in 2008; it entered Kazakhstan's Red Book in 2020.",
        },
      },
      {
        kind: "text",
        title: { kk: "Неге аралық", ru: "Почему диапазон", en: "Why a range" },
        body: {
          kk: "Жарияланған бағалаулар 50 мыңнан 300 мыңға дейін жетеді — төрт еседен астам айырма. Әдістемелер де, жылдар да әртүрлі. Осы жағдайда бір санды таңдау — білмейтінімізді жасыру. Платформа аралықты көрсетеді, өйткені бұл білімнің нақты күйін дәл жеткізеді.",
          ru: "Опубликованные оценки лежат от 50 до 300 тысяч — разброс больше чем вчетверо. Различаются и методики, и годы. Выбрать одно число в такой ситуации значит скрыть незнание. Платформа показывает диапазон, потому что он точнее передаёт реальное состояние знаний.",
          en: "Published estimates run from 50,000 to 300,000 — a spread of more than fourfold, across different methods and different years. Choosing one number here would hide what is not known. The platform shows the range because it describes the state of knowledge more accurately.",
        },
      },
      {
        kind: "chart",
        chart: "sturgeonCatch",
        caption: {
          kk: "Ресми бекіре аулауы: 1977 жылғы 30 000 тоннадан 2020 жылы 120 тоннаға дейін.",
          ru: "Официальный вылов осетровых: с 30 000 тонн в 1977 году до 120 тонн в 2020-м.",
          en: "The official sturgeon catch: from 30,000 tonnes in 1977 to 120 tonnes in 2020.",
        },
      },
      {
        kind: "text",
        title: { kk: "Көрінбейтін алым", ru: "Невидимое изъятие", en: "The invisible removal" },
        body: {
          kk: "Бұл график заңды аулауды ғана көрсетеді. Заңсыз аулау (IUU) 4–10 есе жоғары деп бағаланады, сондықтан нақты алым бірнеше есе көп. Заманауи қор бағалау әдістері қолданылмайды. Графикті «аулау азайды» деп емес, «есепке алынатын аулау азайды» деп оқыған дұрыс.",
          ru: "Этот график показывает только законный вылов. Незаконный (IUU) оценивается в 4–10 раз выше, поэтому реальное изъятие в разы больше. Современные методы оценки запаса не применяются. График правильнее читать не как «вылов упал», а как «упал учитываемый вылов».",
          en: "This chart shows the legal catch only. Illegal (IUU) fishing is estimated at 4–10 times higher, so the real removal is several times larger. Modern stock assessment methods are not applied. The chart is better read as 'the recorded catch fell' than as 'the catch fell'.",
        },
      },
      { kind: "check", question: "seal-range" },
      { kind: "check", question: "sturgeon-iuu" },
    ],
  },
  {
    id: "oil-and-water",
    track: "resources",
    minutes: 4,
    sourceIds: ["industry_reports", "grid_arendal"],
    title: {
      kk: "Мұнай, су және таңдау",
      ru: "Нефть, вода и выбор",
      en: "Oil, water and the choice",
    },
    hook: {
      kk: "Аймақтың байлығы да, ең үлкен экологиялық жүктемесі де бір көзден.",
      ru: "И богатство региона, и его главная экологическая нагрузка — из одного источника.",
      en: "The region's wealth and its heaviest environmental load come from the same source.",
    },
    cards: [
      {
        kind: "stat",
        metric: "oilReserves",
        label: { kk: "Мұнай қоры, млрд баррель", ru: "Запасы нефти, млрд баррелей", en: "Oil reserves, bn barrels" },
        plain: {
          kk: "Каспий бассейні бойынша баға. Иран мен Түрікменстан деректері іс жүзінде жабық, олардың сандары салалық шолулардан алынған — дәлдігі төмен.",
          ru: "Оценка по Каспийскому бассейну. Данные Ирана и Туркменистана фактически закрыты, их цифры взяты из отраслевых обзоров — точность ниже.",
          en: "An estimate for the Caspian basin. Iranian and Turkmen figures are effectively closed; those numbers come from industry reviews and are less precise.",
        },
      },
      {
        kind: "stat",
        metric: "oilDepletion",
        tone: "warn",
        label: { kk: "Қазіргі қарқынмен, жыл", ru: "При текущем темпе, лет", en: "At the current rate, years" },
        plain: {
          kk: "Қалған қор / орташа жылдық өндіру. Жаңа кен орындары мен технология өзгерісі ескерілмейді — бұл болжам емес, ағымдағы қарқынның иллюстрациясы.",
          ru: "Остаток запасов / средняя годовая добыча. Новые месторождения и смена технологий не учитываются — это не прогноз, а иллюстрация текущего темпа.",
          en: "Remaining reserves ÷ mean annual production. New fields and changing technology are not accounted for — this illustrates the present rate rather than forecasting an end date.",
        },
      },
      {
        kind: "map",
        module: "resources",
        layers: ["fields", "cities"],
        prompt: {
          kk: "Кен орындарын ашып, олардың итбалық мекендеу орындарына қаншалықты жақын екенін қараңыз.",
          ru: "Откройте месторождения и посмотрите, насколько близко они к местам обитания тюленя.",
          en: "Open the fields layer and see how close they sit to the seal habitats.",
        },
      },
      { kind: "check", question: "depletion-meaning" },
    ],
  },
  {
    id: "who-is-watching",
    track: "future",
    minutes: 4,
    sourceIds: ["model", "jrc_gsw"],
    title: {
      kk: "Теңізді кім бақылайды",
      ru: "Кто наблюдает за морем",
      en: "Who is watching the sea",
    },
    hook: {
      kk: "Теңіз ортақ, ал оны көру мүмкіндігі әркелкі.",
      ru: "Море общее, а возможность его видеть — разная.",
      en: "The sea is shared. The ability to see it is not.",
    },
    cards: [
      {
        kind: "text",
        title: { kk: "Дерек теңсіздігі", ru: "Неравенство данных", en: "The data gap" },
        body: {
          kk: "Бес жағалау елі бір теңізді бөліседі, бірақ ашық машиналық оқылатын экологиялық дерек бойынша олардың арасы жер мен көктей: Түрікменстан 9 балл, Иран 12, Әзербайжан 32, Ресей 45, Қазақстан 68. Бұл — техникалық мәселе емес, экологиялық проблеманың өзі: ортақ теңізді ортақ бақылаусыз басқару мүмкін емес.",
          ru: "Пять прибрежных стран делят одно море, но по открытым машиночитаемым экологическим данным различаются кардинально: Туркменистан 9 баллов, Иран 12, Азербайджан 32, Россия 45, Казахстан 68. Это не техническая деталь, а сама экологическая проблема: общим морем нельзя управлять без общего наблюдения.",
          en: "Five coastal states share one sea, yet they differ enormously in open, machine-readable environmental data: Turkmenistan scores 9, Iran 12, Azerbaijan 32, Russia 45, Kazakhstan 68. This is not a technicality but the environmental problem itself: a shared sea cannot be managed without shared observation.",
        },
      },
      {
        kind: "stat",
        metric: "openDataShare",
        label: {
          kk: "Ашық дерек, орташа балл",
          ru: "Открытость данных, средний балл",
          en: "Data openness, mean score",
        },
        plain: {
          kk: "Бес ел бойынша орташа. Мұны платформаның өз бағасы деп оқыңыз — ресми халықаралық индекс емес.",
          ru: "Среднее по пяти странам. Читайте это как собственную оценку платформы, а не как официальный международный индекс.",
          en: "The mean across the five states. Read it as this platform's own indicator, not an official international index.",
        },
      },
      {
        kind: "text",
        title: { kk: "Спутник алшақтықты жабады", ru: "Спутник закрывает разрыв", en: "Satellites close the gap" },
        body: {
          kk: "JRC Global Surface Water, Sentinel-5P, Sentinel-1, FIRMS және ERA5 бүкіл теңізді біркелкі қамтиды және ешбір елдің рұқсатына тәуелді емес. Дәл сондықтан ашық спутниктік дерек — қазіргі жағдайда ортақ бақылаудың жалғыз шынайы негізі.",
          ru: "JRC Global Surface Water, Sentinel-5P, Sentinel-1, FIRMS и ERA5 покрывают всё море равномерно и не зависят от разрешения какой-либо страны. Именно поэтому открытые спутниковые данные — единственная реальная основа общего наблюдения сегодня.",
          en: "JRC Global Surface Water, Sentinel-5P, Sentinel-1, FIRMS and ERA5 cover the whole sea evenly and depend on no country's permission. That is precisely why open satellite data is the only realistic basis for shared observation today.",
        },
      },
      { kind: "check", question: "data-gap" },
    ],
  },
];

export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));

/** Question ids used as in-lesson checks, in lesson order. */
export function checksOf(lesson: Lesson): string[] {
  return lesson.cards.filter((c) => c.kind === "check").map((c) => c.question);
}
