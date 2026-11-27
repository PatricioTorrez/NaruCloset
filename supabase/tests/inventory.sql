-- Pruebas de inventario (docs/QA.md §2: I-1 … I-10)
select plan(33);

-- Tablas temporales creadas como postgres (antes de cambiar de rol)
create temp table t_sale (id uuid);
create temp table t_res (id uuid);
grant all on t_sale, t_res to authenticated;

-- Atajos
create or replace function pg_temp.on_hand(v uuid) returns int language sql as $$ select stock_on_hand from public.product_variants where id = v $$;
create or replace function pg_temp.reserved(v uuid) returns int language sql as $$ select stock_reserved from public.product_variants where id = v $$;

-- ── I-1 / I-3: entrada aumenta solo la variante indicada ──
select pg_temp.login('00000000-0000-4000-a000-000000000002'); -- staff
select lives_ok(
  $$ select public.register_stock_entry('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":5,"unit_cost":120}]'::jsonb, null, 'Proveedor X', null) $$,
  'staff registra una entrada'
);
select is(pg_temp.on_hand('00000000-0000-4000-f000-000000000001'), 5, 'I-1 la entrada suma 5 a la variante');
select is(pg_temp.on_hand('00000000-0000-4000-f000-000000000002'), 0, 'I-3 otra variante del mismo producto no cambia');
select results_eq(
  $$ select on_hand_before, on_hand_after, movement_type::text from public.inventory_movements
     where variant_id = '00000000-0000-4000-f000-000000000001' order by id desc limit 1 $$,
  $$ values (0, 5, 'stock_entry') $$,
  'la entrada registra movimiento con existencias antes y después'
);

-- ── I-2: venta descuenta ──
insert into t_sale select public.register_sale('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":2}]'::jsonb, 'cash');
select is(pg_temp.on_hand('00000000-0000-4000-f000-000000000001'), 3, 'I-2 la venta descuenta 2');
select is((select total from public.sales where id = (select id from t_sale)), 1000.00::numeric, 'el total usa el precio vigente');
select is((select product_name || '/' || color_name || '/' || size_name from public.sale_items where sale_id = (select id from t_sale)),
  'Sudadera prueba/Gris prueba/S-test', 'la línea conserva nombres al momento de la venta');

-- ── I-4: no se vende más de lo disponible ──
select throws_ok(
  $$ select public.register_sale('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":4}]'::jsonb) $$,
  'P0001', 'insufficient_stock', 'I-4 vender 4 con 3 disponibles falla'
);
select is(pg_temp.on_hand('00000000-0000-4000-f000-000000000001'), 3, 'I-4 el intento fallido no deja cambios');
select throws_ok(
  $$ select public.register_sale('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":1},{"variant_id":"00000000-0000-4000-f000-000000000002","quantity":1}]'::jsonb) $$,
  'P0001', 'insufficient_stock', 'una venta con una línea sin existencias falla completa'
);
select is(pg_temp.on_hand('00000000-0000-4000-f000-000000000001'), 3, 'la línea válida tampoco se descontó (atomicidad)');

-- ── I-5: cancelación y devolución ──
select lives_ok($$ select public.cancel_sale((select id from t_sale), 'Error de captura') $$, 'cancelar venta');
select is(pg_temp.on_hand('00000000-0000-4000-f000-000000000001'), 5, 'I-5 la cancelación regresa las unidades');
select is((select status::text from public.sales where id = (select id from t_sale)), 'cancelled', 'la venta queda cancelada');
select throws_ok($$ select public.cancel_sale((select id from t_sale), 'otra vez') $$, 'P0001', 'invalid_state', 'no se cancela dos veces');

