import test from 'node:test';
import assert from 'node:assert/strict';
import { Database, statsForLeads } from '../src/db/index.js';
import { cleanSettings } from '../src/db/settings.js';

test('writes use parameters and merge only the edited fields in Postgres', async () => {
  const queries = [];
  const db = new Database({ query: async (sql, args) => { queries.push({ sql, args }); return { rows: [{ data: { id: args[0], status: 'closed', notes: 'retained' } }] }; } });
  const hostileId = "x'; delete from leads; --";
  const lead = await db.updateLeadStatus(hostileId, 'closed');
  assert.equal(lead.notes, 'retained');
  assert.equal(queries[0].args[0], hostileId);
  assert.ok(!queries[0].sql.includes(hostileId));
  assert.match(queries[0].sql, /data = data \|\| \$2::jsonb/);
  assert.deepEqual(Object.keys(JSON.parse(queries[0].args[1])).sort(), ['status', 'updated_at']);
});

test('database failures propagate instead of acknowledging an unsaved change', async () => {
  const db = new Database({ query: async () => { throw new Error('database unavailable'); } });
  await assert.rejects(db.updateLeadNotes('lead', 'note'), /database unavailable/);
  await assert.rejects(db.getSettings(), /database unavailable/);
});

test('secrets are neither returned nor accepted in application settings', async () => {
  const db = new Database({ query: async () => ({ rows: [{ data: { min_score_threshold: 80, gemini_api_key: 'private' } }] }) });
  assert.equal((await db.getSettings()).gemini_api_key, undefined);
  assert.equal((await db.getSettings()).min_score_threshold, 80);
  await assert.rejects(db.updateSettings({ gemini_api_key: 'private' }), /API/);
  assert.equal(cleanSettings({ unknown: true }).unknown, undefined);
});

test('pipeline updates preserve the primary key and creation time', async () => {
  let patch;
  const db = new Database({ query: async (sql, args) => { patch = JSON.parse(args[1]); return { rows: [] }; } });
  assert.equal(await db.updatePipeline('original', { id: 'replacement', created_at: 'bad', name: 'updated' }), null);
  assert.equal(patch.id, undefined); assert.equal(patch.created_at, undefined); assert.equal(patch.name, 'updated');
});

test('new pipelines do not invent monitoring statistics', async () => {
  const db = new Database({ query: async (sql, args) => ({ rows: [{ data: JSON.parse(args[1]) }] }) });
  const pipeline = await db.addPipeline({ name: 'CGI', priorityMinScore: 0 });
  assert.equal(pipeline.priorityMinScore, 0);
  assert.equal(pipeline.trackedCompanies, 0);
  assert.deepEqual(pipeline.sources, []);
});

test('legacy records are counted even when hidden by the source policy', () => {
  const stats = statsForLeads([{ url: 'https://sostav.ru/article/old' }, { url: 'https://hh.ru/vacancy/123' }]);
  assert.equal(stats.stored_total, 2); assert.equal(stats.hidden_by_policy, 1);
});

test('a duplicate insert acknowledged by Postgres is not reported as a new lead', async () => {
  let calls = 0;
  const db = new Database({ query: async (sql) => { calls++; assert.match(sql, /on conflict do nothing/); return { rows: [] }; } });
  assert.equal(await db.addLead({ id: 'one', url: 'https://hh.ru/vacancy/123' }), null);
  assert.equal(calls, 1);
  assert.equal(await db.addLead({ id: 'bad', url: 'https://fl.ru/projects/123' }), null);
  assert.equal(calls, 1);
});
