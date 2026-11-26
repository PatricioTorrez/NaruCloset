-- Naru Closet — esquema base
-- Ver docs/DATABASE.md. Todas las fechas en timestamptz (UTC); dinero en numeric(10,2) MXN.

create extension if not exists unaccent with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ───────────────────────── Tipos ─────────────────────────
create type public.user_role as enum ('owner', 'staff');
create type public.product_audience as enum ('women', 'men', 'unisex');
create type public.movement_type as enum (
  'stock_entry', 'sale', 'sale_cancellation', 'return',
  'reservation', 'reservation_release', 'manual_adjustment', 'admin_correction'
);
create type public.sale_status as enum ('completed', 'partially_returned', 'returned', 'cancelled');
create type public.reservation_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'expired');
create type public.payment_method as enum ('cash', 'transfer', 'card', 'other');

-- ───────────────────────── Utilidades ─────────────────────────
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ───────────────────────── Usuarios ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null check (length(trim(full_name)) between 1 and 120),
  role public.user_role not null default 'staff',
  -- Un usuario nuevo NO tiene acceso hasta que un owner lo active.
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- Crea el perfil automáticamente al crear un usuario de Auth (invitación).
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Usuario')
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Siempre debe existir al menos un owner activo.
create or replace function private.ensure_active_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (old.role = 'owner' and old.is_active)
     and not (new.role = 'owner' and new.is_active)
     and not exists (
       select 1 from public.profiles
       where role = 'owner' and is_active and id <> old.id
     ) then
    raise exception 'last_owner' using detail = 'Debe existir al menos un owner activo.';
  end if;
  return new;
end;
$$;
create trigger profiles_keep_owner before update on public.profiles
  for each row execute function private.ensure_active_owner();

-- ───────────────────────── Configuración ─────────────────────────
create table public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Naru Closet' check (length(trim(store_name)) between 1 and 80),
  slogan text default 'Tu estilo, a tu manera.' check (slogan is null or length(slogan) <= 160),
  description text check (description is null or length(description) <= 500),
  about_text text check (about_text is null or length(about_text) <= 5000),
  logo_path text,
  instagram_handle text check (instagram_handle is null or instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  whatsapp_enabled boolean not null default false,
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^\+[1-9][0-9]{7,14}$'),
  contact_email text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone text check (contact_phone is null or length(contact_phone) <= 30),
  currency char(3) not null default 'MXN',
  timezone text not null default 'America/Mexico_City',
  show_sold_out_products boolean not null default true,
  low_stock_threshold int not null default 2 check (low_stock_threshold >= 0),
  reservations_hold_stock boolean not null default true,
  reservation_default_days int check (reservation_default_days is null or reservation_default_days between 1 and 90),
  delivery_info text check (delivery_info is null or length(delivery_info) <= 2000),
  pickup_info text check (pickup_info is null or length(pickup_info) <= 2000),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id),
  constraint whatsapp_requires_number check (not whatsapp_enabled or whatsapp_number is not null)
);
create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function private.set_updated_at();
insert into public.store_settings (id) values (true);

-- ───────────────────────── Catálogo ─────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or length(description) <= 500),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_updated_at before update on public.categories
  for each row execute function private.set_updated_at();

create table public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 40),
  hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 20),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or length(description) <= 5000),
  category_id uuid not null references public.categories (id) on delete restrict,
  audience public.product_audience not null,
  price numeric(10, 2) not null check (price > 0),
  sale_price numeric(10, 2) check (sale_price is null or (sale_price > 0 and sale_price < price)),
  is_active boolean not null default false,
  is_new boolean not null default false,
  is_featured boolean not null default false,
  archived_at timestamptz,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated_at before update on public.products
  for each row execute function private.set_updated_at();
create index products_category_idx on public.products (category_id);
create index products_created_idx on public.products (created_at desc);
create index products_catalog_idx on public.products (audience, created_at desc)
  where is_active and archived_at is null;

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid not null references public.colors (id) on delete restrict,
  size_id uuid not null references public.sizes (id) on delete restrict,
  sku text unique check (sku is null or length(sku) between 1 and 60),
  stock_on_hand int not null default 0 check (stock_on_hand >= 0),
  stock_reserved int not null default 0 check (stock_reserved >= 0),
  stock_available int generated always as (stock_on_hand - stock_reserved) stored,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reserved_not_above_on_hand check (stock_reserved <= stock_on_hand),
  constraint variant_unique_combination unique (product_id, color_id, size_id)
);
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function private.set_updated_at();
create index product_variants_product_idx on public.product_variants (product_id);
create index product_variants_color_idx on public.product_variants (color_id);
create index product_variants_size_idx on public.product_variants (size_id);

-- Las existencias solo cambian dentro de las funciones de inventario.
create or replace function private.guard_variant_stock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if (new.stock_on_hand <> 0 or new.stock_reserved <> 0)
       and coalesce(current_setting('naru.inventory_op', true), '') <> 'on' then
      raise exception 'stock_direct_write' using detail = 'Las existencias iniciales se registran con una entrada de mercancía.';
    end if;
  elsif (new.stock_on_hand is distinct from old.stock_on_hand
         or new.stock_reserved is distinct from old.stock_reserved)
        and coalesce(current_setting('naru.inventory_op', true), '') <> 'on' then
    raise exception 'stock_direct_write' using detail = 'Use las operaciones de inventario.';
  end if;
  return new;
