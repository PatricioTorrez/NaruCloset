-- Naru Closet — colores por producto (precio opcional por color), íconos de categoría,
-- datos de catálogo precargados y catálogo público con colores.
-- No borra datos: solo agrega columnas, una tabla y filas con "on conflict do nothing".

-- ───────────────────────── Íconos de categoría ─────────────────────────
alter table public.categories
  add column icon text check (icon is null or icon ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- ───────────────────────── Colores de cada producto ─────────────────────────
create table public.product_colors (
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid not null references public.colors (id) on delete restrict,
  -- Precio propio del color; null = usa el precio (o la promoción) del producto.
  price numeric(10, 2) check (price is null or price > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, color_id)
);
create index product_colors_color_idx on public.product_colors (color_id);

alter table public.product_colors enable row level security;
grant select on public.product_colors to anon, authenticated;
grant insert, update, delete on public.product_colors to authenticated;

create policy product_colors_select on public.product_colors for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active and p.archived_at is null
    )
    or (select private.is_admin())
  );
create policy product_colors_insert on public.product_colors for insert to authenticated with check ((select private.is_admin()));
create policy product_colors_update on public.product_colors for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy product_colors_delete on public.product_colors for delete to authenticated using ((select private.is_admin()));

-- Toda variante pertenece a un color del producto: si se crea una variante de un color nuevo,
-- el color se agrega al producto automáticamente.
create or replace function private.ensure_product_color()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.product_colors (product_id, color_id, sort_order)
  values (
    new.product_id,
    new.color_id,
    coalesce((select max(pc.sort_order) + 1 from public.product_colors pc where pc.product_id = new.product_id), 0)
  )
  on conflict do nothing;
  return new;
end;
$$;
create trigger product_variants_ensure_color after insert on public.product_variants
  for each row execute function private.ensure_product_color();

-- Colores de variantes ya existentes.
insert into public.product_colors (product_id, color_id)
select distinct v.product_id, v.color_id from public.product_variants v
on conflict do nothing;

