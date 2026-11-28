-- Naru Closet — corrección de existencias de varias tallas en una sola operación (todo o nada).
-- Solo owner (D-004). Cada talla que cambia deja su movimiento en el historial con el mismo motivo.

create or replace function public.adjust_stock_many(
  p_items jsonb,                       -- [{ "variant_id": uuid, "new_on_hand": int }]
  p_reason text,
  p_type public.movement_type default 'manual_adjustment'
)
returns int                            -- número de tallas que cambiaron
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_owner();
  v_ids uuid[];
  v_changed int := 0;
  r record;
begin
  if p_type not in ('manual_adjustment', 'admin_correction') then
    raise exception 'invalid_input' using detail = 'Tipo de ajuste inválido.';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'invalid_input' using detail = 'El motivo es obligatorio.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then
    raise exception 'invalid_input' using detail = 'Indique al menos una talla.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) x
    where (x ->> 'variant_id') is null or (x ->> 'new_on_hand') is null or (x ->> 'new_on_hand')::int < 0
  ) then
    raise exception 'invalid_input' using detail = 'Las cantidades no pueden ser negativas.';
  end if;

  select array_agg(distinct (x ->> 'variant_id')::uuid) into v_ids from jsonb_array_elements(p_items) x;
  if cardinality(v_ids) <> jsonb_array_length(p_items) then
    raise exception 'invalid_input' using detail = 'Hay tallas repetidas.';
  end if;

  -- Bloqueo en orden estable (evita interbloqueos con ventas simultáneas).
  perform private.lock_variants(v_ids);

  for r in
    select v.id, v.stock_on_hand, (x ->> 'new_on_hand')::int as new_on_hand
    from jsonb_array_elements(p_items) x
    join public.product_variants v on v.id = (x ->> 'variant_id')::uuid
    order by v.id
  loop
    if r.new_on_hand <> r.stock_on_hand then
      -- apply_stock_change valida que no quede por debajo de lo apartado.
      perform private.apply_stock_change(r.id, r.new_on_hand - r.stock_on_hand, 0, p_type, v_actor, p_reason);
      v_changed := v_changed + 1;
    end if;
  end loop;

  if v_changed = 0 then
    raise exception 'invalid_input' using detail = 'No cambió ninguna cantidad.';
  end if;
  return v_changed;
end;
$$;

revoke all on function public.adjust_stock_many(jsonb, text, public.movement_type) from public, anon;
grant execute on function public.adjust_stock_many(jsonb, text, public.movement_type) to authenticated;
