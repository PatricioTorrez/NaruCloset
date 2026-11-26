-- Naru Closet — operaciones de inventario
-- Reglas (docs/DATABASE.md §5):
--   * Cada función verifica el rol, bloquea las variantes en orden de id (FOR UPDATE)
--     y registra un movimiento por cada cambio de existencias, todo en una transacción.
--   * Los errores usan códigos legibles por la aplicación en MESSAGE:
--     not_authorized, invalid_input, not_found, invalid_state, insufficient_stock.

-- ───────────────────────── Núcleo ─────────────────────────
create or replace function private.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

create or replace function private.require_owner()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_owner() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

-- Bloquea un conjunto de variantes en orden estable para evitar interbloqueos.
create or replace function private.lock_variants(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_found int;
begin
  select count(*) into v_found from (
    select id from public.product_variants
    where id = any (p_ids)
    order by id
    for update
  ) locked;
  if v_found <> (select count(distinct x) from unnest(p_ids) x) then
    raise exception 'not_found' using detail = 'Una o más variantes no existen.';
  end if;
end;
$$;

-- Aplica un cambio de existencias a una variante (ya bloqueada) y registra el movimiento.
create or replace function private.apply_stock_change(
  p_variant_id uuid,
  p_on_hand_delta int,
  p_reserved_delta int,
  p_type public.movement_type,
  p_actor uuid,
  p_reason text default null,
  p_stock_entry_id uuid default null,
  p_sale_id uuid default null,
  p_sale_return_id uuid default null,
  p_reservation_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.product_variants%rowtype;
  v_on_hand int;
  v_reserved int;
begin
  select * into v from public.product_variants where id = p_variant_id for update;
  if not found then
    raise exception 'not_found' using detail = format('Variante %s no existe.', p_variant_id);
  end if;

  v_on_hand := v.stock_on_hand + p_on_hand_delta;
  v_reserved := v.stock_reserved + p_reserved_delta;

  if v_on_hand < 0 or v_reserved < 0 or v_reserved > v_on_hand then
    raise exception 'insufficient_stock'
      using detail = json_build_object(
        'variant_id', p_variant_id,
        'available', v.stock_on_hand - v.stock_reserved
      )::text;
  end if;

  perform set_config('naru.inventory_op', 'on', true);
  update public.product_variants
    set stock_on_hand = v_on_hand, stock_reserved = v_reserved
    where id = p_variant_id;
  perform set_config('naru.inventory_op', 'off', true);

  insert into public.inventory_movements (
    variant_id, movement_type, on_hand_delta, reserved_delta,
    on_hand_before, on_hand_after, reserved_before, reserved_after,
    reason, stock_entry_id, sale_id, sale_return_id, reservation_id, created_by
  ) values (
    p_variant_id, p_type, p_on_hand_delta, p_reserved_delta,
    v.stock_on_hand, v_on_hand, v.stock_reserved, v_reserved,
    nullif(trim(p_reason), ''), p_stock_entry_id, p_sale_id, p_sale_return_id, p_reservation_id, p_actor
  );
end;
$$;

-- Precio vigente de una variante (precio promocional si existe).
create or replace function private.effective_price(p_variant_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p.sale_price, p.price)
  from public.product_variants v join public.products p on p.id = v.product_id
  where v.id = p_variant_id
$$;

-- Valida un arreglo JSON de líneas [{variant_id, quantity, ...}] sin variantes repetidas.
create or replace function private.validate_lines(p_items jsonb)
returns uuid[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_ids uuid[];
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid_input' using detail = 'Se requiere al menos una línea.';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'invalid_input' using detail = 'Demasiadas líneas.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where (e ->> 'variant_id') is null
       or (e ->> 'quantity') is null
       or (e ->> 'quantity')::int <= 0
       or (e ->> 'quantity')::int > 10000
  ) then
    raise exception 'invalid_input' using detail = 'Cada línea requiere variante y cantidad mayor que cero.';
  end if;
  select array_agg((e ->> 'variant_id')::uuid) into v_ids from jsonb_array_elements(p_items) e;
  if (select count(distinct x) from unnest(v_ids) x) <> array_length(v_ids, 1) then
    raise exception 'invalid_input' using detail = 'Hay variantes repetidas.';
  end if;
  return v_ids;
end;
$$;

-- ───────────────────────── Entradas de mercancía ─────────────────────────
create or replace function public.register_stock_entry(
  p_items jsonb,
  p_received_at timestamptz default null,
  p_supplier text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_admin();
  v_ids uuid[] := private.validate_lines(p_items);
  v_entry uuid;
  v_item uuid;
  e jsonb;
begin
  if exists (
    select 1 from jsonb_array_elements(p_items) x
    where (x ->> 'unit_cost') is not null and (x ->> 'unit_cost')::numeric < 0
  ) then
    raise exception 'invalid_input' using detail = 'El costo no puede ser negativo.';
  end if;

  perform private.lock_variants(v_ids);

  insert into public.stock_entries (received_at, supplier, notes, created_by)
  values (coalesce(p_received_at, now()), nullif(trim(p_supplier), ''), nullif(trim(p_notes), ''), v_actor)
  returning id into v_entry;

  for e in select * from jsonb_array_elements(p_items) order by (value ->> 'variant_id')
  loop
    insert into public.stock_entry_items (stock_entry_id, variant_id, quantity)
    values (v_entry, (e ->> 'variant_id')::uuid, (e ->> 'quantity')::int)
    returning id into v_item;

    if (e ->> 'unit_cost') is not null then
      insert into public.stock_entry_item_costs (stock_entry_item_id, unit_cost)
      values (v_item, (e ->> 'unit_cost')::numeric);
    end if;

    perform private.apply_stock_change(
      (e ->> 'variant_id')::uuid, (e ->> 'quantity')::int, 0, 'stock_entry', v_actor,
      p_stock_entry_id => v_entry
    );
  end loop;

  return v_entry;
end;
$$;

-- ───────────────────────── Ventas ─────────────────────────
-- Crea la venta (sin verificar rol: lo hacen las funciones públicas que la llaman).
create or replace function private.create_sale(
  p_actor uuid,
  p_items jsonb,
  p_payment_method public.payment_method,
  p_sold_at timestamptz,
  p_customer_reference text,
  p_notes text,
  p_reservation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[] := private.validate_lines(p_items);
  v_sale uuid;
  e jsonb;
  v_price numeric;
  v_total numeric := 0;
begin
  if exists (
    select 1 from jsonb_array_elements(p_items) x
    where (x ->> 'unit_price') is not null and (x ->> 'unit_price')::numeric < 0
  ) then
    raise exception 'invalid_input' using detail = 'El precio no puede ser negativo.';
  end if;

  if exists (
    select 1 from public.product_variants v join public.products p on p.id = v.product_id
    where v.id = any (v_ids) and p.archived_at is not null
  ) then
    raise exception 'invalid_state' using detail = 'No se puede vender un producto archivado.';
  end if;

  perform private.lock_variants(v_ids);

  insert into public.sales (sold_at, payment_method, customer_reference, notes, total, reservation_id, created_by)
  values (coalesce(p_sold_at, now()), p_payment_method, nullif(trim(p_customer_reference), ''),
          nullif(trim(p_notes), ''), 0, p_reservation_id, p_actor)
  returning id into v_sale;

  for e in select * from jsonb_array_elements(p_items) order by (value ->> 'variant_id')
  loop
    v_price := coalesce((e ->> 'unit_price')::numeric, private.effective_price((e ->> 'variant_id')::uuid));

    insert into public.sale_items (sale_id, variant_id, product_name, color_name, size_name, quantity, unit_price)
    select v_sale, v.id, p.name, c.name, s.name, (e ->> 'quantity')::int, v_price
    from public.product_variants v
    join public.products p on p.id = v.product_id
    join public.colors c on c.id = v.color_id
    join public.sizes s on s.id = v.size_id
    where v.id = (e ->> 'variant_id')::uuid;

    v_total := v_total + v_price * (e ->> 'quantity')::int;

    perform private.apply_stock_change(
      (e ->> 'variant_id')::uuid, -((e ->> 'quantity')::int), 0, 'sale', p_actor,
      p_sale_id => v_sale
    );
  end loop;

  update public.sales set total = v_total where id = v_sale;
  return v_sale;
end;
$$;

create or replace function public.register_sale(
  p_items jsonb,
  p_payment_method public.payment_method default null,
  p_sold_at timestamptz default null,
  p_customer_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_admin();
begin
  return private.create_sale(v_actor, p_items, p_payment_method, p_sold_at, p_customer_reference, p_notes, null);
end;
$$;

create or replace function public.cancel_sale(p_sale_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_admin();
  v_sale public.sales%rowtype;
  i record;
begin
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'invalid_input' using detail = 'El motivo es obligatorio.';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'not_found' using detail = 'La venta no existe.';
  end if;
  if v_sale.status = 'cancelled' then
    raise exception 'invalid_state' using detail = 'La venta ya está cancelada.';
  end if;

  perform private.lock_variants(array(select variant_id from public.sale_items where sale_id = p_sale_id));

  for i in
    select variant_id, quantity - returned_quantity as pending
    from public.sale_items where sale_id = p_sale_id order by variant_id
  loop
    if i.pending > 0 then
      perform private.apply_stock_change(
        i.variant_id, i.pending, 0, 'sale_cancellation', v_actor, p_reason, p_sale_id => p_sale_id
      );
    end if;
  end loop;

  update public.sales
    set status = 'cancelled', cancelled_at = now(), cancelled_by = v_actor, cancel_reason = trim(p_reason)
    where id = p_sale_id;
end;
$$;

create or replace function public.register_return(p_sale_id uuid, p_items jsonb, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_admin();
  v_sale public.sales%rowtype;
  v_return uuid;
  v_item public.sale_items%rowtype;
  e jsonb;
  v_qty int;
begin
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'invalid_input' using detail = 'El motivo es obligatorio.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid_input' using detail = 'Indique al menos una línea a devolver.';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'not_found' using detail = 'La venta no existe.';
  end if;
  if v_sale.status not in ('completed', 'partially_returned') then
    raise exception 'invalid_state' using detail = 'La venta no admite devoluciones.';
  end if;

  perform private.lock_variants(array(select variant_id from public.sale_items where sale_id = p_sale_id));

  insert into public.sale_returns (sale_id, reason, created_by)
  values (p_sale_id, trim(p_reason), v_actor)
  returning id into v_return;

  for e in select * from jsonb_array_elements(p_items) order by (value ->> 'sale_item_id')
  loop
    v_qty := (e ->> 'quantity')::int;
    select * into v_item from public.sale_items
      where id = (e ->> 'sale_item_id')::uuid and sale_id = p_sale_id for update;
    if not found then
      raise exception 'not_found' using detail = 'La línea no pertenece a la venta.';
    end if;
    if v_qty is null or v_qty <= 0 or v_qty > v_item.quantity - v_item.returned_quantity then
      raise exception 'invalid_input' using detail = 'Cantidad a devolver inválida.';
    end if;

    insert into public.sale_return_items (sale_return_id, sale_item_id, quantity)
    values (v_return, v_item.id, v_qty);
    update public.sale_items set returned_quantity = returned_quantity + v_qty where id = v_item.id;

    perform private.apply_stock_change(
      v_item.variant_id, v_qty, 0, 'return', v_actor, p_reason,
      p_sale_id => p_sale_id, p_sale_return_id => v_return
    );
  end loop;

  update public.sales set status = case
      when not exists (select 1 from public.sale_items where sale_id = p_sale_id and returned_quantity < quantity)
        then 'returned'::public.sale_status
      else 'partially_returned'::public.sale_status
    end
  where id = p_sale_id;

  return v_return;
end;
$$;

-- ───────────────────────── Apartados ─────────────────────────
create or replace function public.create_reservation(
  p_customer_name text,
  p_items jsonb,
  p_customer_contact text default null,
  p_expires_at timestamptz default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_admin();
  v_ids uuid[] := private.validate_lines(p_items);
  v_holds boolean;
  v_res uuid;
  e jsonb;
begin
  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception 'invalid_input' using detail = 'El nombre o referencia del cliente es obligatorio.';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'invalid_input' using detail = 'La fecha límite debe ser futura.';
  end if;
  if exists (
    select 1 from public.product_variants v join public.products p on p.id = v.product_id
    where v.id = any (v_ids) and p.archived_at is not null
  ) then
    raise exception 'invalid_state' using detail = 'No se puede apartar un producto archivado.';
  end if;

  select reservations_hold_stock into v_holds from public.store_settings where id;

  perform private.lock_variants(v_ids);

  insert into public.reservations (customer_name, customer_contact, expires_at, holds_stock, notes, created_by)
  values (trim(p_customer_name), nullif(trim(p_customer_contact), ''), p_expires_at, v_holds,
          nullif(trim(p_notes), ''), v_actor)
  returning id into v_res;

  for e in select * from jsonb_array_elements(p_items) order by (value ->> 'variant_id')
  loop
    insert into public.reservation_items (reservation_id, variant_id, quantity, unit_price)
    values (v_res, (e ->> 'variant_id')::uuid, (e ->> 'quantity')::int,
            private.effective_price((e ->> 'variant_id')::uuid));

    if v_holds then
      perform private.apply_stock_change(
        (e ->> 'variant_id')::uuid, 0, (e ->> 'quantity')::int, 'reservation', v_actor,
        p_reservation_id => v_res
      );
    end if;
  end loop;

  return v_res;
end;
$$;

-- Libera las unidades retenidas por un apartado (si las retenía).
create or replace function private.release_reservation(p_res public.reservations, p_actor uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  i record;
begin
  if not p_res.holds_stock then
    return;
  end if;
  perform private.lock_variants(array(select variant_id from public.reservation_items where reservation_id = p_res.id));
  for i in select variant_id, quantity from public.reservation_items where reservation_id = p_res.id order by variant_id
  loop
    perform private.apply_stock_change(
      i.variant_id, 0, -i.quantity, 'reservation_release', p_actor, p_reason, p_reservation_id => p_res.id
    );
  end loop;
end;
$$;

create or replace function public.confirm_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_admin();
  v_res public.reservations%rowtype;
begin
  select * into v_res from public.reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'not_found' using detail = 'El apartado no existe.';
  end if;
  if v_res.status <> 'pending' then
    raise exception 'invalid_state' using detail = 'Solo se confirman apartados pendientes.';
  end if;
  update public.reservations set status = 'confirmed' where id = p_reservation_id;
end;
$$;

create or replace function public.cancel_reservation(p_reservation_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_admin();
  v_res public.reservations%rowtype;
begin
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'invalid_input' using detail = 'El motivo es obligatorio.';
  end if;
  select * into v_res from public.reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'not_found' using detail = 'El apartado no existe.';
  end if;
  if v_res.status not in ('pending', 'confirmed') then
    raise exception 'invalid_state' using detail = 'El apartado ya está cerrado.';
  end if;

  perform private.release_reservation(v_res, v_actor, p_reason);
  update public.reservations set status = 'cancelled', closed_reason = trim(p_reason) where id = p_reservation_id;
end;
$$;

create or replace function public.complete_reservation(
  p_reservation_id uuid,
  p_payment_method public.payment_method default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_admin();
  v_res public.reservations%rowtype;
  v_items jsonb;
  v_sale uuid;
begin
  select * into v_res from public.reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'not_found' using detail = 'El apartado no existe.';
  end if;
  if v_res.status not in ('pending', 'confirmed') then
    raise exception 'invalid_state' using detail = 'El apartado ya está cerrado.';
  end if;

  select jsonb_agg(jsonb_build_object('variant_id', variant_id, 'quantity', quantity, 'unit_price', unit_price))
    into v_items
    from public.reservation_items where reservation_id = p_reservation_id;

  perform private.release_reservation(v_res, v_actor, 'Apartado completado');
  v_sale := private.create_sale(v_actor, v_items, p_payment_method, now(), v_res.customer_name,
                                coalesce(p_notes, v_res.notes), p_reservation_id);

  update public.reservations set status = 'completed', sale_id = v_sale where id = p_reservation_id;
  return v_sale;
end;
$$;

-- Ejecutada por pg_cron (D-003). No expuesta a usuarios.
create or replace function private.expire_reservations()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_res public.reservations%rowtype;
  v_count int := 0;
begin
  for v_res in
    select * from public.reservations
    where status in ('pending', 'confirmed') and expires_at is not null and expires_at < now()
    order by id
    for update skip locked
  loop
    perform private.release_reservation(v_res, null, 'Vencimiento automático');
    update public.reservations set status = 'expired', closed_reason = 'Vencimiento automático' where id = v_res.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ───────────────────────── Ajustes (solo owner) ─────────────────────────
create or replace function public.adjust_stock(
  p_variant_id uuid,
  p_new_on_hand int,
  p_reason text,
  p_type public.movement_type default 'manual_adjustment'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_owner();
  v_current int;
begin
  if p_type not in ('manual_adjustment', 'admin_correction') then
    raise exception 'invalid_input' using detail = 'Tipo de ajuste inválido.';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'invalid_input' using detail = 'El motivo es obligatorio.';
  end if;
  if p_new_on_hand is null or p_new_on_hand < 0 then
    raise exception 'invalid_input' using detail = 'La cantidad no puede ser negativa.';
  end if;

  select stock_on_hand into v_current from public.product_variants where id = p_variant_id for update;
  if not found then
    raise exception 'not_found' using detail = 'La variante no existe.';
  end if;
  if p_new_on_hand = v_current then
    raise exception 'invalid_input' using detail = 'La cantidad es igual a la actual.';
  end if;

  perform private.apply_stock_change(p_variant_id, p_new_on_hand - v_current, 0, p_type, v_actor, p_reason);
end;
$$;

-- ───────────────────────── Privilegios ─────────────────────────
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.admin_role(), private.is_admin(), private.is_owner()
  to anon, authenticated, service_role;

revoke all on function
  public.register_stock_entry(jsonb, timestamptz, text, text),
  public.register_sale(jsonb, public.payment_method, timestamptz, text, text),
  public.cancel_sale(uuid, text),
  public.register_return(uuid, jsonb, text),
  public.create_reservation(text, jsonb, text, timestamptz, text),
  public.confirm_reservation(uuid),
  public.cancel_reservation(uuid, text),
  public.complete_reservation(uuid, public.payment_method, text),
  public.adjust_stock(uuid, int, text, public.movement_type)
from public, anon;

grant execute on function
  public.register_stock_entry(jsonb, timestamptz, text, text),
  public.register_sale(jsonb, public.payment_method, timestamptz, text, text),
  public.cancel_sale(uuid, text),
  public.register_return(uuid, jsonb, text),
  public.create_reservation(text, jsonb, text, timestamptz, text),
  public.confirm_reservation(uuid),
  public.cancel_reservation(uuid, text),
  public.complete_reservation(uuid, public.payment_method, text),
  public.adjust_stock(uuid, int, text, public.movement_type)
to authenticated;
