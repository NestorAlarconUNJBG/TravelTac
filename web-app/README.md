# TravelTac
Un aplicativo que permite que alguien, que visita un lugar turístico, proporcione información clara y de interés, a través de una audioguía 

## Módulo de puntos de interés

El panel `/admin/pois` permite registrar, consultar, editar y eliminar puntos de interés, incluidos su código, nombre, descripción, historia, coordenadas, radio de activación y estado de publicación. El mapa utiliza Leaflet con mosaicos de OpenStreetMap; se puede elegir una ubicación haciendo clic en el mapa o arrastrando el marcador.

Para habilitar el CRUD en Supabase, ejecuta `supabase/pois_setup.sql` en el SQL Editor después de crear la tabla `public.puntos_interes` y el perfil de administradores `public.usuarios_admin`. El script concede permisos solo a usuarios autenticados con perfil de administrador activo.

## Administración de usuarios

La sección `/admin/usuarios` está disponible solo para perfiles activos con `rol = 'superadmin'`. Ejecuta `supabase/users_setup.sql` en el SQL Editor y promueve manualmente al menos una cuenta de confianza a `superadmin`.

Despliega la función con `supabase functions deploy manage-admin-users` y mantén habilitada la verificación JWT. La función usa `SUPABASE_SERVICE_ROLE_KEY` solo en el entorno servidor; nunca configures esa clave en variables `VITE_*` ni en el cliente. La creación de usuarios también crea su cuenta de Supabase Auth; actualizar una contraseña es opcional al editar.
