-- Naru Closet — indicadores del panel calculados con datos reales
-- SECURITY INVOKER: respeta RLS (solo administradores leen ventas y movimientos).

create or replace function public.admin_dashboard(p_days int default 30)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with settings as (
    select low_stock_threshold from public.store_settings where id
  ),
  product_stock as (
    select p.id, p.name, p.slug, p.is_active, p.archived_at,
           coalesce(sum(v.stock_available) filter (where v.is_active), 0)::int as available,
           coalesce(sum(v.stock_on_hand) filter (where v.is_active), 0)::int as on_hand
    from public.products p
    left join public.product_variants v on v.product_id = p.id
    group by p.id
  ),
  valid_sales as (
    select s.id, s.sold_at from public.sales s where s.status <> 'cancelled'
  ),
  sold as (
    select si.*, vs.sold_at from public.sale_items si join valid_sales vs on vs.id = si.sale_id
  )
  select jsonb_build_object(
    'total_products', (select count(*) from product_stock where archived_at is null),
    'active_products', (select count(*) from product_stock where archived_at is null and is_active),
    'sold_out_products', (select count(*) from product_stock where archived_at is null and is_active and available = 0),
    'low_stock_products', (
      select count(*) from product_stock, settings
      where archived_at is null and is_active and available > 0 and available <= settings.low_stock_threshold
    ),
    'units_available', (select coalesce(sum(available), 0) from product_stock where archived_at is null),
    'units_on_hand', (select coalesce(sum(on_hand), 0) from product_stock where archived_at is null),
    'sales_count', (select count(*) from valid_sales),
    'sales_count_period', (select count(*) from valid_sales where sold_at >= now() - make_interval(days => p_days)),
    'revenue', (select coalesce(sum(unit_price * (quantity - returned_quantity)), 0) from sold),
    'revenue_period', (
      select coalesce(sum(unit_price * (quantity - returned_quantity)), 0) from sold
      where sold_at >= now() - make_interval(days => p_days)
    ),
    'open_reservations', (select count(*) from public.reservations where status in ('pending', 'confirmed')),
    'top_products', coalesce((
      select jsonb_agg(t order by t.units desc)
      from (
        select si.product_name as name, sum(si.quantity - si.returned_quantity)::int as units,
               sum(si.unit_price * (si.quantity - si.returned_quantity)) as revenue
        from sold si
        group by si.product_name
        having sum(si.quantity - si.returned_quantity) > 0
        order by units desc
        limit 5
      ) t
    ), '[]'::jsonb),
    'low_stock_list', coalesce((
      select jsonb_agg(l order by l.available)
      from (
        select ps.id, ps.name, ps.available from product_stock ps, settings
        where ps.archived_at is null and ps.is_active and ps.available <= settings.low_stock_threshold
        order by ps.available, ps.name
        limit 8
      ) l
    ), '[]'::jsonb),
    'sales_by_day', coalesce((
      select jsonb_agg(d order by d.day)
      from (
        select to_char(date_trunc('day', sold_at at time zone (select timezone from public.store_settings where id)), 'YYYY-MM-DD') as day,
               sum(unit_price * (quantity - returned_quantity)) as revenue,
               sum(quantity - returned_quantity)::int as units
        from sold
        where sold_at >= now() - make_interval(days => p_days)
        group by 1
      ) d
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.admin_dashboard(int) from public, anon;
grant execute on function public.admin_dashboard(int) to authenticated;
