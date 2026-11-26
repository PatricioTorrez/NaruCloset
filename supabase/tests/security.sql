-- Pruebas de permisos y RLS (docs/QA.md §3: S-2 … S-6, S-8)
select plan(20);

-- Datos operativos para comprobar que no se filtran
select pg_temp.login('00000000-0000-4000-a000-000000000001');
select public.register_stock_entry('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":3,"unit_cost":99}]'::jsonb);
select public.register_sale('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":1}]'::jsonb);

-- ── Visitante anónimo ──
select pg_temp.login(null);
select is((select count(*)::int from public.products where slug like '%-test'), 1, 'S-8 anon solo ve el producto activo');
select is((select count(*)::int from public.product_variants where id = '00000000-0000-4000-f000-000000000003'), 0, 'S-8 anon no ve variantes de productos ocultos');
select is((select count(*)::int from public.catalog_products(p_search => 'prueba')), 1, 'el catálogo público devuelve solo visibles');
select throws_ok($$ select * from public.sales $$, '42501', null, 'S-3 anon no puede leer ventas');
select throws_ok($$ select * from public.inventory_movements $$, '42501', null, 'S-3 anon no puede leer movimientos');
select throws_ok($$ select * from public.stock_entry_item_costs $$, '42501', null, 'S-3 anon no puede leer costos');
select throws_ok($$ select * from public.reservations $$, '42501', null, 'S-3 anon no puede leer apartados');
select throws_ok($$ select * from public.profiles $$, '42501', null, 'S-3 anon no puede leer perfiles');
select throws_ok(
  $$ insert into public.products (name, slug, category_id, audience, price) values ('x', 'x-anon', '00000000-0000-4000-b000-000000000001', 'men', 1) $$,
  '42501', null, 'S-4 anon no puede crear productos'
);
select throws_ok(
  $$ select public.register_sale('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":1}]'::jsonb) $$,
  '42501', null, 'S-4 anon no puede ejecutar ventas'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('product-images', 'products/x/y.webp') $$,
  '42501', null, 'S-5 anon no puede subir fotos'
);

-- ── Usuario autenticado sin acceso (perfil inactivo) ──
select pg_temp.login('00000000-0000-4000-a000-000000000003');
select is_empty($$ select 1 from public.sales $$, 'S-2 usuario inactivo no ve ventas');
select is_empty($$ select 1 from public.current_admin() $$, 'S-2 current_admin vacío para usuario inactivo');
select throws_ok(
  $$ select public.register_stock_entry('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":1}]'::jsonb) $$,
  '42501', 'not_authorized', 'S-2 usuario inactivo no opera inventario'
);
with u as (update public.products set price = 1 where slug = 'sudadera-prueba-test' returning 1)
select is((select count(*)::int from u), 0, 'S-2 usuario inactivo no modifica productos');

-- ── Staff ──
select pg_temp.login('00000000-0000-4000-a000-000000000002');
select isnt_empty($$ select 1 from public.sales $$, 'staff ve ventas');
select is_empty($$ select 1 from public.stock_entry_item_costs $$, 'S-6 staff no ve costos');
with u as (update public.store_settings set store_name = 'Hackeada' where id returning 1)
select is((select count(*)::int from u), 0, 'S-6 staff no cambia la configuración');

-- ── Owner ──
select pg_temp.login('00000000-0000-4000-a000-000000000001');
select isnt_empty($$ select 1 from public.stock_entry_item_costs $$, 'owner ve costos');
-- Deja al owner de prueba como único owner activo (se revierte al final)
reset role;
update public.profiles set is_active = false where role = 'owner' and id <> '00000000-0000-4000-a000-000000000001';
select pg_temp.login('00000000-0000-4000-a000-000000000001');
select throws_ok(
  $$ update public.profiles set role = 'staff' where id = '00000000-0000-4000-a000-000000000001' $$,
  'P0001', 'last_owner', 'no se puede quitar el último owner'
);

select * from finish();
