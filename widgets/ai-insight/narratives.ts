import type { InsightModule } from "@/entities/ai-insight/schema";
import type { Locale } from "@/shared/lib/i18n";

/**
 * Human-readable wording for each dashboard's analysis.
 *
 * Only the *phrasing* lives here. Every number the card shows — trend, the
 * anomaly table, risk level, forecast — is computed at runtime by
 * entities/ai-insight/compute.ts from the datasets, so the text and the
 * figures cannot drift apart into a claim the data does not support.
 *
 * Running scripts/pipeline/gen-insights.ts with an Anthropic key regenerates
 * these narratives from the same aggregated payloads and writes them to
 * data/ai/. Until that runs, these baseline texts are what ships, which keeps
 * the platform working with no key and no network.
 */
type Narrative = { summary: string; recommendations: string[]; dataQuality: string };

/**
 * Keyed by locale rather than branched, so adding a language is a compile
 * error here until the text exists — never a silent fallback to Russian.
 */
export const NARRATIVES: Record<InsightModule, Record<Locale, Narrative>> = {
  water: {
    kk: {
      summary:
        "2015 жылдан бері теңіз деңгейінің төмендеу қарқыны алдыңғы кезеңмен салыстырғанда бірнеше есе жоғары; 2025 жылы деңгей тарихи минимумнан төмен түсті. Жайпақ солтүстік-шығыс секторда бұл шақырымдап құрғаған түбі дегенді білдіреді.",
      recommendations: [
        "Ақтау мен Құрық порттарының су алу нүктелері мен кеме жолдарын жаңа тереңдікке қарай қайта жоспарлау",
        "Құрғаған түбіндегі тұзды шаң көзін тұрақтандыру жоспарын дайындау (арал сценарийін болдырмау)",
        "Еділ мен Жайық ағынының азаюын Каспий маңы елдерімен бірлескен мониторингке шығару",
        "Жағалау сызығын жыл сайын спутниктік түсірілім бойынша қайта өлшеп, модельді тексеріп отыру",
      ],
      dataQuality:
        "Деңгей қатары жарияланған альтиметрия мәндері мен төмендеу қарқыны бойынша қалпына келтірілген (SEMI). Жағалау сызығы — түп еңісі арқылы есептелген модель, спутниктік бақылау емес. Екеуі де «Әдістеме» бетінде ашық сипатталған.",
    },
    ru: {
      summary:
        "С 2015 года скорость падения уровня в разы выше предыдущего периода; в 2025-м уровень опустился ниже исторического минимума. На пологом северо-восточном секторе это означает километры обнажённого дна.",
      recommendations: [
        "Перепланировать водозаборы и судовые ходы портов Актау и Курык под новые глубины",
        "Подготовить план закрепления обнажённого дна как источника солепылевых бурь (не повторять аральский сценарий)",
        "Вынести сокращение стока Волги и Урала в совместный мониторинг прикаспийских государств",
        "Ежегодно переизмерять береговую линию по спутниковым снимкам и верифицировать модель",
      ],
      dataQuality:
        "Ряд уровня восстановлен по опубликованным значениям альтиметрии и скоростям падения (SEMI). Береговая линия — расчётная модель через уклон дна, а не спутниковое наблюдение. Оба допущения описаны на странице «Методика».",
    },
    en: {
      summary:
        "Since 2015 the level has been falling several times faster than in the preceding period; in 2025 it dropped below its historic minimum. On the flat north-eastern sector that means kilometres of exposed seabed.",
      recommendations: [
        "Replan the water intakes and shipping channels of the ports of Aktau and Kuryk for the new depths",
        "Prepare a plan to stabilise the exposed seabed as a source of salt-dust storms (so the Aral scenario is not repeated)",
        "Raise the decline in Volga and Ural flow into joint monitoring by the Caspian littoral states",
        "Re-measure the shoreline from satellite imagery every year and verify the model against it",
      ],
      dataQuality:
        "The level series is reconstructed from published altimetry values and rates of decline (SEMI). The shoreline is a calculated model based on the slope of the seabed, not a satellite observation. Both assumptions are described on the Methodology page.",
    },
  },

  pollution: {
    kk: {
      summary:
        "Су тазалығы индексі барлық аймақта қабылданған шектен төмен, ең нашары — Апшерон секторы. Ластану құрылымында мұнай өнімдері басым. Қошқар-Ата қоймасы Ақтаудан 5 км жерде 105 млн тонна қалдық сақтайды.",
      recommendations: [
        "Қошқар-Ата бетінің шаң көтеруін тұрақты бақылауға алу және рекультивация мерзімін жариялау",
        "Ірі шығарынды көздері бойынша РВПЗ есептерін машинамен оқылатын форматта ашу",
        "Ақтау мен Атырауда жердегі ауа сапасы станцияларының санын арттыру",
        "Жел бағыты моделін пайдаланып, шығарынды шлейфі тұрғын аймаққа түсетін сағаттарды алдын ала ескерту",
      ],
      dataQuality:
        "Ауа сапасы — Open-Meteo/CAMS арқылы нақты уақыттағы дерек (REAL); желі болмаса соңғы сақталған мән көрсетіледі. Шығарынды көлемдері мен тазалық индексі — жарияланымдар мен платформа моделі (SEMI). Денсаулық көрсеткіші — WHO әдістемесі бойынша жылдық модельдік баға, өлшем емес.",
    },
    ru: {
      summary:
        "Индекс чистоты воды ниже принятого порога во всех секторах, хуже всего — Апшерон. В структуре загрязнения преобладают нефтепродукты. Хвостохранилище Кошкар-Ата хранит 105 млн тонн отходов в 5 км от Актау.",
      recommendations: [
        "Взять под постоянный контроль пыление поверхности Кошкар-Ата и опубликовать сроки рекультивации",
        "Раскрыть отчётность ПРТР по крупным источникам выбросов в машиночитаемом формате",
        "Увеличить число наземных станций контроля воздуха в Актау и Атырау",
        "Использовать модель ветра для заблаговременного предупреждения о сносе шлейфа на жилую зону",
      ],
      dataQuality:
        "Качество воздуха — реальные данные Open-Meteo/CAMS в реальном времени (REAL); при отсутствии сети показывается последний сохранённый замер. Объёмы выбросов и индекс чистоты — публикации и модель платформы (SEMI). Показатель здоровья — годовая модельная оценка по методике ВОЗ, а не измерение.",
    },
    en: {
      summary:
        "The water purity index is below the accepted threshold in every sector, worst of all in the Absheron sector. Oil products dominate the structure of pollution. The Koshkar-Ata tailings pond holds 105 million tonnes of waste 5 km from Aktau.",
      recommendations: [
        "Put dust rising from the surface of Koshkar-Ata under permanent monitoring and publish a remediation timetable",
        "Release PRTR reporting for the major emission sources in a machine-readable format",
        "Increase the number of ground-based air quality stations in Aktau and Atyrau",
        "Use the wind model to warn residential areas in advance of the hours when an emission plume drifts over them",
      ],
      dataQuality:
        "Air quality is real-time data from Open-Meteo/CAMS (REAL); with no connection the last saved measurement is shown. Emission volumes and the purity index come from publications and the platform's own model (SEMI). The health figure is an annual model estimate following WHO methodology, not a measurement.",
    },
  },

  life: {
    kk: {
      summary:
        "Бекіре аулауы 1977 жылдан бері іс жүзінде нөлге дейін құлады, ал каспий итбалығының популяциясы ғасыр басындағы деңгейден 90%-дан астам төмен. Екі түр де халықаралық қорғау мәртебесінде.",
      recommendations: [
        "Итбалық санының бағалауын бірыңғай әдістемеге көшіру — қазіргі бағалаулар төрт есе айырмашылықта",
        "Жайық пен Еділ сағасындағы уылдырық шашу орындарын қалпына келтіру бағдарламасын іске қосу",
        "Заңсыз аулауға қарсы кеме қозғалысын спутниктік бақылауға қосу",
        "Жаппай қырылу оқиғаларының себебін ашық жариялайтын хаттама бекіту",
      ],
      dataQuality:
        "Итбалық саны бойынша дереккөздер қайшылықты (70 мыңнан 300 мыңға дейін) — платформа бір санды емес, аралықты көрсетеді. Ресми аулау статистикасы заңсыз аулауды есепке алмайды, сондықтан нақты қорды төмен көрсетеді (SEMI).",
    },
    ru: {
      summary:
        "Вылов осетровых с 1977 года упал практически до нуля, популяция каспийского тюленя более чем на 90% ниже уровня начала века. Оба вида имеют международный охранный статус.",
      recommendations: [
        "Перейти к единой методике учёта тюленя — текущие оценки расходятся в четыре раза",
        "Запустить программу восстановления нерестилищ в устьях Урала и Волги",
        "Подключить спутниковый мониторинг движения судов для противодействия браконьерству",
        "Утвердить протокол публичного раскрытия причин случаев массовой гибели",
      ],
      dataQuality:
        "Источники по численности тюленя противоречивы (от 70 до 300 тысяч) — платформа показывает диапазон, а не одно число. Официальная статистика вылова не учитывает незаконный промысел и занижает реальную нагрузку на запас (SEMI).",
    },
    en: {
      summary:
        "The sturgeon catch has fallen practically to zero since 1977, and the Caspian seal population is more than 90% below its level at the start of the century. Both species hold international protected status.",
      recommendations: [
        "Move to a single methodology for counting seals — current estimates differ by a factor of four",
        "Launch a programme to restore the spawning grounds at the mouths of the Ural and the Volga",
        "Add satellite monitoring of vessel movement to counter IUU fishing",
        "Adopt a protocol for publicly disclosing the causes of mass mortality events",
      ],
      dataQuality:
        "Sources on seal numbers contradict one another (from 70,000 to 300,000) — the platform shows a range rather than a single figure. Official catch statistics do not account for illegal fishing and understate the real pressure on the stock (SEMI).",
    },
  },

  resources: {
    kk: {
      summary:
        "Өндіру көлемі соңғы онжылдықта өсуде, ал ағымдағы қарқынмен мұнай қоры шамамен елу жылға жетеді. Иран мен Түрікменстан бойынша дерек жабық, сондықтан жалпы баға дәлдігі шектеулі.",
      recommendations: [
        "Кен орындары бойынша жылдық өндіру мен қалдық қорды ашық форматта жариялау",
        "Теңіз платформаларындағы авариялық төгінділер туралы хабарлау уақытын нормативпен бекіту",
        "Қор жету мерзімі есебін жаңа кен орындарын ескеретін нұсқаға дейін кеңейту",
      ],
      dataQuality:
        "Қорлар мен өндіру көлемдері салалық есептерден алынған (SEMI). Иран мен Түрікменстан деректері іс жүзінде жабық — олар бойынша сандар бағалау сипатында. Болжам жаңа кен орындарын да, технология өзгерісін де ескермейді.",
    },
    ru: {
      summary:
        "Добыча за последнее десятилетие растёт, а запасов нефти при текущем темпе хватит примерно на полвека. По Ирану и Туркменистану данные закрыты, поэтому точность общей оценки ограничена.",
      recommendations: [
        "Публиковать годовую добычу и остаток запасов по месторождениям в открытом формате",
        "Нормативно закрепить сроки оповещения об аварийных разливах на морских платформах",
        "Расширить расчёт срока исчерпания до версии, учитывающей ввод новых месторождений",
      ],
      dataQuality:
        "Запасы и объёмы добычи взяты из отраслевых отчётов (SEMI). Данные Ирана и Туркменистана фактически закрыты — цифры по ним оценочные. Прогноз не учитывает ни новые месторождения, ни смену технологий.",
    },
    en: {
      summary:
        "Production has grown over the past decade, and at the current rate oil reserves will last roughly half a century. Data for Iran and Turkmenistan is closed, so the accuracy of the overall estimate is limited.",
      recommendations: [
        "Publish annual production and remaining reserves by field in an open format",
        "Set the deadlines for reporting accidental spills at offshore platforms in regulation",
        "Extend the depletion calculation to a version that accounts for new fields coming on stream",
      ],
      dataQuality:
        "Reserves and production volumes are taken from industry reports (SEMI). Data for Iran and Turkmenistan is effectively closed — the figures for them are estimates. The projection accounts for neither new fields nor changes in technology.",
    },
  },

  index: {
    kk: {
      summary:
        "Жиынтық индекс бес құраушының салмақталған қосындысы ретінде есептеледі. Ең төмен үлес — биоалуантүрлілік пен дерек ашықтығы: Каспий бойынша ақпараттың өзі жетіспейді.",
      recommendations: [
        "Каспий маңы елдері үшін бірыңғай ашық экологиялық дерек стандартын келісу",
        "Спутниктік дереккөздерді негізгі мониторинг құралы ретінде бекіту — олар ел рұқсатына тәуелді емес",
        "Индекс құраушыларын жыл сайын қайта есептеп, өзгерісті ашық жариялау",
      ],
      dataQuality:
        "Индекс — платформаның меншікті моделі, ресми көрсеткіш емес. Формуласы мен салмақтары «Әдістеме» бетінде толық келтірілген, кез келген адам қайта есептей алады.",
    },
    ru: {
      summary:
        "Сводный индекс считается как взвешенная сумма пяти компонент. Наименьший вклад — биоразнообразие и открытость данных: по Каспию не хватает самой информации.",
      recommendations: [
        "Согласовать единый стандарт открытых экологических данных для прикаспийских государств",
        "Закрепить спутниковые источники как основной инструмент мониторинга — они не зависят от разрешения стран",
        "Ежегодно пересчитывать компоненты индекса и публиковать изменение открыто",
      ],
      dataQuality:
        "Индекс — собственная модель платформы, а не официальный показатель. Формула и веса полностью приведены на странице «Методика», любой может пересчитать результат.",
    },
    en: {
      summary:
        "The composite index is calculated as a weighted sum of five components. The smallest contribution comes from biodiversity and data openness: for the Caspian, the information itself is missing.",
      recommendations: [
        "Agree a single open environmental data standard for the Caspian littoral states",
        "Establish satellite sources as the primary monitoring instrument — they do not depend on any country's permission",
        "Recompute the index components every year and publish the change openly",
      ],
      dataQuality:
        "The index is the platform's own model, not an official indicator. Its formula and weights are set out in full on the Methodology page, and anyone can recompute the result.",
    },
  },
};
