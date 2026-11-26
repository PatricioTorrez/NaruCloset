#!/usr/bin/env node
/**
 * Prueba I-6 (docs/QA.md): varias ventas simultáneas de la ÚLTIMA unidad desde conexiones
 * independientes. Exactamente una debe tener éxito y las existencias deben quedar en 0.
 *   node --env-file=.env.local scripts/test-concurrency.mjs
 *
 * Crea datos de prueba con sufijo aleatorio y los elimina al terminar (en una transacción que
 * desactiva temporalmente el trigger de inmutabilidad SOLO para borrar esos registros de prueba).
 */
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('Falta SUPABASE_DB_URL en .env.local');
  process.exit(1);
}
const ssl = dbUrl.includes('localhost') ? false : { rejectUnauthorized: false };
const connect = async () => {
  const c = new pg.Client({ connectionString: dbUrl, ssl });
  await c.connect();
  return c;
};

const tag = randomUUID().slice(0, 8);
const ids = {
  user: randomUUID(),
  category: randomUUID(),
  color: randomUUID(),
  size: randomUUID(),
  product: randomUUID(),
  variant: randomUUID(),
};
const CONCURRENT = 6;

async function asUser(client, sql, params) {
  await client.query('begin');
  try {
    await client.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ sub: ids.user, role: 'authenticated' }),
    ]);
    await client.query('set local role authenticated');
    const r = await client.query(sql, params);
    await client.query('commit');
    return r;
  } catch (e) {
    await client.query('rollback');
    throw e;
  }
}

const admin = await connect();
let exitCode = 0;
try {
  // ── Preparación ──
  await admin.query('begin');
  await admin.query(
    `insert into auth.users (id, email, raw_user_meta_data, aud, role) values ($1, $2, '{"full_name":"Concurrency test"}', 'authenticated', 'authenticated')`,
    [ids.user, `concurrency-${tag}@test.local`],
  );
  await admin.query(`update public.profiles set role = 'staff', is_active = true where id = $1`, [ids.user]);
  await admin.query(`insert into public.categories (id, name, slug) values ($1, $2, $3)`, [ids.category, `test-${tag}`, `test-${tag}`]);
  await admin.query(`insert into public.colors (id, name, hex) values ($1, $2, '#123456')`, [ids.color, `test-${tag}`]);
  await admin.query(`insert into public.sizes (id, name) values ($1, $2)`, [ids.size, `t-${tag}`]);
  await admin.query(
    `insert into public.products (id, name, slug, category_id, audience, price) values ($1, $2, $3, $4, 'unisex', 100)`,
    [ids.product, `test-${tag}`, `test-${tag}`, ids.category],
  );
  await admin.query(`insert into public.product_variants (id, product_id, color_id, size_id) values ($1, $2, $3, $4)`, [
    ids.variant,
    ids.product,
    ids.color,
    ids.size,
  ]);
  await admin.query('commit');

  const setup = await connect();
  await asUser(setup, `select public.register_stock_entry($1::jsonb)`, [
    JSON.stringify([{ variant_id: ids.variant, quantity: 1 }]),
  ]);
  await setup.end();

  // ── Ventas simultáneas de la última unidad ──
  const clients = await Promise.all(Array.from({ length: CONCURRENT }, connect));
  const results = await Promise.allSettled(
    clients.map((c) =>
      asUser(c, `select public.register_sale($1::jsonb)`, [JSON.stringify([{ variant_id: ids.variant, quantity: 1 }])]),
    ),
  );
  await Promise.all(clients.map((c) => c.end()));

  const ok = results.filter((r) => r.status === 'fulfilled').length;
  const insufficient = results.filter((r) => r.status === 'rejected' && r.reason.message === 'insufficient_stock').length;
  const { rows } = await admin.query(
    `select stock_on_hand, stock_reserved,
            (select count(*)::int from public.inventory_movements where variant_id = $1 and movement_type = 'sale') as sale_moves
     from public.product_variants where id = $1`,
    [ids.variant],
  );

  const checks = [
    [ok === 1, `exactamente 1 venta exitosa (obtuvo ${ok})`],
    [insufficient === CONCURRENT - 1, `${CONCURRENT - 1} rechazadas por insufficient_stock (obtuvo ${insufficient})`],
    [rows[0].stock_on_hand === 0, `existencias finales 0 (obtuvo ${rows[0].stock_on_hand})`],
    [rows[0].sale_moves === 1, `1 movimiento de venta (obtuvo ${rows[0].sale_moves})`],
  ];
  for (const [pass, msg] of checks) {
    console.log(`${pass ? 'ok' : 'not ok'} - I-6 ${msg}`);
    if (!pass) exitCode = 1;
  }
  for (const r of results) if (r.status === 'rejected' && r.reason.message !== 'insufficient_stock') console.log('#', r.reason.message);
} catch (e) {
  console.error('not ok - la prueba abortó:', e.message);
  exitCode = 1;
} finally {
  // ── Limpieza de los datos de prueba ──
  try {
    await admin.query('rollback').catch(() => {});
    await admin.query('begin');
    await admin.query('alter table public.inventory_movements disable trigger inventory_movements_immutable');
    await admin.query('delete from public.inventory_movements where variant_id = $1', [ids.variant]);
    await admin.query('delete from public.sale_items where variant_id = $1', [ids.variant]);
    await admin.query('delete from public.sales where created_by = $1', [ids.user]);
    await admin.query(
      'delete from public.stock_entry_items where variant_id = $1',
      [ids.variant],
    );
    await admin.query('delete from public.stock_entries where created_by = $1', [ids.user]);
    await admin.query('alter table public.inventory_movements enable trigger inventory_movements_immutable');
    await admin.query('delete from public.products where id = $1', [ids.product]);
    await admin.query('delete from public.categories where id = $1', [ids.category]);
    await admin.query('delete from public.colors where id = $1', [ids.color]);
    await admin.query('delete from public.sizes where id = $1', [ids.size]);
    await admin.query('delete from public.profiles where id = $1', [ids.user]);
    await admin.query('delete from auth.users where id = $1', [ids.user]);
    await admin.query('commit');
    console.log('# datos de prueba eliminados');
  } catch (e) {
    await admin.query('rollback').catch(() => {});
    console.error(`# no se pudieron limpiar los datos de prueba (sufijo ${tag}):`, e.message);
    exitCode = 1;
  }
  await admin.end();
}
process.exit(exitCode);
