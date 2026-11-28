-- Pruebas de colores por producto: precio por color, alta automática y visibilidad pública.
select plan(10);

create temp table t_sale (id uuid);
grant all on t_sale to authenticated;

-- La variante creada en _setup agregó su color al producto.
select is(
  (select count(*)::int from public.product_colors where product_id = '00000000-0000-4000-e000-000000000001'),
  1, 'crear variantes agrega su color al producto (una sola vez)'
);

-- Sin precio propio, el color usa el precio del producto.
select is(private.effective_price('00000000-0000-4000-f000-000000000001'), 500.00::numeric, 'sin precio por color usa el precio del producto');

update public.products set sale_price = 450 where id = '00000000-0000-4000-e000-000000000001';
select is(private.effective_price('00000000-0000-4000-f000-000000000001'), 450.00::numeric, 'la promoción del producto aplica si el color no tiene precio');

update public.product_colors set price = 620
  where product_id = '00000000-0000-4000-e000-000000000001' and color_id = '00000000-0000-4000-c000-000000000001';
select is(private.effective_price('00000000-0000-4000-f000-000000000001'), 620.00::numeric, 'el precio del color manda sobre la promoción');

select throws_ok(
  $$ update public.product_colors set price = 0 where product_id = '00000000-0000-4000-e000-000000000001' $$,
  '23514', null, 'el precio por color no puede ser cero'
);

-- Una venta cobra el precio del color.
select pg_temp.login('00000000-0000-4000-a000-000000000002'); -- staff
select public.register_stock_entry('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":3}]'::jsonb);
insert into t_sale select public.register_sale('[{"variant_id":"00000000-0000-4000-f000-000000000001","quantity":1}]'::jsonb, 'cash');
select is((select total from public.sales where id = (select id from t_sale)), 620.00::numeric, 'la venta usa el precio del color');

-- El staff puede agregar un color a un producto.
select lives_ok(
  $$ insert into public.product_colors (product_id, color_id, price) values
     ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-c000-000000000002', null) $$,
  'un administrador agrega un color al producto'
);

-- El visitante ve colores solo de productos visibles.
select pg_temp.login(null);
select is(
  (select count(*)::int from public.product_colors where product_id = '00000000-0000-4000-e000-000000000002'),
  0, 'el visitante no ve colores de productos ocultos'
);
select throws_ok(
  $$ insert into public.product_colors (product_id, color_id) values ('00000000-0000-4000-e000-000000000002', '00000000-0000-4000-c000-000000000001') $$,
  '42501', null, 'el visitante no puede agregar colores'
);

-- El catálogo público devuelve los colores con su precio.
select is(
  (select jsonb_array_length(colors) from public.catalog_products(p_search => 'Sudadera prueba')),
  2, 'el catálogo incluye los colores del producto'
);

select * from finish();
