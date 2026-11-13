import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { X509Certificate } from 'node:crypto';
import { databaseConnectionString } from '../src/db/connection.js';

test('Supabase connections verify the hostname and use the bundled trusted root', () => {
  const url = new URL(databaseConnectionString('postgresql://fixture:secret@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=disable'));
  assert.equal(url.searchParams.get('sslmode'), 'verify-full');
  const certificate = new X509Certificate(fs.readFileSync(url.searchParams.get('sslrootcert')));
  assert.equal(certificate.ca, true);
  assert.equal(certificate.fingerprint256, '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA');
  assert.equal(url.username, 'fixture');
});

test('an explicit custom CA path is retained', () => {
  const url = new URL(databaseConnectionString('postgresql://fixture:secret@db.test.supabase.co/postgres?sslrootcert=custom.crt'));
  assert.equal(url.searchParams.get('sslrootcert'), 'custom.crt');
  assert.equal(url.searchParams.get('sslmode'), 'verify-full');
});

test('non-PostgreSQL configuration fails with an actionable error', () => {
  assert.throws(() => databaseConnectionString('sqlite:///leads.db'), /DATABASE_URL/);
});
