/**
 * Данные и управление стратегиями поиска (Пайплайны, Раздел 3 и 13.4 ТЗ)
 */

export const INITIAL_PIPELINES = [
  {
    id: "pipe_3d_studios",
    name: "Студии и продакшны с потребностью в 3D/CGI",
    description: "Поиск заказов на субподряд по 3D графике, моушн-дизайну и сложной продуктовой анимации от видеопродакшнов и агентств.",
    status: "active", // active | paused | error
    targetServices: [
      "3D моушен-дизайн и анимация",
      "ИИ видеоролики и графика"
    ],
    targetIndustries: [
      "Рекламные агентства и продакшн",
      "Электротехника"
    ],
    selectedSignals: [
      "sig_direct_tender",
      "sig_direct_order",
      "sig_prof_subcontract"
    ],
    sources: ["Telegram Channels", "hh.ru"],
    priorityMinScore: 75,
    minGrade: "A",
    trackedCompanies: 48,
    newSignalsToday: 12,
    highPriorityLeads: 8,
    lastRunAt: "2026-10-27 16:30"
  },
  {
    id: "pipe_direct_brands_fmcg",
    name: "Прямые бренды: Продукты питания, Напитки и Бьюти",
    description: "Ежедневный мониторинг производителей FMCG и косметики на запуск новых рекламных кампаний, редизайн упаковки и тендеры.",
    status: "active",
    targetServices: [
      "3D моушен-дизайн и анимация",
      "2D моушен-дизайн и анимация",
      "2D и 3D мультипликация"
    ],
    targetIndustries: [
      "Продукты питания и напитки",
      "Бьюти"
    ],
    selectedSignals: [
      "sig_direct_order",
      "sig_mkt_rebranding",
      "sig_hire_motion_3d"
    ],
    sources: ["hh.ru", "Web Search", "Telegram Channels"],
    priorityMinScore: 70,
    minGrade: "B",
    trackedCompanies: 64,
    newSignalsToday: 9,
    highPriorityLeads: 6,
    lastRunAt: "2026-10-27 15:45"
  },
  {
    id: "pipe_industrial_military",
    name: "Тяжелая промышленность: Авто, Нефтегаз и ВПК",
    description: "Поиск промышленных предприятий, готовящих 3D демонстрации оборудования, презентационные ролики для форумов и выставок.",
    status: "active",
    targetServices: [
      "3D моушен-дизайн и анимация",
      "3D Web-приложения и интерактив"
    ],
    targetIndustries: [
      "Авто и мото индустрия",
      "Газ и нефть",
      "Военная промышленность"
    ],
    selectedSignals: [
      "sig_direct_tender",
      "sig_mkt_expo",
      "sig_direct_3d_web"
    ],
    sources: ["hh.ru", "Web Search"],
    priorityMinScore: 80,
    minGrade: "A",
    trackedCompanies: 32,
    newSignalsToday: 4,
    highPriorityLeads: 3,
    lastRunAt: "2026-10-27 14:10"
  },
  {
    id: "pipe_fintech_web3d",
    name: "Банки и Финтех: 3D Web & Продуктовый моушн",
    description: "Отслеживание финтех-компаний и банков, обновляющих мобильные приложения и сайты с использованием интерактивного 3D.",
    status: "paused",
    targetServices: [
      "3D Web-приложения и интерактив",
      "ИИ видеоролики и графика"
    ],
    targetIndustries: [
      "Банки и финансы"
    ],
    selectedSignals: [
      "sig_direct_3d_web",
      "sig_hire_ai_artist",
      "sig_biz_investment"
    ],
    sources: ["hh.ru", "Telegram Channels"],
    priorityMinScore: 70,
    minGrade: "B",
    trackedCompanies: 29,
    newSignalsToday: 0,
    highPriorityLeads: 2,
    lastRunAt: "2026-10-26 18:00"
  }
];

const LOCAL_STORAGE_KEY = 'studioradar_pipelines_v1';

export function getSavedPipelines() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return INITIAL_PIPELINES;
}

export function savePipelines(pipelines) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pipelines));
  } catch (e) {}
}
