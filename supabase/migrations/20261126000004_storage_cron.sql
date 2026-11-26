-- Naru Closet — Storage de fotografías y tareas programadas

-- ───────────────────────── Storage ─────────────────────────
-- Bucket público de lectura (fotos del catálogo); escritura solo para administradores.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy product_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()))
  with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy product_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));
-- Listar objetos solo para administradores (la descarga pública no requiere SELECT en buckets públicos).
create policy product_images_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));

-- ───────────────────────── pg_cron: vencimiento de apartados (D-003) ─────────────────────────
create extension if not exists pg_cron;

select cron.schedule(
  'naru-expire-reservations',
  '*/15 * * * *',
  $$ select private.expire_reservations(); $$
);
