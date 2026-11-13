import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { migrateJson } from '../scripts/migrate-json.js';

async function sources(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'studioradar-migration-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const data = { leads: [{ id: 'legacy-one', url: 'https://sostav.ru/article/old', custom_field: 'preserve' }],
    pipelines: [{ id: 'legacy-pipeline', name: 'Saved strategy' }], settings: { ai_provider: 'gemini', min_score_threshold: 80 } };
  for (const [name, value] of Object.entries(data)) await fs.writeFile(path.join(directory, `${name}.json`), JSON.stringify(value));
  return { directory, data };
}

function fixturePool(data, { mismatch = false, onCommit } = {}) {
  const calls = [];
  const client = { release() {}, async query(sql) {
    calls.push(sql);
    if (sql === 'commit') await onCommit?.();
    if (sql.startsWith('select data from public.leads')) return { rows: mismatch ? [] : [{ data: data.leads[0] }] };
    if (sql.startsWith('select data from public.pipelines')) return { rows: [{ data: data.pipelines[0] }] };
    if (sql.startsWith('select data from public.app_settings')) return { rows: [{ data: data.settings }] };
    return { rows: [] };
  } };
  return { calls, connect: async () => client };
}

test('migration preserves legacy/custom data and removes files only after verified commit', async t => {
  const { directory, data } = await sources(t);
  const pool = fixturePool(data);
  const result = await migrateJson(pool, directory, { removeFiles: true });
  assert.equal(result.leads, 1); assert.equal(result.files_removed, true);
  assert.equal(pool.calls.at(-1), 'commit');
  assert.deepEqual(await fs.readdir(directory), []);
});

test('verification failure rolls back and retains all original files', async t => {
  const { directory, data } = await sources(t);
  const pool = fixturePool(data, { mismatch: true });
  await assert.rejects(migrateJson(pool, directory, { removeFiles: true }), /verification failure/);
  assert.equal(pool.calls.at(-1), 'rollback');
  assert.ok(!pool.calls.includes('commit'));
  assert.equal((await fs.readdir(directory)).length, 3);
});

test('source changes during migration prevent deletion of any file', async t => {
  const { directory, data } = await sources(t);
  const pool = fixturePool(data, { onCommit: async () => fs.writeFile(path.join(directory, 'leads.json'), '[]') });
  await assert.rejects(migrateJson(pool, directory, { removeFiles: true }), /changed during migration/);
  assert.equal((await fs.readdir(directory)).length, 3);
});
