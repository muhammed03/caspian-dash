import type { Trio } from "@/shared/lib/i18n";
import type { Achievement, Discovery, Mission } from "./types";

/**
 * Levels, achievements and missions.
 *
 * The register is deliberately sober. Nothing here congratulates the reader for
 * clicking; every title names a competence, because the module sits inside a
 * platform whose credibility is the product. No confetti, no mascots, no
 * leaderboards — the reward for learning is being trusted with more of it.
 */

/** Level 0 is the starting state, so the array is indexed by level directly. */
export const LEVEL_NAMES: Trio[] = [
  { kk: "Жаңа оқырман", ru: "Новый читатель", en: "New reader" },
  { kk: "Бақылаушы", ru: "Наблюдатель", en: "Observer" },
  { kk: "Дерек оқырманы", ru: "Читатель данных", en: "Data reader" },
  { kk: "Талдаушы", ru: "Аналитик", en: "Analyst" },
  { kk: "Зерттеуші", ru: "Исследователь", en: "Researcher" },
  { kk: "Сарапшы", ru: "Эксперт", en: "Expert" },
  { kk: "Теңіз қорғаушысы", ru: "Хранитель моря", en: "Steward of the sea" },
  { kk: "Каспий елшісі", ru: "Посол Каспия", en: "Caspian advocate" },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-lesson",
    tier: "bronze",
    title: { kk: "Бірінші қадам", ru: "Первый шаг", en: "First step" },
    requirement: { kk: "Бір сабақты аяқтау", ru: "Завершить один урок", en: "Finish one lesson" },
    test: (p) => p.lessons >= 1,
    measure: (p) => ({ have: Math.min(p.lessons, 1), need: 1 }),
  },
  {
    id: "half-curriculum",
    tier: "silver",
    title: { kk: "Жарты жол", ru: "Половина пути", en: "Halfway" },
    requirement: { kk: "Сабақтардың жартысы", ru: "Половина уроков", en: "Half of the lessons" },
    test: (p) => p.lessons >= Math.ceil(p.totalLessons / 2),
    measure: (p) => ({ have: p.lessons, need: Math.ceil(p.totalLessons / 2) }),
  },
  {
    id: "full-curriculum",
    tier: "gold",
    title: { kk: "Толық курс", ru: "Полный курс", en: "Full curriculum" },
    requirement: { kk: "Барлық сабақ аяқталды", ru: "Все уроки завершены", en: "Every lesson finished" },
    test: (p) => p.totalLessons > 0 && p.lessons >= p.totalLessons,
    measure: (p) => ({ have: p.lessons, need: p.totalLessons }),
  },
  {
    id: "sceptic",
    tier: "silver",
    title: { kk: "Сыншы көзқарас", ru: "Критический взгляд", en: "Critical eye" },
    requirement: {
      kk: "Он сұраққа бірінші реттен дұрыс жауап беру",
      ru: "Ответить верно с первого раза на десять вопросов",
      en: "Answer ten questions correctly first time",
    },
    test: (p) => p.perfectChecks >= 10,
    measure: (p) => ({ have: p.perfectChecks, need: 10 }),
  },
  {
    id: "quiz-run",
    tier: "bronze",
    title: { kk: "Тексерілген білім", ru: "Проверенное знание", en: "Knowledge checked" },
    requirement: { kk: "Бес сұраққа жауап беру", ru: "Ответить на пять вопросов", en: "Answer five questions" },
    test: (p) => p.quizAnswered >= 5,
    measure: (p) => ({ have: p.quizAnswered, need: 5 }),
  },
  {
    id: "explorer",
    tier: "silver",
    title: { kk: "Зерттеуші", ru: "Исследователь", en: "Explorer" },
    requirement: {
      kk: "Картадан бес нысан ашу",
      ru: "Открыть пять объектов на карте",
      en: "Uncover five places on the map",
    },
    test: (p) => p.discoveries >= 5,
    measure: (p) => ({ have: p.discoveries, need: 5 }),
  },
  {
    id: "cartographer",
    tier: "gold",
    title: { kk: "Картограф", ru: "Картограф", en: "Cartographer" },
    requirement: {
      kk: "Барлық нысанды табу",
      ru: "Найти все объекты",
      en: "Find every place",
    },
    test: (p) => p.totalDiscoveries > 0 && p.discoveries >= p.totalDiscoveries,
    measure: (p) => ({ have: p.discoveries, need: p.totalDiscoveries }),
  },
  {
    id: "week-streak",
    tier: "silver",
    title: { kk: "Тұрақтылық", ru: "Постоянство", en: "Consistency" },
    requirement: { kk: "Қатарынан жеті күн", ru: "Семь дней подряд", en: "Seven days in a row" },
    test: (p) => p.streak >= 7,
    measure: (p) => ({ have: p.streak, need: 7 }),
  },
  {
    id: "modeller",
    tier: "bronze",
    title: { kk: "Модельші", ru: "Моделист", en: "Modeller" },
    requirement: {
      kk: "Симуляторда үш сценарий қарау",
      ru: "Прогнать три сценария в симуляторе",
      en: "Run three scenarios in the simulator",
    },
    test: (p) => p.simulations >= 3,
    measure: (p) => ({ have: p.simulations, need: 3 }),
  },
];

