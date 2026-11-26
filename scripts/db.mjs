#!/usr/bin/env node
/**
 * Comandos de base de datos sin Docker, contra el proyecto Supabase en la nube.
 *   npm run db:push    → aplica supabase/migrations pendientes (pide confirmación de la CLI)
 *   npm run db:types   → regenera src/types/database.ts (requiere `npx supabase login` y SUPABASE_PROJECT_REF)
 * Lee .env.local; nunca imprime credenciales.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const cmd = process.argv[2];

function supabase(args, opts = {}) {
  const r = spawnSync('npx', ['supabase', ...args], { stdio: opts.capture ? ['inherit', 'pipe', 'inherit'] : 'inherit', shell: true, encoding: 'utf8' });
  if (r.status !== 0) process.exit(r.status ?? 1);
  return r.stdout;
}

if (cmd === 'push') {
  if (!process.env.SUPABASE_DB_URL) throw new Error('Falta SUPABASE_DB_URL en .env.local');
  supabase(['db', 'push', '--db-url', JSON.stringify(process.env.SUPABASE_DB_URL)]);
} else if (cmd === 'types') {
  const ref = process.env.SUPABASE_PROJECT_REF ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (!ref) throw new Error('No se pudo determinar el project ref (SUPABASE_PROJECT_REF).');
  const out = supabase(['gen', 'types', 'typescript', '--project-id', ref, '--schema', 'public'], { capture: true });
  writeFileSync('src/types/database.ts', `// Generado con: npm run db:types\n${out}`);
  console.log('src/types/database.ts actualizado');
} else {
  console.error('Uso: node scripts/db.mjs push|types');
  process.exit(1);
}
