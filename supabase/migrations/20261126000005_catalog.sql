-- Naru Closet — consultas del catálogo público
-- SECURITY INVOKER: se ejecuta con los permisos de quien consulta, así que RLS aplica
-- (un visitante solo ve productos activos, no archivados).

create or replace function public.catalog_products(
  p_search text default null,
  p_category text default null,          -- slug de categoría
  p_audience public.product_audience default null, -- women / men (incluye unisex)
  p_size_ids uuid[] default null,
  p_color_ids uuid[] default null,
  p_only_available boolean default false,
  p_only_new boolean default false,
  p_only_featured boolean default false,
  p_sort text default 'new',             -- new | price_asc | price_desc
  p_limit int default 24,
  p_offset int default 0
)
returns table (
  id uuid,
  slug text,
  name text,
  category_name text,
  category_slug text,
  audience public.product_audience,
  price numeric,
  sale_price numeric,
  is_new boolean,
  is_featured boolean,
  created_at timestamptz,
  total_available int,
  primary_image text,
  primary_thumb text,
  primary_image_alt text,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with settings as (
    select show_sold_out_products from public.store_settings where id
  ),
  base as (
    select
      p.id, p.slug, p.name, c.name as category_name, c.slug as category_slug, p.audience,
      p.price, p.sale_price, p.is_new, p.is_featured, p.created_at,
      coalesce((
        select sum(v.stock_available)::int from public.product_variants v
        where v.product_id = p.id and v.is_active
      ), 0) as total_available
    from public.products p
    join public.categories c on c.id = p.category_id
    where p.is_active and p.archived_at is null
      and (p_search is null or length(trim(p_search)) = 0
           or extensions.unaccent('extensions.unaccent'::regdictionary, p.name) ilike '%' || extensions.unaccent('extensions.unaccent'::regdictionary, trim(p_search)) || '%')
      and (p_category is null or c.slug = p_category)
      and (p_audience is null or p.audience = p_audience or p.audience = 'unisex')
      and (not p_only_new or p.is_new)
      and (not p_only_featured or p.is_featured)
      and (
        (p_size_ids is null or cardinality(p_size_ids) = 0)
        and (p_color_ids is null or cardinality(p_color_ids) = 0)
        and not p_only_available
        or exists (
          select 1 from public.product_variants v
          where v.product_id = p.id and v.is_active
            and (p_size_ids is null or cardinality(p_size_ids) = 0 or v.size_id = any (p_size_ids))
            and (p_color_ids is null or cardinality(p_color_ids) = 0 or v.color_id = any (p_color_ids))
            and (not p_only_available or v.stock_available > 0)
        )
      )
  ),
  visible as (
    select b.* from base b, settings s
    where s.show_sold_out_products or b.total_available > 0
  )
  select
    v.id, v.slug, v.name, v.category_name, v.category_slug, v.audience,
    v.price, v.sale_price, v.is_new, v.is_featured, v.created_at, v.total_available,
    img.storage_path, img.thumb_path, img.alt_text,
    count(*) over () as total_count
  from visible v
  left join lateral (
    select i.storage_path, i.thumb_path, i.alt_text from public.product_images i
    where i.product_id = v.id
    order by i.is_primary desc, i.sort_order, i.created_at
    limit 1
  ) img on true
  order by
    case when p_sort = 'price_asc' then coalesce(v.sale_price, v.price) end asc nulls last,
    case when p_sort = 'price_desc' then coalesce(v.sale_price, v.price) end desc nulls last,
    v.created_at desc,
    v.id
  limit least(greatest(coalesce(p_limit, 24), 1), 60)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

grant execute on function public.catalog_products(text, text, public.product_audience, uuid[], uuid[],
  boolean, boolean, boolean, text, int, int) to anon, authenticated;