export const MISSIONS: Mission[] = [
  {
    id: "daily-lesson",
    kind: "daily",
    title: { kk: "Бүгінгі сабақ", ru: "Урок дня", en: "Today's lesson" },
    detail: {
      kk: "Кез келген сабақты аяқтаңыз — серияны сақтайды.",
      ru: "Завершите любой урок — это сохранит серию.",
      en: "Finish any lesson — this keeps your streak alive.",
    },
    href: "/academy/lessons",
    measure: (p) => ({ have: Math.min(p.lessons, 1), need: 1 }),
  },
  {
    id: "daily-check",
    kind: "daily",
    title: { kk: "Үш сұрақ", ru: "Три вопроса", en: "Three questions" },
    detail: {
      kk: "Викторинада үш сұраққа жауап беріңіз.",
      ru: "Ответьте на три вопроса в викторине.",
      en: "Answer three questions in the quiz.",
    },
    href: "/academy/quiz",
    measure: (p) => ({ have: Math.min(p.quizAnswered, 3), need: 3 }),
  },
  {
    id: "weekly-tracks",
    kind: "weekly",
    title: { kk: "Екі бағыт", ru: "Два направления", en: "Two tracks" },
    detail: {
      kk: "Екі түрлі тақырыптағы сабақты аяқтаңыз.",
      ru: "Завершите уроки из двух разных тем.",
      en: "Finish lessons from two different tracks.",
    },
    href: "/academy/lessons",
    measure: (p) => ({ have: Math.min(p.tracksCompleted, 2), need: 2 }),
  },
  {
    id: "weekly-explore",
    kind: "weekly",
    title: { kk: "Картаны зерттеу", ru: "Разведка карты", en: "Survey the map" },
    detail: {
      kk: "Картадан үш нысан ашыңыз.",
      ru: "Откройте три объекта на карте.",
      en: "Uncover three places on the map.",
    },
    href: "/map/life",
    measure: (p) => ({ have: Math.min(p.discoveries, 3), need: 3 }),
  },
  {
    id: "standing-simulator",
    kind: "standing",
    title: { kk: "Сценарийді сынау", ru: "Проверить сценарий", en: "Test a scenario" },
    detail: {
      kk: "Симуляторда деңгейдің төмендеу сценарийін қараңыз.",
      ru: "Посмотрите сценарий падения уровня в симуляторе.",
      en: "Run a level-decline scenario in the simulator.",
    },
    href: "/academy/simulator",
    measure: (p) => ({ have: Math.min(p.simulations, 1), need: 1 }),
  },
  {
    id: "standing-curriculum",
    kind: "standing",
    title: { kk: "Курсты аяқтау", ru: "Пройти курс", en: "Complete the curriculum" },
    detail: {
      kk: "Барлық сабақты аяқтап, «Каспий елшісі» деңгейіне жетіңіз.",
      ru: "Завершите все уроки и дойдите до уровня «Посол Каспия».",
      en: "Finish every lesson and reach the Caspian advocate level.",
    },
    href: "/academy/lessons",
    measure: (p) => ({ have: p.lessons, need: p.totalLessons }),
  },
];

/**
 * Places on the map that reveal a fact when the reader opens them. Coordinates
 * and facts come from the same datasets the map layers are drawn from, so a
 * discovery is a real object, not a scattered collectible.
 */
