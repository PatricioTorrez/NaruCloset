-- Naru Closet — privilegios del rol service_role
-- La clave secret/service_role solo se usa en scripts de servidor (crear owner, mantenimiento).
-- Los proyectos nuevos de Supabase no conceden privilegios por defecto, así que se otorgan explícitamente.
-- service_role ignora RLS; nunca se expone al navegador (docs/SECURITY.md §6).

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
