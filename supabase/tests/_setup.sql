-- Datos de prueba comunes. Cada archivo de prueba corre dentro de BEGIN … ROLLBACK,
-- así que nada de esto queda guardado. Se incluye con \ir desde cada prueba.

create extension if not exists pgtap with schema extensions;

-- Usuarios de prueba
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values
  ('00000000-0000-4000-a000-000000000001', 'owner@test.local', '{"full_name":"Owner Test"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000002', 'staff@test.local', '{"full_name":"Staff Test"}', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000003', 'outsider@test.local', '{"full_name":"Sin acceso"}', 'authenticated', 'authenticated');

update public.profiles set role = 'owner', is_active = true where id = '00000000-0000-4000-a000-000000000001';
update public.profiles set role = 'staff', is_active = true where id = '00000000-0000-4000-a000-000000000002';
-- outsider queda con el perfil inactivo creado por el trigger

insert into public.categories (id, name, slug) values ('00000000-0000-4000-b000-000000000001', 'Prueba', 'prueba-test');
insert into public.colors (id, name, hex) values
  ('00000000-0000-4000-c000-000000000001', 'Gris prueba', '#888888'),
  ('00000000-0000-4000-c000-000000000002', 'Blanco prueba', '#ffffff');
insert into public.sizes (id, name, sort_order) values
  ('00000000-0000-4000-d000-000000000001', 'S-test', 1),
  ('00000000-0000-4000-d000-000000000002', 'M-test', 2);

insert into public.products (id, name, slug, category_id, audience, price, is_active)
values
  ('00000000-0000-4000-e000-000000000001', 'Sudadera prueba', 'sudadera-prueba-test', '00000000-0000-4000-b000-000000000001', 'unisex', 500, true),
  ('00000000-0000-4000-e000-000000000002', 'Oculto prueba', 'oculto-prueba-test', '00000000-0000-4000-b000-000000000001', 'women', 300, false);

insert into public.product_variants (id, product_id, color_id, size_id) values
  ('00000000-0000-4000-f000-000000000001', '00000000-0000-4000-e000-000000000001', '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-d000-000000000001'),
  ('00000000-0000-4000-f000-000000000002', '00000000-0000-4000-e000-000000000001', '00000000-0000-4000-c000-000000000001', '00000000-0000-4000-d000-000000000002'),
  ('00000000-0000-4000-f000-000000000003', '00000000-0000-4000-e000-000000000002', '00000000-0000-4000-c000-000000000002', '00000000-0000-4000-d000-000000000001');

-- Cambia la identidad de la sesión: login(uuid) para un usuario, login(null) para visitante anónimo.
create or replace function pg_temp.login(uid uuid) returns void language plpgsql as $$
begin
  reset role;
  if uid is null then
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    execute 'set local role anon';
  else
    perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
  end if;
end;
$$;