export const DISCOVERIES: Discovery[] = [
  {
    id: "koshkar-ata",
    lat: 43.71,
    lng: 51.13,
    module: "pollution",
    kind: "hotspot",
    title: { kk: "Қошқар-Ата", ru: "Кошкар-Ата", en: "Koshkar-Ata" },
    fact: {
      kk: "105 млн тонна қалдық Ақтаудан 5 км жерде. Су айдыны құрғаған сайын улы шаң қаупі артады.",
      ru: "105 млн тонн отходов в 5 км от Актау. Чем сильнее высыхает поверхность, тем выше риск токсичной пыли.",
      en: "105 million tonnes of waste 5 km from Aktau. The more the surface dries, the greater the toxic-dust risk.",
    },
    sourceId: "koshkar_pub",
  },
  {
    id: "tyuleniy",
    lat: 44.5,
    lng: 50.2,
    module: "life",
    kind: "habitat",
    title: { kk: "Итбалық аралдары", ru: "Тюленьи острова", en: "Seal Islands" },
    fact: {
      kk: "Каспий итбалығының негізгі көбею орындарының бірі. Мұз азайған сайын төлдеу алаңы жоғалады.",
      ru: "Одно из ключевых мест размножения каспийского тюленя. Чем меньше льда, тем меньше площадок для щенки.",
      en: "One of the key breeding grounds of the Caspian seal. Less ice means fewer places to pup.",
    },
    sourceId: "iucn_seal",
  },
  {
    id: "volga-delta",
    lat: 46.0,
    lng: 48.5,
    module: "water",
    kind: "coastline",
    title: { kk: "Еділ атырауы", ru: "Дельта Волги", en: "Volga delta" },
    fact: {
      kk: "Каспий ағынының шамамен 80%-ы осы жерден келеді. Жайпақ түбі — деңгей төмендегенде ең көп жер ашылатын аймақ.",
      ru: "Отсюда приходит около 80% стока Каспия. Пологое дно — здесь при падении уровня обнажается больше всего суши.",
      en: "About 80% of the Caspian's inflow arrives here. The seabed is flat, so a falling level exposes more land here than anywhere.",
    },
    sourceId: "grid_arendal",
  },
  {
    id: "kashagan",
    lat: 46.35,
    lng: 51.53,
    module: "resources",
    kind: "facility",
    title: { kk: "Қашаған", ru: "Кашаган", en: "Kashagan" },
    fact: {
      kk: "Таяз солтүстік Каспийдегі жасанды аралдағы теңіз кен орны — итбалық мекендейтін аймаққа жақын.",
      ru: "Морское месторождение на искусственном острове в мелководном северном Каспии — рядом с местами обитания тюленя.",
      en: "An offshore field on an artificial island in the shallow northern Caspian — close to seal habitat.",
    },
    sourceId: "industry_reports",
  },
  {
    id: "atyrau",
    lat: 47.117,
    lng: 51.883,
    module: "pollution",
    kind: "facility",
    title: { kk: "Атырау", ru: "Атырау", en: "Atyrau" },
    fact: {
      kk: "Теңізден ~30 км — бриздің ену шегінің шетінде. Сондықтан платформа мұнда бриз сенімділігін әрқашан бір деңгейге төмендетеді.",
      ru: "~30 км от моря — на самом краю зоны проникновения бриза. Поэтому уверенность в бризе здесь всегда понижается на уровень.",
      en: "~30 km from the sea, at the very edge of the breeze penetration zone. Breeze confidence here is therefore always downgraded by one level.",
    },
    sourceId: "open_meteo",
  },
  {
    id: "kenderli",
    lat: 42.9,
    lng: 52.7,
    module: "life",
    kind: "habitat",
    title: { kk: "Кендірлі", ru: "Кендерли", en: "Kenderli" },
    fact: {
      kk: "Итбалықтың жағаға шығып демалатын орны. Мазалау мен жағалау сызығының жылжуы бұл алаңдарды жоғалтады.",
      ru: "Место, где тюлень выходит на берег отдыхать. Беспокойство и смещение берега уничтожают такие площадки.",
      en: "A haul-out where seals come ashore to rest. Disturbance and a shifting shoreline erase such sites.",
    },
    sourceId: "iucn_seal",
  },
  {
    id: "absheron",
    lat: 40.41,
    lng: 49.87,
    module: "pollution",
    kind: "hotspot",
    title: { kk: "Апшерон", ru: "Апшерон", en: "Absheron" },
    fact: {
      kk: "Су тазалығы индексі бойынша ең нашар аймақ. Бір ғасырдан астам мұнай өндіру мен газохимия шоғырланған жер.",
      ru: "Худший регион по индексу чистоты воды. Здесь больше века сосредоточены нефтедобыча и газохимия.",
      en: "The worst region on the water-purity index — more than a century of oil production and gas chemistry concentrated in one place.",
    },
    sourceId: "model",
  },
  {
    id: "north-shelf",
    lat: 45.6,
    lng: 50.4,
    module: "water",
    kind: "coastline",
    title: { kk: "Солтүстік қайраң", ru: "Северный шельф", en: "Northern shelf" },
    fact: {
      kk: "Тереңдігі бірнеше метр ғана. Дәл сондықтан деңгейдің бір сантиметрі мұнда ондаған метр құрлық береді.",
      ru: "Глубина всего несколько метров. Именно поэтому один сантиметр уровня даёт здесь десятки метров суши.",
      en: "Only a few metres deep. That is exactly why one centimetre of level yields tens of metres of land here.",
    },
    sourceId: "grealm",
  },
];

export const DISCOVERY_BY_ID = new Map(DISCOVERIES.map((d) => [d.id, d]));
