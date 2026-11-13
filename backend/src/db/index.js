import { randomUUID } from 'node:crypto';
import { isBannedLead, canonicalUrl } from '../../../ai/policy.js';
import { getPool } from './connection.js';
import { DEFAULT_SETTINGS, cleanSettings } from './settings.js';
export { isBannedLead } from '../../../ai/policy.js';

export function statsForLeads(leads) {
  const visible = leads.filter(lead => !isBannedLead(lead));
  const total = visible.length;
  const withPhone = visible.filter(lead => Boolean(lead.phone)).length;
  return {
    total_leads: total, stored_total: leads.length, hidden_by_policy: leads.length - total,
    with_phone: withPhone,
    unconfirmed_phone: visible.filter(lead => !lead.phone || lead.status === 'contacts_unconfirmed').length,
    with_phone_pct: total ? Math.round(withPhone / total * 100) : 0,
    direct_clients_pct: total ? Math.round(visible.filter(lead => lead.verified_direct).length / total * 100) : 0,
    in_progress: visible.filter(lead => ['in_progress', 'called', 'negotiation'].includes(lead.status)).length,
    closed: visible.filter(lead => lead.status === 'closed').length
  };
}

/** Postgres is the sole source of runtime data; every write is acknowledged by DB. */
export class Database {
  constructor(pool) { this.pool = pool; }
  query(sql, values = []) { return (this.pool || getPool()).query(sql, values); }

  async init() {
    // Fail startup if migration/credentials are missing; never create an empty file fallback.
    for (const table of ['leads', 'pipelines', 'app_settings', 'search_runs', 'search_candidates']) {
      await this.query(`select 1 from public.${table} limit 0`);
    }
    await this.query("insert into public.app_settings(id, data) values ('global', $1::jsonb) on conflict (id) do nothing", [JSON.stringify(DEFAULT_SETTINGS)]);
    console.log('[Database] Подключено хранилище PostgreSQL / Supabase');
  }

  async getStoredLeads() {
    const result = await this.query('select data from public.leads order by created_at desc, id');
    return result.rows.map(row => row.data);
  }
  async getAllLeads() { return (await this.getStoredLeads()).filter(lead => !isBannedLead(lead)); }
  async getLeadById(id) {
    const result = await this.query('select data from public.leads where id = $1', [id]);
    return result.rows[0]?.data || null;
  }
  async addLead(data) {
    if (isBannedLead(data)) return null;
    const now = new Date().toISOString();
    const lead = { ...data, id: data.id || `order-${randomUUID()}`, created_at: data.created_at || now, updated_at: now };
    const result = await this.query(`insert into public.leads(id, canonical_url, data, created_at, updated_at)
      values ($1, $2, $3::jsonb, $4, $5) on conflict do nothing returning data`,
    [lead.id, canonicalUrl(lead.url), JSON.stringify(lead), lead.created_at, lead.updated_at]);
    return result.rows[0]?.data || null;
  }
  async patchLead(id, patch) {
    const updated = { ...patch, updated_at: new Date().toISOString() };
    const result = await this.query(`update public.leads set data = data || $2::jsonb,
      updated_at = now() where id = $1 returning data`, [id, JSON.stringify(updated)]);
    return result.rows[0]?.data || null;
  }
  updateLeadStatus(id, status) { return this.patchLead(id, { status }); }
  updateLeadNotes(id, notes) { return this.patchLead(id, { notes }); }
  async getStats() { return statsForLeads(await this.getStoredLeads()); }

  async getAllPipelines() {
    const result = await this.query('select data from public.pipelines order by created_at desc, id');
    return result.rows.map(row => row.data);
  }
  async getPipelineById(id) {
    const result = await this.query('select data from public.pipelines where id = $1', [id]);
    return result.rows[0]?.data || null;
  }
  async addPipeline(data) {
    const now = new Date().toISOString();
    const pipe = {
      id: data.id || `pipe_${randomUUID()}`, name: data.name || 'Новый пайплайн',
      description: data.description || '', status: data.status || 'active',
      targetServices: data.targetServices || [], targetIndustries: data.targetIndustries || [],
      selectedSignals: data.selectedSignals || [], sources: data.sources || [],
      priorityMinScore: data.priorityMinScore ?? 70, minGrade: data.minGrade || 'B',
      trackedCompanies: 0, newSignalsToday: 0, highPriorityLeads: 0,
      lastRunAt: data.lastRunAt || 'Не запускался', created_at: now, updated_at: now
    };
    const result = await this.query('insert into public.pipelines(id, data, created_at, updated_at) values ($1, $2::jsonb, $3, $3) returning data',
      [pipe.id, JSON.stringify(pipe), now]);
    return result.rows[0].data;
  }
  async updatePipeline(id, data) {
    const { id: ignoredId, created_at: ignoredCreatedAt, ...patch } = data;
    patch.updated_at = new Date().toISOString();
    const result = await this.query(`update public.pipelines set data = data || $2::jsonb,
      updated_at = now() where id = $1 returning data`, [id, JSON.stringify(patch)]);
    return result.rows[0]?.data || null;
  }
  async togglePipelineStatus(id) {
    const result = await this.query(`update public.pipelines set data = data || jsonb_build_object(
      'status', case when data->>'status' = 'active' then 'paused' else 'active' end,
      'updated_at', now()), updated_at = now() where id = $1 returning data`, [id]);
    return result.rows[0]?.data || null;
  }
  async deletePipeline(id) {
    return (await this.query('delete from public.pipelines where id = $1 returning id', [id])).rowCount > 0;
  }
  async duplicatePipeline(id) {
    const original = await this.getPipelineById(id);
    if (!original) return null;
    return this.addPipeline({ ...original, id: undefined, name: `${original.name} (Копия)`, lastRunAt: 'Не запускался' });
  }

