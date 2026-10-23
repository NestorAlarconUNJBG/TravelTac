# TravelTac Mobile

Aplicación turística Flutter para explorar atractivos publicados de Tacna.

## Conectar el catálogo público

1. Configura el proyecto de Supabase y ejecuta primero `../web-app/supabase/pois_setup.sql`.
2. Ejecuta `../web-app/supabase/public_catalog_read.sql` en Supabase SQL Editor. La política habilita solo lectura pública de POI publicados y sus categorías; mantiene las operaciones de categorías limitadas a administradores activos.
3. Desde PowerShell, inicia la app con el lanzador que lee las variables ya configuradas en `web-app/.env`:

```powershell
.\run_with_supabase.ps1
```

El lanzador también acepta opciones de Flutter, por ejemplo `.\run_with_supabase.ps1 -d <device-id>`. Si prefieres ejecutar `flutter run` directamente, usa `--dart-define=SUPABASE_URL=...` y `--dart-define=SUPABASE_ANON_KEY=...`.

La clave anon/publishable es pública y visible en la app; las políticas RLS controlan el acceso. Nunca uses `service_role` ni claves secretas en `--dart-define`.

La sección **Explorar** obtiene categorías y puntos de `public.categorias` y `public.puntos_interes`. Solo presenta registros con `estado_publicacion = 'publicado'`; búsqueda por nombre, categoría y proximidad se aplican a ese catálogo. La proximidad usa las coordenadas guardadas en Supabase y solicita ubicación al dispositivo solo cuando se activa el filtro.

Si faltan las variables de configuración, reinicia la app con los `--dart-define` indicados. Si Supabase no responde o las políticas RLS bloquean la lectura, Explorar muestra el error y permite reintentar; no sustituye el catálogo con datos de ejemplo.
