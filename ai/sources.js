/**
 * sources.js — Реестр источников, стоп-доменов и поисковых запросов для ИИ-радара
 * Сфокусирован ИСКЛЮЧИТЕЛЬНО на прямых коммерческих брендах и кампаниях.
 * Биржи фриланса, Telegram и любые тендерные площадки (включая Workspace и B2B-Center) ПОЛНОСТЬЮ ИСКЛЮЧЕНЫ.
 */

// Черный список доменов для Exa, Tavily и локальных фильтров
export const EXCLUDE_DOMAINS = [
  // 1. Биржи фриланса и частные агрегаторы
  'fl.ru', 'kwork.ru', 'freelance.ru', 'freelancehunt.com', 'weblancer.net',
  'work-zilla.com', 'youdo.com', 'dtf.ru', 'freelance.habr.com',
  'profi.ru', 'freelancer.com', 'upwork.com', 'fiverr.com', 'render.ru',
  'allfreelance.ru', 'kadrof.ru',

  // 2. Telegram-каналы и соцсети
  't.me', 'telegram.org', 'tgstat.ru', 'telemetr.me',
  'instagram.com', 'tiktok.com', 'youtube.com', 'pinterest.com',

  // 3. Тендерные площадки, агрегаторы и госзакупки ЛЮБОГО ТИПА
  'workspace.ru', 'b2b-center.ru', 'zakupki.gov.ru', 'rostender.info',
  'sberbank-ast.ru', 'tenderdetail.com', 'rts-tender.ru', 'roseltorg.ru',
  'tektorg.ru', 'etp-ets.ru', 'fabrikant.ru', 'tenderguru.ru',
  'tendersontime.com', 'zakupki.tochka.com', 'bicotender.ru', 'all-tenders.ru',
  'goszakupki.ru', 'tenders.mts.ru', 'suppliers.ozon.ru',

  // 4. Доски вакансий для найма в штат / резюме соискателей
  'hh.ru', 'superjob.ru', 'rabota.ru', 'zarplata.ru', 'avito.ru/rabota'
];

// Поисковые запросы по ПРЯМЫМ коммерческим кампаниям и запускам продуктов брендов
// Каждая найденная ссылка ведет НА СТАТЬЮ / ПУБЛИКАЦИЮ О ПРОЕКТЕ С ДЕТАЛЯМИ И ЛПР
export const ORDER_SEARCH_QUERIES = [
  'site:sostav.ru ("запустил" OR "представил" OR "кампания") ("3D ролик" OR "CGI" OR "моушн-дизайн" OR "анимация")',
  'site:adindex.ru ("рекламная кампания" OR "промо ролик" OR "3D") ("бренд" OR "запуск")',
  'site:new-retail.ru ("запустил" OR "кампания" OR "ролики с 3D" OR "CGI")',
  'site:vc.ru ("запустили" OR "представили новую") ("3D" OR "CGI" OR "видеоролик") бренд',
  'site:sostav.ru "директор по маркетингу" ("3D" OR "CGI" OR "анимация" OR "видеоролик")'
];

// Дополнительные запросы в отраслевые медиа для отслеживания маркетинговых кампаний брендов
export const MEDIA_SEARCH_QUERIES = [
  "site:sostav.ru ('запустил' OR 'представил') ('ролик' OR '3D' OR 'CGI')",
  "site:adindex.ru ('кампания' OR 'промо') ('видеоролик' OR '3D')",
  "site:vc.ru ('запустили' OR 'презентовали') ('3D ролик' OR 'CGI' OR 'анимация')",
  "site:new-retail.ru ('рекламная кампания' OR 'запуск') ('3D' OR 'ролик')"
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

// Каталог открытых площадок и медиа
export const PLATFORM_REGISTRY = [
  {
    id: "industry_media",
    name: "Отраслевые медиа (Sostav, AdIndex, VC, New-Retail)",
    description: "Анонсы рекламных кампаний, запуски продуктов и ребрендинги для прямого выхода на ЛПР брендов",
    domains: ["sostav.ru", "adindex.ru", "vc.ru", "new-retail.ru"],
    type: "market_signals"
  }
];
