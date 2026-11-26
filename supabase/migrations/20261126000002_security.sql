-- Naru Closet — roles, privilegios y Row Level Security
-- Ver docs/SECURITY.md

-- ───────────────────────── Funciones de rol ─────────────────────────
create or replace function private.admin_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.admin_role() is not null
$$;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.admin_role() = 'owner', false)
$$;

revoke all on all functions in schema private from public;
grant execute on function private.admin_role(), private.is_admin(), private.is_owner()
  to anon, authenticated, service_role;

-- Perfil de la sesión actual (para el panel). Devuelve vacío si no es administrador activo.
create or replace function public.current_admin()
returns table (id uuid, full_name text, role public.user_role)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.role from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
$$;
revoke all on function public.current_admin() from public, anon;
grant execute on function public.current_admin() to authenticated;

-- ───────────────────────── Privilegios base ─────────────────────────
-- Supabase concede ALL por defecto a anon/authenticated; partimos de cero y concedemos lo mínimo.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Lectura pública del catálogo (filtrada por RLS)
grant select on public.store_settings, public.categories, public.colors, public.sizes,
  public.products, public.product_variants, public.product_images to anon, authenticated;

-- Panel: lectura de operación (filtrada por RLS a administradores)
grant select on public.profiles, public.stock_entries, public.stock_entry_items,
  public.stock_entry_item_costs, public.sales, public.sale_items, public.sale_returns,
  public.sale_return_items, public.reservations, public.reservation_items,
  public.inventory_movements to authenticated;

-- Panel: escritura de catálogo (filtrada por RLS)
grant insert, update, delete on public.categories, public.colors, public.sizes,
  public.products, public.product_images to authenticated;
grant update (store_name, slogan, description, about_text, logo_path, instagram_handle,
  whatsapp_enabled, whatsapp_number, contact_email, contact_phone, timezone,
  show_sold_out_products, low_stock_threshold, reservations_hold_stock,
  reservation_default_days, delivery_info, pickup_info, updated_by)
  on public.store_settings to authenticated;
grant update (full_name, role, is_active) on public.profiles to authenticated;

-- Variantes: nunca se escriben existencias directamente (solo funciones de inventario).
grant insert (product_id, color_id, size_id, sku, is_active) on public.product_variants to authenticated;
grant update (sku, is_active) on public.product_variants to authenticated;
grant delete on public.product_variants to authenticated;

-- Ventas, apartados, entradas y movimientos: sin INSERT/UPDATE/DELETE directos.

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles enable row level security;
alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.colors enable row level security;
alter table public.sizes enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.stock_entries enable row level security;
alter table public.stock_entry_items enable row level security;
alter table public.stock_entry_item_costs enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_returns enable row level security;
alter table public.sale_return_items enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_items enable row level security;
alter table public.inventory_movements enable row level security;

-- Perfiles
-- Los administradores ven los nombres de sus compañeros (autoría en historial); solo el owner los edita.
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update_owner on public.profiles for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

-- Configuración
create policy settings_select on public.store_settings for select to anon, authenticated using (true);
create policy settings_update_owner on public.store_settings for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

-- Catálogos auxiliares (categorías, colores, tallas)
create policy categories_select on public.categories for select to anon, authenticated
  using (is_active or (select private.is_admin()));
create policy categories_insert on public.categories for insert to authenticated with check ((select private.is_admin()));
create policy categories_update on public.categories for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy categories_delete on public.categories for delete to authenticated using ((select private.is_admin()));

create policy colors_select on public.colors for select to anon, authenticated
  using (is_active or (select private.is_admin()));
create policy colors_insert on public.colors for insert to authenticated with check ((select private.is_admin()));
create policy colors_update on public.colors for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy colors_delete on public.colors for delete to authenticated using ((select private.is_admin()));

create policy sizes_select on public.sizes for select to anon, authenticated
  using (is_active or (select private.is_admin()));
create policy sizes_insert on public.sizes for insert to authenticated with check ((select private.is_admin()));
create policy sizes_update on public.sizes for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy sizes_delete on public.sizes for delete to authenticated using ((select private.is_admin()));

-- Productos: visibles si están activos y no archivados
create policy products_select on public.products for select to anon, authenticated
  using ((is_active and archived_at is null) or (select private.is_admin()));
create policy products_insert on public.products for insert to authenticated with check ((select private.is_admin()));
create policy products_update on public.products for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy products_delete on public.products for delete to authenticated using ((select private.is_admin()));

-- Variantes: visibles si están activas y su producto es visible
create policy variants_select on public.product_variants for select to anon, authenticated
  using (
    (is_active and exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active and p.archived_at is null
    ))
    or (select private.is_admin())
  );
create policy variants_insert on public.product_variants for insert to authenticated with check ((select private.is_admin()));
create policy variants_update on public.product_variants for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy variants_delete on public.product_variants for delete to authenticated using ((select private.is_admin()));

-- Imágenes
create policy images_select on public.product_images for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active and p.archived_at is null
    )
    or (select private.is_admin())
  );
create policy images_insert on public.product_images for insert to authenticated with check ((select private.is_admin()));
create policy images_update on public.product_images for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy images_delete on public.product_images for delete to authenticated using ((select private.is_admin()));

-- Operación: solo lectura para administradores; costos solo para owner
create policy stock_entries_select on public.stock_entries for select to authenticated using ((select private.is_admin()));
create policy stock_entry_items_select on public.stock_entry_items for select to authenticated using ((select private.is_admin()));
create policy stock_entry_item_costs_select on public.stock_entry_item_costs for select to authenticated using ((select private.is_owner()));
create policy sales_select on public.sales for select to authenticated using ((select private.is_admin()));
create policy sale_items_select on public.sale_items for select to authenticated using ((select private.is_admin()));
create policy sale_returns_select on public.sale_returns for select to authenticated using ((select private.is_admin()));
create policy sale_return_items_select on public.sale_return_items for select to authenticated using ((select private.is_admin()));
create policy reservations_select on public.reservations for select to authenticated using ((select private.is_admin()));
create policy reservation_items_select on public.reservation_items for select to authenticated using ((select private.is_admin()));
create policy movements_select on public.inventory_movements for select to authenticated using ((select private.is_admin()));

-- Las tablas nuevas no heredan privilegios amplios por defecto
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;