delete from t_sale;
insert into t_sale select public.register_sale('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":2,"unit_price":450}]'::jsonb);
select lives_ok(
  $$ select public.register_return((select id from t_sale),
       jsonb_build_array(jsonb_build_object('sale_item_id', (select id from public.sale_items where sale_id = (select id from t_sale)), 'quantity', 1)),
       'Talla incorrecta') $$,
  'registrar devolución parcial'
);
select is(pg_temp.on_hand('00000000-0000-4000-f000-000000000001'), 4, 'I-5 la devolución regresa 1 unidad');
select is((select status::text from public.sales where id = (select id from t_sale)), 'partially_returned', 'estado devolución parcial');
select throws_ok(
  $$ select public.register_return((select id from t_sale),
       jsonb_build_array(jsonb_build_object('sale_item_id', (select id from public.sale_items where sale_id = (select id from t_sale)), 'quantity', 2)),
       'Excede') $$,
  'P0001', 'invalid_input', 'no se devuelve más de lo vendido'
);

-- ── I-8: los apartados retienen existencias ──
insert into t_res select public.create_reservation('Cliente prueba', '[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":3}]'::jsonb);
select is(pg_temp.reserved('00000000-0000-4000-f000-000000000001'), 3, 'I-8 el apartado retiene 3');
select throws_ok(
  $$ select public.register_sale('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":2}]'::jsonb) $$,
  'P0001', 'insufficient_stock', 'I-8 no se venden unidades apartadas (4 en tienda, 3 apartadas)'
);
select lives_ok($$ select public.cancel_reservation((select id from t_res), 'Cliente no vino') $$, 'cancelar apartado');
select is(pg_temp.reserved('00000000-0000-4000-f000-000000000001'), 0, 'I-8 la cancelación libera');

-- Completar apartado = venta en una transacción
delete from t_res;
insert into t_res select public.create_reservation('Cliente 2', '[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":1}]'::jsonb);
select lives_ok($$ select public.complete_reservation((select id from t_res), 'transfer') $$, 'completar apartado');
select results_eq(
  $$ select stock_on_hand, stock_reserved from public.product_variants where id = '00000000-0000-4000-f000-000000000001' $$,
  $$ values (3, 0) $$,
  'completar libera la reserva y descuenta la venta'
);

-- Vencimiento automático
delete from t_res;
insert into t_res select public.create_reservation('Cliente 3', '[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":2}]'::jsonb, null, now() + interval '1 day');
reset role;
update public.reservations set expires_at = now() - interval '1 minute' where id = (select id from t_res);
select is(private.expire_reservations(), 1, 'expire_reservations vence 1 apartado');
select is(pg_temp.reserved('00000000-0000-4000-f000-000000000001'), 0, 'el vencimiento libera las unidades');

-- ── I-7: el historial cuadra con las existencias ──
select is(
  (select sum(on_hand_delta)::int from public.inventory_movements where variant_id = '00000000-0000-4000-f000-000000000001'),
  pg_temp.on_hand('00000000-0000-4000-f000-000000000001'),
  'I-7 la suma de movimientos = existencias actuales'
);

-- ── I-9: ajustes ──
select pg_temp.login('00000000-0000-4000-a000-000000000002'); -- staff
select throws_ok(
  $$ select public.adjust_stock('00000000-0000-4000-f000-000000000001', 10, 'Conteo') $$,
  '42501', 'not_authorized', 'I-9 staff no puede ajustar'
);
select pg_temp.login('00000000-0000-4000-a000-000000000001'); -- owner
select throws_ok(
  $$ select public.adjust_stock('00000000-0000-4000-f000-000000000001', 10, '  ') $$,
  'P0001', 'invalid_input', 'I-9 ajuste sin motivo falla'
);
select lives_ok(
  $$ select public.adjust_stock('00000000-0000-4000-f000-000000000001', 10, 'Conteo físico de cierre') $$,
  'owner ajusta con motivo'
);

-- ── I-10: nadie escribe existencias directamente ──
select throws_ok(
  $$ update public.product_variants set stock_on_hand = 99 where id = '00000000-0000-4000-f000-000000000001' $$,
  '42501', null, 'I-10 owner no puede actualizar existencias por la API (sin privilegio de columna)'
);
reset role;
select throws_ok(
  $$ update public.product_variants set stock_on_hand = 99 where id = '00000000-0000-4000-f000-000000000001' $$,
  'P0001', 'stock_direct_write', 'I-10 ni siquiera el rol de base de datos escribe existencias fuera de las funciones'
);

select * from finish();
