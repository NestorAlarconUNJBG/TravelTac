-- Run this script in the Supabase SQL Editor after creating the TravelTac tables.
-- The bucket is public so the tourist-facing app can load images and play audio.
-- Only authenticated users with an active usuarios_admin profile can manage media.

insert into storage.buckets (id, name, public, allowed_mime_types)
values (
  'traveltac-multimedia',
  'traveltac-multimedia',
  true,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/aac', 'audio/x-aac', 'audio/mp4']
)
on conflict (id) do update
set public = excluded.public,
    allowed_mime_types = excluded.allowed_mime_types;

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

grant select on table public.puntos_interes to authenticated;
grant select, insert, update, delete on table public.multimedia to authenticated;
grant usage, select on sequence public.multimedia_id_seq to authenticated;

alter table public.puntos_interes enable row level security;
alter table public.multimedia enable row level security;

drop policy if exists "traveltac_active_admin_read_pois" on public.puntos_interes;
create policy "traveltac_active_admin_read_pois"
on public.puntos_interes
for select
to authenticated
using (public.traveltac_is_active_admin());

drop policy if exists "traveltac_active_admin_read_multimedia" on public.multimedia;
create policy "traveltac_active_admin_read_multimedia"
on public.multimedia
for select
to authenticated
using (public.traveltac_is_active_admin());

drop policy if exists "traveltac_active_admin_insert_multimedia" on public.multimedia;
create policy "traveltac_active_admin_insert_multimedia"
on public.multimedia
for insert
to authenticated
with check (public.traveltac_is_active_admin());

drop policy if exists "traveltac_active_admin_update_multimedia" on public.multimedia;
create policy "traveltac_active_admin_update_multimedia"
on public.multimedia
for update
to authenticated
using (public.traveltac_is_active_admin())
with check (public.traveltac_is_active_admin());

drop policy if exists "traveltac_active_admin_delete_multimedia" on public.multimedia;
create policy "traveltac_active_admin_delete_multimedia"
on public.multimedia
for delete
to authenticated
using (public.traveltac_is_active_admin());

drop policy if exists "traveltac_active_admin_read_media_objects" on storage.objects;
create policy "traveltac_active_admin_read_media_objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'traveltac-multimedia'
  and public.traveltac_is_active_admin()
);

drop policy if exists "traveltac_active_admin_upload_media_objects" on storage.objects;
create policy "traveltac_active_admin_upload_media_objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'traveltac-multimedia'
  and public.traveltac_is_active_admin()
);

drop policy if exists "traveltac_active_admin_update_media_objects" on storage.objects;
create policy "traveltac_active_admin_update_media_objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'traveltac-multimedia'
  and public.traveltac_is_active_admin()
)
with check (
  bucket_id = 'traveltac-multimedia'
  and public.traveltac_is_active_admin()
);

drop policy if exists "traveltac_active_admin_delete_media_objects" on storage.objects;
create policy "traveltac_active_admin_delete_media_objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'traveltac-multimedia'
  and public.traveltac_is_active_admin()
);
