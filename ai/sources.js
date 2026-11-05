/**
 * sources.js — Реестр источников, площадок и поисковых запросов для ИИ-радара
 */

// Поисковые запросы по ключевым каналам прямых коммерческих заказов:
// 1. Корпоративные порталы прямых закупок брендов (МТС, Ozon, ПИК, Самолёт)
// 2. Профессиональные Telegram-каналы продюсеров и агентский субподряд (CG Freelance, Norm Rabota)
// 3. HeadHunter проектные контракты для продакшн-команд (hh.ru)
// 4. Хабр Заказы (IT/B2B 3D), Workspace.ru и B2B-Center
export const ORDER_SEARCH_QUERIES = [
  'site:workspace.ru/tenders/ "3D" OR "анимация" OR "видео" OR "ролик"',
  'site:b2b-center.ru/market/ "видеоролик" OR "анимация" OR "3D" OR "CGI"',
  'site:tenders.mts.ru OR site:pik.ru OR site:samolet.ru OR site:suppliers.ozon.ru "видео" OR "3D"',
  'site:t.me ("ищем продакшн" OR "ищем студию" OR "ищем команду") ("3D" OR "видеоролик" OR "анимация")',
  'site:hh.ru/vacancy "проектная работа" ("3D" OR "моушн-дизайн" OR "видеоролик")',
  'site:freelance.habr.com "3D" OR "анимация" OR "видеоролик"'
];

// Запросы в отраслевые медиа для отслеживания маркетинговых кампаний брендов
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

// Каталог открытых площадок и платформ
export const PLATFORM_REGISTRY = [
  {
    id: "corporate_portals",
    name: "Корпоративные порталы брендов",
    description: "Прямые коммерческие закупки крупных частных холдингов (МТС, Ozon, VK, ПИК, Самолёт)",
    domains: ["tenders.mts.ru", "suppliers.ozon.ru", "pik.ru", "samolet.ru"],
    type: "direct_procurement"
  },
  {
    id: "pro_telegram",
    name: "Telegram-сообщества продюсеров",
    description: "Срочный агентский субподряд и проектные контракты для продакшн-команд",
    domains: ["t.me"],
    type: "creative_subcontract"
  },
  {
    id: "tenders_b2b",
    name: "Коммерческие тендеры (Workspace, B2B-Center)",
    description: "Открытые брифы девелоперов, финтеха и ритейла с подачей КП",
    domains: ["workspace.ru", "b2b-center.ru"],
    type: "open_tender"
  },
  {
    id: "industry_media",
    name: "Отраслевые медиа (Sostav, AdIndex, VC)",
    description: "Анонсы рекламных кампаний, запуски продуктов и ребрендинги для прямого выхода на ЛПР",
    domains: ["sostav.ru", "adindex.ru", "vc.ru"],
    type: "market_signals"
  }
];
