/**
 * sources.js — Реестр источников, площадок, стоп-доменов и поисковых запросов для ИИ-радара
 * Сфокусирован на прямых B2B-заказах с прямыми ссылками на брифы и маркетинговых сигналах брендов.
 * Фриланс-биржи с демпингом, Telegram-каналы и гостендеры 44/223-ФЗ строго исключены.
 */

// Черный список доменов для Exa, Tavily и локальных фильтров
export const EXCLUDE_DOMAINS = [
  // 1. Биржи фриланса и агрегаторы частных исполнителей (демпинг и копеечные заказы)
  'fl.ru', 'kwork.ru', 'freelance.ru', 'freelancehunt.com', 'weblancer.net',
  'work-zilla.com', 'youdo.com', 'dtf.ru', 'freelance.habr.com',
  'profi.ru', 'freelancer.com', 'upwork.com', 'fiverr.com', 'render.ru/ru/jobs/freelance',
  'allfreelance.ru', 'kadrof.ru',

  // 2. Telegram-каналы и социальные агрегаторы
  't.me', 'telegram.org', 'tgstat.ru', 'telemetr.me',
  'instagram.com', 'tiktok.com', 'youtube.com', 'pinterest.com',

  // 3. Государственные бюджетные закупки (44-ФЗ, 223-ФЗ, школы, больницы, госаукционы)
  'zakupki.gov.ru', 'rostender.info', 'sberbank-ast.ru',
  'tenderdetail.com', 'rts-tender.ru', 'roseltorg.ru', 'tektorg.ru',
  'etp-ets.ru', 'goszakupki.ru', 'bicotender.ru', 'all-tenders.ru',

  // 4. Доски вакансий для найма в штат / резюме соискателей
  'hh.ru', 'superjob.ru', 'rabota.ru', 'zarplata.ru', 'avito.ru/rabota'
];

// Поисковые запросы по ПРЯМЫМ ЗАКАЗАМ с прямыми ссылками на карточки брифов/задач:
export const ORDER_SEARCH_QUERIES = [
  'site:workspace.ru/tenders/ "3D" OR "анимация" OR "видеоролик" OR "CGI" OR "моушн"',
  'site:b2b-center.ru/market/ "видеоролик" OR "анимация" OR "3D" OR "CGI"',
  'site:tenders.mts.ru OR site:suppliers.ozon.ru "видео" OR "3D" OR "анимация"',
  'site:vc.ru ("ищем студию" OR "ищем продакшн" OR "бриф на создание") ("3D" OR "видеоролик")',
  '"бриф на производство" ("видеоролика" OR "3D анимации" OR "CGI") "заказчик" -site:fl.ru -site:kwork.ru'
];

// Запросы в отраслевые медиа для отслеживания МАРКЕТИНГОВЫХ СИГНАЛОВ брендов:
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

// Каталог открытых площадок и платформ прямого спроса
export const PLATFORM_REGISTRY = [
  {
    id: "workspace_briefs",
    name: "Открытые брифы Workspace.ru",
    description: "Прямые коммерческие брифы агентств и брендов на 3D, моушн и видеопроизводство с прямым откликом",
    domains: ["workspace.ru"],
    type: "direct_order"
  },
  {
    id: "corporate_brands",
    name: "Корпоративные закупки частных холдингов",
    description: "Прямые коммерческие запросы предложений брендов (МТС, Ozon, X5 Group, B2B-Center коммерческий)",
    domains: ["tenders.mts.ru", "suppliers.ozon.ru", "b2b-center.ru"],
    type: "direct_order"
  },
  {
    id: "industry_media",
    name: "Отраслевые медиа (Sostav, AdIndex, VC, New-Retail)",
    description: "Анонсы рекламных кампаний, запуски продуктов и ребрендинги для прямого выхода на ЛПР брендов",
    domains: ["sostav.ru", "adindex.ru", "vc.ru", "new-retail.ru"],
    type: "market_signals"
  }
];
