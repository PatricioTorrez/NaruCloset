#!/usr/bin/env node
/**
 * Ejecuta las pruebas pgTAP de supabase/tests contra la base indicada en SUPABASE_DB_URL,
 * sin Docker. Cada archivo corre dentro de BEGIN … ROLLBACK: no deja datos.
 *   node --env-file=.env.local scripts/run-sql-tests.mjs
 * Los archivos que empiezan con "_" son includes (se anteponen a cada prueba).
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('Falta SUPABASE_DB_URL en .env.local');
  process.exit(1);
}

const dir = path.resolve('supabase/tests');
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
const includes = await Promise.all(files.filter((f) => f.startsWith('_')).map((f) => readFile(path.join(dir, f), 'utf8')));
const tests = files.filter((f) => !f.startsWith('_'));

let failed = 0;
let passed = 0;

for (const file of tests) {
  const client = new pg.Client({ connectionString: dbUrl, ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false } });
  await client.connect();
  const body = await readFile(path.join(dir, file), 'utf8');
  console.log(`\n# ${file}`);
  try {
    await client.query('begin');
    await client.query(includes.join('\n'));
    const results = await client.query(body);
    const lines = (Array.isArray(results) ? results : [results])
      .flatMap((r) => r.rows ?? [])
      .flatMap((row) => Object.values(row))
      .filter((v) => typeof v === 'string')
      .flatMap((v) => v.split('\n'));
    for (const line of lines) {
      if (/^ok /.test(line)) passed++;
      if (/^not ok /.test(line)) failed++;
      if (/^(ok|not ok|#|1\.\.)/.test(line.trim())) console.log(line);
    }
  } catch (e) {
    failed++;
    console.log(`not ok - ${file} abortó: ${e.message}`);
  } finally {
    await client.query('rollback').catch(() => {});
    await client.end();
  }
}

console.log(`\n${passed} pasaron, ${failed} fallaron`);
process.exit(failed > 0 ? 1 : 0);
