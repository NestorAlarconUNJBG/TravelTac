-- Run in the Supabase SQL Editor after creating public.usuarios_admin.
-- Authentication credentials are managed by Supabase Auth; the application does not store password hashes here.

alter table public.usuarios_admin
  alter column contrasena_hash drop not null;

alter table public.usuarios_admin enable row level security;

revoke all on table public.usuarios_admin from public, anon, authenticated;
grant select (id, nombre_completo, correo, rol, institucion, estado)
on table public.usuarios_admin to authenticated;
grant update (nombre_completo, institucion)
on table public.usuarios_admin to authenticated;

drop policy if exists "traveltac_users_read_own_profile" on public.usuarios_admin;
create policy "traveltac_users_read_own_profile"
on public.usuarios_admin
for select
to authenticated
using (lower(correo) = lower((select auth.jwt() ->> 'email')));

drop policy if exists "traveltac_users_update_own_profile" on public.usuarios_admin;
create policy "traveltac_users_update_own_profile"
on public.usuarios_admin
for update
to authenticated
using (lower(correo) = lower((select auth.jwt() ->> 'email')))
with check (lower(correo) = lower((select auth.jwt() ->> 'email')));

-- Promote the intended account to superadmin manually, replacing the email:
-- update public.usuarios_admin
-- set rol = 'superadmin'
-- where lower(correo) = lower('superadmin@example.com');
