/** Public sources for direct production orders in Russia and the CIS. */
export const EXCLUDE_DOMAINS = [
  'fl.ru', 'kwork.ru', 'freelance.ru', 'freelancehunt.com', 'weblancer.net',
  'work-zilla.com', 'youdo.com', 'freelance.habr.com', 'profi.ru',
  'freelancer.com', 'upwork.com', 'fiverr.com', 'allfreelance.ru', 'kadrof.ru',
  'workspace.ru', 'b2b-center.ru', 'zakupki.gov.ru', 'rostender.info',
  'sberbank-ast.ru', 'tenderdetail.com', 'rts-tender.ru', 'roseltorg.ru',
  'tektorg.ru', 'etp-ets.ru', 'fabrikant.ru', 'tenderguru.ru',
  'tendersontime.com', 'zakupki.tochka.com', 'bicotender.ru', 'all-tenders.ru',
  'goszakupki.ru', 'tenders.mts.ru', 'suppliers.ozon.ru'
];

export const TELEGRAM_MIN_BUDGET_RUB = 900_000;
export const SEARCH_MAX_AGE_DAYS = 30;
export const TARGET_COUNTRIES = [
  'Россия', 'Беларусь', 'Казахстан', 'Армения', 'Азербайджан',
  'Кыргызстан', 'Узбекистан', 'Таджикистан', 'Молдова', 'Туркменистан'
];
export const PLATFORM_REGISTRY = [
  { id: 'hh', name: 'HeadHunter — проектный подряд', domains: ['hh.ru', 'hh.kz', 'hh.uz', 'hh.kg', 'hh1.az', 'rabota.by'] },
  { id: 'telegram', name: 'Telegram — публичные заказы от 900 000 ₽', domains: ['t.me'] },
  { id: 'linkedin', name: 'LinkedIn — публичные запросы компаний', domains: ['linkedin.com'] },
  { id: 'facebook', name: 'Facebook — публичные запросы компаний', domains: ['facebook.com'] }
];

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


const SERVICE_TERMS = [
  '3D CGI моушн motion design', '2D animation анимация эксплейнер',
  'AI video ИИ видеоролик', '2D 3D мультипликация', 'WebGL interactive 3D интерактив'
];
const INDUSTRY_TERMS = [
  'FMCG продукты напитки', 'военная промышленность', 'авто мото',
  'банк финтех', 'нефть газ', 'beauty косметика', 'электротехника',
  'рекламное агентство продакшн', 'недвижимость девелопер'
];

// Every run covers all platforms and all configured industries, rather than one random query.
// Rotate service/country emphasis daily; the classifier always checks the full target lists.
export function buildSearchJobs({ query = null, now = new Date() } = {}) {
  const day = Math.floor(now.getTime() / 86_400_000);
  return PLATFORM_REGISTRY.flatMap(platform => TARGET_INDUSTRIES.map((industry, i) => {
    const region = TARGET_COUNTRIES[(day + i) % TARGET_COUNTRIES.length];
    const intent = platform.id === 'telegram'
      ? 'ищем студию подрядчика бюджет от 900000 рублей'
      : 'ищем подрядчика студию проект outsourcing production partner';
    return {
      platform: platform.id, industry, includeDomains: platform.domains,
      query: [query, INDUSTRY_TERMS[i], SERVICE_TERMS[(day + i) % SERVICE_TERMS.length], intent, region].filter(Boolean).join(' ')
    };
  }));
}
export const ORDER_SEARCH_QUERIES = buildSearchJobs().map(job => job.query);
