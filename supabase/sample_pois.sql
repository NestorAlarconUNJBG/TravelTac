-- Run this script in the Supabase SQL Editor after creating puntos_interes.
-- The sample records stay as drafts until their details and coordinates are verified.

insert into public.puntos_interes (
  codigo_identificador,
  nombre,
  descripcion_corta,
  historia_completa,
  latitud,
  longitud,
  radio_geocerca_m,
  estado_publicacion
)
values
  (
    'DEMO-TACNA-MICULLA',
    'Complejo Arqueológico de Miculla',
    'Sitio arqueológico conocido por sus petroglifos y paisaje desértico.',
    'Miculla reúne numerosas representaciones rupestres grabadas en roca. '
      'Este registro de ejemplo debe completarse con información histórica '
      'verificada y contenido aprobado antes de su publicación.',
    -17.96300000,
    -70.08500000,
    50.00,
    'borrador'
  ),
  (
    'DEMO-TACNA-ALIANZA',
    'Complejo Monumental Alto de la Alianza',
    'Espacio histórico y conmemorativo ubicado en la ciudad de Tacna.',
    'Este punto de ejemplo representa el Complejo Monumental Alto de la '
      'Alianza. Completa la reseña con fuentes verificadas y contenido '
      'aprobado antes de publicarlo en la audioguía.',
    -18.01100000,
    -70.25300000,
    50.00,
    'borrador'
  )
on conflict (codigo_identificador) do nothing;
