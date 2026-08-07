import type { QuizQuestion } from "./types";

/**
 * The question bank.
 *
 * Two things separate these from trivia. First, every answer is checkable
 * against a dataset in this repository — the `sourceId` says which. Second,
 * the explanation is written to teach the *caveat*, not to say "correct":
 * that the shoreline is modelled, that the seal count is a disputed range,
 * that the health figure is an estimate. A reader who finishes the quiz should
 * come away more sceptical, not less.
 */
export const QUIZ: QuizQuestion[] = [
  {
    id: "volga-share",
    difficulty: "basic",
    track: "sea",
    format: "choice",
    prompt: {
      kk: "Каспийге құятын тұщы судың басым бөлігін қай өзен әкеледі?",
      ru: "Какая река приносит основную часть пресной воды в Каспий?",
      en: "Which river brings in most of the Caspian's fresh water?",
    },
    options: [
      { kk: "Жайық", ru: "Урал", en: "Ural" },
      { kk: "Еділ", ru: "Волга", en: "Volga" },
      { kk: "Кура", ru: "Кура", en: "Kura" },
      { kk: "Терек", ru: "Терек", en: "Terek" },
    ],
    answer: 1,
    explain: {
      kk: "Еділ бүкіл ағынның шамамен 80%-ын береді. Сондықтан Каспий деңгейі Еділ бассейніндегі су реттеуге тікелей тәуелді — теңіздің тағдыры негізінен одан мыңдаған шақырым жоғарыда шешіледі.",
      ru: "Волга даёт около 80% всего стока. Поэтому уровень Каспия напрямую зависит от водного регулирования в бассейне Волги — судьба моря во многом решается за тысячи километров от него.",
      en: "The Volga supplies about 80% of all inflow. That makes the Caspian's level directly dependent on water management in the Volga basin — the sea's fate is largely decided thousands of kilometres upstream.",
    },
    sourceId: "grid_arendal",
  },
  {
    id: "level-drop",
    difficulty: "basic",
    track: "sea",
    format: "metric",
    prompt: {
      kk: "1992 жылдан бері Каспий деңгейі шамамен қанша метрге төмендеді?",
      ru: "На сколько метров примерно упал уровень Каспия с 1992 года?",
      en: "By roughly how many metres has the Caspian fallen since 1992?",
    },
    options: [
      { kk: "0,5 м", ru: "0,5 м", en: "0.5 m" },
      { kk: "1,2 м", ru: "1,2 м", en: "1.2 m" },
      { kk: "2,6 м", ru: "2,6 м", en: "2.6 m" },
      { kk: "6,0 м", ru: "6,0 м", en: "6.0 m" },
    ],
    answer: 2,
    explain: {
      kk: "1992 жылы −26,75 м, 2025 жылы −29,38 м (Балтық жүйесі) — айырма 2,6 метрден асады. Бұл қатар альтиметрия бойынша қалпына келтірілген: G-REALM порталы хакатон желісінен қолжетімсіз болды, сондықтан ол «жарияланымнан енгізілген» деп белгіленген.",
      ru: "В 1992 году −26,75 м, в 2025-м −29,38 м (Балтийская система) — разница больше 2,6 метра. Ряд восстановлен по альтиметрии: портал G-REALM был недоступен из сети хакатона, поэтому он помечен как «введено из публикации».",
      en: "−26.75 m in 1992 and −29.38 m in 2025 (Baltic System) — a difference of more than 2.6 metres. The series was reconstructed from published altimetry: the G-REALM portal was unreachable from the hackathon network, which is why it carries the 'entered from a publication' badge.",
    },
    sourceId: "grealm",
  },
  {
    id: "coastline-model",
    difficulty: "applied",
    track: "coast",
    format: "scenario",
    prompt: {
      kk: "Платформадағы жағалау сызығының картасы — бұл не?",
      ru: "Карта береговой линии на платформе — это что?",
      en: "What exactly is the shoreline map on this platform?",
    },
    options: [
      {
        kk: "Әр жылға арналған спутниктік түсірілім",
        ru: "Спутниковый снимок за каждый год",
        en: "A satellite image for each year",
      },
      {
        kk: "Деңгей мен түп еңісінен есептелген модель",
        ru: "Модель, рассчитанная из уровня и уклона дна",
        en: "A model computed from the level and the seabed slope",
      },
      {
        kk: "Дала өлшемдерінің нәтижесі",
        ru: "Результат полевых измерений",
        en: "The result of field measurements",
      },
      {
        kk: "Ресми гидрографиялық карта",
        ru: "Официальная гидрографическая карта",
        en: "An official hydrographic chart",
      },
    ],
    answer: 1,
    explain: {
      kk: "Көлденең шегіну = деңгейдің төмендеуі / түп еңісі. Бұл модель, спутниктік бақылау емес, және платформа мұны әр жерде ашық айтады. Жайпақ солтүстікте бір сантиметр деңгей ондаған метр құрлық береді — сондықтан еңіс дұрыс болмаса, нәтиже де қате.",
      ru: "Горизонтальное отступание = падение уровня / уклон дна. Это модель, а не спутниковое наблюдение, и платформа говорит об этом везде. На пологом севере один сантиметр уровня даёт десятки метров суши — поэтому при неверном уклоне ошибётся и результат.",
      en: "Horizontal retreat = drop in level ÷ seabed slope. It is a model, not a satellite observation, and the platform says so everywhere. On the flat north one centimetre of level yields tens of metres of land — so a wrong slope makes a wrong answer.",
    },
    sourceId: "model",
  },
  {
    id: "seal-range",
    difficulty: "applied",
    track: "life",
    format: "scenario",
    prompt: {
      kk: "Неге платформа итбалық санын бір сан емес, аралық түрінде көрсетеді?",
      ru: "Почему платформа показывает численность тюленя диапазоном, а не одним числом?",
      en: "Why does the platform show the seal population as a range rather than one number?",
    },
    options: [
      {
        kk: "Дерек әлі жүктелмегендіктен",
        ru: "Потому что данные ещё не загружены",
        en: "Because the data has not loaded yet",
      },
      {
        kk: "Дереккөздердің бағалаулары төрт есеге дейін алшақтайтындықтан",
        ru: "Потому что оценки источников расходятся до четырёх раз",
        en: "Because the published estimates differ by up to fourfold",
      },
      {
        kk: "Аралық әдемірек көрінетіндіктен",
        ru: "Потому что диапазон выглядит красивее",
        en: "Because a range looks nicer",
      },
      {
        kk: "Санақ жыл сайын жүргізілетіндіктен",
        ru: "Потому что учёт проводят каждый год",
        en: "Because a census is run every year",
      },
    ],
    answer: 1,
    explain: {
      kk: "Жарияланған бағалаулар 50 мыңнан 300 мыңға дейін — төрт еседен астам айырма. Бір санды таңдау білмейтінімізді жасыру болар еді. Аралық — білімнің нақты жағдайын көрсететін адал жауап.",
      ru: "Опубликованные оценки лежат от 50 тысяч до 300 тысяч — разброс более чем в четыре раза. Выбрать одно число значило бы скрыть незнание. Диапазон — честный ответ, отражающий реальное состояние знаний.",
      en: "Published estimates run from 50,000 to 300,000 — a spread of more than fourfold. Picking a single number would hide what is not known. The range is the honest answer, and it reflects the real state of knowledge.",
    },
    sourceId: "iucn_seal",
  },
  {
    id: "sturgeon-iuu",
    difficulty: "expert",
    track: "life",
    format: "scenario",
    prompt: {
      kk: "Бекіре аулауының ресми статистикасы шындықты неге толық көрсетпейді?",
      ru: "Почему официальная статистика вылова осетровых не отражает реальность?",
      en: "Why does the official sturgeon catch statistic not reflect reality?",
    },
    options: [
      {
        kk: "Тоннаны қате өлшейтіндіктен",
        ru: "Потому что неверно измеряют тоннаж",
        en: "Because the tonnage is measured wrongly",
      },
      {
        kk: "Заңсыз аулау заңдыдан 4–10 есе жоғары бағаланатындықтан",
        ru: "Потому что незаконный вылов оценивается в 4–10 раз выше законного",
        en: "Because illegal fishing is estimated at 4–10 times the legal catch",
      },
      {
        kk: "Бекіре енді ауланбайтындықтан",
        ru: "Потому что осетровых больше не ловят",
        en: "Because sturgeon are no longer caught at all",
      },
      {
        kk: "Статистика тек Қазақстан бойынша жүретіндіктен",
        ru: "Потому что статистика ведётся только по Казахстану",
        en: "Because the statistic covers Kazakhstan only",
      },
    ],
    answer: 1,
    explain: {
      kk: "Ресми аулау 1977 жылғы 30 000 тоннадан 2020 жылы 120 тоннаға дейін құлады, бірақ нақты алым бұдан бірнеше есе көп: заңсыз аулау (IUU) 4–10 есе жоғары деп бағаланады. Сондықтан платформа бір сан емес, IUU-көбейткішімен аралық көрсетеді.",
      ru: "Официальный вылов рухнул с 30 000 тонн в 1977 году до 120 тонн в 2020-м, но реальный изъятый объём в разы больше: незаконный вылов (IUU) оценивается в 4–10 раз выше. Поэтому платформа показывает не одно число, а диапазон с IUU-множителем.",
      en: "The official catch collapsed from 30,000 tonnes in 1977 to 120 tonnes in 2020, but the real removal is several times larger: illegal (IUU) fishing is estimated at 4–10 times the legal catch. That is why the platform shows a band with an IUU multiplier rather than a single figure.",
    },
    sourceId: "cites_fao",
  },
  {
    id: "koshkar-scale",
    difficulty: "basic",
    track: "pollution",
    format: "metric",
    prompt: {
      kk: "Ақтаудан 5 км жердегі Қошқар-Ата қоймасында қанша қалдық жинақталған?",
      ru: "Сколько отходов накоплено в хвостохранилище Кошкар-Ата в 5 км от Актау?",
      en: "How much waste has accumulated in the Koshkar-Ata tailings pond, 5 km from Aktau?",
    },
    options: [
      { kk: "1 млн тоннадан астам", ru: "более 1 млн тонн", en: "over 1 million tonnes" },
      { kk: "15 млн тоннадан астам", ru: "более 15 млн тонн", en: "over 15 million tonnes" },
      { kk: "105 млн тоннадан астам", ru: "более 105 млн тонн", en: "over 105 million tonnes" },
      { kk: "900 млн тоннадан астам", ru: "более 900 млн тонн", en: "over 900 million tonnes" },
    ],
    answer: 2,
    explain: {
      kk: "105 млн тоннадан астам, оның 52 млн тоннасы әлсіз радиоактивті, аумағы 77 км². Қойма 2009 жылы жабылды, бірақ басты қауіп сақталады — құрғаған беттен көтерілетін улы шаң.",
      ru: "Более 105 млн тонн, из них 52 млн тонн слабо радиоактивных, площадь 77 км². Хранилище закрыто в 2009 году, но главный риск остаётся — токсичная пыль с высохшей поверхности.",
      en: "Over 105 million tonnes, of which 52 million are low-level radioactive, across 77 km². The pond was closed in 2009, but the main risk remains: toxic dust blown off the dried surface.",
    },
    sourceId: "koshkar_pub",
  },
  {
    id: "pollution-structure",
    difficulty: "basic",
    track: "pollution",
    format: "choice",
    prompt: {
      kk: "Каспийдің ластану құрылымында ең үлкен үлес қайсысында?",
      ru: "Какая доля наибольшая в структуре загрязнения Каспия?",
      en: "Which share is the largest in the structure of Caspian pollution?",
    },
    options: [
      { kk: "Тұрмыстық ағындылар", ru: "Бытовые стоки", en: "Domestic sewage" },
      { kk: "Мұнай өнімдері", ru: "Нефтепродукты", en: "Oil products" },
      { kk: "Пластик", ru: "Пластик", en: "Plastic" },
      { kk: "Ауыл шаруашылығы ағыны", ru: "Сельхозсток", en: "Agricultural runoff" },
    ],
    answer: 1,
    explain: {
      kk: "Мұнай өнімдері — шамамен 41%, одан кейін өнеркәсіптік ағындылар (24%) және тұрмыстық ағындылар (19%). Бұл үлестер — жарияланымдардан алынған жиынтық баға, лездік өлшеу емес.",
      ru: "Нефтепродукты — около 41%, далее промышленные стоки (24%) и бытовые (19%). Эти доли — сводная оценка из публикаций, а не мгновенное измерение.",
      en: "Oil products at about 41%, then industrial effluent (24%) and domestic sewage (19%). These shares are a composite estimate from the literature, not an instantaneous measurement.",
    },
    sourceId: "grid_arendal",
  },
  {
    id: "health-estimate",
    difficulty: "expert",
    track: "pollution",
    format: "scenario",
    prompt: {
      kk: "Платформадағы «денсаулыққа әсер» көрсеткіші нені білдіреді?",
      ru: "Что означает показатель «влияние на здоровье» на платформе?",
      en: "What does the platform's 'effect on health' figure represent?",
    },
    options: [
      {
        kk: "Нақты уақыттағы тіркелген жағдайлар саны",
        ru: "Число зарегистрированных случаев в реальном времени",
        en: "A real-time count of recorded cases",
      },
      {
        kk: "ДДҰ әдістемесі бойынша жылдық модельдік баға",
        ru: "Годовую модельную оценку по методике ВОЗ",
        en: "An annual model estimate following WHO methodology",
      },
      {
        kk: "Ауруханалардың ресми есебі",
        ru: "Официальный отчёт больниц",
        en: "An official hospital report",
      },
      {
        kk: "Сауалнама нәтижесі",
        ru: "Результат опроса населения",
        en: "The result of a public survey",
      },
    ],
    answer: 1,
    explain: {
      kk: "Бұл — PM2.5 концентрациясы × «доза-әсер» функциясы × халық саны формуласы бойынша есептелген жылдық баға (1200–2800 аралығы). Бұл өлшеу де, нақты уақыттағы есептегіш те емес, және платформа мұны тікелей жазады.",
      ru: "Это годовая оценка по формуле «концентрация PM2.5 × функция доза-эффект × население» с диапазоном 1200–2800. Это не измерение и не счётчик реального времени, и платформа прямо это указывает.",
      en: "It is an annual estimate from PM2.5 concentration × an exposure-response function × population, with a range of 1,200–2,800. It is neither a measurement nor a real-time counter, and the platform states that plainly.",
    },
    sourceId: "model",
  },
  {
    id: "plume-relative",
    difficulty: "expert",
    track: "pollution",
    format: "map",
    prompt: {
      kk: "Ауа картасындағы шлейф конусы нені көрсетеді?",
      ru: "Что показывает конус шлейфа на карте воздуха?",
      en: "What does the plume cone on the air map show?",
    },
    options: [
      {
        kk: "Өлшенген концентрацияны мкг/м³-пен",
        ru: "Измеренную концентрацию в мкг/м³",
        en: "A measured concentration in µg/m³",
      },
      {
        kk: "Өлшенген желден есептелген ықтимал таралу секторын",
        ru: "Вероятный сектор рассеивания, рассчитанный из измеренного ветра",
        en: "A probable dispersion sector computed from measured wind",
      },
      {
        kk: "Кәсіпорынның ресми санитарлық аймағын",
        ru: "Официальную санитарную зону предприятия",
        en: "The facility's official sanitary zone",
      },
      {
        kk: "Спутник тіркеген ластану дағын",
        ru: "Пятно загрязнения, зафиксированное спутником",
        en: "A pollution patch recorded by satellite",
      },
    ],
    answer: 1,
    explain: {
      kk: "Шығарынды қарқыны (г/с) белгісіз, сондықтан абсолюттік мкг/м³ ойдан шығару болар еді — платформада ондай сан жоқ. Концентрация тек салыстырмалы (0…1), ал конустың өзі өлшенген желден есептелген ықтимал сектор. Жел деректері болмаса, ештеңе сызылмайды.",
      ru: "Мощность выброса (г/с) неизвестна, поэтому абсолютные мкг/м³ были бы выдумкой — таких чисел на платформе нет. Концентрация только относительная (0…1), а сам конус — вероятный сектор, рассчитанный из измеренного ветра. Без данных о ветре не рисуется ничего.",
      en: "The emission rate in g/s is unknown, so an absolute µg/m³ figure would be a fabrication — no such number appears anywhere on the platform. Concentration is relative only (0…1), and the cone itself is a probable sector computed from measured wind. With no wind data, nothing is drawn.",
    },
    sourceId: "open_meteo",
  },
  {
    id: "data-gap",
    difficulty: "applied",
    track: "future",
    format: "map",
    prompt: {
      kk: "Каспий жағалауындағы қай елде ашық машиналық оқылатын экологиялық дерек ең аз?",
      ru: "У какой прикаспийской страны меньше всего открытых машиночитаемых экологических данных?",
      en: "Which Caspian country publishes the least open, machine-readable environmental data?",
    },
    options: [
      { kk: "Қазақстан", ru: "Казахстан", en: "Kazakhstan" },
      { kk: "Ресей", ru: "Россия", en: "Russia" },
      { kk: "Түрікменстан", ru: "Туркменистан", en: "Turkmenistan" },
      { kk: "Әзербайжан", ru: "Азербайджан", en: "Azerbaijan" },
    ],
    answer: 2,
    explain: {
      kk: "Түрікменстан — 100 балдық шкалада 9, Иран 12, Әзербайжан 32, Ресей 45, Қазақстан 68. Аймақтық дерек теңсіздігі — өзі бір экологиялық проблема: теңіз ортақ, ал оны бақылау мүмкіндігі әркелкі. Спутниктік дереккөздер осы алшақтықты жабады.",
      ru: "Туркменистан — 9 из 100, Иран 12, Азербайджан 32, Россия 45, Казахстан 68. Региональное неравенство данных — само по себе экологическая проблема: море общее, а возможность его контролировать разная. Этот разрыв закрывают спутниковые источники.",
      en: "Turkmenistan scores 9 out of 100, Iran 12, Azerbaijan 32, Russia 45, Kazakhstan 68. Regional inequality in data is an environmental problem in its own right: the sea is shared, the ability to watch it is not. Satellite sources are what closes that gap.",
    },
    sourceId: "model",
  },
  {
    id: "breeze-risk",
    difficulty: "expert",
    track: "pollution",
    format: "scenario",
    prompt: {
      kk: "Неге теңіз бризі жағалаудағы мұнай өңдеу зауыты үшін ең қауіпті жел режимі саналады?",
      ru: "Почему морской бриз считается самым опасным ветровым режимом для прибрежного НПЗ?",
      en: "Why is a sea breeze the most dangerous wind regime for a coastal refinery?",
    },
    options: [
      {
        kk: "Ол шлейфті теңізге қарай тез шығарады",
        ru: "Он быстро уносит шлейф в открытое море",
        en: "It quickly carries the plume out to open sea",
      },
      {
        kk: "Ол шлейфті қалаға қарай итеріп, фумигация тудырады",
        ru: "Он толкает шлейф к городу и вызывает фумигацию",
        en: "It pushes the plume inland toward the town and causes fumigation",
      },
      {
        kk: "Ол түнде ғана соғады",
        ru: "Он дует только ночью",
        en: "It only blows at night",
      },
      {
        kk: "Ол жауын-шашынды күшейтеді",
        ru: "Он усиливает осадки",
        en: "It intensifies rainfall",
      },
    ],
    answer: 1,
    explain: {
      kk: "Бриз шлейфті құрлыққа, қалаға қарай итереді. Оның үстіне суық су үстіндегі орнықты ауа ыстық жағаға келгенде астынан термиялық ішкі шекаралық қабат (TIBL) өсіп, биіктегі шлейфті түгелдей жерге түсіреді — классикалық жағалау фумигациясы. Платформа бризді ешқашан факт ретінде айтпайды, тек сенімділік деңгейін көрсетеді.",
      ru: "Бриз толкает шлейф на сушу, к городу. Вдобавок устойчивый воздух над холодной водой, приходя на горячий берег, надстраивает снизу термический внутренний пограничный слой (TIBL), который разом опускает приподнятый шлейф к земле — классическая береговая фумигация. Платформа никогда не утверждает наличие бриза как факт, а показывает лишь уровень уверенности.",
      en: "The breeze pushes the plume inland, toward the town. On top of that, stable air that sat over cold water meets a hot shore, where a thermal internal boundary layer grows underneath and brings the whole elevated plume down at once — the classic coastal fumigation episode. The platform never asserts a breeze as fact; it reports only how much of the evidence lines up.",
    },
    sourceId: "open_meteo",
  },
  {
    id: "depletion-meaning",
    difficulty: "applied",
    track: "resources",
    format: "scenario",
    prompt: {
      kk: "«Қор жету мерзімі» көрсеткішін қалай дұрыс оқу керек?",
      ru: "Как правильно читать показатель «срок исчерпания» запасов?",
      en: "How should the 'years to depletion' figure be read?",
    },
    options: [
      {
        kk: "Мұнай нақты сол жылы бітеді",
        ru: "Нефть закончится ровно в этот год",
        en: "The oil runs out exactly in that year",
      },
      {
        kk: "Қазіргі қарқын өзгермесе қанша жылға жететінін көрсететін қарапайым қатынас",
        ru: "Простое отношение, показывающее, на сколько лет хватит при неизменном темпе",
        en: "A simple ratio showing how long reserves last if nothing changes",
      },
      {
        kk: "Кен орындарының лицензия мерзімі",
        ru: "Срок действия лицензий на месторождения",
        en: "The expiry of the field licences",
      },
      {
        kk: "Мемлекеттің ресми болжамы",
        ru: "Официальный государственный прогноз",
        en: "An official government forecast",
      },
    ],
    answer: 1,
    explain: {
      kk: "Бұл — қалған қор / орташа жылдық өндіру. Жаңа кен орындары, технология өзгерісі және сұраныс динамикасы ескерілмейді, сондықтан бұл болжам емес, ағымдағы қарқынның иллюстрациясы. Иран мен Түрікменстан деректері іс жүзінде жабық, олардың сандары — салалық шолулардың бағасы.",
      ru: "Это остаток запасов / средняя годовая добыча. Новые месторождения, смена технологий и динамика спроса не учитываются, поэтому это не прогноз, а иллюстрация текущего темпа. Данные Ирана и Туркменистана фактически закрыты — их цифры это оценки отраслевых обзоров.",
      en: "It is remaining reserves ÷ mean annual production. New fields, changing technology and shifting demand are not accounted for, so it illustrates the present rate rather than forecasting an end date. Iranian and Turkmen figures are effectively closed; those numbers are industry-review estimates.",
    },
    sourceId: "industry_reports",
  },
];

export const QUIZ_BY_ID = new Map(QUIZ.map((q) => [q.id, q]));
