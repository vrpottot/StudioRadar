import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { getPool, closePool } from '../src/db/connection.js';
import { cleanSettings } from '../src/db/settings.js';
import { canonicalUrl } from '../../ai/policy.js';

// Import legacy files only explicitly. Runtime never reads or writes these files.
export async function migrateJson(pool, sourceDirectory, { removeFiles = false } = {}) {
  const root = path.resolve(sourceDirectory);
  const names = ['leads', 'pipelines', 'settings'];
  const files = names.map(name => path.join(root, `${name}.json`));
  const contents = await Promise.all(files.map(file => fs.readFile(file, 'utf8')));
  const [leads, pipelines, rawSettings] = contents.map(content => JSON.parse(content));
  if (!Array.isArray(leads) || !Array.isArray(pipelines) || !rawSettings || Array.isArray(rawSettings) || typeof rawSettings !== 'object') {
    throw new Error('Invalid source data; no files removed');
  }
  for (const rows of [leads, pipelines]) {
    if (rows.some(row => !row || typeof row.id !== 'string' || !row.id) || new Set(rows.map(row => row.id)).size !== rows.length) {
      throw new Error('Source IDs must be present and unique');
    }
  }
  if (Object.keys(rawSettings).some(key => /api_key|secret|token/i.test(key))) {
    throw new Error('Move saved provider keys into server environment before migrating settings');
  }
  const settings = cleanSettings(rawSettings);
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const [table, rows] of [['leads', leads], ['pipelines', pipelines]]) {
      for (const row of rows) {
        const created = row.created_at || new Date().toISOString();
        const updated = row.updated_at || created;
        if (table === 'leads') {
          await client.query(`insert into public.leads(id, canonical_url, data, created_at, updated_at)
            values($1,$2,$3::jsonb,$4,$5) on conflict(id) do nothing`, [row.id, canonicalUrl(row.url), JSON.stringify(row), created, updated]);
        } else {
          await client.query(`insert into public.pipelines(id, data, created_at, updated_at)
            values($1,$2::jsonb,$3,$4) on conflict(id) do nothing`, [row.id, JSON.stringify(row), created, updated]);
        }
        const actual = await client.query(`select data from public.${table} where id = $1`, [row.id]);
        if (!isDeepStrictEqual(actual.rows[0]?.data, row)) throw new Error(`Migration conflict or verification failure: ${table}/${row.id}`);
      }
    }
    await client.query("insert into public.app_settings(id,data) values('global',$1::jsonb) on conflict(id) do nothing", [JSON.stringify(settings)]);
    const actualSettings = await client.query("select data from public.app_settings where id='global'");
    if (!isDeepStrictEqual(actualSettings.rows[0]?.data, settings)) throw new Error('Settings conflict; import rolled back');
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally { client.release(); }

  if (removeFiles) {
    // Check all sources before deleting any. The caller must stop writers first.
    const latest = await Promise.all(files.map(file => fs.readFile(file, 'utf8')));
    if (!latest.every((content, index) => content === contents[index])) throw new Error('Source files changed during migration; nothing removed');
    for (const file of files) await fs.unlink(file);
  }
  return { leads: leads.length, pipelines: pipelines.length, settings: 1, files_removed: removeFiles };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const optionIndex = process.argv.indexOf('--source-dir');
  const sourceDirectory = optionIndex >= 0 ? process.argv[optionIndex + 1] : path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  try {
    console.log(JSON.stringify(await migrateJson(getPool(), sourceDirectory, { removeFiles: process.argv.includes('--remove-files') })));
  } catch (error) { console.error('[Migration]', error.message); process.exitCode = 1; }
  finally { await closePool(); }
}
