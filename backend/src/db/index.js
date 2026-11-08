import fs from 'fs/promises';
import { LEADS_FILE, PIPELINES_FILE, SETTINGS_FILE } from '../config/index.js';

// Начальные пайплайны по ТЗ
const INITIAL_PIPELINES = [
  {
    id: "pipe_3d_studios",
    name: "Студии и продакшны с потребностью в 3D/CGI",
    description: "Поиск заказов на субподряд по 3D графике, моушн-дизайну и сложной продуктовой анимации от видеопродакшнов и агентств.",
    status: "active",
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
    sources: ["Web Search", "Отраслевые медиа"],
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
    description: "Ежедневный мониторинг производителей FMCG и косметики на запуск новых рекламных кампаний, редизайн упаковки и брифы.",
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
    sources: ["ЕИС Закупки", "Web Search", "Habr Design"],
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
    sources: ["ЕИС Закупки", "Web Search"],
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
    sources: ["ЕИС Закупки", "Web Search"],
    priorityMinScore: 70,
    minGrade: "B",
    trackedCompanies: 29,
    newSignalsToday: 0,
    highPriorityLeads: 2,
    lastRunAt: "2026-10-26 18:00"
  }
];

const INITIAL_SETTINGS = {
  notify_on_a_only: true,
  daily_digest_time: "09:00",
  min_score_threshold: 70,
  staff_stop_words: [
    "в штат", "полная ставка", "junior", "стажер", "оклад", "курьер", "офис-менеджер"
  ],
  cheap_stop_words: [
    "рилс", "reels", "shorts", "шортс", "нарезка", "бюджет 500", "за отзыв"
  ],
  education_stop_words: [
    "обучение", "курсы", "наставничество", "вебинар", "марафон", "онлайн-школа"
  ],
  ai_provider: "autonomous"
};

// Список запрещенных источников и паттернов (фриланс-биржи, TG, тендерные площадки, Workspace, B2B-Center, HR)
export const BANNED_PATTERNS = [
  'telegram', 't.me', 'fl.ru', 'kwork', 'freelance', 'freelancehunt',
  'weblancer', 'work-zilla', 'youdo', 'dtf.ru',
  'workspace.ru', 'workspace', 'b2b-center',
  'tender', 'тендер', 'тендерный', 'zakupki', 'rostender', 'sberbank-ast',
  '44-фз', '223-фз', 'госзакупка', 'электронный аукцион',
  'hh.ru', 'superjob.ru', 'rabota.ru', 'zarplata.ru'
];

export function isBannedLead(l) {
  if (!l) return true;
  const text = `${l.id || ''} ${l.company || ''} ${l.source || ''} ${l.url || ''} ${l.apply_url || ''} ${l.contact_name || ''} ${l.request_text || ''}`.toLowerCase();
  return BANNED_PATTERNS.some(p => text.includes(p));
}

class Database {
  constructor() {
    this.leads = [];
    this.pipelines = [];
    this.settings = { ...INITIAL_SETTINGS };
  }

  async init() {
    try {
      const data = await fs.readFile(LEADS_FILE, 'utf-8');
      const loaded = JSON.parse(data);
      this.leads = loaded.filter(l => !isBannedLead(l));
      if (this.leads.length !== loaded.length) {
        await this.saveLeads();
      }
    } catch {
      this.leads = [];
      await this.saveLeads();
    }

    try {
      const pData = await fs.readFile(PIPELINES_FILE, 'utf-8');
      this.pipelines = JSON.parse(pData);
    } catch {
      this.pipelines = [...INITIAL_PIPELINES];
      await this.savePipelines();
    }

    try {
      const sData = await fs.readFile(SETTINGS_FILE, 'utf-8');
      this.settings = { ...INITIAL_SETTINGS, ...JSON.parse(sData) };
    } catch {
      this.settings = { ...INITIAL_SETTINGS };
      await this.saveSettings();
    }

    console.log(`[Database] Загружено лидов: ${this.leads.length}, пайплайнов: ${this.pipelines.length}`);
  }

  async reload() {
    try {
      const data = await fs.readFile(LEADS_FILE, 'utf-8');
      this.leads = JSON.parse(data);
    } catch {}

    try {
      const pData = await fs.readFile(PIPELINES_FILE, 'utf-8');
      this.pipelines = JSON.parse(pData);
    } catch {}

    try {
      const sData = await fs.readFile(SETTINGS_FILE, 'utf-8');
      this.settings = JSON.parse(sData);
    } catch {}
  }

