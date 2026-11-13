/** Public sources for direct production orders worldwide, including Russia and CIS. */
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
export const SEARCH_MAX_AGE_DAYS = 90;
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
  '3D CGI анимация', '2D анимация моушн-дизайн',
  'ИИ видеоролик', 'мультипликация', 'WebGL 3D интерактив'
];
const ENGLISH_SERVICES = ['3D CGI animation', '2D motion design', 'AI video production', 'animated film', 'WebGL interactive 3D'];
const ENGLISH_MARKETS = ['Europe', 'United States', 'United Kingdom', 'United Arab Emirates', 'India', 'Kazakhstan', 'Uzbekistan', 'Canada', 'Saudi Arabia', 'Australia'];
const BUYER_PHRASES = ['"ищем студию"', '"нужен подрядчик"', '"ищем команду"', '"нужна студия"', '"ищем подрядчика"',
  '"посоветуйте студию"', '"порекомендуйте продакшн"', '"ищу студию"', '"нужен продакшн"', '"ищем партнера"'];
const SERVICE_SEARCH_TERMS = ['(CGI OR "3D-анимация")', '("моушн-дизайн" OR "2D-анимация")', '("AI-видео" OR "ИИ-ролик")', '(мультфильм OR мультипликация)', '(WebGL OR "интерактивный 3D")'];
const INDUSTRY_TERMS = [
  'FMCG продукты напитки', 'военная промышленность', 'авто мото',
  'банк финтех', 'нефть газ', 'beauty косметика', 'электротехника',
  'рекламное агентство продакшн', 'недвижимость девелопер'
];
const ENGLISH_INDUSTRIES = ['food and beverages FMCG', 'defence manufacturing', 'automotive', 'banking and finance', 'oil and gas', 'beauty and cosmetics', 'electrical equipment', 'advertising agencies and production studios', 'real estate developers'];

// Every run covers all platforms and all configured industries, rather than one random query.
// Rotate service emphasis, but never restrict a whole industry to one CIS country.
// Engines receive different formulations without increasing the 72-request budget.
export function buildSearchJobs({ query = null, now = new Date(), round = 0 } = {}) {
  const day = Math.floor(now.getTime() / 86_400_000);
  return PLATFORM_REGISTRY.flatMap(platform => TARGET_INDUSTRIES.map((industry, i) => {
    const serviceIndex = (day + i + 2 * round) % SERVICE_TERMS.length;
    const intent = 'компания ищет внешнюю студию или команду-подрядчика для производства';
    // Broad discovery uses literal buyer language. Industry and geography need not
    // be named in the post; the qualifier still enforces all target lists.
    const english = ['linkedin', 'facebook'].includes(platform.id);
    const alternate = english
      ? `("looking for a studio" OR "seeking an agency" OR "production partner needed" OR "looking for a production house") ${ENGLISH_SERVICES[serviceIndex]} ${(i + round) % 3 === 0 ? ENGLISH_MARKETS[(i + round) % ENGLISH_MARKETS.length] : ''}`
      : `${BUYER_PHRASES[(i + round + 2 * Math.floor(i / 5)) % BUYER_PHRASES.length]} ${SERVICE_SEARCH_TERMS[serviceIndex]} ${platform.id === 'telegram' ? 'бюджет' : ''}`;
    return {
      platform: platform.id, industry, includeDomains: platform.domains,
      query: [query, english ? `A company in ${ENGLISH_INDUSTRIES[i]} seeking an external production studio or agency for ${ENGLISH_SERVICES[serviceIndex]}. Find the customer's current request, not supplier advertising or staff hiring. Customers worldwide including Russia and CIS; по всему миру.`
        : [intent, SERVICE_TERMS[serviceIndex], `для заказчика: ${INDUSTRY_TERMS[i]}. Заказчики по всему миру, включая Россию и СНГ. Нужен опубликованный запрос заказчика, не услуги исполнителя и не вакансия сотрудника.`].join(' ')].filter(Boolean).join(' '),
      tavilyQuery: [query, alternate, '-"ищу работу" -"предлагаю услуги" -"market report"'].filter(Boolean).join(' ')
    };
  }));
}
export const ORDER_SEARCH_QUERIES = buildSearchJobs().map(job => job.query);
