-- Run after pois_setup.sql and after creating categorias and puntos_interes.
-- The tourist app uses only the anon key and can read published content.

grant usage on schema public to anon, authenticated;
grant select on table public.categorias, public.puntos_interes
to anon, authenticated;

alter table public.categorias enable row level security;
alter table public.puntos_interes enable row level security;

drop policy if exists "traveltac_public_read_published_pois"
on public.puntos_interes;
create policy "traveltac_public_read_published_pois"
on public.puntos_interes
for select
to anon, authenticated
using (estado_publicacion = 'publicado');

drop policy if exists "traveltac_public_read_published_categories"
on public.categorias;
create policy "traveltac_public_read_published_categories"
on public.categorias
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.puntos_interes as poi
    where poi.categoria_id = categorias.id
      and poi.estado_publicacion = 'publicado'
  )
);

grant insert, update, delete on table public.categorias to authenticated;
drop policy if exists "traveltac_active_admin_manage_categories"
on public.categorias;
create policy "traveltac_active_admin_manage_categories"
on public.categorias
for all
to authenticated
using (public.traveltac_is_active_admin())
with check (public.traveltac_is_active_admin());

do $$
declare
  category_id_sequence regclass;
begin
  category_id_sequence :=
    pg_get_serial_sequence('public.categorias', 'id')::regclass;
  if category_id_sequence is not null then
    execute format(
      'grant usage, select on sequence %s to authenticated',
      category_id_sequence
    );
  end if;
end;
$$;
