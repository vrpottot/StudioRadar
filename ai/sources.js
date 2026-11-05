/**
 * sources.js — Реестр источников, площадок, стоп-доменов и поисковых запросов для ИИ-радара
 * Сфокусирован ИСКЛЮЧИТЕЛЬНО на прямых B2B-заказах и коммерческих брендах.
 * Фриланс-биржи, Telegram-каналы и тендерные площадки полностью исключены.
 */

// Черный список доменов для Exa, Tavily и локальных фильтров
export const EXCLUDE_DOMAINS = [
  // 1. Биржи фриланса и агрегаторы частных исполнителей
  'fl.ru', 'kwork.ru', 'freelance.ru', 'freelancehunt.com', 'weblancer.net',
  'work-zilla.com', 'youdo.com', 'dtf.ru', 'habr.com', 'freelance.habr.com',
  'profi.ru', 'freelancer.com', 'upwork.com', 'fiverr.com', 'render.ru',
  'allfreelance.ru', 'kadrof.ru',

  // 2. Telegram-каналы и социальные агрегаторы
  't.me', 'telegram.org', 'tgstat.ru', 'telemetr.me',
  'instagram.com', 'tiktok.com', 'youtube.com', 'pinterest.com',

  // 3. Тендерные агрегаторы, аукционы и государственные закупки
  'zakupki.gov.ru', 'rostender.info', 'b2b-center.ru', 'sberbank-ast.ru',
  'tenderdetail.com', 'rts-tender.ru', 'roseltorg.ru', 'tektorg.ru',
  'etp-ets.ru', 'fabrikant.ru', 'workspace.ru', 'tenderguru.ru', 'tendersontime.com',
  'zakupki.tochka.com', 'bicotender.ru', 'all-tenders.ru', 'goszakupki.ru',
  'estp.ru', 'lot-online.ru', 'etp-avtodor.ru', 'gz-spb.ru', 'etprf.ru',

  // 4. Доски вакансий для найма в штат / резюме соискателей
  'hh.ru', 'superjob.ru', 'rabota.ru', 'zarplata.ru', 'avito.ru/rabota'
];

// Поисковые запросы, ориентированные на ПРЯМЫЕ заказы брендов и коммерческих клиентов:
// 1. Анонсы рекламных кампаний и запуски продуктов брендов (FMCG, ритейл, авто, финтех)
// 2. Прямые брифы и запросы предложений на продакшн студии
// 3. Корпоративные порталы прямого сотрудничества с брендами
export const ORDER_SEARCH_QUERIES = [
  'site:sostav.ru OR site:adindex.ru ("запустил" OR "представил" OR "кампания") ("3D ролик" OR "CGI" OR "анимация" OR "видео")',
  'site:vc.ru OR site:new-retail.ru ("запустили" OR "представили новую линейку" OR "рекламная кампания") ("3D" OR "видеоролик" OR "CGI")',
  'site:mts.ru OR site:ozon.ru OR site:sber.ru OR site:x5.ru OR site:samolet.ru OR site:magnit.ru ("видеоролик" OR "3D" OR "анимация" OR "CGI")',
  '"ищем студию" OR "ищем продакшн" ("3D графика" OR "презентационный фильм" OR "анимационный ролик")',
  '"запрос коммерческих предложений" ("видеопродакшн" OR "3D анимация" OR "компьютерная графика") -тендер -госзакупка',
  'site:sostav.ru "директор по маркетингу" ("3D" OR "CGI" OR "анимация" OR "новый продукт")'
];

// Дополнительные запросы в отраслевые медиа для отслеживания маркетинговых кампаний брендов
export const MEDIA_SEARCH_QUERIES = [
  "site:sostav.ru 'запустил' 'ролик' OR '3D' OR 'CGI'",
  "site:adindex.ru 'кампания' 'видеоролик' OR '3D'",
  "site:vc.ru 'запустили' '3D ролик' OR 'CGI' OR 'анимация'"
];

// Целевые коммерческие направления студии для ИИ-разведки
export const TARGET_SERVICES = [
  "3D моушен-дизайн и анимация",
  "2D моушен-дизайн и анимация",
  "ИИ видеоролики и графика",
  "2D и 3D мультипликация",
  "3D Web-приложения и интерактив"
];

// Целевые индустрии B2B клиентов
export const TARGET_INDUSTRIES = [
  "Продукты питания и напитки",
  "Военная промышленность",
  "Авто и мото индустрия",
  "Банки и финансы",
  "Газ и нефть",
  "Бьюти",
  "Электротехника",
  "Рекламные агентства и продакшн",
  "Недвижимость и девелопмент"
];

// Каталог открытых площадок и платформ прямого спроса
export const PLATFORM_REGISTRY = [
  {
    id: "corporate_brands",
    name: "Корпоративные порталы брендов",
    description: "Прямые коммерческие холдинги и бренды (МТС, Ozon, X5 Group, ПИК, Самолёт)",
    domains: ["mts.ru", "ozon.ru", "x5.ru", "samolet.ru", "pik.ru"],
    type: "direct_procurement"
  },
  {
    id: "industry_media",
    name: "Отраслевые медиа (Sostav, AdIndex, VC, New-Retail)",
    description: "Анонсы рекламных кампаний, запуски продуктов и ребрендинги для прямого выхода на ЛПР брендов",
    domains: ["sostav.ru", "adindex.ru", "vc.ru", "new-retail.ru"],
    type: "market_signals"
  },
  {
    id: "direct_briefs",
    name: "Прямые коммерческие брифы",
    description: "Запросы предложений на продакшн, 3D графику и презентационные фильмы от частного бизнеса",
    domains: ["vc.ru", "sostav.ru", "habr.com"],
    type: "direct_order"
  }
];