  async getSettings() {
    const result = await this.query("select data from public.app_settings where id = 'global'");
    return { ...DEFAULT_SETTINGS, ...cleanSettings(result.rows[0]?.data) };
  }
  async updateSettings(data) {
    if (Object.keys(data).some(key => /api_key|secret|token/i.test(key))) {
      throw new Error('API-ключи задаются только в серверном backend/.env и не сохраняются в БД.');
    }
    const patch = { ...cleanSettings(data), ai_provider: 'gemini', updated_at: new Date().toISOString() };
    const result = await this.query(`insert into public.app_settings(id, data) values ('global', $1::jsonb)
      on conflict(id) do update set data = app_settings.data || excluded.data, updated_at = now() returning data`, [JSON.stringify(patch)]);
    return { ...DEFAULT_SETTINGS, ...cleanSettings(result.rows[0].data) };
  }

  async startSearchRun({ query, limit }) {
    const id = randomUUID();
    await this.query("insert into public.search_runs(id, status, query, result_limit) values ($1, 'running', $2, $3)", [id, query, limit]);
    return id;
  }
  async finishSearchRun(id, { status, diagnostics = {}, found = 0, added = 0, error = null }) {
    await this.query(`update public.search_runs set status = $2, diagnostics = $3::jsonb,
      found_count = $4, added_count = $5, error = $6, finished_at = now() where id = $1`,
    [id, status, JSON.stringify(diagnostics), found, added, error]);
  }
  async saveCandidate(runId, candidate) {
    await this.query(`insert into public.search_candidates(run_id, url, platform, search_provider, title,
      evidence_text, accepted, rejection_reason, evaluation) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
      on conflict(run_id, url) do update set platform=excluded.platform, search_provider=excluded.search_provider,
      title=excluded.title, evidence_text=excluded.evidence_text, accepted=excluded.accepted,
      rejection_reason=excluded.rejection_reason, evaluation=excluded.evaluation, checked_at=now()`, [runId, candidate.url, candidate.platform, candidate.search_provider,
      candidate.title, candidate.text, candidate.accepted, candidate.reason || null, JSON.stringify(candidate.evaluation || null)]);
  }

  async saveDiscoveredCandidates(runId, candidates) {
    if (!candidates.length) return;
    const rows = candidates.map(item => ({url:item.url, title:item.title || null,
      search_provider:item.source || null, evidence_text:(item.snippet || '').slice(0,16000),
      evaluation:{status:'pending',publishedDate:item.publishedDate || null}}));
    await this.query(`insert into public.search_candidates(run_id,url,title,search_provider,evidence_text,accepted,rejection_reason,evaluation)
      select $1,x.url,x.title,x.search_provider,x.evidence_text,false,'pending',x.evaluation
      from jsonb_to_recordset($2::jsonb) as x(url text,title text,search_provider text,evidence_text text,evaluation jsonb)
      on conflict(run_id,url) do nothing`, [runId,JSON.stringify(rows)]);
  }

  async getPendingCandidates(limit = 300) {
    const result = await this.query(`select url,title,evidence_text as snippet,search_provider as source,evaluation->>'publishedDate' as "publishedDate"
      from (select distinct on (url) url,title,evidence_text,search_provider,accepted,rejection_reason,evaluation,checked_at
        from public.search_candidates order by url,checked_at desc) latest
      where accepted=false and (rejection_reason='pending' or evaluation->>'code' in ('AI_PROVIDER_ERROR','LEAD_PERSIST_ERROR'))
      order by checked_at desc limit $1`, [limit]);
    return result.rows;
  }

  async getLatestSearchFeedback() {
    const result=await this.query(`select diagnostics from public.search_runs
      where status in ('completed','failed') order by started_at desc limit 1`);
    return result.rows[0]?.diagnostics || {};
  }
}

export const db = new Database();
