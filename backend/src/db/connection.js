import pg from 'pg';
import { fileURLToPath } from 'node:url';
import '../config/index.js';

let pool;

export function databaseConnectionString(value) {
  const connectionString = value?.trim();
  if (!connectionString || !/^postgres(?:ql)?:\/\//.test(connectionString)) {
    throw new Error('Задайте PostgreSQL DATABASE_URL из Supabase в backend/.env. Локальные JSON-файлы больше не используются.');
  }
  const url = new URL(connectionString);
  if (/(?:\.supabase\.co|\.pooler\.supabase\.com)$/.test(url.hostname)) {
    url.searchParams.set('sslmode', 'verify-full');
    if (!url.searchParams.has('sslrootcert')) {
      url.searchParams.set('sslrootcert', fileURLToPath(new URL('./supabase-ca.crt', import.meta.url)));
    }
  }
  return url.toString();
}

export function getPool() {
  if (pool) return pool;
  const connectionString = databaseConnectionString(process.env.DATABASE_URL);
  pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000, statement_timeout: 30000,
    application_name: 'studioradar' });
  pool.on('error', () => console.error('[Database] Потеряно фоновое соединение с PostgreSQL'));
  return pool;
}

export async function closePool() {
  if (pool) { await pool.end(); pool = undefined; }
}
