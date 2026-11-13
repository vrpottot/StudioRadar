import { db } from '../db/index.js';
import { broadcast } from '../ws/index.js';

export async function getLeads(filters = {}) {
  const { industry, service, status, only_with_phone, query } = filters;
  let leads = await db.getAllLeads();

  if (industry && industry !== 'Все 7 сфер' && industry !== 'Все сферы') {
    leads = leads.filter(l => l.industry === industry);
  }

  if (service && service !== 'Все услуги') {
    leads = leads.filter(l => l.service === service);
  }

  if (status && status !== 'all') {
    if (status === 'in_progress') {
      leads = leads.filter(l => ['in_progress', 'called', 'negotiation'].includes(l.status));
    } else if (status === 'closed') {
      leads = leads.filter(l => l.status === 'closed');
    } else {
      leads = leads.filter(l => l.status === status);
    }
  }

  if (only_with_phone === 'true' || only_with_phone === true) {
    leads = leads.filter(l => Boolean(l.phone));
  }

  if (query) {
    const q = query.toLowerCase();
    leads = leads.filter(l => 
      (l.company && l.company.toLowerCase().includes(q)) ||
      (l.contact_name && l.contact_name.toLowerCase().includes(q)) ||
      (l.request_text && l.request_text.toLowerCase().includes(q)) ||
      (l.phone && l.phone.includes(q))
    );
  }

  return leads;
}

export function getLeadById(id) {
  return db.getLeadById(id);
}

export async function updateLeadStatus(id, status) {
  const updated = await db.updateLeadStatus(id, status);
  if (updated) {
    broadcast({ type: 'lead_status_updated', lead_id: id, status });
  }
  return updated;
}

export async function updateLeadNotes(id, notes) {
  return await db.updateLeadNotes(id, notes);
}

export async function getStats() {
  return db.getStats();
}
