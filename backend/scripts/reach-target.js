import { executeAiHunt } from '../src/services/hunterService.js';
import { db } from '../src/db/index.js';
import { closePool, getPool } from '../src/db/connection.js';
import { huntOrders } from '../../ai/index.js';
import { canonicalUrl, sourcePlatform } from '../../ai/policy.js';
import { buyerIntentScore } from '../../ai/candidates.js';

const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : Number(process.argv[index + 1]);
};
const target = argument('--target', 10);
const rounds = argument('--rounds', 3);
const firstRound = argument('--start-round', 0);
if (!Number.isInteger(target) || target < 1 || target > 20 || !Number.isInteger(rounds) || rounds < 1 || rounds > 3
  || !Number.isInteger(firstRound) || firstRound < 0 || firstRound + rounds > 100) {
  throw new Error('Параметры: --target 1..20, --rounds 1..3, --start-round 0..97');
}

const checked = new Set();
const companyCount = leads => new Set(leads.map(lead => lead.company?.trim().toLowerCase()).filter(Boolean)).size;
try {
  let leads = await db.getAllLeads();
  if (process.argv.includes('--recheck') && companyCount(leads) < target) {
    // Revisit saved evidence after policy changes; never mark an old rejection
    // accepted without the same current page, date, source and LLM checks.
    const result = await getPool().query(`SELECT DISTINCT ON (url)
      url, title, evidence_text, search_provider FROM public.search_candidates
      WHERE accepted = false ORDER BY url, checked_at DESC`);
    const backlog = result.rows.map(row => ({ url: row.url, title: row.title,
      snippet: row.evidence_text.split('\n\nИсточник профиля автора:')[0], source: row.search_provider }))
      .filter(row => ['linkedin', 'facebook'].includes(sourcePlatform(row.url)) && buyerIntentScore(row) >= 100);
    console.log(`Повторная проверка сохранённых запросов по обновлённым правилам: ${backlog.length}.`);
    if (backlog.length) {
      await executeAiHunt({ limit: Math.min(20, target - companyCount(leads)), searchRound: firstRound, maxRounds: 1 }, {
        schedule: () => {},
        notify: event => { if (event.type === 'new_lead_detected') console.log(JSON.stringify({ saved: event.lead })); },
        hunt: options => huntOrders({ ...options, onCandidate: async candidate => {
          await options.onCandidate(candidate);
          if (typeof candidate.evaluation?.isOrder === 'boolean') checked.add(canonicalUrl(candidate.url));
        } }, { candidates: backlog })
      });
      leads = await db.getAllLeads();
    }
  }
  if (companyCount(leads) < target) {
    console.log(`Цель: ${target} разных прямых заказчиков. Сейчас: ${companyCount(leads)}. До ${rounds} поисковых проходов.`);
    await executeAiHunt({ limit: Math.min(20, target - companyCount(leads)), searchRound: firstRound, maxRounds: rounds }, {
      schedule: () => {},
      notify: event => { if (event.type === 'new_lead_detected') console.log(JSON.stringify({ saved: event.lead })); },
      hunt: options => huntOrders({ ...options,
        excludeUrls: [...options.excludeUrls, ...checked],
        onCandidate: async candidate => {
          await options.onCandidate(candidate);
          const url = canonicalUrl(candidate.url);
          if (url && typeof candidate.evaluation?.isOrder === 'boolean') checked.add(url);
        }
      })
    });
    leads = await db.getAllLeads();
  }
  console.log(JSON.stringify({ target, confirmed_companies: companyCount(leads), confirmed_orders: leads.length,
    achieved: companyCount(leads) >= target, leads: leads.map(lead => ({ company: lead.company, country: lead.country, url: lead.url })) }));
  if (companyCount(leads) < target) process.exitCode = 2;
} catch (error) {
  console.error('[Поиск до цели]', error.message);
  process.exitCode = 1;
} finally { await closePool(); }
