import 'package:flutter/material.dart';

class Poi {
  const Poi({
    required this.id,
    required this.name,
    required this.category,
    required this.location,
    required this.description,
    required this.icon,
    required this.color,
    required this.latitude,
    required this.longitude,
    this.featured = false,
  });

  factory Poi.fromSupabase(
    Map<String, dynamic> row, {
    required String categoryName,
  }) {
    final latitude = _coordinate(row['latitud'], 'latitud', -90, 90);
    final longitude = _coordinate(row['longitud'], 'longitud', -180, 180);
    final category = categoryName.isEmpty ? 'Sin categoría' : categoryName;

    return Poi(
      id: _requiredText(row['id'], 'id'),
      name: _requiredText(row['nombre'], 'nombre'),
      category: category,
      location:
          '(${latitude.toStringAsFixed(4)}, ${longitude.toStringAsFixed(4)})',
      description:
          _optionalText(row['descripcion_corta']) ??
          _optionalText(row['historia_completa']) ??
          'Este atractivo aún no tiene una descripción publicada.',
      icon: _categoryIcon(category),
      color: _categoryColor(category),
      latitude: latitude,
      longitude: longitude,
    );
  }

  final String id;
  final String name;
  final String category;
  final String location;
  final String description;
  final IconData icon;
  final Color color;
  final double latitude;
  final double longitude;
  final bool featured;
}

String _requiredText(dynamic value, String fieldName) {
  final text = value?.toString().trim() ?? '';
  if (text.isEmpty) {
    throw FormatException(
      'El campo "$fieldName" está vacío en un punto de interés.',
    );
  }
  return text;
}

String? _optionalText(dynamic value) {
  final text = value?.toString().trim();
  return text == null || text.isEmpty ? null : text;
}

double _coordinate(dynamic value, String fieldName, double min, double max) {
  final coordinate = double.tryParse(value.toString());
  if (coordinate == null ||
      !coordinate.isFinite ||
      coordinate < min ||
      coordinate > max) {
    throw FormatException('La coordenada "$fieldName" no es válida.');
  }
  return coordinate;
}

IconData _categoryIcon(String category) => switch (category.toLowerCase()) {
  'arqueología' => Icons.account_balance_rounded,
  'historia' => Icons.history_edu_rounded,
  'arquitectura' => Icons.church_rounded,
  _ => Icons.place_rounded,
};

Color _categoryColor(String category) => switch (category.toLowerCase()) {
  'arqueología' => const Color(0xFFA94F32),
  'historia' => const Color(0xFFC18A35),
  'arquitectura' => const Color(0xFF773A2B),
  _ => const Color(0xFF786858),
};
