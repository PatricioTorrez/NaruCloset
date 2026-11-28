-- Corrección de varias tallas a la vez: todo o nada, solo owner, con historial.
select plan(7);

create or replace function pg_temp.on_hand(v uuid) returns int language sql as $$ select stock_on_hand from public.product_variants where id = v $$;

select pg_temp.login('00000000-0000-4000-a000-000000000001'); -- owner
select public.register_stock_entry('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":5},{"variant_id":"00000000-0000-4000-f000-000000000002","quantity":2}]'::jsonb);

select is(
  public.adjust_stock_many('[{"variant_id":"00000000-0000-4000-f000-000000000001","new_on_hand":3},{"variant_id":"00000000-0000-4000-f000-000000000002","new_on_hand":4}]'::jsonb, 'Conteo físico'),
  2, 'corrige dos tallas en una operación'
);
select is(pg_temp.on_hand('00000000-0000-4000-f000-000000000001'), 3, 'la primera talla queda en 3');
select is(pg_temp.on_hand('00000000-0000-4000-f000-000000000002'), 4, 'la segunda talla queda en 4');
select is(
  (select count(*)::int from public.inventory_movements where reason = 'Conteo físico'),
  2, 'cada talla deja su movimiento con el motivo'
);

-- Todo o nada: si una talla no puede bajar por debajo de lo apartado, ninguna cambia.
create temp table t_res (id uuid);
grant all on t_res to authenticated;
insert into t_res select public.create_reservation('Cliente', '[{"variant_id":"00000000-0000-4000-f000-000000000002","quantity":3}]'::jsonb);
select throws_ok(
  $$ select public.adjust_stock_many('[{"variant_id":"00000000-0000-4000-f000-000000000001","new_on_hand":9},{"variant_id":"00000000-0000-4000-f000-000000000002","new_on_hand":1}]'::jsonb, 'Conteo') $$,
  null, null, 'falla si una talla quedaría por debajo de lo apartado'
);
select is(pg_temp.on_hand('00000000-0000-4000-f000-000000000001'), 3, 'y la otra talla no cambió');

select pg_temp.login('00000000-0000-4000-a000-000000000002'); -- staff
select throws_ok(
  $$ select public.adjust_stock_many('[{"variant_id":"00000000-0000-4000-f000-000000000001","new_on_hand":1}]'::jsonb, 'Conteo') $$,
  '42501', 'not_authorized', 'staff no puede corregir existencias'
);

select * from finish();
