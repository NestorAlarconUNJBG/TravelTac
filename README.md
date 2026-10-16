# TravelTac
Un aplicativo que permite que alguien, que visita un lugar turístico, proporcione información clara y de interés, a través de una audioguía 

## Módulo de puntos de interés

El panel `/admin/pois` permite registrar, consultar, editar y eliminar puntos de interés, incluidos su código, nombre, descripción, historia, coordenadas, radio de activación y estado de publicación. El mapa utiliza Leaflet con mosaicos de OpenStreetMap; se puede elegir una ubicación haciendo clic en el mapa o arrastrando el marcador.

Para habilitar el CRUD en Supabase, ejecuta `supabase/pois_setup.sql` en el SQL Editor después de crear la tabla `public.puntos_interes` y el perfil de administradores `public.usuarios_admin`. El script concede permisos solo a usuarios autenticados con perfil de administrador activo.
