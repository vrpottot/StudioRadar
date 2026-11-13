import { db } from '../src/db/index.js';
import { closePool } from '../src/db/connection.js';

try {
  const [leads, pipelines] = await Promise.all([db.getStoredLeads(), db.getAllPipelines(), db.getSettings(),
    db.query('select 1 from public.search_runs limit 0'), db.query('select 1 from public.search_candidates limit 0')]);
  console.log(JSON.stringify({ database: 'supabase-postgresql', stored_leads: leads.length, pipelines: pipelines.length }));
} catch (error) {
  console.error('[Database check]', error.message);
  process.exitCode = 1;
} finally { await closePool(); }
