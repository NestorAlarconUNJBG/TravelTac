-- Run in the Supabase SQL Editor after creating public.puntos_interes.
-- POI management is limited to authenticated administrators with an active profile.

create or replace function public.traveltac_is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.usuarios_admin as admin
    where lower(admin.correo) = lower((select auth.jwt() ->> 'email'))
      and admin.estado = 'activo'
  );
$$;

revoke all on function public.traveltac_is_active_admin() from public;
grant execute on function public.traveltac_is_active_admin() to authenticated;

grant select, insert, update, delete on table public.puntos_interes to authenticated;
alter table public.puntos_interes enable row level security;

drop policy if exists "traveltac_active_admin_read_pois" on public.puntos_interes;
create policy "traveltac_active_admin_read_pois"
on public.puntos_interes
for select
to authenticated
using (public.traveltac_is_active_admin());

drop policy if exists "traveltac_active_admin_insert_pois" on public.puntos_interes;
create policy "traveltac_active_admin_insert_pois"
on public.puntos_interes
for insert
to authenticated
with check (public.traveltac_is_active_admin());

drop policy if exists "traveltac_active_admin_update_pois" on public.puntos_interes;
create policy "traveltac_active_admin_update_pois"
on public.puntos_interes
for update
to authenticated
using (public.traveltac_is_active_admin())
with check (public.traveltac_is_active_admin());

drop policy if exists "traveltac_active_admin_delete_pois" on public.puntos_interes;
create policy "traveltac_active_admin_delete_pois"
on public.puntos_interes
for delete
to authenticated
using (public.traveltac_is_active_admin());

do $$
declare
  poi_id_sequence regclass;
begin
  poi_id_sequence := pg_get_serial_sequence('public.puntos_interes', 'id')::regclass;
  if poi_id_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', poi_id_sequence);
  end if;
end;
$$;