end;
$$;
create trigger product_variants_guard_stock before insert or update on public.product_variants
  for each row execute function private.guard_variant_stock();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid references public.colors (id) on delete set null,
  storage_path text not null unique,
  thumb_path text not null unique,
  width int not null check (width > 0),
  height int not null check (height > 0),
  alt_text text check (alt_text is null or length(alt_text) <= 200),
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);
create unique index product_images_one_primary on public.product_images (product_id) where is_primary;

-- ───────────────────────── Inventario ─────────────────────────
create table public.stock_entries (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  supplier text check (supplier is null or length(supplier) <= 120),
  notes text check (notes is null or length(notes) <= 1000),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index stock_entries_received_idx on public.stock_entries (received_at desc);

create table public.stock_entry_items (
  id uuid primary key default gen_random_uuid(),
  stock_entry_id uuid not null references public.stock_entries (id) on delete restrict,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  quantity int not null check (quantity > 0)
);
create index stock_entry_items_entry_idx on public.stock_entry_items (stock_entry_id);
create index stock_entry_items_variant_idx on public.stock_entry_items (variant_id);

-- Costos separados: solo el owner puede leerlos (D-004).
create table public.stock_entry_item_costs (
  stock_entry_item_id uuid primary key references public.stock_entry_items (id) on delete restrict,
  unit_cost numeric(10, 2) not null check (unit_cost >= 0)
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number bigint generated always as identity unique,
  sold_at timestamptz not null default now(),
  status public.sale_status not null default 'completed',
  payment_method public.payment_method,
  customer_reference text check (customer_reference is null or length(customer_reference) <= 120),
  notes text check (notes is null or length(notes) <= 1000),
  total numeric(10, 2) not null check (total >= 0),
  reservation_id uuid,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id),
  cancel_reason text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint cancel_fields check (
    (status = 'cancelled') = (cancelled_at is not null and cancel_reason is not null)
  )
);
create index sales_sold_idx on public.sales (sold_at desc);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete restrict,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  product_name text not null,
  color_name text not null,
  size_name text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  line_total numeric(10, 2) generated always as (quantity * unit_price) stored,
  returned_quantity int not null default 0 check (returned_quantity >= 0),
  constraint returned_not_above_quantity check (returned_quantity <= quantity)
);
create index sale_items_sale_idx on public.sale_items (sale_id);
create index sale_items_variant_idx on public.sale_items (variant_id);

create table public.sale_returns (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete restrict,
  returned_at timestamptz not null default now(),
  reason text not null check (length(trim(reason)) between 3 and 500),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index sale_returns_sale_idx on public.sale_returns (sale_id);

create table public.sale_return_items (
  id uuid primary key default gen_random_uuid(),
  sale_return_id uuid not null references public.sale_returns (id) on delete restrict,
  sale_item_id uuid not null references public.sale_items (id) on delete restrict,
  quantity int not null check (quantity > 0)
);
create index sale_return_items_return_idx on public.sale_return_items (sale_return_id);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_number bigint generated always as identity unique,
  customer_name text not null check (length(trim(customer_name)) between 1 and 120),
  customer_contact text check (customer_contact is null or length(customer_contact) <= 120),
  status public.reservation_status not null default 'pending',
  expires_at timestamptz,
  holds_stock boolean not null,
  notes text check (notes is null or length(notes) <= 1000),
  sale_id uuid references public.sales (id) on delete restrict,
  closed_reason text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint completed_has_sale check ((status = 'completed') = (sale_id is not null))
);
create trigger reservations_updated_at before update on public.reservations
  for each row execute function private.set_updated_at();
create index reservations_status_idx on public.reservations (status, expires_at);
create index reservations_created_idx on public.reservations (created_at desc);

alter table public.sales
  add constraint sales_reservation_fk foreign key (reservation_id) references public.reservations (id) on delete restrict;

create table public.reservation_items (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete restrict,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  constraint reservation_item_unique unique (reservation_id, variant_id)
);
create index reservation_items_variant_idx on public.reservation_items (variant_id);

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  movement_type public.movement_type not null,
  on_hand_delta int not null,
  reserved_delta int not null,
  on_hand_before int not null check (on_hand_before >= 0),
  on_hand_after int not null check (on_hand_after >= 0),
  reserved_before int not null check (reserved_before >= 0),
  reserved_after int not null check (reserved_after >= 0),
  reason text check (reason is null or length(reason) <= 500),
  stock_entry_id uuid references public.stock_entries (id) on delete restrict,
  sale_id uuid references public.sales (id) on delete restrict,
  sale_return_id uuid references public.sale_returns (id) on delete restrict,
  reservation_id uuid references public.reservations (id) on delete restrict,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint movement_not_empty check (on_hand_delta <> 0 or reserved_delta <> 0),
  constraint movement_on_hand_math check (on_hand_after = on_hand_before + on_hand_delta),
  constraint movement_reserved_math check (reserved_after = reserved_before + reserved_delta),
  constraint movement_reason_required check (
    movement_type not in ('manual_adjustment', 'admin_correction')
    or (reason is not null and length(trim(reason)) >= 3)
  )
);
create index inventory_movements_variant_idx on public.inventory_movements (variant_id, created_at desc);
create index inventory_movements_created_idx on public.inventory_movements (created_at desc);
create index inventory_movements_sale_idx on public.inventory_movements (sale_id) where sale_id is not null;
create index inventory_movements_reservation_idx on public.inventory_movements (reservation_id) where reservation_id is not null;

-- El historial es inmutable para todos, incluso para funciones con privilegios.
create or replace function private.forbid_movement_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'movement_immutable' using detail = 'Los movimientos de inventario no se modifican ni se eliminan.';
end;
$$;
create trigger inventory_movements_immutable before update or delete on public.inventory_movements
  for each row execute function private.forbid_movement_changes();
