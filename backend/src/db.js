import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'leads.json');

// Инициализация базы данных: только реальные спарсенные заказы (без демо-данных)
const INITIAL_LEADS = [];

class Database {
  constructor() {
    this.leads = [];
  }

  async init() {
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      this.leads = JSON.parse(data);
    } catch (e) {
      this.leads = [...INITIAL_LEADS];
      await this.save();
    }
    console.log(`[Database] Загружено лидов: ${this.leads.length}`);
  }

  async reload() {
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      this.leads = JSON.parse(data);
    } catch (e) {
      // Игнорируем ошибку чтения
    }
  }

  async save() {
    try {
      await fs.writeFile(DB_FILE, JSON.stringify(this.leads, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Database] Ошибка сохранения:', e);
    }
  }

  getAllLeads() {
    return this.leads
      .filter(l => !l.id.startsWith('lead-'))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getLeadById(id) {
    return this.leads.find(l => l.id === id);
  }

  async addLead(leadData) {
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
    await this.save();
    return newLead;
  }

  async updateLeadStatus(id, newStatus) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return null;
    lead.status = newStatus;
    lead.updated_at = new Date().toISOString();
    await this.save();
    return lead;
  }

  async updateLeadNotes(id, notes) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return null;
    lead.notes = notes;
    lead.updated_at = new Date().toISOString();
    await this.save();
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
}

export const db = new Database();