  async saveLeads() {
    try {
      await fs.writeFile(LEADS_FILE, JSON.stringify(this.leads, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Database] Ошибка сохранения лидов:', e);
    }
  }

  async savePipelines() {
    try {
      await fs.writeFile(PIPELINES_FILE, JSON.stringify(this.pipelines, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Database] Ошибка сохранения пайплайнов:', e);
    }
  }

  async saveSettings() {
    try {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Database] Ошибка сохранения настроек:', e);
    }
  }

  // --- ЛИДЫ ---
  getAllLeads() {
    return this.leads
      .filter(l => !isBannedLead(l))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  getLeadById(id) {
    return this.leads.find(l => l.id === id);
  }

  async addLead(leadData) {
    if (isBannedLead(leadData)) {
      console.warn('[Database] Отклонена попытка добавить лид из запрещенного источника (ТГ/Фриланс/Тендер):', leadData?.company, leadData?.source);
      return null;
    }

    const existing = this.leads.find(l => 
      l.id === leadData.id || 
      (l.company && leadData.company && 
       l.company.trim().toLowerCase() === leadData.company.trim().toLowerCase() && 
       l.title && leadData.title && 
       l.title.trim().toLowerCase() === leadData.title.trim().toLowerCase())
    );
    if (existing) return null;

    const newLead = {
      ...leadData,
      created_at: leadData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.leads.unshift(newLead);
    await this.saveLeads();
    return newLead;
  }

  async updateLeadStatus(id, newStatus) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return null;
    lead.status = newStatus;
    lead.updated_at = new Date().toISOString();
    await this.saveLeads();
    return lead;
  }

  async updateLeadNotes(id, notes) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return null;
    lead.notes = notes;
    lead.updated_at = new Date().toISOString();
    await this.saveLeads();
    return lead;
  }

  getStats() {
    const total = this.leads.length;
    const withPhone = this.leads.filter(l => Boolean(l.phone)).length;
    const unconfirmed = this.leads.filter(l => !l.phone || l.status === 'contacts_unconfirmed').length;
    const inProgress = this.leads.filter(l => ['in_progress', 'called', 'negotiation'].includes(l.status)).length;
    const closed = this.leads.filter(l => l.status === 'closed').length;

    return {
      total_leads: total,
      with_phone: withPhone,
      unconfirmed_phone: unconfirmed,
      with_phone_pct: total ? Math.round((withPhone / total) * 100) : 0,
      direct_clients_pct: 100,
      in_progress: inProgress,
      closed: closed
    };
  }

  // --- ПАЙПЛАЙНЫ ---
  getAllPipelines() {
    return this.pipelines;
  }

  getPipelineById(id) {
    return this.pipelines.find(p => p.id === id);
  }

  async addPipeline(pipeData) {
    const newPipe = {
      id: pipeData.id || `pipe_${Date.now()}`,
      name: pipeData.name || 'Новый пайплайн',
      description: pipeData.description || '',
      status: pipeData.status || 'active',
      targetServices: pipeData.targetServices || [],
      targetIndustries: pipeData.targetIndustries || [],
      selectedSignals: pipeData.selectedSignals || [],
      sources: pipeData.sources || ["ЕИС Закупки", "Web Search"],
      priorityMinScore: pipeData.priorityMinScore || 70,
      minGrade: pipeData.minGrade || (pipeData.priorityMinScore >= 80 ? "A" : "B"),
      trackedCompanies: pipeData.trackedCompanies || Math.floor(Math.random() * 20) + 10,
      newSignalsToday: pipeData.newSignalsToday || 0,
      highPriorityLeads: pipeData.highPriorityLeads || 0,
      lastRunAt: pipeData.lastRunAt || 'Не запускался',
      created_at: new Date().toISOString()
    };
    this.pipelines.unshift(newPipe);
    await this.savePipelines();
    return newPipe;
  }

  async updatePipeline(id, data) {
    const idx = this.pipelines.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.pipelines[idx] = {
      ...this.pipelines[idx],
      ...data,
      updated_at: new Date().toISOString()
    };
    await this.savePipelines();
    return this.pipelines[idx];
  }

  async togglePipelineStatus(id) {
    const pipe = this.pipelines.find(p => p.id === id);
    if (!pipe) return null;
    pipe.status = pipe.status === 'active' ? 'paused' : 'active';
    pipe.updated_at = new Date().toISOString();
    await this.savePipelines();
    return pipe;
  }

  async deletePipeline(id) {
    const initialLen = this.pipelines.length;
    this.pipelines = this.pipelines.filter(p => p.id !== id);
    if (this.pipelines.length === initialLen) return false;
    await this.savePipelines();
    return true;
  }

  async duplicatePipeline(id) {
    const original = this.pipelines.find(p => p.id === id);
    if (!original) return null;

    const copy = {
      ...original,
      id: `pipe_${Date.now()}`,
      name: `${original.name} (Копия)`,
      lastRunAt: 'Не запускался',
      created_at: new Date().toISOString()
    };
    this.pipelines.unshift(copy);
    await this.savePipelines();
    return copy;
  }

  // --- НАСТРОЙКИ ---
  getSettings() {
    return this.settings;
  }

  async updateSettings(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings,
      updated_at: new Date().toISOString()
    };
    await this.saveSettings();
    return this.settings;
  }
}

export const db = new Database();
