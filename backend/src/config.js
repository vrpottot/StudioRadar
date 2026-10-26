import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 8001;
export const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.trim());

// Telegram MTProto (GramJS) credentials
export const TELEGRAM_API_ID = process.env.TELEGRAM_API_ID ? parseInt(process.env.TELEGRAM_API_ID) : 0;
export const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || '';
export const TELEGRAM_SESSION_NAME = process.env.TELEGRAM_SESSION_NAME || 'studioradar_session';

// 7 Целевых сфер студии (из таблицы заказчика) + B2B-субподряд (агентства и продакшны по п. 3 ТЗ)
export const TARGET_INDUSTRIES = [
  "Продукты питания и напитки",
  "Военная промышленность",
  "Авто и мото индустрия",
  "Банки и финансы",
  "Газ и нефть",
  "Бьюти",
  "Электротехника",
  "Рекламные агентства и продакшн"
];

// Перечень услуг студии (из ТЗ заказчика)
export const TARGET_SERVICES = [
  "3D моушен-дизайн и анимация",
  "2D моушен-дизайн и анимация",
  "ИИ видеоролики и графика",
  "2D и 3D мультипликация",
  "3D Web-приложения и интерактив"
];

// Каналы для мониторинга
export const DEFAULT_MONITORED_CHANNELS = [
  "motionhunter",        // Упомянут заказчиком
  "cgfreelance",         // Упомянут заказчиком
  "cmo_russia",          // Директора по маркетингу
  "marketing_brands_ru", // Прямые B2B запросы
  "tender_creatives",    // B2B закупки
  "ecom_brands_hub"      // E-commerce бренды
];

// Жесткие стоп-слова (отсев по ТЗ)
export const STOP_WORDS_STAFF = [
  "в штат", "на полную ставку", "full-time", "офис", "junior", "джуниор", 
  "стажер", "оклад", "зарплата от", "ищем сотрудника", "ищем коллегу",
  "администратор", "продавец", "кассир", "курьер", "оператор колл", "офис-менеджер"
];

export const STOP_WORDS_CHEAP = [
  "рилс", "reels", "shorts", "шортс", "нарезка", "монтажер рилс", 
  "бюджет 500", "бюджет 1000", "бартер", "за отзыв"
];

export const STOP_WORDS_EDUCATION = [
  "помогите обучиться", "обучение", "курсы", "наставничество", 
  "бесплатный вебинар", "марафон", "интенсив", "школа моушена",
  "педагог", "преподаватель", "учитель", "репетитор", "методист", "тьютор",
  "онлайн-школа", "детский клуб", "центр творчества"
];

export const STOP_DOMAINS_FREELANCE = [
  "fl.ru", "freelance.ru", "kwork.ru", "freelancehunt.com", 
  "weblancer.net", "youdo.com", "work-zilla.com"
];
