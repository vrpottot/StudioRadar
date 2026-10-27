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

// Каналы и чаты для мониторинга (по ТЗ и запросу заказчика)
export const DEFAULT_MONITORED_CHANNELS = [
  "brickspacer_career",  // Карьера и 3D/CGI проекты студии Brickspacer
  "designerworkchat",    // Чат работы и заказов для дизайнеров
  "CGWorkHub",           // CG Work Hub (компьютерная графика, 3D, моушен)
  "jetlagchat",          // Чат продакшна Jetlag (видео, съёмки, моушен)
  "cidjin_chat",         // Чат CG/3D сообщества Сиджин
  "desgangchat",         // Чат сообщества Desgang (дизайн, моушен)
  "aivacancychannel",    // Канал вакансий и заказов в сфере нейросетей и AI
  "motionhunter",        // Моушен-хантер заказы
  "cgfreelance"          // CG заказы и фриланс
];

// Полный перечень источников с метаданными и ссылками
export const MONITORED_TELEGRAM_SOURCES = [
  { id: "brickspacer_career", url: "https://t.me/brickspacer_career", name: "Brickspacer Career", type: "channel" },
  { id: "designerworkchat", url: "https://t.me/designerworkchat", name: "Designer Work Chat", type: "chat" },
  { id: "CGWorkHub", url: "https://t.me/CGWorkHub", name: "CG Work Hub", type: "channel" },
  { id: "+R_KxUQG5hYo5ZjAy", url: "https://t.me/+R_KxUQG5hYo5ZjAy", name: "CG Private Community", type: "private_invite" },
  { id: "jetlagchat", url: "https://t.me/jetlagchat", name: "Jetlag Production Chat", type: "chat" },
  { id: "cidjin_chat", url: "https://t.me/cidjin_chat", name: "Сиджин CG Chat", type: "chat" },
  { id: "desgangchat", url: "https://t.me/desgangchat", name: "Desgang Community", type: "chat" },
  { id: "aivacancychannel", url: "https://t.me/aivacancychannel", name: "AI Vacancy Channel", type: "channel" },
  { id: "motionhunter", url: "https://t.me/motionhunter", name: "Motion Hunter", type: "channel" },
  { id: "cgfreelance", url: "https://t.me/cgfreelance", name: "CG Freelance & Orders", type: "channel" }
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
