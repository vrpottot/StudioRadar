export const TARGET_INDUSTRIES = [
  "Все сферы",
  "Продукты питания и напитки",
  "Военная промышленность",
  "Авто и мото индустрия",
  "Банки и финансы",
  "Газ и нефть",
  "Бьюти",
  "Электротехника",
  "Рекламные агентства и продакшн"
];

export const TARGET_SERVICES = [
  "Все услуги",
  "3D моушен-дизайн и анимация",
  "2D моушен-дизайн и анимация",
  "ИИ видеоролики и графика",
  "2D и 3D мультипликация",
  "3D Web-приложения и интерактив"
];

export const LEAD_STATUSES = [
  { id: "new", label: "Новый", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { id: "contacts_unconfirmed", label: "Требует телефона", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  { id: "in_progress", label: "Взят в работу", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { id: "called", label: "Созвонились", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { id: "negotiation", label: "Переговоры / КП", color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  { id: "closed", label: "Сделка", color: "bg-emerald-500 text-slate-950 font-semibold border-emerald-400" },
  { id: "rejected", label: "Не подходит", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" }
];

// Уровни приоритета по п. 7.4 ТЗ (A+, A, B, C, D, E)
export const LEAD_GRADES = {
  "A+": {
    label: "A+",
    name: "Исключительно высокий",
    minScore: 90,
    badgeBg: "var(--accent-emerald-subtle)",
    badgeText: "var(--color-accent-green-text)",
    badgeBorder: "var(--color-accent-green)"
  },
  "A": {
    label: "A",
    name: "Высокий приоритет",
    minScore: 75,
    badgeBg: "#f3effb",
    badgeText: "var(--color-accent-purple)",
    badgeBorder: "var(--color-accent-lavender)"
  },
  "B": {
    label: "B",
    name: "Перспективный",
    minScore: 60,
    badgeBg: "#e7eef6",
    badgeText: "#1e3a5f",
    badgeBorder: "#cde0f1"
  },
  "C": {
    label: "C",
    name: "Средний",
    minScore: 45,
    badgeBg: "#fdf0e6",
    badgeText: "#7b3306",
    badgeBorder: "#f4e6d7"
  },
  "D": {
    label: "D",
    name: "Низкий",
    minScore: 30,
    badgeBg: "#f8f7f4",
    badgeText: "#727272",
    badgeBorder: "#e8e5dc"
  },
  "E": {
    label: "E",
    name: "Отклонен",
    minScore: 0,
    badgeBg: "#f6c9c0",
    badgeText: "#6b0c26",
    badgeBorder: "#f1b3a7"
  }
};

export function getLeadGrade(score) {
  const num = Number(score) || 0;
  if (num >= 90) return "A+";
  if (num >= 75) return "A";
  if (num >= 60) return "B";
  if (num >= 45) return "C";
  if (num >= 30) return "D";
  return "E";
}

export const INITIAL_LEADS = [];
export const REALTIME_NEW_POOL = [];