-- ───────────────────────── Precio vigente ─────────────────────────
-- Precio del color › precio promocional › precio regular.
create or replace function private.effective_price(p_variant_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(pc.price, p.sale_price, p.price)
  from public.product_variants v
  join public.products p on p.id = v.product_id
  left join public.product_colors pc on pc.product_id = v.product_id and pc.color_id = v.color_id
  where v.id = p_variant_id
$$;

-- ───────────────────────── Catálogo público ─────────────────────────
-- Cambia el tipo de retorno (precio mínimo/máximo y colores con su foto): hay que recrearla.
drop function if exists public.catalog_products(text, text, public.product_audience, uuid[], uuid[],
  boolean, boolean, boolean, text, int, int);

create function public.catalog_products(
  p_search text default null,
  p_category text default null,
  p_audience public.product_audience default null,
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
  category_icon text,
  audience public.product_audience,
  price numeric,
  sale_price numeric,
  price_min numeric,
  price_max numeric,
  is_new boolean,
  is_featured boolean,
  created_at timestamptz,
  total_available int,
  primary_image text,
  primary_thumb text,
  primary_image_alt text,
  colors jsonb,
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
      p.id, p.slug, p.name, c.name as category_name, c.slug as category_slug, c.icon as category_icon, p.audience,
      p.price, p.sale_price, p.is_new, p.is_featured, p.created_at,
      coalesce((
        select sum(v.stock_available)::int from public.product_variants v
        where v.product_id = p.id and v.is_active
      ), 0) as total_available,
      coalesce((select min(pc.price) from public.product_colors pc where pc.product_id = p.id), coalesce(p.sale_price, p.price)) as color_min,
      coalesce((select max(pc.price) from public.product_colors pc where pc.product_id = p.id), coalesce(p.sale_price, p.price)) as color_max,
      exists (select 1 from public.product_colors pc where pc.product_id = p.id and pc.price is null) as has_default_color
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
  priced as (
    select b.*,
      -- Si algún color no tiene precio propio, cuenta también el precio del producto.
      least(b.color_min, case when b.has_default_color or not exists (select 1 from public.product_colors pc where pc.product_id = b.id) then coalesce(b.sale_price, b.price) end) as price_min,
      greatest(b.color_max, case when b.has_default_color or not exists (select 1 from public.product_colors pc where pc.product_id = b.id) then coalesce(b.sale_price, b.price) end) as price_max
    from base b
  ),
  visible as (
    select b.* from priced b, settings s
    where s.show_sold_out_products or b.total_available > 0
  )
  select
    v.id, v.slug, v.name, v.category_name, v.category_slug, v.category_icon, v.audience,
    v.price, v.sale_price, v.price_min, v.price_max, v.is_new, v.is_featured, v.created_at, v.total_available,
    img.storage_path, img.thumb_path, img.alt_text,
    coalesce((
      select jsonb_agg(jsonb_build_object(
          'id', co.id, 'name', co.name, 'hex', co.hex,
          'price', coalesce(pc.price, v.sale_price, v.price),
          'thumb', ci.thumb_path, 'image', ci.storage_path
        ) order by pc.sort_order, co.sort_order, co.name)
      from public.product_colors pc
      join public.colors co on co.id = pc.color_id
      left join lateral (
        select i.storage_path, i.thumb_path from public.product_images i
        where i.product_id = v.id and i.color_id = pc.color_id
        order by i.is_primary desc, i.sort_order, i.created_at
        limit 1
      ) ci on true
      where pc.product_id = v.id
    ), '[]'::jsonb) as colors,
    count(*) over () as total_count
  from visible v
  left join lateral (
    select i.storage_path, i.thumb_path, i.alt_text from public.product_images i
    where i.product_id = v.id
    order by i.is_primary desc, i.sort_order, i.created_at
    limit 1
  ) img on true
  order by
    case when p_sort = 'price_asc' then v.price_min end asc nulls last,
    case when p_sort = 'price_desc' then v.price_max end desc nulls last,
    -- En "recientes", las novedades van primero.
    case when p_sort = 'new' then v.is_new end desc,
    v.created_at desc,
    v.id
  limit least(greatest(coalesce(p_limit, 24), 1), 60)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

revoke execute on function public.catalog_products(text, text, public.product_audience, uuid[], uuid[],
  boolean, boolean, boolean, text, int, int) from public;
grant execute on function public.catalog_products(text, text, public.product_audience, uuid[], uuid[],
  boolean, boolean, boolean, text, int, int) to anon, authenticated;

-- ───────────────────────── Datos de catálogo precargados ─────────────────────────
update public.categories set icon = 'jacket' where slug = 'abrigos' and icon is null;

insert into public.categories (name, slug, icon, sort_order) values
  ('Blusas', 'blusas', 'shirt-v-neck', 10),
  ('Playeras', 'playeras', 'shirt', 20),
  ('Camisas', 'camisas', 'shirt-buttons', 30),
  ('Suéteres', 'sueteres', 'sweater', 40),
  ('Sudaderas', 'sudaderas', 'shirt-long-sleeve', 50),
  ('Abrigos', 'abrigos', 'jacket', 60),
  ('Vestidos', 'vestidos', 'dress', 70),
  ('Faldas', 'faldas', 'skirt', 80),
  ('Pantalones', 'pantalones', 'trousers', 90),
  ('Shorts', 'shorts', 'shorts', 100),
  ('Calzado', 'calzado', 'sneaker', 110),
  ('Accesorios', 'accesorios', 'bag', 120)
on conflict do nothing;

insert into public.sizes (name, sort_order) values
  ('XS', 10), ('S', 20), ('M', 30), ('L', 40), ('XL', 50), ('XXL', 60), ('Unitalla', 70)
on conflict do nothing;

insert into public.colors (name, hex, sort_order) values
  ('Negro', '#1F1C1B', 10), ('Blanco', '#F7F5F0', 20), ('Gris', '#8C8885', 30),
  ('Beige', '#D9C7AD', 40), ('Café', '#6B4F3F', 50), ('Azul marino', '#26324A', 60),
  ('Azul', '#5B7393', 70), ('Rojo', '#9E2B2F', 80), ('Rosa', '#D6AEA8', 90),
  ('Verde', '#5F6B4A', 100)
on conflict do nothing;
