import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/poi.dart';

class PublicCatalog {
  const PublicCatalog({required this.categories, required this.pois});

  final List<String> categories;
  final List<Poi> pois;
}

abstract interface class CatalogRepository {
  Future<PublicCatalog> fetchCatalog();
}

class SupabaseCatalogRepository implements CatalogRepository {
  const SupabaseCatalogRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<PublicCatalog> fetchCatalog() async {
    final categoryRows = await _fetchAll(
      _client.from('categorias').select('id, nombre').order('nombre'),
    );
    final poiRows = await _fetchAll(
      _client
          .from('puntos_interes')
          .select(
            'id, categoria_id, nombre, descripcion_corta, historia_completa, '
            'latitud, longitud, estado_publicacion',
          )
          .eq('estado_publicacion', 'publicado')
          .order('nombre'),
    );

    final categoryNamesById = <String, String>{};
    final categoryNames = <String>[];
    for (final row in categoryRows) {
      final id = row['id']?.toString();
      final name = row['nombre']?.toString().trim() ?? '';
      if (id == null || name.isEmpty) continue;
      categoryNamesById[id] = name;
      categoryNames.add(name);
    }

    final pois = poiRows.map((row) {
      final categoryId = row['categoria_id']?.toString();
      return Poi.fromSupabase(
        row,
        categoryName: categoryNamesById[categoryId] ?? '',
      );
    }).toList();

    return PublicCatalog(categories: categoryNames, pois: pois);
  }

  Future<List<Map<String, dynamic>>> _fetchAll(
    PostgrestTransformBuilder<List<Map<String, dynamic>>> query,
  ) async {
    const pageSize = 500;
    final rows = <Map<String, dynamic>>[];
    var offset = 0;

    while (true) {
      final page = await query.range(offset, offset + pageSize - 1);
      rows.addAll(page);
      if (page.length < pageSize) return rows;
      offset += pageSize;
    }
  }
}
